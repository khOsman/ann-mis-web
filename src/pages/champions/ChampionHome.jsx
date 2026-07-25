import ChampionLayout from "../../layouts/ChampionLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAuth } from "../../context/AuthContext";

export default function ChampionHome() {
  const { appUser } = useAuth();

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
