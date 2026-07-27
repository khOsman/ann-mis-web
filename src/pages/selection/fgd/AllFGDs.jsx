import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useCohorts } from "../../../hooks";
import { COHORT_STATUS } from "../../../constants/status";
import { ROUTES } from "../../../constants/routes";

export default function AllFGDs() {
  const navigate = useNavigate();

  const { data: cohorts, loading } = useCohorts();

  // A cohort with nobody registered has nothing to select from yet — keep
  // it out of the FGD management list until it actually has participants.
  const activeCohorts = cohorts.filter(
    (cohort) =>
      cohort.status === COHORT_STATUS.ACTIVE &&
      (cohort.total_registrations || 0) > 0
  );

  return (
    <AdminLayout
      title="Selection"
      subtitle="Manage FGD generation and participant selection"
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active Cohorts</p>
            <h3 className="text-3xl font-bold mt-2">
              {activeCohorts.length}
            </h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Registered</p>
            <h3 className="text-3xl font-bold mt-2">
              {activeCohorts.reduce(
                (sum, cohort) => sum + (cohort.total_registrations || 0),
                0
              )}
            </h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Generated FGDs</p>
            <h3 className="text-3xl font-bold mt-2">
              {activeCohorts.reduce(
                (sum, cohort) => sum + (cohort.total_fgds || 0),
                0
              )}
            </h3>
          </div>
        </div>

        {/* Active Cohorts */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Active Cohorts
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Select a cohort to manage FGD generation and participant
              selection.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading cohorts...
            </div>
          ) : activeCohorts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No active cohorts with registered participants yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-sm text-gray-600">
                  <tr>
                    <th className="text-left px-6 py-4">Cohort</th>
                    <th className="text-center px-6 py-4">Registered</th>
                    <th className="text-center px-6 py-4">FGDs</th>
                    <th className="text-center px-6 py-4">Pending Selection</th>
                    <th className="text-center px-6 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {activeCohorts.map((cohort) => (
                    <tr
                      key={cohort.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-5">
                        <p className="font-semibold">
                          {cohort.cohort_name}
                        </p>

                        <p className="text-xs text-gray-500">
                          {cohort.cohort_code}
                        </p>
                      </td>

                      <td className="text-center">
                        {cohort.total_registrations || 0}
                      </td>

                      <td className="text-center">
                        {cohort.total_fgds || 0}
                      </td>

                      <td className="text-center">
                        {cohort.total_registrations || 0}
                      </td>

                      <td className="text-center">
                        <button
                          onClick={() =>
                            navigate(
                              `${ROUTES.selectionFGDs}/${cohort.id}`
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90"
                        >
                          View FGDs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageContainer>
    </AdminLayout>
  );
}