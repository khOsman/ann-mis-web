import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { useChampions, useFGDChangeRequests } from "../../hooks";
import { ROUTES } from "../../constants/routes";
import { CHAMPION_ROLES, REGISTRATION_STATUS } from "../../constants/champions";
import {
  assignChampionToFGD,
  unassignChampionFromFGD,
} from "../../services/championsService";
import { resolveFGDChangeRequest } from "../../services/championPortalService";
import { getCohorts } from "../../services/cohortService";
import { getFGDsByCohort } from "../../services/fgdService";

export default function SelectionCommittee() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { isViewer } = useAuth();
  const { data: champions, loading, error } = useChampions();

  const [assignTarget, setAssignTarget] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [fgds, setFgds] = useState([]);
  const [loadingFgds, setLoadingFgds] = useState(false);
  const [selectedFgdId, setSelectedFgdId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const { data: changeRequests, loading: loadingChangeRequests } = useFGDChangeRequests();
  const [resolvingRequestId, setResolvingRequestId] = useState(null);

  const handleResolveRequest = async (requestId, status) => {
    setResolvingRequestId(requestId);

    try {
      await resolveFGDChangeRequest({ requestId, status });
      showAlert("success", `Request ${status.toLowerCase()}.`);
      // No manual refetch needed — the live listener updates the queue automatically.
    } catch (err) {
      showAlert("error", err.message || "Failed to resolve request.");
    } finally {
      setResolvingRequestId(null);
    }
  };

  const approvedCommitteeMembers = useMemo(
    () =>
      champions.filter(
        (champion) =>
          champion.role === CHAMPION_ROLES.SELECTION_COMMITTEE &&
          champion.registration_status === REGISTRATION_STATUS.APPROVED
      ),
    [champions]
  );

  useEffect(() => {
    if (!assignTarget) return;

    getCohorts()
      .then((data) => setCohorts(data.filter((c) => c.is_deleted !== true)))
      .catch(() => showAlert("error", "Failed to load cohorts."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignTarget]);

  useEffect(() => {
    if (!selectedCohortId) {
      setFgds([]);
      return;
    }

    setLoadingFgds(true);

    getFGDsByCohort(selectedCohortId)
      .then(setFgds)
      .catch(() => showAlert("error", "Failed to load FGDs for this cohort."))
      .finally(() => setLoadingFgds(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCohortId]);

  const openAssignModal = (champion) => {
    setAssignTarget(champion);
    setSelectedCohortId("");
    setSelectedFgdId("");
    setFgds([]);
  };

  const closeAssignModal = () => {
    setAssignTarget(null);
  };

  const handleAssign = async () => {
    if (!selectedFgdId) {
      showAlert("error", "Select an FGD to assign.");
      return;
    }

    setAssigning(true);

    try {
      await assignChampionToFGD({
        championId: assignTarget.id,
        fgdId: selectedFgdId,
      });

      showAlert("success", "Committee member assigned. Notification email sent.");
      closeAssignModal();
      // No manual refetch needed — the live listener updates `champions` automatically.
    } catch (err) {
      showAlert("error", err.message || "Failed to assign FGD.");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (championId, fgdId) => {
    try {
      await unassignChampionFromFGD({ championId, fgdId });
      showAlert("success", "FGD assignment removed.");
      // No manual refetch needed — the live listener updates `champions` automatically.
    } catch (err) {
      showAlert("error", err.message || "Failed to remove assignment.");
    }
  };

  return (
    <AdminLayout
      title="Selection Committee"
      subtitle="Assign approved Selection Committee members to FGD groups"
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Pending FGD Change Requests
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Committee members requesting a different FGD assignment. Approving
              here does not auto-reassign — use "Assign / Change FGD" below to
              act on it.
            </p>
          </div>

          {loadingChangeRequests ? (
            <div className="py-10 text-center text-gray-500">Loading...</div>
          ) : changeRequests.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No pending change requests.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {changeRequests.map((request) => (
                <div
                  key={request.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-sm">
                      {request.champion_name}{" "}
                      <span className="text-gray-400 font-normal">
                        wants to change {request.fgd_code}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                  </div>

                  {!isViewer && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={resolvingRequestId === request.id}
                        onClick={() => handleResolveRequest(request.id, "Approved")}
                        className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={resolvingRequestId === request.id}
                        onClick={() => handleResolveRequest(request.id, "Dismissed")}
                        className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:border-gray-400 disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Approved Selection Committee Members
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {approvedCommitteeMembers.length} member(s). Assigning or changing
              an FGD sends the member an email with the session details.
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="py-20 text-center text-red-500">{error.message}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left font-semibold text-gray-700">
                    <th className="px-6 py-4">Committee Code</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Institution</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Assigned FGD(s)</th>
                    <th className="px-6 py-4">Member Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {approvedCommitteeMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-500">
                        No approved Selection Committee members found.
                      </td>
                    </tr>
                  ) : (
                    approvedCommitteeMembers.map((champion) => (
                      <tr key={champion.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold">
                          {champion.champion_code}
                        </td>
                        <td className="px-6 py-4">{champion.name}</td>
                        <td className="px-6 py-4">{champion.institution || "-"}</td>
                        <td className="px-6 py-4">{champion.email}</td>
                        <td className="px-6 py-4">
                          {champion.assigned_fgds?.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {champion.assigned_fgds.map((assignment) => (
                                <div
                                  key={assignment.fgd_id}
                                  className="flex items-center gap-2"
                                >
                                  <span className="px-2 py-1 rounded-lg bg-purple-50 text-[var(--ann-purple)] text-xs font-semibold">
                                    {assignment.fgd_code}
                                  </span>
                                  {!isViewer && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUnassign(champion.id, assignment.fgd_id)
                                      }
                                      className="text-xs text-red-500 hover:underline"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">{champion.member_status}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col gap-2 items-center">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  ROUTES.championProfile.replace(
                                    ":championId",
                                    champion.id
                                  )
                                )
                              }
                              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
                            >
                              View Profile
                            </button>
                            {!isViewer && (
                              <button
                                type="button"
                                onClick={() => openAssignModal(champion)}
                                className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90"
                              >
                                Assign / Change FGD
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageContainer>

      {assignTarget && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Assign FGD to {assignTarget.name}
            </h3>

            <div className="mt-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cohort
              </label>
              <select
                value={selectedCohortId}
                onChange={(e) => {
                  setSelectedCohortId(e.target.value);
                  setSelectedFgdId("");
                }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
              >
                <option value="">Select cohort...</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.cohort_name} ({cohort.cohort_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                FGD
              </label>
              <select
                value={selectedFgdId}
                onChange={(e) => setSelectedFgdId(e.target.value)}
                disabled={!selectedCohortId || loadingFgds}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)] disabled:opacity-50"
              >
                <option value="">
                  {loadingFgds ? "Loading FGDs..." : "Select FGD..."}
                </option>
                {fgds.map((fgd) => (
                  <option key={fgd.id} value={fgd.id}>
                    {fgd.fgd_code} — {fgd.fgd_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAssignModal}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={assigning}
                onClick={handleAssign}
                className="px-5 py-2.5 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {assigning ? "Assigning..." : "Confirm Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
