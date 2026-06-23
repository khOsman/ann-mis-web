import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import AdminLayout from "../layouts/AdminLayout";
import PageContainer from "../layouts/PageContainer";
import StatCard from "../components/dashboard/StatCard";

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !user.email.endsWith("@brac.net")) {
        await signOut(auth);
        window.location.href = "/";
        return;
      }

      setAllowed(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ann-bg)]">
        <p className="text-[var(--ann-purple)] font-medium">Checking access...</p>
      </div>
    );
  }

  if (!allowed) return null;

  const stats = [
    ["Total Registrations", "0", "Across all cohorts"],
    ["Selected", "0", "FGD selected participants"],
    ["Enrolled", "0", "Payment completed"],
    ["Graduated", "0", "Successfully completed"],
  ];

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="ANN operational overview and quick actions"
    >
      <PageContainer className="py-6 lg:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
          {stats.map(([title, value, subtitle]) => (
            <StatCard
              key={title}
              title={title}
              value={value}
              subtitle={subtitle}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-3 gap-5 lg:gap-6 mt-6 lg:mt-8">
          <div className="2xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 lg:p-6 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                  Active Cohorts
                </h3>
                <p className="text-sm text-gray-500">
                  Recent cohort progress summary
                </p>
              </div>
              <button className="text-sm font-semibold text-[var(--ann-pink)] text-left">
                View all
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-[#F9FAFB] text-gray-500">
                  <tr>
                    <th className="text-left p-4">Cohort</th>
                    <th className="text-left p-4">Registrations</th>
                    <th className="text-left p-4">Selected</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {["Jessore-25", "Bogura-26", "Rajshahi-26"].map((cohort) => (
                    <tr key={cohort} className="border-t border-gray-100">
                      <td className="p-4 font-semibold text-[var(--ann-text-dark)]">
                        {cohort}
                      </td>
                      <td className="p-4 text-gray-600">0</td>
                      <td className="p-4 text-gray-600">0</td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full bg-pink-50 text-[var(--ann-pink)] text-xs font-semibold">
                          Draft
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 lg:p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Quick Actions
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Start common operational tasks
            </p>

            <div className="mt-5 space-y-3">
              {[
                "Create New Cohort",
                "Design Registration Form",
                "View Participants",
                "Generate Report",
              ].map((item) => (
                <button
                  key={item}
                  className="w-full text-left px-4 py-3 rounded-2xl border border-gray-200 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] font-medium transition"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}