import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../../../firebase";
import AdminLayout from "../../../layouts/AdminLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAlert } from "../../../context/AlertContext";
import { useAuth } from "../../../context/AuthContext";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { ROUTES } from "../../../constants/routes";
import { useChampions, useCohort, useFGDsByCohort } from "../../../hooks";
import {
  generateFGDsForCohort,
  regenerateFGDsForCohort,
  syncFGDStatusIfEnded,
} from "../../../services/fgdService";
import {
  assignChampionToFGD,
  unassignChampionFromFGD,
} from "../../../services/championsService";
import { CHAMPION_ROLES, MEMBER_STATUS } from "../../../constants/champions";

export default function CohortFGDs() {
  const { cohortId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { isViewer } = useAuth();

  const { data: cohort, loading: cohortLoading } = useCohort(cohortId);
  const { data: fgds, loading: loadingFgds } = useFGDsByCohort(cohortId);

  // Opportunistic reconciliation — no scheduled job flips a passed FGD to
  // Completed on its own, so check whenever this list loads/updates.
  useEffect(() => {
    fgds.forEach((fgd) => {
      syncFGDStatusIfEnded(fgd).catch((err) =>
        console.error(`Failed to sync status for ${fgd.id}:`, err)
      );
    });
  }, [fgds]);

  const [participantLimit, setParticipantLimit] = useState(25);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegeneratePanel, setShowRegeneratePanel] = useState(false);
  const [regenerateLimit, setRegenerateLimit] = useState(25);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: allChampions, loading: loadingCommittee } = useChampions();
  const activeCommittee = useMemo(
    () =>
      allChampions.filter(
        (champion) =>
          champion.role === CHAMPION_ROLES.SELECTION_COMMITTEE &&
          champion.member_status === MEMBER_STATUS.ACTIVE
      ),
    [allChampions]
  );

  const [attachTargetId, setAttachTargetId] = useState(null);
  const [attachSearch, setAttachSearch] = useState("");
  const [selectedChampionIds, setSelectedChampionIds] = useState([]);
  const [attaching, setAttaching] = useState(false);
  const [removeTargetId, setRemoveTargetId] = useState(null);
  const [removingChampionId, setRemovingChampionId] = useState(null);

  // Derived from the live `fgds` list (not a snapshot captured at click
  // time) so the modal reflects any change made elsewhere while it's open.
  const attachTarget = useMemo(
    () => fgds.find((item) => item.id === attachTargetId) || null,
    [fgds, attachTargetId]
  );
  const removeTarget = useMemo(
    () => fgds.find((item) => item.id === removeTargetId) || null,
    [fgds, removeTargetId]
  );

  const assignedChampionIds = useMemo(
    () =>
      new Set((attachTarget?.committee_members || []).map((member) => member.champion_id)),
    [attachTarget]
  );

  const assignableCommittee = useMemo(() => {
    const keyword = attachSearch.trim().toLowerCase();

    return activeCommittee.filter((champion) => {
      if (assignedChampionIds.has(champion.id)) return false;
      if (!keyword) return true;
      return champion.name?.toLowerCase().includes(keyword);
    });
  }, [activeCommittee, assignedChampionIds, attachSearch]);

  const hasProperSchedule = (fgd) =>
    Boolean(fgd.session_date && fgd.session_start_time && fgd.session_end_time);

  const openAttachModal = (fgd) => {
    if (!hasProperSchedule(fgd)) {
      showAlert(
        "error",
        `Set ${fgd.fgd_code}'s schedule (date, start time, and end time) before assigning Selection Committee members.`
      );
      return;
    }

    setAttachTargetId(fgd.id);
    setAttachSearch("");
    setSelectedChampionIds([]);
  };

  const closeAttachModal = () => {
    setAttachTargetId(null);
  };

  const toggleSelectedChampion = (championId) => {
    setSelectedChampionIds((prev) =>
      prev.includes(championId)
        ? prev.filter((id) => id !== championId)
        : [...prev, championId]
    );
  };

  const handleAttachSelected = async () => {
    if (selectedChampionIds.length === 0) {
      showAlert("error", "Select at least one committee member to attach.");
      return;
    }

    setAttaching(true);

    try {
      const results = await Promise.allSettled(
        selectedChampionIds.map((championId) =>
          assignChampionToFGD({ championId, fgdId: attachTarget.id })
        )
      );

      const failed = results.filter((result) => result.status === "rejected");

      if (failed.length > 0) {
        showAlert(
          "error",
          `${failed.length} of ${selectedChampionIds.length} assignment(s) failed.`
        );
      } else {
        showAlert(
          "success",
          `${selectedChampionIds.length} committee member(s) attached. Notification emails sent.`
        );
      }

      closeAttachModal();
      // No manual refetch needed — both live listeners (FGDs, Champions) pick up the change.
    } finally {
      setAttaching(false);
    }
  };

  const handleRemoveMember = async (championId) => {
    setRemovingChampionId(championId);

    try {
      await unassignChampionFromFGD({ championId, fgdId: removeTarget.id });
      showAlert("success", "Committee member removed from this FGD.");
      // No manual refetch needed — `removeTarget` is derived from the live FGDs list.
    } catch (error) {
      showAlert("error", error.message || "Failed to remove committee member.");
    } finally {
      setRemovingChampionId(null);
    }
  };

  const handleGenerateFGDs = async () => {
    if (!cohort) return;

    if (!cohort.total_registrations || cohort.total_registrations === 0) {
      showAlert(
        "error",
        "This cohort has no registered participants yet. FGDs cannot be generated until participants have registered."
      );
      return;
    }

    setGenerating(true);

    try {
      const user = auth.currentUser;

      const result = await generateFGDsForCohort({
        cohort,
        participantLimit,
        createdByEmail: user?.email || "",
        createdByName: user?.displayName || "",
      });

      showAlert(
        "success",
        `${result.totalFGDs} FGDs generated for ${result.totalParticipants} participants.`
      );
      // No manual refetch needed — the live listener picks up the new FGDs.
    } catch (error) {
      console.error("FGD generation failed:", error);
      showAlert("error", error.message || "Failed to generate FGDs.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateFGDs = async () => {
    if (!cohort) return;

    setShowConfirmDialog(true);
  };

  const performRegenerateFGDs = async () => {
    setShowConfirmDialog(false);
    setRegenerating(true);

    try {
      const user = auth.currentUser;

      const result = await regenerateFGDsForCohort({
        cohort,
        participantLimit: regenerateLimit,
        updatedByEmail: user?.email || "",
        updatedByName: user?.displayName || "",
      });

      showAlert(
        "success",
        `FGDs regenerated: ${result.totalFGDs} groups for ${result.totalParticipants} participants.`
      );

      setShowRegeneratePanel(false);
      // No manual refetch needed — the live listener picks up the regenerated FGDs.
    } catch (error) {
      console.error("FGD regeneration failed:", error);
      showAlert("error", error.message || "Failed to regenerate FGDs.");
    } finally {
      setRegenerating(false);
    }
  };

  const loading = cohortLoading || loadingFgds;

  return (
    <AdminLayout
      title="FGD Groups"
      subtitle="Manage FGDs for this cohort"
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <button
          onClick={() => navigate(`/admin/cohorts/${cohortId}`)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to Cohort Details
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
            {cohort?.cohort_name || "Cohort FGDs"}
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            {cohort?.cohort_code || "-"} • Total Registered:{" "}
            {cohort?.total_registrations || 0}
          </p>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-500">
            Loading FGDs...
          </div>
        ) : fgds.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Generate FGDs
            </h3>

            {!cohort?.total_registrations ? (
              <p className="text-sm text-gray-500 mt-2">
                No participants have registered for this cohort yet. FGDs can be
                generated once participants have registered.
              </p>
            ) : isViewer ? (
              <p className="text-sm text-gray-500 mt-2">
                No FGDs have been generated for this cohort yet.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-500 mt-2">
                  No FGDs have been generated for this cohort yet.
                </p>

                <div className="mt-5 max-w-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Participants per FGD
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={participantLimit}
                    onChange={(e) => setParticipantLimit(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                  />
                </div>

                <button
                  type="button"
                  disabled={generating}
                  onClick={handleGenerateFGDs}
                  className="mt-5 bg-[var(--ann-pink)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate FGDs"}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                  Generated FGDs
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {fgds.length} FGD group(s) generated.
                </p>
              </div>

              {!isViewer && (
                <button
                  type="button"
                  onClick={() => setShowRegeneratePanel((prev) => !prev)}
                  className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold"
                >
                  {showRegeneratePanel ? "Cancel" : "Regenerate FGDs"}
                </button>
              )}
            </div>

            {showRegeneratePanel && !isViewer && (
              <div className="px-6 py-5 border-b border-gray-200 bg-red-50/50">
                <p className="text-sm text-red-700 font-semibold">
                  Warning: regenerating permanently deletes all {fgds.length} existing
                  FGD group(s) and resets every affected participant's attendance,
                  scores, feedback, and selection decision (Selected/Waitlisted/
                  Rejected) back to Pending. This cannot be undone.
                </p>

                <div className="mt-4 max-w-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Participants per FGD
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={regenerateLimit}
                    onChange={(e) => setRegenerateLimit(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                  />
                </div>

                <button
                  type="button"
                  disabled={regenerating}
                  onClick={handleRegenerateFGDs}
                  className="mt-4 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {regenerating ? "Regenerating..." : "Confirm Regenerate"}
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-6 py-4">FGD Code</th>
                    <th className="text-left px-6 py-4">Name</th>
                    <th className="text-center px-6 py-4">Participants</th>
                    <th className="text-center px-6 py-4">Present</th>
                    <th className="text-center px-6 py-4">Absent</th>
                    <th className="text-center px-6 py-4">Status</th>
                    <th className="text-center px-6 py-4">Selection Committee</th>
                    <th className="text-center px-6 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {fgds.map((fgd) => (
                    <tr
                      key={fgd.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-5 font-semibold">
                        {fgd.fgd_code}
                      </td>

                      <td className="px-6 py-5">{fgd.fgd_name}</td>

                      <td className="px-6 py-5 text-center">
                        {fgd.total_participants || 0}
                      </td>

                      <td className="px-6 py-5 text-center">
                        {fgd.total_present || 0}
                      </td>

                      <td className="px-6 py-5 text-center">
                        {fgd.total_absent || 0}
                      </td>

                      <td className="px-6 py-5 text-center">
                        {fgd.status || "-"}
                      </td>

                      <td className="px-6 py-5">
                        {fgd.committee_members?.length > 0 ? (
                          <div className="flex flex-wrap justify-center gap-1.5 max-w-[220px] mx-auto">
                            {fgd.committee_members.map((member) => (
                              <span
                                key={member.champion_id}
                                title={member.email}
                                className="px-2 py-1 rounded-lg bg-purple-50 text-[var(--ann-purple)] text-xs font-semibold whitespace-nowrap"
                              >
                                {member.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-xs text-gray-400">Unassigned</p>
                        )}
                      </td>

                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {!isViewer && (
                            <button
                              type="button"
                              onClick={() => openAttachModal(fgd)}
                              className="px-3 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
                            >
                              Attach SC
                            </button>
                          )}

                          {!isViewer && (
                            <button
                              type="button"
                              disabled={!fgd.committee_members?.length}
                              onClick={() => setRemoveTargetId(fgd.id)}
                              className="px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Remove SC
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                ROUTES.selectionFGDDetails.replace(
                                  ":fgdId",
                                  fgd.id
                                )
                              )
                            }
                            className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageContainer>

      {attachTarget && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Attach Selection Committee to {attachTarget.fgd_code}
            </h3>

            <input
              type="text"
              value={attachSearch}
              onChange={(e) => setAttachSearch(e.target.value)}
              placeholder="Search by name..."
              className="mt-4 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
            />

            {loadingCommittee ? (
              <p className="text-sm text-gray-500 mt-4">
                Loading active committee members...
              </p>
            ) : assignableCommittee.length === 0 ? (
              <p className="text-sm text-gray-500 mt-4">
                No matching active committee members available.
              </p>
            ) : (
              <div className="mt-4 max-h-64 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
                {assignableCommittee.map((champion) => (
                  <label
                    key={champion.id}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedChampionIds.includes(champion.id)}
                      onChange={() => toggleSelectedChampion(champion.id)}
                      className="accent-[var(--ann-pink)]"
                    />
                    <div>
                      <p className="font-semibold">{champion.name}</p>
                      <p className="text-xs text-gray-500">
                        {champion.champion_code} • {champion.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAttachModal}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={attaching || selectedChampionIds.length === 0}
                onClick={handleAttachSelected}
                className="px-5 py-2.5 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {attaching
                  ? "Attaching..."
                  : `Attach Selected${
                      selectedChampionIds.length > 0
                        ? ` (${selectedChampionIds.length})`
                        : ""
                    }`}
              </button>
            </div>
          </div>
        </div>
      )}

      {removeTarget && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Remove Selection Committee from {removeTarget.fgd_code}
            </h3>

            {removeTarget.committee_members?.length > 0 ? (
              <div className="mt-4 flex flex-col gap-2">
                {removeTarget.committee_members.map((member) => (
                  <div
                    key={member.champion_id}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    <button
                      type="button"
                      disabled={removingChampionId === member.champion_id}
                      onClick={() => handleRemoveMember(member.champion_id)}
                      className="text-xs text-red-500 hover:underline disabled:opacity-50"
                    >
                      {removingChampionId === member.champion_id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-4">
                No committee members assigned to this FGD.
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setRemoveTargetId(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showConfirmDialog}
        title="Regenerate FGD Groups?"
        message={`This will permanently delete all ${fgds.length} existing FGD group(s) for this cohort and reset every affected participant's attendance, scores, feedback, and selection decision (Selected/Waitlisted/Rejected) back to Pending. This cannot be undone.`}
        confirmText="Regenerate"
        cancelText="Cancel"
        variant="danger"
        onConfirm={performRegenerateFGDs}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </AdminLayout>
  );
}