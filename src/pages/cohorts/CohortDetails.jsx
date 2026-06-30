import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { ROUTES } from "../../constants/routes";
import CohortStatusBadge from "../../components/cohorts/CohortStatusBadge";
import { useCohort } from "../../hooks";
import ParticipantImportBox from "../../components/cohorts/ParticipantImportBox";

export default function CohortDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const { data: cohort, loading, error,refresh } = useCohort(id);

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
        <PageContainer className="py-6">
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
          onImported={refresh}
        />

        <div className="bg-white rounded-2xl border p-6">
          <h3 className="text-lg font-bold mb-5">Future Modules</h3>

          <div className="grid md:grid-cols-4 gap-4">
            {["Registration Forms", "FGDs", "Participants", "Projects"].map(
              (item) => (
                <button
                  key={item}
                  className="border rounded-xl p-4 text-left hover:border-[var(--ann-pink)]"
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}