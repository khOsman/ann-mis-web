import { useMemo, useState } from "react";
import { useAlert } from "../../context/AlertContext";
import { exportExcel } from "../../services/exportService";
import { formatBDPhone } from "../../utils/phone";
import { formatTimeRangeBDT } from "../../utils/time";
import {
  CALL_NOTE_MAX_LENGTH,
  CALL_NOTE_REQUIRED,
  CALL_RESULT_OPTIONS,
  CALL_STATUS,
  CALL_STATUS_STYLE,
} from "../../constants/phoneCall";
import {
  callersOf,
  countStatuses,
  logPhoneCall,
  statusOf,
  summarizeCalls,
  validateCall,
} from "../../services/phoneCallService";

const formatWhen = (stamp) => {
  if (!stamp?.toDate) return "just now";

  return stamp.toDate().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const FILTERS = ["All", ...Object.values(CALL_STATUS)];

function StatusBadge({ status }) {
  return (
    <span
      className={`px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${
        CALL_STATUS_STYLE[status] || CALL_STATUS_STYLE[CALL_STATUS.PENDING]
      }`}
    >
      {status}
    </span>
  );
}

// The Phone Call Interview sheet for one FGD, shared by the admin app and the
// committee portal: everyone in the group with ID, name, email and phone, the
// current confirmation status, and the full history of call attempts. Callers
// log each attempt through "Log call"; nothing is edited after the fact.
export default function PhoneCallSheet({
  fgd,
  participants,
  calls,
  canCall,
  caller,
  lockedReason = "",
  headerActions = null,
}) {
  const { showAlert } = useAlert();

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [target, setTarget] = useState(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const summary = useMemo(() => summarizeCalls(calls), [calls]);
  const counts = useMemo(() => countStatuses(participants, summary), [participants, summary]);

  const rows = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return participants.filter((participant) => {
      const current = statusOf(summary, participant.id);

      if (filter !== "All" && current !== filter) return false;

      if (!keyword) return true;

      return [participant.participant_code, participant.name, participant.email, participant.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [participants, summary, filter, search]);

  const callers = callersOf(fgd);

  const openLog = (participant) => {
    setTarget(participant);
    setStatus("");
    setNote("");
  };

  const closeLog = () => {
    if (saving) return;
    setTarget(null);
  };

  const handleSave = async () => {
    const problem = validateCall({ status, note });

    if (problem) {
      showAlert("warning", problem);
      return;
    }

    setSaving(true);

    try {
      await logPhoneCall({ fgd, participant: target, status, note, caller });
      showAlert("success", `Call logged for ${target.name || target.participant_code}.`);
      setTarget(null);
    } catch (error) {
      console.error("Failed to log call:", error);
      showAlert("error", error.message || "Failed to log the call.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    exportExcel({
      sourceLabel: `Phone Calls ${fgd.fgd_code || ""}`.trim(),
      columns: [
        { key: "participant_code", label: "ID" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "status", label: "Status" },
        { key: "attempts", label: "Attempts" },
        { key: "last_by", label: "Last called by" },
        { key: "last_at", label: "Last call" },
        { key: "note", label: "Last note" },
      ],
      rows: participants.map((participant) => {
        const info = summary.get(participant.id);

        return {
          participant_code: participant.participant_code || "",
          name: participant.name || "",
          email: participant.email || "",
          phone: formatBDPhone(participant.phone),
          status: statusOf(summary, participant.id),
          attempts: info?.attempts.length || 0,
          last_by: info?.latest.called_by_name || "",
          last_at: info ? formatWhen(info.latest.created_at) : "",
          note: info?.latest.note || "",
        };
      }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              {fgd.fgd_code} {fgd.fgd_name ? `· ${fgd.fgd_name}` : ""}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {fgd.cohort_name || "-"} · {fgd.session_date || "Date not set"}
              {fgd.session_start_time
                ? ` · ${formatTimeRangeBDT(fgd.session_start_time, fgd.session_end_time)}`
                : ""}
              {fgd.venue ? ` · ${fgd.venue}` : ""}
            </p>
            <p className="text-sm text-gray-600 mt-3">
              <span className="font-semibold">Callers:</span>{" "}
              {callers.length === 0 ? (
                <span className="text-gray-500">
                  nobody named, so any admin-side user can call
                </span>
              ) : (
                callers.map((item) => item.name).join(", ")
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {headerActions}
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
            >
              Export
            </button>
          </div>
        </div>

        {lockedReason && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {lockedReason}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {FILTERS.map((name) => {
          const value = name === "All" ? counts.total : counts[name];

          return (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              className={`rounded-2xl border p-4 text-left transition ${
                filter === name
                  ? "border-[var(--ann-pink)] bg-pink-50/60"
                  : "border-gray-200 bg-white hover:border-[var(--ann-pink)]"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {name}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--ann-text-dark)]">
                {value}
              </p>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, email or phone..."
            className="w-full max-w-md border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
          />
        </div>

        {participants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No participants are in this FGD.
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No participants match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Calls</th>
                  <th className="text-left px-4 py-3">Last call</th>
                  <th className="text-center px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((participant, index) => {
                  const info = summary.get(participant.id);
                  const phone = formatBDPhone(participant.phone);
                  const expanded = expandedId === participant.id;

                  return (
                    <FragmentRow key={participant.id}>
                      <tr className="border-t border-gray-100 align-top">
                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {participant.participant_code || "-"}
                        </td>
                        <td className="px-4 py-3 font-semibold">{participant.name || "-"}</td>
                        <td className="px-4 py-3 text-gray-600 break-all">
                          {participant.email || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {phone ? (
                            <a
                              href={`tel:${phone}`}
                              className="text-[var(--ann-pink)] font-semibold whitespace-nowrap"
                            >
                              {phone}
                            </a>
                          ) : (
                            <span className="text-red-600 text-xs font-semibold">
                              No phone number
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={statusOf(summary, participant.id)} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {info ? (
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? null : participant.id)}
                              className="text-[var(--ann-pink)] font-semibold hover:underline"
                            >
                              {info.attempts.length}
                            </button>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {info ? (
                            <>
                              <p>
                                {info.latest.called_by_name || "-"}{" "}
                                <span className="text-gray-400">
                                  · {formatWhen(info.latest.created_at)}
                                </span>
                              </p>
                              {info.latest.note && (
                                <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">
                                  {info.latest.note}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">Not called yet</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {canCall ? (
                            <button
                              type="button"
                              onClick={() => openLog(participant)}
                              className="px-3 py-2 rounded-lg bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90"
                            >
                              Log call
                            </button>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>

                      {expanded && info && (
                        <tr className="bg-gray-50/60">
                          <td />
                          <td colSpan={8} className="px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                              All attempts, newest first
                            </p>
                            <ul className="space-y-2">
                              {info.attempts.map((attempt) => (
                                <li key={attempt.id} className="flex flex-wrap items-start gap-3">
                                  <StatusBadge status={attempt.status} />
                                  <span className="text-gray-700">
                                    {attempt.called_by_name || "-"}
                                    <span className="text-gray-400">
                                      {" "}
                                      · {formatWhen(attempt.created_at)}
                                    </span>
                                  </span>
                                  {attempt.note && (
                                    <span className="text-gray-600 whitespace-pre-wrap">
                                      {attempt.note}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </FragmentRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {target && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">Log a call</h3>
            <p className="text-sm text-gray-600 mt-1">
              {target.name || "-"} · {target.participant_code || "-"}
            </p>
            {formatBDPhone(target.phone) && (
              <a
                href={`tel:${formatBDPhone(target.phone)}`}
                className="inline-block mt-2 text-[var(--ann-pink)] font-semibold"
              >
                Call {formatBDPhone(target.phone)}
              </a>
            )}

            <p className="text-sm font-semibold text-gray-700 mt-5 mb-2">Outcome of the call</p>
            <div className="grid grid-cols-2 gap-2">
              {CALL_RESULT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatus(option)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold text-left ${
                    status === option
                      ? `${CALL_STATUS_STYLE[option]} ring-2 ring-[var(--ann-pink)]`
                      : "border-gray-200 text-gray-700 hover:border-[var(--ann-pink)]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <label className="block text-sm font-semibold text-gray-700 mt-5 mb-2">
              Note{" "}
              <span className="font-normal text-gray-400">
                {CALL_NOTE_REQUIRED.includes(status) ? "(required)" : "(optional)"}
              </span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              maxLength={CALL_NOTE_MAX_LENGTH}
              placeholder="What did the participant say?"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
            />

            <p className="text-xs text-gray-400 mt-2">
              Each call is added to the history; earlier calls are never changed.
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={closeLog}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !status}
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save call"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// A table row pair (the row and its expandable history) needs a keyed
// wrapper that is not a DOM element.
function FragmentRow({ children }) {
  return <>{children}</>;
}
