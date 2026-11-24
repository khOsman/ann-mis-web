import { useNavigate } from "react-router-dom";
import ChampionLayout from "../../../layouts/ChampionLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAuth } from "../../../context/AuthContext";
import { useFGDsByCaller } from "../../../hooks";
import { ROUTES } from "../../../constants/routes";
import { FGD_STATUS } from "../../../constants/fgd";

// The FGDs an admin has named this committee member to phone for. Separate
// from "Assigned FGDs" (the FGDs they sit on as a committee member): a
// caller does not have to be on the committee of the FGD they call for.
export default function ChampionPhoneCalls() {
  const { appUser } = useAuth();
  const navigate = useNavigate();

  const { data: fgds, loading } = useFGDsByCaller(appUser?.id);

  const sorted = [...fgds].sort((a, b) =>
    String(a.session_date || "").localeCompare(String(b.session_date || ""))
  );

  return (
    <ChampionLayout
      title="Phone Calls"
      subtitle="Participants you phone to confirm attendance"
    >
      <PageContainer className="py-6 lg:py-8">
        {loading ? (
          <p className="text-gray-500">Loading your FGDs...</p>
        ) : sorted.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
            You have not been asked to make phone calls for any FGD yet.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                FGDs you call for
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Open an FGD to see its participants and log each call.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-6 py-4">FGD</th>
                    <th className="text-left px-6 py-4">Cohort</th>
                    <th className="text-left px-6 py-4">Date</th>
                    <th className="text-center px-6 py-4">Participants</th>
                    <th className="text-center px-6 py-4">Status</th>
                    <th className="text-center px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((fgd) => (
                    <tr key={fgd.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold">{fgd.fgd_code}</p>
                        <p className="text-xs text-gray-500">{fgd.fgd_name}</p>
                      </td>
                      <td className="px-6 py-4">{fgd.cohort_name || "-"}</td>
                      <td className="px-6 py-4">{fgd.session_date || "Not set"}</td>
                      <td className="px-6 py-4 text-center">{fgd.total_participants || 0}</td>
                      <td className="px-6 py-4 text-center">{fgd.status || "-"}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(ROUTES.championPhoneCallsFGD.replace(":fgdId", fgd.id))
                          }
                          className="px-4 py-2 rounded-lg bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90"
                        >
                          {fgd.status === FGD_STATUS.COMPLETED ? "View" : "Open"}
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
