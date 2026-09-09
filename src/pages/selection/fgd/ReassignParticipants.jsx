import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAlert } from "../../../context/AlertContext";
import { useAuth } from "../../../context/AuthContext";
import { ROUTES } from "../../../constants/routes";
import { useCohort, useParticipants, useFGDsByCohort } from "../../../hooks";
import {
  distributeAcrossFGDs,
  hasFGDScheduleEnded,
  reassignParticipants,
} from "../../../services/fgdService";
import { FGD_STATUS, FGD_ATTENDANCE_STATUS } from "../../../constants/fgd";
import { SELECTION_STATUS } from "../../../constants/status";
import { formatBDPhone } from "../../../utils/phone";

const isAbsent = (p) => p.fgd_attendance_status === FGD_ATTENDANCE_STATUS.ABSENT;
const isRejected = (p) => p.selection_status === SELECTION_STATUS.REJECTED;
const isWaitlisted = (p) => p.selection_status === SELECTION_STATUS.WAITLISTED;
const isEligible = (p) => isAbsent(p) || isRejected(p) || isWaitlisted(p);

const CATEGORY_TABS = [
  { key: "all", label: "All", predicate: isEligible },
  { key: "absent", label: "Absent", predicate: isAbsent },
  { key: "rejected", label: "Rejected", predicate: isRejected },
  { key: "waitlisted", label: "Waitlisted", predicate: isWaitlisted },
];

export default function ReassignParticipants() {
  const { cohortId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { isViewer } = useAuth();

  const { data: cohort } = useCohort(cohortId);
  const { data: allParticipants, loading: loadingParticipants } = useParticipants();
  const { data: fgds } = useFGDsByCohort(cohortId);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const [reassignTarget, setReassignTarget] = useState(null); // array of participant objects, or null
  const [destinationFgdId, setDestinationFgdId] = useState(""); // single-mode
  const [destinationFgdIds, setDestinationFgdIds] = useState([]); // bulk-mode
  const [preview, setPreview] = useState(null); // bulk-mode computed pairs
  const [reassigning, setReassigning] = useState(false);

  const cohortParticipants = useMemo(
    () => allParticipants.filter((p) => p.cohort_id === cohortId),
    [allParticipants, cohortId]
  );

  const activeCategoryTab = CATEGORY_TABS.find((tab) => tab.key === categoryFilter);

  const categoryParticipants = useMemo(
    () => cohortParticipants.filter(activeCategoryTab.predicate),
    [cohortParticipants, activeCategoryTab]
  );

  const visibleParticipants = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return categoryParticipants;

    return categoryParticipants.filter(
      (p) =>
        p.participant_code?.toLowerCase().includes(keyword) ||
        p.name?.toLowerCase().includes(keyword) ||
        p.email?.toLowerCase().includes(keyword) ||
        p.phone?.toLowerCase().includes(keyword)
    );
  }, [categoryParticipants, search]);

  // Excludes each participant's own current FGD implicitly is not possible
  // here (this list is shared across a mixed selection) — the modal filters
  // per-participant where relevant (single mode only).
  const activeFgds = useMemo(
    () =>
      fgds.filter(
        (fgd) => fgd.status === FGD_STATUS.ACTIVE && !hasFGDScheduleEnded(fgd)
      ),
    [fgds]
  );

  const toggleSelected = (participantId) => {
    setSelectedIds((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    );
  };

  const allVisibleSelected =
    visibleParticipants.length > 0 &&
    visibleParticipants.every((p) => selectedIds.includes(p.id));

  const toggleSelectAllVisible = () => {
    const visibleIds = visibleParticipants.map((p) => p.id);

    setSelectedIds((prev) =>
      allVisibleSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : [...new Set([...prev, ...visibleIds])]
    );
  };

  const openReassignModal = (participants) => {
    setReassignTarget(participants);
    setDestinationFgdId("");
    setDestinationFgdIds([]);
    setPreview(null);
  };

  const closeReassignModal = () => {
    setReassignTarget(null);
    setDestinationFgdId("");
    setDestinationFgdIds([]);
    setPreview(null);
  };

  const toggleDestinationFgd = (fgdId) => {
    setDestinationFgdIds((prev) =>
      prev.includes(fgdId) ? prev.filter((id) => id !== fgdId) : [...prev, fgdId]
    );
    setPreview(null);
  };

  const handlePreviewDistribution = () => {
    const chosenFgds = activeFgds.filter((fgd) => destinationFgdIds.includes(fgd.id));
    if (chosenFgds.length === 0) return;

    setPreview(distributeAcrossFGDs(reassignTarget, chosenFgds));
  };

  const handleConfirmReassign = async () => {
    const isBulk = reassignTarget.length > 1;

    if (isBulk && !preview) return;
    if (!isBulk && !destinationFgdId) return;

    setReassigning(true);

    try {
      const pairs = isBulk
        ? preview.map(({ participant, destinationFgd }) => ({
            participantId: participant.id,
            destinationFgdId: destinationFgd.id,
          }))
        : [{ participantId: reassignTarget[0].id, destinationFgdId }];

      const result = await reassignParticipants(pairs);

      showAlert(
        "success",
        `Moved ${result.movedCount} participant(s) to their new FGD.`
      );
      setSelectedIds([]);
      closeReassignModal();
    } catch (error) {
      showAlert("error", error.message || "Failed to reassign participants.");
    } finally {
      setReassigning(false);
    }
  };

  const selectedParticipants = cohortParticipants.filter((p) =>
    selectedIds.includes(p.id)
  );

  return (
    <AdminLayout
      title="Reassign Participants"
      subtitle={cohort ? `${cohort.cohort_name} (${cohort.cohort_code})` : "Loading..."}
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <button
          onClick={() => navigate(ROUTES.selectionReassign)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to Cohorts
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                Participants needing reassignment
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Absent, Rejected, or Waitlisted participants can be moved into
                another still-active FGD in this cohort.
              </p>
            </div>

            {!isViewer && (
              <button
                type="button"
                disabled={selectedParticipants.length === 0}
                onClick={() => openReassignModal(selectedParticipants)}
                className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Reassign Selected
                {selectedParticipants.length > 0 ? ` (${selectedParticipants.length})` : ""}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategoryFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  categoryFilter === tab.key
                    ? "bg-[var(--ann-pink)] text-white border-[var(--ann-pink)]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[var(--ann-pink)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, participant code..."
            className="w-full md:w-96 border border-gray-300 rounded-xl px-4 py-3 text-sm mb-5 focus:outline-none focus:border-[var(--ann-pink)]"
          />

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="bg-[#F9FAFB] text-gray-500">
                <tr>
                  <th className="p-4">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      disabled={visibleParticipants.length === 0}
                      className="accent-[var(--ann-pink)]"
                    />
                  </th>
                  <th className="text-left p-4">No.</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Current FGD</th>
                  <th className="text-left p-4">Attendance</th>
                  <th className="text-left p-4">Selection</th>
                  {!isViewer && <th className="text-left p-4">Action</th>}
                </tr>
              </thead>

              <tbody>
                {loadingParticipants ? (
                  <tr>
                    <td colSpan={isViewer ? 8 : 9} className="p-6 text-center text-gray-500">
                      Loading participants...
                    </td>
                  </tr>
                ) : visibleParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={isViewer ? 8 : 9} className="p-6 text-center text-gray-500">
                      No participants found for this category.
                    </td>
                  </tr>
                ) : (
                  visibleParticipants.map((participant, index) => (
                    <tr key={participant.id} className="border-t border-gray-100">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(participant.id)}
                          onChange={() => toggleSelected(participant.id)}
                          className="accent-[var(--ann-pink)]"
                        />
                      </td>
                      <td className="p-4 text-gray-500">{index + 1}</td>
                      <td className="p-4 font-semibold text-[var(--ann-text-dark)]">
                        {participant.name || "-"}
                      </td>
                      <td className="p-4 text-gray-600">{participant.email || "-"}</td>
                      <td className="p-4 text-gray-600">
                        {formatBDPhone(participant.phone) || "-"}
                      </td>
                      <td className="p-4 text-gray-600">
                        {participant.fgd_code || "-"}
                      </td>
                      <td className="p-4 text-gray-600">
                        {participant.fgd_attendance_status || "-"}
                      </td>
                      <td className="p-4 text-gray-600">
                        {participant.selection_status || "-"}
                      </td>
                      {!isViewer && (
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => openReassignModal([participant])}
                            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold"
                          >
                            Reassign
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageContainer>

      {reassignTarget && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              {reassignTarget.length === 1
                ? `Reassign ${reassignTarget[0].name || "participant"}`
                : `Reassign ${reassignTarget.length} participants`}
            </h3>

            {reassignTarget.length === 1 ? (
              <div className="mt-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Destination FGD
                </label>
                <select
                  value={destinationFgdId}
                  onChange={(e) => setDestinationFgdId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                >
                  <option value="">Select FGD...</option>
                  {activeFgds
                    .filter((fgd) => fgd.id !== reassignTarget[0].fgd_id)
                    .map((fgd) => (
                      <option key={fgd.id} value={fgd.id}>
                        {fgd.fgd_code} — {fgd.fgd_name} (
                        {fgd.total_participants || 0}/{fgd.participant_limit || "-"})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Destination FGDs (pick one or more — participants will be
                    distributed between them evenly)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3">
                    {activeFgds.map((fgd) => (
                      <label key={fgd.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={destinationFgdIds.includes(fgd.id)}
                          onChange={() => toggleDestinationFgd(fgd.id)}
                          className="accent-[var(--ann-pink)]"
                        />
                        {fgd.fgd_code} — {fgd.fgd_name} ({fgd.total_participants || 0}/
                        {fgd.participant_limit || "-"})
                      </label>
                    ))}
                  </div>
                </div>

                {!preview ? (
                  <button
                    type="button"
                    disabled={destinationFgdIds.length === 0}
                    onClick={handlePreviewDistribution}
                    className="w-full border border-gray-300 text-gray-700 rounded-xl px-4 py-2.5 text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] disabled:opacity-40"
                  >
                    Preview Distribution
                  </button>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Proposed distribution
                    </p>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                      {preview.map(({ participant, destinationFgd }) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between px-3 py-2 text-sm"
                        >
                          <span className="text-gray-700">{participant.name || "-"}</span>
                          <span className="text-gray-500">
                            → {destinationFgd.fgd_code}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeReassignModal}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  reassigning ||
                  (reassignTarget.length === 1 ? !destinationFgdId : !preview)
                }
                onClick={handleConfirmReassign}
                className="px-5 py-2.5 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {reassigning ? "Reassigning..." : "Confirm Reassign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
