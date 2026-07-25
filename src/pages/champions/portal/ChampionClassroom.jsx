import { Navigate } from "react-router-dom";
import ChampionLayout from "../../../layouts/ChampionLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAuth } from "../../../context/AuthContext";
import { CHAMPION_ROLES } from "../../../constants/champions";
import { ROUTES } from "../../../constants/routes";

export default function ChampionClassroom() {
  const { appUser } = useAuth();

  const allowed = [CHAMPION_ROLES.FACILITATOR, CHAMPION_ROLES.CO_FACILITATOR].includes(
    appUser?.role
  );

  if (!allowed) {
    return <Navigate to={ROUTES.championHome} replace />;
  }

  return (
    <ChampionLayout title="Classroom" subtitle="Assigned batches, attendance and feedback">
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">Coming Soon</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-6">
            Classroom tools — assigned batches, attendance tracking, and
            per-session feedback — are coming soon. For now, please continue
            coordinating with the ANN team directly.
          </p>
        </div>
      </PageContainer>
    </ChampionLayout>
  );
}
