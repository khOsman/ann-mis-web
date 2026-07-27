import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ChampionLayout from "../../../layouts/ChampionLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useCohorts } from "../../../hooks";
import { ROUTES } from "../../../constants/routes";
import { COHORT_STATUS } from "../../../constants/status";

export default function ChampionFGDRosters() {
  const navigate = useNavigate();
  const { data: cohorts, loading } = useCohorts();

  const activeCohorts = useMemo(
    () => cohorts.filter((cohort) => cohort.status === COHORT_STATUS.ACTIVE),
    [cohorts]
  );

  return (
    <ChampionLayout
      title="FGD Rosters"
      subtitle="Pick an open slot on any FGD roster"
    >
      <PageContainer className="py-6 lg:py-8">
        {loading ? (
          <p className="text-gray-500">Loading cohorts...</p>
        ) : activeCohorts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
            No active cohorts right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {activeCohorts.map((cohort) => (
              <div
                key={cohort.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col"
              >
                <div>
                  <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                    {cohort.cohort_name || "-"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {cohort.cohort_code || "-"} • {cohort.district || "-"}
                  </p>
                </div>

                <p className="text-sm text-gray-600 mt-4">
                  <span className="font-bold text-[var(--ann-purple)]">
                    {cohort.total_fgds || 0}
                  </span>{" "}
                  FGD(s) available
                </p>

                <button
                  type="button"
                  disabled={!cohort.total_fgds}
                  onClick={() =>
                    navigate(
                      ROUTES.championFGDRosterDetail.replace(":cohortId", cohort.id)
                    )
                  }
                  className="mt-5 bg-[var(--ann-pink)] text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  View Roster
                </button>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </ChampionLayout>
  );
}
