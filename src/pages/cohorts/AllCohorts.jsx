import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";

export default function AllCohorts() {
  return (
    <AdminLayout
      title="All Cohorts"
      subtitle="View and manage all cohorts"
    >
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
            All Cohorts
          </h3>

          <p className="text-gray-500 mt-2">
            Cohort list will appear here.
          </p>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}