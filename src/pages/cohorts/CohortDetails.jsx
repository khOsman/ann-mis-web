import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebase";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { ROUTES } from "../../constants/routes";

export default function CohortDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [cohort, setCohort] = useState(null);

  useEffect(() => {
    const fetchCohort = async () => {
      try {
        const docRef = doc(db, "cohorts", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          showAlert("error", "Cohort not found.");
          navigate(ROUTES.cohorts);
          return;
        }

        setCohort({
          id: docSnap.id,
          ...docSnap.data(),
        });
      } catch (error) {
        console.error(error);
        showAlert("error", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCohort();
  }, [id]);

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

  if (loading) {
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
      title={cohort.cohort_name}
      subtitle={`${cohort.cohort_code} • ${cohort.district}, ${cohort.division}`}
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border p-5">
            <p className="text-gray-500 text-sm">Registrations</p>
            <h3 className="text-2xl font-bold">
              {cohort.total_registrations || 0}
            </h3>
          </div>

          <div className="bg-white rounded-2xl border p-5">
            <p className="text-gray-500 text-sm">Selected</p>
            <h3 className="text-2xl font-bold">
              {cohort.total_selected || 0}
            </h3>
          </div>

          <div className="bg-white rounded-2xl border p-5">
            <p className="text-gray-500 text-sm">Enrolled</p>
            <h3 className="text-2xl font-bold">
              {cohort.total_enrolled || 0}
            </h3>
          </div>

          <div className="bg-white rounded-2xl border p-5">
            <p className="text-gray-500 text-sm">Graduated</p>
            <h3 className="text-2xl font-bold">
              {cohort.total_graduated || 0}
            </h3>
          </div>

          <div className="bg-white rounded-2xl border p-5">
            <p className="text-gray-500 text-sm">Projects</p>
            <h3 className="text-2xl font-bold">
              {cohort.total_projects || 0}
            </h3>
          </div>
        </div>

        {/* Cohort Information */}
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="text-lg font-bold mb-5">
            Cohort Information
          </h3>

          <div className="grid md:grid-cols-2 gap-5 text-sm">
            <div>
              <p className="text-gray-500">Cohort Code</p>
              <p className="font-semibold">{cohort.cohort_code}</p>
            </div>

            <div>
              <p className="text-gray-500">Cohort Year</p>
              <p className="font-semibold">{cohort.cohort_year}</p>
            </div>

            <div>
              <p className="text-gray-500">Division</p>
              <p className="font-semibold">{cohort.division}</p>
            </div>

            <div>
              <p className="text-gray-500">District</p>
              <p className="font-semibold">{cohort.district}</p>
            </div>

            <div>
              <p className="text-gray-500">Registration Start</p>
              <p className="font-semibold">
                {cohort.registration_start_date}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Registration End</p>
              <p className="font-semibold">
                {cohort.registration_end_date}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Selection Target</p>
              <p className="font-semibold">
                {cohort.selection_target}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Graduation Target</p>
              <p className="font-semibold">
                {cohort.graduation_target}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-semibold">
                {cohort.status}
              </p>
            </div>
          </div>
        </div>

        {/* Audit Information */}
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="text-lg font-bold mb-5">
            Audit Information
          </h3>

          <div className="grid md:grid-cols-2 gap-5 text-sm">
            <div>
              <p className="text-gray-500">Created By</p>
              <p className="font-semibold">
                {cohort.created_by_name ||
                  cohort.created_by_email ||
                  "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Created At</p>
              <p className="font-semibold">
                {formatDate(cohort.created_at)}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Last Updated By</p>
              <p className="font-semibold">
                {cohort.updated_by_name ||
                  cohort.updated_by_email ||
                  "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Last Updated At</p>
              <p className="font-semibold">
                {formatDate(cohort.updated_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Future Modules */}
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="text-lg font-bold mb-5">
            Future Modules
          </h3>

          <div className="grid md:grid-cols-4 gap-4">
            <button className="border rounded-xl p-4 text-left hover:border-[var(--ann-pink)]">
              Registration Forms
            </button>

            <button className="border rounded-xl p-4 text-left hover:border-[var(--ann-pink)]">
              FGDs
            </button>

            <button className="border rounded-xl p-4 text-left hover:border-[var(--ann-pink)]">
              Participants
            </button>

            <button className="border rounded-xl p-4 text-left hover:border-[var(--ann-pink)]">
              Projects
            </button>
          </div>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}