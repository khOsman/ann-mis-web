import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";

export default function AllForms() {
  return (
    <AdminLayout title="All Forms" subtitle="View and manage registration forms">
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
            Forms Module
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Registration form builder will be added here.
          </p>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}