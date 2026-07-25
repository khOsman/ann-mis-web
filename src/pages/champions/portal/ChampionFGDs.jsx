import { useNavigate } from "react-router-dom";
import ChampionLayout from "../../../layouts/ChampionLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAuth } from "../../../context/AuthContext";
import { useChampions } from "../../../hooks";
import { ROUTES } from "../../../constants/routes";
import { formatTimeRangeBDT } from "../../../utils/time";

export default function ChampionFGDs() {
  const { appUser } = useAuth();
  const navigate = useNavigate();

  const { data: champion, loading } = useChampions(appUser?.id);
  const assignedFgds = champion?.assigned_fgds || [];

  return (
    <ChampionLayout title="FGDs" subtitle="Your assigned Focused Group Discussions">
      <PageContainer className="py-6 lg:py-8">
        {loading ? (
          <p className="text-gray-500">Loading your assigned FGDs...</p>
        ) : assignedFgds.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
            You have no assigned FGDs yet. The ANN team will notify you once you're
            assigned.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                Assigned FGDs
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {assignedFgds.length} FGD(s). Select View to see the schedule,
                participants, attendance and evaluation for a group.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-6 py-4">FGD Code</th>
                    <th className="text-left px-6 py-4">Name</th>
                    <th className="text-left px-6 py-4">Cohort</th>
                    <th className="text-left px-6 py-4">Date</th>
                    <th className="text-left px-6 py-4">Time</th>
                    <th className="text-center px-6 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {assignedFgds.map((fgd) => (
                    <tr key={fgd.fgd_id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-5 font-semibold">{fgd.fgd_code}</td>
                      <td className="px-6 py-5">{fgd.fgd_name}</td>
                      <td className="px-6 py-5">{fgd.cohort_name || "-"}</td>
                      <td className="px-6 py-5">{fgd.session_date || "Not set"}</td>
                      <td className="px-6 py-5">
                        {formatTimeRangeBDT(fgd.session_start_time, fgd.session_end_time) ||
                          "Not set"}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              ROUTES.championFGDDetail.replace(":fgdId", fgd.fgd_id)
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageContainer>
    </ChampionLayout>
  );
}
