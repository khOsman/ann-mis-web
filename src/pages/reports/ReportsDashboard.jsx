import { useNavigate } from "react-router-dom";
import { FileText, SlidersHorizontal, Download } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";

export default function ReportsDashboard() {
  const navigate = useNavigate();

  const reportCards = [
    {
      title: "Custom Report Builder",
      description:
        "Create dynamic reports by selecting datasets, columns, and filters.",
      icon: SlidersHorizontal,
      path: "/admin/reports/custom",
      active: true,
    },
    {
      title: "Saved Reports",
      description: "Access frequently used report templates.",
      icon: FileText,
      path: "#",
      active: false,
    },
    {
      title: "Export Center",
      description: "Download generated reports in CSV or XLSX format.",
      icon: Download,
      path: "#",
      active: false,
    },
  ];

  return (
    <AdminLayout
      title="Reports"
      subtitle="Build, customize, and export ANN MIS reports"
    >
      <PageContainer className="py-6 lg:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reportCards.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                type="button"
                disabled={!item.active}
                onClick={() => item.active && navigate(item.path)}
                className={`bg-white border rounded-2xl p-6 text-left shadow-sm transition ${
                  item.active
                    ? "border-gray-200 hover:border-[var(--ann-pink)] hover:shadow-md"
                    : "border-gray-100 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[var(--ann-pink)] flex items-center justify-center">
                  <Icon size={22} />
                </div>

                <h3 className="text-lg font-bold text-[var(--ann-text-dark)] mt-5">
                  {item.title}
                </h3>

                <p className="text-sm text-gray-500 mt-2 leading-6">
                  {item.description}
                </p>

                {!item.active && (
                  <span className="inline-block mt-4 text-xs font-semibold text-gray-400">
                    Coming soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PageContainer>
    </AdminLayout>
  );
}