import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routes";
import CohortStatusBadge from "../../components/cohorts/CohortStatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useCohort } from "../../hooks";
import ParticipantImportBox from "../../components/cohorts/ParticipantImportBox";
import CohortJourney from "../../components/cohorts/CohortJourney";
import {
  previewCohortDataDeletion,
  deleteAllCohortData,
} from "../../services/cohortDataDeletionService";

export default function CohortDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { isSuperAdmin } = useAuth();

  const { data: cohort, loading, error } = useCohort(id);

  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        `Deleted ${result.deletedParticipants} participant(s), ${result.deletedResponses} response(s), ${result.deletedFgds} FGD(s), and ${result.deletedForms} form(s).`
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
          onClick={() => navigate(ROUTES.cohorts)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to Cohorts
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

        <ParticipantImportBox
          cohort={cohort}
          showAlert={showAlert}
        />

        <CohortJourney cohort={cohort} />

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
    </AdminLayout>
  );
}