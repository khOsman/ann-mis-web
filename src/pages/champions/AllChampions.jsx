import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useChampions } from "../../hooks";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { CHAMPION_ROLE_LABELS } from "../../constants/champions";

const ROLE_FILTERS = [
  { key: "all", label: "All" },
  { key: "unassigned", label: "Unassigned" },
  ...Object.entries(CHAMPION_ROLE_LABELS).map(([key, label]) => ({ key, label })),
];

export default function AllChampions() {
  const { data, loading, error } = useChampions();
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState("all");

  const totalChampions = data.length;

  const pendingApplications = data.filter(
    (m) => m.registration_status === "Pending"
  ).length;

  const approvedChampions = data.filter(
    (m) => m.registration_status === "Approved"
  ).length;

  const activeChampions = data.filter(
    (m) => m.member_status === "Active"
  ).length;

  const filteredData = data.filter((champion) => {
    if (roleFilter === "all") return true;
    if (roleFilter === "unassigned") return !champion.role;
    return champion.role === roleFilter;
  });

  return (
    <AdminLayout
      title="Champions Pool"
      subtitle="Manage registrations across Selection Committee, Facilitator, Co-Facilitator, Mentor and YCN"
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">

        {/* Summary Cards */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Applications</p>

            <h2 className="text-3xl font-bold text-[var(--ann-purple)] mt-2">
              {totalChampions}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pending Review</p>

            <h2 className="text-3xl font-bold text-amber-500 mt-2">
              {pendingApplications}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Approved</p>

            <h2 className="text-3xl font-bold text-green-600 mt-2">
              {approvedChampions}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active Champions</p>

            <h2 className="text-3xl font-bold text-blue-600 mt-2">
              {activeChampions}
            </h2>
          </div>

        </div>

        {/* Table */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">

          <div className="px-6 py-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--ann-text-dark)]">
                Champions Pool Applications
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Review, approve, assign a role, and manage Champions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {ROLE_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setRoleFilter(filter.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    roleFilter === filter.key
                      ? "bg-[var(--ann-pink)] text-white border-[var(--ann-pink)]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[var(--ann-pink)]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500">
              Loading Champions...
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-500">
              {error.message}
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead className="bg-gray-50 border-b">

                  <tr className="text-left text-sm font-semibold text-gray-700">

                    <th className="px-6 py-4">Champion ID</th>

                    <th className="px-6 py-4">Name</th>

                    <th className="px-6 py-4">Role</th>

                    <th className="px-6 py-4">Institution</th>

                    <th className="px-6 py-4">Registration</th>

                    <th className="px-6 py-4">Account</th>

                    <th className="px-6 py-4">Member</th>

                    <th className="px-6 py-4 text-center">Action</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-16 text-center text-gray-500"
                      >
                        No Champions found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((champion) => (
                      <tr
                        key={champion.id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 font-semibold">
                          {champion.champion_code}
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">
                              {champion.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {champion.email}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {champion.role
                            ? CHAMPION_ROLE_LABELS[champion.role] || champion.role
                            : (
                              <span className="text-amber-600 text-xs font-semibold">
                                Unassigned
                              </span>
                            )}
                        </td>

                        <td className="px-6 py-4">
                          {champion.institution}
                        </td>

                        <td className="px-6 py-4">
                          {champion.registration_status}
                        </td>

                        <td className="px-6 py-4">
                          {champion.account_status}
                        </td>

                        <td className="px-6 py-4">
                          {champion.member_status}
                        </td>

                        <td className="px-6 py-4 text-center">

                          <button
                            onClick={() =>
                                navigate(
                                ROUTES.championProfile.replace(
                                    ":championId",
                                    champion.id
                                )
                                )
                            }
                            className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90"
                            >
                            View
                            </button>

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
    </AdminLayout>
  );
}
