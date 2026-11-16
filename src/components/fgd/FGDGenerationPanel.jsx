import { useMemo, useState } from "react";
import { auth } from "../../firebase";
import { useAlert } from "../../context/AlertContext";
import ConfirmDialog from "../common/ConfirmDialog";
import { useForms, useParticipantsByCohort } from "../../hooks";
import {
  SOURCE,
  buildPools,
  maxFgdSequence,
  planRound,
  registeredAtMillis,
  repeatCount,
  seatsToFillLastGroup,
} from "../../services/fgdRoundPlanner";
import { executeFgdRound } from "../../services/fgdRoundService";

const formatRegistered = (participant) => {
  const millis = registeredAtMillis(participant);

  if (!millis) return "-";

  return new Date(millis).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const POOL_TABS = [
  { key: "absent", label: "Absent" },
  { key: "waitlisted", label: "Waitlisted" },
];

const COMPOSITION_LABEL = {
  [SOURCE.LEFTOVER]: "leftover",
  [SOURCE.NEW]: "new",
  [SOURCE.ABSENT]: "absent",
  [SOURCE.WAITLISTED]: "waitlisted",
};

function PoolCard({ title, count, note, tone = "gray" }) {
  const tones = {
    gray: "border-gray-200 bg-white",
    pink: "border-pink-200 bg-pink-50/60",
    amber: "border-amber-200 bg-amber-50/60",
    red: "border-red-200 bg-red-50/60",
    blue: "border-blue-200 bg-blue-50/60",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-1 text-3xl font-extrabold text-[var(--ann-text-dark)]">{count}</p>
      <p className="mt-1 text-xs text-gray-500">{note}</p>
    </div>
  );
}

// Generate FGDs for one cohort. Everyone not yet in an FGD is queued first
// come first served; people held back by an earlier round come first. Staff
// can also pick participants who were Absent (in a Completed FGD) or
// Waitlisted to fill seats or form groups. Nothing is written until the
// preview below has been confirmed, and each FGD is created atomically (see
// fgdRoundService.js).
export default function FGDGenerationPanel({ cohort, fgds }) {
  const { showAlert } = useAlert();
  const { data: participants, loading: loadingParticipants } = useParticipantsByCohort(
    cohort.id
  );
  const { data: allForms } = useForms();

  const [limitText, setLimitText] = useState(() => {
    const last = [...fgds].sort((a, b) => (b.sequence_no || 0) - (a.sequence_no || 0))[0];

    return String(last?.participant_limit || 25);
  });
  const [absentIds, setAbsentIds] = useState(() => new Set());
  const [waitlistedIds, setWaitlistedIds] = useState(() => new Set());
  const [smallOverride, setSmallOverride] = useState(null);
  const [tab, setTab] = useState("absent");
  const [takeText, setTakeText] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);

  const registrationOpen = useMemo(
    () =>
      allForms.some(
        (form) =>
          form.cohort_id === cohort.id && !form.is_deleted && form.status === "Published"
      ),
    [allForms, cohort.id]
  );

  // While registration is open, a short last group waits for more people. Once
  // it is closed nobody else is coming, so the last group forms its own FGD.
  const allowSmallLast = smallOverride ?? !registrationOpen;

  const pools = useMemo(() => buildPools(participants, fgds), [participants, fgds]);

  // A pick only counts while that person is still in the pool (someone else
  // may have placed them in the meantime).
  const absentPicked = useMemo(
    () => pools.absent.filter((p) => absentIds.has(p.id)),
    [pools.absent, absentIds]
  );
  const waitlistedPicked = useMemo(
    () => pools.waitlisted.filter((p) => waitlistedIds.has(p.id)),
    [pools.waitlisted, waitlistedIds]
  );

  const existingMaxSequence = useMemo(() => maxFgdSequence(fgds), [fgds]);

  const plan = useMemo(
    () =>
      planRound({
        leftover: pools.leftover,
        fresh: pools.fresh,
        absentPicked,
        waitlistedPicked,
        limit: limitText,
        allowSmallLast,
        existingMaxSequence,
        cohortCode: cohort.cohort_code,
      }),
    [
      pools,
      absentPicked,
      waitlistedPicked,
      limitText,
      allowSmallLast,
      existingMaxSequence,
      cohort.cohort_code,
    ]
  );

  const queueSize = pools.leftover.length + pools.fresh.length;
  const freeSeats = seatsToFillLastGroup(queueSize, limitText);
  const activePool = tab === "absent" ? pools.absent : pools.waitlisted;
  const activeIds = tab === "absent" ? absentIds : waitlistedIds;
  const setActiveIds = tab === "absent" ? setAbsentIds : setWaitlistedIds;

  const toggleId = (id) => {
    setActiveIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  const takeFirst = (count) => {
    const size = Math.max(0, Math.min(activePool.length, Math.floor(Number(count) || 0)));

    setActiveIds(new Set(activePool.slice(0, size).map((p) => p.id)));
  };

  const canGenerate = !running && plan.errors.length === 0 && plan.groups.length > 0;

  const handleGenerate = async () => {
    setRunning(true);

    try {
      const result = await executeFgdRound({
        cohort,
        plan,
        existingMaxSequence,
        user: auth.currentUser,
      });

      setAbsentIds(new Set());
      setWaitlistedIds(new Set());

      if (result.failure) {
        showAlert(
          "error",
          `${result.created.length} FGD(s) created. Stopped at ${result.failure.group.name}: ${result.failure.message} Review the lists and preview again.`
        );
      } else {
        showAlert(
          "success",
          `${result.created.length} FGD(s) created${
            result.heldCount > 0
              ? `; ${result.heldCount} participant(s) held for the next round`
              : ""
          }.`
        );
      }
    } catch (error) {
      console.error("FGD generation failed:", error);
      showAlert("error", error.message || "Failed to generate FGDs.");
    } finally {
      setRunning(false);
      setConfirmOpen(false);
    }
  };

  const summary = plan.groups.length
    ? `Create ${plan.groups.length} FGD(s) (${plan.groups
        .map((group) => group.name)
        .join(", ")}) with ${plan.totalPlaced} participant(s)` +
      (plan.held.length > 0 ? `, holding ${plan.held.length} for the next round.` : ".")
    : "";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">Generate FGDs</h3>
        <p className="text-sm text-gray-500 mt-1">
          Participants are placed first come first served by registration time.
          Leftover participants from an earlier round always go first. Review the
          preview, then confirm.
        </p>
      </div>

      {loadingParticipants ? (
        <p className="text-gray-500">Loading participants...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <PoolCard
              title="Leftover"
              count={pools.leftover.length}
              note="Held from an earlier round. Placed first."
              tone="amber"
            />
            <PoolCard
              title="New registrations"
              count={pools.fresh.length}
              note="Not in any FGD yet. First come first served."
              tone="pink"
            />
            <PoolCard
              title="Absent"
              count={pools.absent.length}
              note="Absent in a Completed FGD. You choose."
              tone="red"
            />
            <PoolCard
              title="Waitlisted"
              count={pools.waitlisted.length}
              note="Evaluated and waitlisted. You choose."
              tone="blue"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Participants per FGD
              </label>
              <input
                type="number"
                min="1"
                value={limitText}
                onChange={(e) => setLimitText(e.target.value)}
                className="w-full max-w-xs border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
              />
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p>
                Registration is{" "}
                <span className="font-semibold">
                  {registrationOpen ? "open" : "closed"}
                </span>
                .{" "}
                {registrationOpen
                  ? "A last group that is not full waits for more registrations."
                  : "Nobody else is coming, so the last group can form its own FGD."}
              </p>
              <label className="mt-3 flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={allowSmallLast}
                  onChange={(e) => setSmallOverride(e.target.checked)}
                  className="mt-1"
                />
                <span>Allow a smaller last FGD (instead of holding those participants)</span>
              </label>
            </div>
          </div>

          {(pools.absent.length > 0 || pools.waitlisted.length > 0) && (
            <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-[var(--ann-text-dark)]">
                  Add participants from Absent or Waitlisted
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {freeSeats > 0
                    ? `The last group still has ${freeSeats} free seat(s). Pick up to that many to complete it, or pick enough for whole new groups.`
                    : "Optional. Picked participants form groups after the registrations above."}{" "}
                  Their earlier results are kept as history and they start fresh.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {POOL_TABS.map(({ key, label }) => {
                  const count =
                    key === "absent" ? absentPicked.length : waitlistedPicked.length;
                  const total =
                    key === "absent" ? pools.absent.length : pools.waitlisted.length;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                        tab === key
                          ? "bg-[var(--ann-pink)] text-white border-[var(--ann-pink)]"
                          : "bg-white text-gray-700 border-gray-300 hover:border-[var(--ann-pink)]"
                      }`}
                    >
                      {label} ({count} of {total} picked)
                    </button>
                  );
                })}

                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder={freeSeats > 0 ? String(freeSeats) : "N"}
                    value={takeText}
                    onChange={(e) => setTakeText(e.target.value)}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => takeFirst(takeText || freeSeats)}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
                  >
                    Take first N
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIds(new Set())}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:border-gray-400"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {activePool.length === 0 ? (
                <p className="text-sm text-gray-500">Nobody is in this pool.</p>
              ) : (
                <div className="max-h-72 overflow-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 sticky top-0">
                      <tr>
                        <th className="p-3 w-10" />
                        <th className="text-left p-3">#</th>
                        <th className="text-left p-3">Code</th>
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Registered</th>
                        <th className="text-left p-3">Earlier FGD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePool.map((participant, index) => {
                        const outcome = tab === "absent" ? "Absent" : "Waitlisted";
                        const repeats = repeatCount(participant, outcome);

                        return (
                          <tr key={participant.id} className="border-t border-gray-100">
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={activeIds.has(participant.id)}
                                onChange={() => toggleId(participant.id)}
                              />
                            </td>
                            <td className="p-3 text-gray-500">{index + 1}</td>
                            <td className="p-3 font-mono text-xs">
                              {participant.participant_code || "-"}
                            </td>
                            <td className="p-3">{participant.name || "-"}</td>
                            <td className="p-3 text-gray-600">{formatRegistered(participant)}</td>
                            <td className="p-3 text-gray-600">
                              {participant.fgd_code || "none"}
                              {tab === "waitlisted" &&
                                typeof participant.average_evaluation_score === "number" &&
                                ` · avg ${participant.average_evaluation_score.toFixed(1)}`}
                              {repeats > 0 && (
                                <span className="ml-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 px-2 py-0.5 text-xs font-semibold">
                                  {tab === "absent" ? "Absent again" : "Waitlisted again"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-semibold text-[var(--ann-text-dark)]">Preview</h4>

            {plan.errors.map((message) => (
              <div
                key={message}
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {message}
              </div>
            ))}

            {plan.warnings.map((message) => (
              <div
                key={message}
                className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              >
                {message}
              </div>
            ))}

            {plan.groups.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left p-3">FGD</th>
                      <th className="text-left p-3">Code</th>
                      <th className="text-center p-3">Participants</th>
                      <th className="text-left p-3">Made up of</th>
                      <th className="text-left p-3">First registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.groups.map((group) => (
                      <tr key={group.sequenceNo} className="border-t border-gray-100">
                        <td className="p-3 font-semibold">
                          {group.name}
                          {group.isSmall && (
                            <span className="ml-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 text-xs font-semibold">
                              smaller
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-xs">{group.code}</td>
                        <td className="p-3 text-center">
                          {group.members.length}
                          {plan.limit ? ` / ${plan.limit}` : ""}
                        </td>
                        <td className="p-3 text-gray-700">
                          {Object.entries(group.composition)
                            .filter(([, count]) => count > 0)
                            .map(([source, count]) => `${count} ${COMPOSITION_LABEL[source]}`)
                            .join(" · ")}
                        </td>
                        <td className="p-3 text-gray-600">
                          {formatRegistered(group.members[0].participant)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {plan.errors.length === 0 && plan.held.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {plan.held.length} participant(s) are not enough for a full FGD and will
                be <span className="font-semibold">held</span>. They go first in the next
                round, or you can top them up from Absent or Waitlisted above.
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!canGenerate}
              onClick={() => setConfirmOpen(true)}
              className="bg-[var(--ann-pink)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {running ? "Generating..." : "Generate FGDs"}
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        variant="primary"
        title="Generate these FGDs?"
        message={summary}
        confirmText={running ? "Generating..." : "Generate"}
        onConfirm={handleGenerate}
        onCancel={() => !running && setConfirmOpen(false)}
      />
    </div>
  );
}
