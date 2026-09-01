import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAlert } from "../../../context/AlertContext";
import { useAuth } from "../../../context/AuthContext";
import { useCohort, useFGDsByCohort, useChampions } from "../../../hooks";
import {
  assignChampionToFGD,
  unassignChampionFromFGD,
} from "../../../services/championsService";
import {
  CHAMPION_ROLES,
  MEMBER_STATUS,
  getChampionRoles,
} from "../../../constants/champions";
import { FGD_ROSTER_CAP } from "../../../constants/fgd";
import { formatTimeRangeBDT } from "../../../utils/time";

function AttachModal({ fgd, activeCommittee, onClose }) {
  const { showAlert } = useAlert();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [assigning, setAssigning] = useState(false);

  if (!fgd) return null;

  const assignedIds = new Set(
    (fgd.committee_members || []).map((member) => member.champion_id)
  );
  const remainingSlots = Math.max(
    0,
    FGD_ROSTER_CAP - (fgd.committee_members?.length || 0)
  );

  const assignable = activeCommittee.filter((champion) => {
    if (assignedIds.has(champion.id)) return false;
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return champion.name?.toLowerCase().includes(keyword);
  });

  const toggleSelected = (championId) => {
    setSelectedIds((prev) => {
      if (prev.includes(championId)) return prev.filter((id) => id !== championId);
      if (prev.length >= remainingSlots) return prev;
      return [...prev, championId];
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) {
      showAlert("error", "Select at least one committee member to attach.");
      return;
    }

    setAssigning(true);

    try {
      const results = await Promise.allSettled(
        selectedIds.map((championId) =>
          assignChampionToFGD({ championId, fgdId: fgd.id })
        )
      );

      const failed = results.filter((result) => result.status === "rejected");
      const succeededCount = results.length - failed.length;

      if (failed.length > 0) {
        const reasons = [
          ...new Set(
            failed.map((result) => result.reason?.message || "Failed to assign.")
          ),
        ];

        showAlert(
          "error",
          succeededCount > 0
            ? `${succeededCount} attached, ${failed.length} failed — ${reasons.join(" ")}`
            : `Attach failed — ${reasons.join(" ")}`
        );
      } else {
        showAlert(
          "success",
          `${selectedIds.length} committee member(s) attached. Notification emails sent.`
        );
      }

      onClose();
      // No manual refetch needed — the live FGD listener picks up the change.
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
          Attach SC to {fgd.fgd_code}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {remainingSlots} slot{remainingSlots === 1 ? "" : "s"} open — select up to{" "}
          {remainingSlots} at a time.
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="mt-4 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
        />

        {assignable.length === 0 ? (
          <p className="text-sm text-gray-500 mt-4">
            No matching active committee members available.
          </p>
        ) : (
          <div className="mt-4 max-h-64 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
            {assignable.map((champion) => {
              const isSelected = selectedIds.includes(champion.id);
              const selectionDisabled =
                !isSelected && selectedIds.length >= remainingSlots;

              return (
                <label
                  key={champion.id}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 ${
                    selectionDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={selectionDisabled}
                    onChange={() => toggleSelected(champion.id)}
                    className="accent-[var(--ann-pink)]"
                  />
                  <div>
                    <p className="font-semibold">{champion.name}</p>
                    <p className="text-xs text-gray-500">
                      {champion.champion_code} • {champion.email}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-gray-400"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={assigning || selectedIds.length === 0}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {assigning
              ? "Attaching..."
              : `Attach Selected${selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RosterDetail() {
  const { cohortId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { isViewer } = useAuth();

  const { data: cohort, loading: loadingCohort } = useCohort(cohortId);
  const { data: fgds, loading: loadingFgds } = useFGDsByCohort(cohortId);
  const { data: allChampions, loading: loadingCommittee } = useChampions();

  const [attachTarget, setAttachTarget] = useState(null);
  const [removingKey, setRemovingKey] = useState(null);

  const activeCommittee = useMemo(
    () =>
      allChampions.filter(
        (champion) =>
          getChampionRoles(champion).includes(CHAMPION_ROLES.SELECTION_COMMITTEE) &&
          champion.member_status === MEMBER_STATUS.ACTIVE
      ),
    [allChampions]
  );

  const sortedFgds = useMemo(
    () =>
      fgds
        .filter(
          (fgd) =>
            fgd.session_date && fgd.session_start_time && fgd.session_end_time
        )
        .sort((a, b) => (a.sequence_no || 0) - (b.sequence_no || 0)),
    [fgds]
  );

  // Consecutive FGDs sharing the same date get one merged cell, matching the
  // reference roster sheet's layout (and the Champion Portal's own version).
  const dateGroups = useMemo(() => {
    const groups = [];

    sortedFgds.forEach((fgd) => {
      const last = groups[groups.length - 1];

      if (last && last.date === fgd.session_date) {
        last.fgds.push(fgd);
      } else {
        groups.push({ date: fgd.session_date, fgds: [fgd] });
      }
    });

    return groups;
  }, [sortedFgds]);

  const handleRemove = async (championId, fgdId) => {
    const key = `${fgdId}:${championId}`;
    setRemovingKey(key);

    try {
      await unassignChampionFromFGD({ championId, fgdId });
      showAlert("success", "Committee member removed from this FGD.");
      // No manual refetch needed — the live FGD listener picks up the change.
    } catch (err) {
      showAlert("error", err.message || "Failed to remove committee member.");
    } finally {
      setRemovingKey(null);
    }
  };

  // Re-run the AttachModal against the freshest FGD doc every render — the
  // one it opened with can go stale the moment someone else's assignment
  // (or a removal in another cell) lands via the live listener.
  const liveAttachTarget = attachTarget
    ? sortedFgds.find((fgd) => fgd.id === attachTarget.id) || attachTarget
    : null;

  const loading = loadingCohort || loadingFgds;

  return (
    <AdminLayout
      title="FGD Roster"
      subtitle={cohort ? `${cohort.cohort_name} (${cohort.cohort_code})` : "Loading..."}
    >
      <PageContainer className="py-6 lg:py-8 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to All Rosters
        </button>

        {loading ? (
          <p className="text-gray-500">Loading roster...</p>
        ) : sortedFgds.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
            No FGDs with a schedule set (date and time) yet.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#DCE6F7] text-center py-3 font-bold text-lg border-b border-gray-300">
              Amra Notun Network &quot;Changemakers&quot; Training
            </div>
            <div className="bg-[#DCE6F7] text-center py-2 font-semibold border-b border-gray-300">
              {cohort?.cohort_name} ({cohort?.cohort_code})
            </div>
            <div className="bg-white text-center py-2 font-semibold border-b border-gray-300">
              FGD Roster Sheet
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr>
                    <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left sticky left-0 z-10">
                      Session
                    </th>
                    {sortedFgds.map((fgd) => (
                      <th
                        key={fgd.id}
                        className="border border-gray-300 bg-green-500 text-white px-4 py-2 whitespace-nowrap"
                      >
                        {fgd.fgd_code}
                      </th>
                    ))}
                  </tr>

                  <tr>
                    <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left sticky left-0 z-10">
                      Date
                    </th>
                    {dateGroups.map((group) => (
                      <td
                        key={group.fgds[0].id}
                        colSpan={group.fgds.length}
                        className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap"
                      >
                        {group.date || "Not set"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left sticky left-0 z-10">
                      Time
                    </th>
                    {sortedFgds.map((fgd) => (
                      <td
                        key={fgd.id}
                        className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap"
                      >
                        {formatTimeRangeBDT(
                          fgd.session_start_time,
                          fgd.session_end_time
                        ) || "Not set"}
                      </td>
                    ))}
                  </tr>

                  {Array.from({ length: FGD_ROSTER_CAP }).map((_, slotIndex) => (
                    <tr key={slotIndex}>
                      {slotIndex === 0 && (
                        <th
                          rowSpan={FGD_ROSTER_CAP}
                          className="border border-gray-300 bg-gray-50 px-3 py-2 text-left align-top sticky left-0 z-10"
                        >
                          Name
                        </th>
                      )}
                      {sortedFgds.map((fgd) => {
                        const members = fgd.committee_members || [];
                        const member = members[slotIndex];
                        const isNextOpenSlot =
                          !member &&
                          slotIndex === members.length &&
                          members.length < FGD_ROSTER_CAP;
                        const removeKey = member
                          ? `${fgd.id}:${member.champion_id}`
                          : null;

                        return (
                          <td
                            key={fgd.id}
                            className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap"
                          >
                            {member ? (
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-semibold">{member.name}</span>
                                {!isViewer && (
                                  <button
                                    type="button"
                                    disabled={removingKey === removeKey}
                                    onClick={() =>
                                      handleRemove(member.champion_id, fgd.id)
                                    }
                                    className="text-xs text-red-500 hover:underline disabled:opacity-50"
                                  >
                                    {removingKey === removeKey ? "..." : "Remove"}
                                  </button>
                                )}
                              </div>
                            ) : isNextOpenSlot && !isViewer ? (
                              <button
                                type="button"
                                onClick={() => setAttachTarget(fgd)}
                                className="px-3 py-1.5 rounded-lg bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90"
                              >
                                Attach SC
                              </button>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageContainer>

      {!loadingCommittee && (
        <AttachModal
          fgd={liveAttachTarget}
          activeCommittee={activeCommittee}
          onClose={() => setAttachTarget(null)}
        />
      )}
    </AdminLayout>
  );
}
