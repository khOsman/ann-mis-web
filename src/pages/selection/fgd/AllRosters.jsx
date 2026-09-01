import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useCohorts } from "../../../hooks";
import { COHORT_STATUS } from "../../../constants/status";
import { ROUTES } from "../../../constants/routes";

export default function AllRosters() {
  const navigate = useNavigate();
  const { data: cohorts, loading } = useCohorts();

  // A roster sheet only means something once FGDs actually exist for the
  // cohort — same filter the Champion Portal's own roster list uses.
  const activeCohorts = useMemo(
    () =>
      cohorts.filter(
        (cohort) =>
          cohort.status === COHORT_STATUS.ACTIVE && (cohort.total_fgds || 0) > 0
      ),
    [cohorts]
  );

  return (
    <AdminLayout
      title="All Rosters"
      subtitle="FGD roster sheets for every active cohort"
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Active Cohorts
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Select a cohort to view its FGD roster and attach or remove
              Selection Committee members on any slot.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading cohorts...
            </div>
          ) : activeCohorts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No active cohorts have generated FGDs yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-sm text-gray-600">
                  <tr>
                    <th className="text-left px-6 py-4">Cohort</th>
                    <th className="text-center px-6 py-4">FGDs</th>
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
                        <p className="font-semibold">{cohort.cohort_name}</p>
                        <p className="text-xs text-gray-500">
                          {cohort.cohort_code}
                        </p>
                      </td>

                      <td className="text-center">{cohort.total_fgds || 0}</td>

                      <td className="text-center">
                        <button
                          onClick={() =>
                            navigate(
                              ROUTES.selectionRosterDetail.replace(
                                ":cohortId",
                                cohort.id
                              )
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90"
                        >
                          View Roster
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
