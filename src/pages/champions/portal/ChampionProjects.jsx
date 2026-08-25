import { Navigate, useNavigate } from "react-router-dom";
import ChampionLayout from "../../../layouts/ChampionLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAuth } from "../../../context/AuthContext";
import { CHAMPION_ROLES } from "../../../constants/champions";
import { ROUTES } from "../../../constants/routes";
import { MOCK_PROJECTS } from "../../../constants/mockMentorData";

export default function ChampionProjects() {
  const { appUser } = useAuth();
  const navigate = useNavigate();

  const allowed = appUser?.role === CHAMPION_ROLES.MENTOR;

  if (!allowed) {
    return <Navigate to={ROUTES.championHome} replace />;
  }

  return (
    <ChampionLayout title="Projects" subtitle="Assigned project groups and feedback">
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Project ID
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Project Name
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Cohort
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PROJECTS.map((project) => (
                  <tr key={project.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-500">{project.id}</td>
                    <td className="px-4 py-3 font-medium text-[var(--ann-text-dark)]">
                      {project.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {project.cohort_name} ({project.cohort_code})
                    </td>
                    <td className="px-4 py-3 text-gray-600">{project.status}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            ROUTES.championProjectDetail.replace(
                              ":projectId",
                              project.id
                            )
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90"
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
      </PageContainer>
    </ChampionLayout>
  );
}
