import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import ChampionLayout from "../../../layouts/ChampionLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAuth } from "../../../context/AuthContext";
import { CHAMPION_ROLES } from "../../../constants/champions";
import { ROUTES } from "../../../constants/routes";
import {
  MOCK_PROJECTS,
  MOCK_PROJECT_STATUS,
} from "../../../constants/mockMentorData";

const STATUS_BADGE_CLASSES = {
  [MOCK_PROJECT_STATUS.IN_PROGRESS]: "bg-blue-50 text-blue-700 border-blue-200",
  [MOCK_PROJECT_STATUS.COMPLETED_SUCCESSFUL]:
    "bg-green-50 text-green-700 border-green-200",
  [MOCK_PROJECT_STATUS.COMPLETED_UNSUCCESSFUL]:
    "bg-red-50 text-red-700 border-red-200",
};

function MemberProfileModal({ member, onClose }) {
  if (!member) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
          {member.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{member.institution}</p>

        <p className="text-xs text-gray-400 mt-4">
          Full participant profiles for project members will be available
          once real project data is connected.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function ChampionProjectDetail() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [viewingMember, setViewingMember] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedReports, setUploadedReports] = useState([]);

  const allowed = appUser?.role === CHAMPION_ROLES.MENTOR;

  if (!allowed) {
    return <Navigate to={ROUTES.championHome} replace />;
  }

  const project = MOCK_PROJECTS.find((p) => p.id === projectId);

  if (!project) {
    return (
      <ChampionLayout title="Project Not Found">
        <PageContainer className="py-6 lg:py-8">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center text-gray-500">
            This project could not be found.
          </div>
        </PageContainer>
      </ChampionLayout>
    );
  }

  const handleUpload = () => {
    if (!selectedFile) return;

    setUploadedReports((prev) => [
      ...prev,
      { name: selectedFile.name, uploadedAt: new Date() },
    ]);
    setSelectedFile(null);
  };

  return (
    <ChampionLayout title={project.name} subtitle={project.cohort_name}>
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <button
          onClick={() => navigate(ROUTES.championProjects)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to Assigned Projects
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                {project.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {project.cohort_name} ({project.cohort_code}) • {project.pillar}
              </p>
            </div>

            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                STATUS_BADGE_CLASSES[project.status] ||
                "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              {project.status}
            </span>
          </div>

          <p className="text-sm text-gray-600 leading-6">{project.description}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-sm font-bold text-[var(--ann-text-dark)] mb-4">
            Members ({project.members.length})
          </h3>

          <div className="divide-y divide-gray-100">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ann-text-dark)]">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500">{member.institution}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingMember(member)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-sm font-bold text-[var(--ann-text-dark)] mb-1">
            Project Report
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Upload a report for this project. This is a preview of the upload
            flow — files are not yet sent anywhere.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="text-sm text-gray-600"
            />
            <button
              type="button"
              disabled={!selectedFile}
              onClick={handleUpload}
              className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              Upload
            </button>
          </div>

          {uploadedReports.length > 0 && (
            <ul className="mt-4 space-y-2">
              {uploadedReports.map((report, idx) => (
                <li
                  key={`${report.name}-${idx}`}
                  className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
                >
                  {report.name} uploaded successfully.
                </li>
              ))}
            </ul>
          )}
        </div>
      </PageContainer>

      <MemberProfileModal
        member={viewingMember}
        onClose={() => setViewingMember(null)}
      />
    </ChampionLayout>
  );
}
