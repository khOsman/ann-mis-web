import ChampionLayout from "../../layouts/ChampionLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAuth } from "../../context/AuthContext";
import { CHAMPION_ROLES } from "../../constants/champions";
import StatCard from "../../components/dashboard/StatCard";
import YearlyProjectTrendChart from "../../components/champions/YearlyProjectTrendChart";
import { MOCK_PROJECTS, MOCK_YEARLY_TREND } from "../../constants/mockMentorData";

function MentorDashboard({ appUser }) {
  return (
    <PageContainer className="py-6 lg:py-8 space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
          Welcome, {appUser?.name || "Mentor"}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Here's an overview of your mentoring activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Projects"
          value={MOCK_PROJECTS.length}
          subtitle="Projects you are mentoring"
        />
      </div>

      <YearlyProjectTrendChart data={MOCK_YEARLY_TREND} />
    </PageContainer>
  );
}

export default function ChampionHome() {
  const { appUser } = useAuth();

  if (appUser?.role === CHAMPION_ROLES.MENTOR) {
    return (
      <ChampionLayout>
        <MentorDashboard appUser={appUser} />
      </ChampionLayout>
    );
  }

  return (
    <ChampionLayout>
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
            Welcome, {appUser?.name || "Champion"}
          </h3>

          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-6">
            Your dashboard overview is coming soon. Use the sidebar to access
            the tools available for your role.
          </p>
        </div>
      </PageContainer>
    </ChampionLayout>
  );
}
