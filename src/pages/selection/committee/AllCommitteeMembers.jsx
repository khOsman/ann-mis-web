import AdminLayout from "../../../layouts/AdminLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useSelectionCommittee } from "../../../hooks";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";

export default function AllCommitteeMembers() {
  const { data, loading, error } = useSelectionCommittee();
  const navigate = useNavigate();

  const totalMembers = data.length;

  const pendingApplications = data.filter(
    (m) => m.registration_status === "Pending"
  ).length;

  const approvedMembers = data.filter(
    (m) => m.registration_status === "Approved"
  ).length;

  const activeMembers = data.filter(
    (m) => m.member_status === "Active"
  ).length;

  return (
    <AdminLayout
      title="Selection Committee"
      subtitle="Manage committee registrations and committee members"
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">

        {/* Summary Cards */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Applications</p>

            <h2 className="text-3xl font-bold text-[var(--ann-purple)] mt-2">
              {totalMembers}
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
              {approvedMembers}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active Members</p>

            <h2 className="text-3xl font-bold text-blue-600 mt-2">
              {activeMembers}
            </h2>
          </div>

        </div>

        {/* Table */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">

          <div className="px-6 py-5 border-b">
            <h2 className="text-xl font-bold text-[var(--ann-text-dark)]">
              Committee Registration Applications
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Review, approve and manage selection committee members.
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500">
              Loading committee members...
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

                    <th className="px-6 py-4">Committee ID</th>

                    <th className="px-6 py-4">Name</th>

                    <th className="px-6 py-4">Institution</th>

                    <th className="px-6 py-4">Registration</th>

                    <th className="px-6 py-4">Account</th>

                    <th className="px-6 py-4">Member</th>

                    <th className="px-6 py-4 text-center">Action</th>

                  </tr>

                </thead>

                <tbody>

                  {totalMembers === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-16 text-center text-gray-500"
                      >
                        No committee applications found.
                      </td>
                    </tr>
                  ) : (
                    data.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 font-semibold">
                          {member.committee_code}
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">
                              {member.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {member.email}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {member.institution}
                        </td>

                        <td className="px-6 py-4">
                          {member.registration_status}
                        </td>

                        <td className="px-6 py-4">
                          {member.account_status}
                        </td>

                        <td className="px-6 py-4">
                          {member.member_status}
                        </td>

                        <td className="px-6 py-4 text-center">

                          <button
                            onClick={() =>
                                navigate(
                                ROUTES.selectionCommitteeProfile.replace(
                                    ":memberId",
                                    member.id
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