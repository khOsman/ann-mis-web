import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routes";
import CohortStatusBadge from "../../components/cohorts/CohortStatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useCohort, useParticipants, useForms } from "../../hooks";
import ParticipantImportBox from "../../components/cohorts/ParticipantImportBox";
import CohortJourney from "../../components/cohorts/CohortJourney";
import {
  previewCohortDataDeletion,
  deleteAllCohortData,
} from "../../services/cohortDataDeletionService";
import {
  previewParticipantDelete,
  hardDeleteParticipants,
} from "../../services/participantDeletionService";
import { findDuplicateParticipants } from "../../services/participantService";
import { formatBDPhone } from "../../utils/phone";
import { COHORT_STATUS } from "../../constants/status";

export default function CohortDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const { isAdmin, isSuperAdmin, isViewer, hasPermission } = useAuth();

  // Both the dashboard and AllCohorts.jsx link here — each passes where it
  // came from via navigation state so "Back" returns there instead of
  // always landing on All Cohorts.
  const backTo = location.state?.from || ROUTES.cohorts;
  const backLabel = location.state?.fromLabel || "Cohorts";

  const { data: cohort, loading, error } = useCohort(id);
  const { data: allParticipants, loading: participantsLoading } = useParticipants();
  const { data: allForms } = useForms();

  // "Add Participant" needs some registration form to exist for this
  // cohort so there's something to render/submit against — but not
  // specifically a Published one: a form is routinely marked Closed once
  // the public registration window ends, while staff (Youth Coordinators
  // especially) still need to key in a backlog of paper registrations for
  // days afterward. Requiring Published would block exactly that.
  const hasRegistrationForm = useMemo(
    () => allForms.some((f) => f.cohort_id === id),
    [allForms, id]
  );

  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cohortParticipants = useMemo(
    () => allParticipants.filter((p) => p.cohort_id === id),
    [allParticipants, id]
  );

  const { duplicateIds, preselectIds } = useMemo(
    () => findDuplicateParticipants(cohortParticipants),
    [cohortParticipants]
  );

  const [duplicatesChecked, setDuplicatesChecked] = useState(false);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [participantPreview, setParticipantPreview] = useState(null);
  const [loadingParticipantPreview, setLoadingParticipantPreview] = useState(false);
  const [participantConfirmText, setParticipantConfirmText] = useState("");
  const [showParticipantConfirmDialog, setShowParticipantConfirmDialog] = useState(false);
  const [deletingParticipants, setDeletingParticipants] = useState(false);

  const toggleParticipantSelection = (participantId) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    );
  };

  const toggleSelectAllParticipants = () => {
    setSelectedParticipantIds((prev) =>
      prev.length === cohortParticipants.length
        ? []
        : cohortParticipants.map((p) => p.id)
    );
  };

  // Flags every extra copy in a duplicate group (same email or phone) for
  // review, keeping the most-recently-submitted one per group untouched and
  // unflagged as the "original" — matches findDuplicateParticipants'
  // preselectIds, which already excludes that one.
  const checkForDuplicates = () => {
    setDuplicatesChecked(true);
    setSelectedParticipantIds([...preselectIds]);
  };

  const openParticipantDeletePreview = async () => {
    setLoadingParticipantPreview(true);

    try {
      const data = await previewParticipantDelete(selectedParticipantIds);
      setParticipantPreview(data);
    } catch (err) {
      showAlert("error", err.message || "Failed to load delete preview.");
    } finally {
      setLoadingParticipantPreview(false);
    }
  };

  const closeParticipantDeletePreview = () => {
    setParticipantPreview(null);
    setParticipantConfirmText("");
  };

  const handleDeleteParticipants = async () => {
    setShowParticipantConfirmDialog(false);
    setDeletingParticipants(true);

    try {
      const result = await hardDeleteParticipants(selectedParticipantIds);

      showAlert(
        "success",
        `Deleted ${result.deletedCount} participant(s), ${result.deletedResponses} response(s), and ${result.deletedEvaluations} evaluation(s).`
      );

      setSelectedParticipantIds([]);
      closeParticipantDeletePreview();
    } catch (err) {
      showAlert("error", err.message || "Failed to delete participants.");
    } finally {
      setDeletingParticipants(false);
    }
  };

  useEffect(() => {
    if (!loading && !cohort) {
      showAlert("error", "Cohort not found.");
      navigate(ROUTES.cohorts);
    }
  }, [loading, cohort, navigate, showAlert]);

  useEffect(() => {
    if (error) {
      console.error(error);
      showAlert("error", error.message || "Failed to load cohort.");
    }
  }, [error, showAlert]);

  const openDangerZone = async () => {
    setDangerZoneOpen(true);
    setLoadingPreview(true);

    try {
      const data = await previewCohortDataDeletion(id);
      setPreview(data);
    } catch (err) {
      showAlert("error", err.message || "Failed to load delete preview.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const closeDangerZone = () => {
    setDangerZoneOpen(false);
    setConfirmText("");
    setPreview(null);
  };

  const handleDelete = async () => {
    setShowConfirmDialog(false);
    setDeleting(true);

    try {
      const result = await deleteAllCohortData(id);

      showAlert(
        "success",
        `Deleted ${result.deletedParticipants} participant(s), ${result.deletedResponses} response(s), ${result.deletedFgds} FGD(s), and ${result.deletedForms} form(s).` +
          (result.updatedChampions
            ? ` Cleared stale FGD assignments from ${result.updatedChampions} committee member(s).`
            : "")
      );

      closeDangerZone();
    } catch (err) {
      showAlert("error", err.message || "Failed to delete cohort data.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "-";

    return timestamp.toDate().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  if (loading || !cohort) {
    return (
      <AdminLayout
        title="Cohort Details"
        subtitle="Loading cohort information"
      >
        <PageContainer className="py-6 space-y-4">
          <button
            onClick={() => navigate(ROUTES.cohorts)}
            className="text-sm font-semibold text-[var(--ann-pink)]"
          >
            ← Back to Cohorts
          </button>
          <p>Loading...</p>
        </PageContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={cohort.cohort_name || "Cohort Details"}
      subtitle={`${cohort.cohort_code || "-"} • ${cohort.district || "-"}, ${
        cohort.division || "-"
      }`}
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <button
          onClick={() => navigate(backTo)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to {backLabel}
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {[
            ["Registrations", cohort.total_registrations || 0],
            ["Selected", cohort.total_selected || 0],
            ["Enrolled", cohort.total_enrolled || 0],
            ["Graduated", cohort.total_graduated || 0],
            ["Projects", cohort.total_projects || 0],
          ].map(([label, value]) => (
            <div key={label} className="bg-white rounded-2xl border p-5">
              <p className="text-gray-500 text-sm">{label}</p>
              <h3 className="text-2xl font-bold">{value}</h3>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border p-6">
          <h3 className="text-lg font-bold mb-5">Cohort Information</h3>

          <div className="grid md:grid-cols-2 gap-5 text-sm">
            <div>
              <p className="text-gray-500">Cohort Code</p>
              <p className="font-semibold">{cohort.cohort_code || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">Cohort Year</p>
              <p className="font-semibold">{cohort.cohort_year || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">Division</p>
              <p className="font-semibold">{cohort.division || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">District</p>
              <p className="font-semibold">{cohort.district || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">Registration Start</p>
              <p className="font-semibold">
                {cohort.registration_start_date || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Registration End</p>
              <p className="font-semibold">
                {cohort.registration_end_date || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Selection Target</p>
              <p className="font-semibold">{cohort.selection_target || 0}</p>
            </div>

            <div>
              <p className="text-gray-500">Graduation Target</p>
              <p className="font-semibold">{cohort.graduation_target || 0}</p>
            </div>

            <div>
              <p className="text-gray-500">Status</p>
              <div className="mt-1">
                <CohortStatusBadge status={cohort.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6">
          <h3 className="text-lg font-bold mb-5">Audit Information</h3>

          <div className="grid md:grid-cols-2 gap-5 text-sm">
            <div>
              <p className="text-gray-500">Created By</p>
              <p className="font-semibold">
                {cohort.created_by_name || cohort.created_by_email || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Created At</p>
              <p className="font-semibold">{formatDate(cohort.created_at)}</p>
            </div>

            <div>
              <p className="text-gray-500">Last Updated By</p>
              <p className="font-semibold">
                {cohort.updated_by_name || cohort.updated_by_email || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Last Updated At</p>
              <p className="font-semibold">{formatDate(cohort.updated_at)}</p>
            </div>
          </div>
        </div>

        {hasPermission("manualEntry") &&
          cohort.status === COHORT_STATUS.ACTIVE &&
          hasRegistrationForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                Add Participant
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Manually key in one participant's registration data — the
                same form the public link uses.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/admin/cohorts/${id}/add-participant`)}
              className="px-5 py-2.5 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90"
            >
              Add Participant
            </button>
          </div>
        )}

        {/* Bulk CSV import is a broader capability than the narrow
            single-participant manualEntry permission — Youth Coordinators
            get the latter, not this, so this stays admin/super-admin only
            (not just !isViewer, which youth_coordinator would pass too). */}
        {isAdmin && (
          <ParticipantImportBox
            cohort={cohort}
            showAlert={showAlert}
          />
        )}

        <CohortJourney cohort={cohort} />

        {isSuperAdmin && (
          <div className="bg-white rounded-2xl border p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="text-lg font-bold">Participants</h3>
                <p className="text-sm text-gray-600">
                  Check for duplicates (matched by email or phone) and
                  permanently remove selected participants — super admin
                  only. Removal updates this cohort's stats, any assigned
                  FGD's count, and everywhere else that reads this data.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={checkForDuplicates}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:border-gray-400"
                >
                  Check for Duplicates
                </button>

                <button
                  type="button"
                  disabled={selectedParticipantIds.length === 0}
                  onClick={openParticipantDeletePreview}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete Selected ({selectedParticipantIds.length})
                </button>
              </div>
            </div>

            {duplicatesChecked && (
              <p className="text-sm text-gray-600 mb-4">
                {preselectIds.size > 0
                  ? `Found ${preselectIds.size} duplicate participant(s), pre-selected below — the most recently submitted entry in each group is kept as the original and left unselected.`
                  : "No duplicates found."}
              </p>
            )}

            {participantPreview && (
              <div className="space-y-4 bg-red-50 rounded-xl p-4 mb-4">
                {loadingParticipantPreview ? (
                  <p className="text-sm text-gray-500">Loading counts...</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Participants</p>
                      <p className="font-bold text-lg text-red-700">
                        {participantPreview.participantCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Form Responses</p>
                      <p className="font-bold text-lg text-red-700">
                        {participantPreview.responseCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Evaluations</p>
                      <p className="font-bold text-lg text-red-700">
                        {participantPreview.evaluationCount}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type <span className="font-mono text-red-600">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={participantConfirmText}
                    onChange={(e) => setParticipantConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full max-w-sm border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeParticipantDeletePreview}
                    className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:border-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      participantConfirmText !== "DELETE" ||
                      deletingParticipants ||
                      loadingParticipantPreview
                    }
                    onClick={() => setShowParticipantConfirmDialog(true)}
                    className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deletingParticipants ? "Deleting..." : "Delete Participants"}
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-[#F9FAFB] text-gray-500">
                  <tr>
                    <th className="text-left p-3 w-10">
                      <input
                        type="checkbox"
                        checked={
                          cohortParticipants.length > 0 &&
                          selectedParticipantIds.length === cohortParticipants.length
                        }
                        onChange={toggleSelectAllParticipants}
                      />
                    </th>
                    <th className="text-left p-3">Participant Code</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Phone</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {participantsLoading ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        Loading participants...
                      </td>
                    </tr>
                  ) : cohortParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        No participants in this cohort.
                      </td>
                    </tr>
                  ) : (
                    cohortParticipants.map((participant) => (
                      <tr key={participant.id} className="border-t border-gray-100">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedParticipantIds.includes(participant.id)}
                            onChange={() => toggleParticipantSelection(participant.id)}
                          />
                        </td>
                        <td className="p-3">{participant.participant_code || "-"}</td>
                        <td className="p-3">
                          {participant.name || "-"}
                          {duplicatesChecked && preselectIds.has(participant.id) && (
                            <span className="ml-2 inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                              Duplicate
                            </span>
                          )}
                          {duplicatesChecked &&
                            !preselectIds.has(participant.id) &&
                            duplicateIds.has(participant.id) && (
                              <span className="ml-2 inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                                Original
                              </span>
                            )}
                        </td>
                        <td className="p-3">{participant.email || "-"}</td>
                        <td className="p-3">{formatBDPhone(participant.phone) || "-"}</td>
                        <td className="p-3">{participant.selection_status || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isSuperAdmin && (
          <div className="bg-white rounded-2xl border border-red-200 p-6">
            <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete every participant, form response, FGD, and
              form tied to this cohort (super admin only). The cohort record
              itself stays, with its stats reset to zero. This cannot be
              undone.
            </p>

            {!dangerZoneOpen ? (
              <button
                type="button"
                onClick={openDangerZone}
                className="border border-red-300 text-red-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-red-50"
              >
                Show Delete Options
              </button>
            ) : (
              <div className="space-y-4">
                {loadingPreview ? (
                  <p className="text-sm text-gray-500">Loading counts...</p>
                ) : (
                  preview && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-red-50 rounded-xl p-4">
                      <div>
                        <p className="text-gray-500">Participants</p>
                        <p className="font-bold text-lg text-red-700">
                          {preview.participantCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Form Responses</p>
                        <p className="font-bold text-lg text-red-700">
                          {preview.responseCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">FGDs</p>
                        <p className="font-bold text-lg text-red-700">
                          {preview.fgdCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Forms</p>
                        <p className="font-bold text-lg text-red-700">
                          {preview.formCount}
                        </p>
                      </div>
                    </div>
                  )
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type <span className="font-mono text-red-600">{cohort.cohort_code}</span>{" "}
                    to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={cohort.cohort_code}
                    className="w-full max-w-sm border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeDangerZone}
                    className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:border-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      confirmText !== cohort.cohort_code || deleting || loadingPreview
                    }
                    onClick={() => setShowConfirmDialog(true)}
                    className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deleting ? "Deleting..." : "Delete All Participant Data"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </PageContainer>

      <ConfirmDialog
        open={showConfirmDialog}
        title={`Delete all data for ${cohort.cohort_code}?`}
        message={`This will permanently delete ${preview?.participantCount || 0} participant(s), ${preview?.responseCount || 0} form response(s), ${preview?.fgdCount || 0} FGD(s), and ${preview?.formCount || 0} form(s). The cohort record stays but its stats reset to zero. This cannot be undone.`}
        confirmText="Delete Everything"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDialog(false)}
      />

      <ConfirmDialog
        open={showParticipantConfirmDialog}
        title={`Delete ${selectedParticipantIds.length} participant(s)?`}
        message={`This will permanently delete ${participantPreview?.participantCount || 0} participant(s), ${participantPreview?.responseCount || 0} form response(s), and ${participantPreview?.evaluationCount || 0} evaluation(s), and update this cohort's and any assigned FGD's counts. This cannot be undone.`}
        confirmText="Delete Participants"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteParticipants}
        onCancel={() => setShowParticipantConfirmDialog(false)}
      />
    </AdminLayout>
  );
}