import { useAuth } from "../../context/AuthContext";
import annLogo from "../../assets/ann-logo.png";
import { CHAMPION_ROLE_LABELS } from "../../constants/champions";

const ROLE_MESSAGES = {
  selection_committee:
    "FGD assignment and evaluation tools for Selection Committee members are coming soon. For now, please continue coordinating with the ANN team directly for your Focused Group Discussion schedule.",
  facilitator:
    "Session scheduling and attendance tools for Facilitators are coming soon. For now, please continue coordinating with the ANN team directly.",
  co_facilitator:
    "Session scheduling and attendance tools for Co-Facilitators are coming soon. For now, please continue coordinating with the ANN team directly.",
  mentor:
    "Project group tools for Mentors are coming soon. For now, please continue coordinating with the ANN team directly.",
  ycn:
    "Youth Content Network tools are coming soon. For now, please continue coordinating with the ANN team directly.",
};

export default function ChampionHome() {
  const { appUser, logout } = useAuth();
  const roleLabel = appUser?.role ? CHAMPION_ROLE_LABELS[appUser.role] : "Champion";

  return (
    <div className="min-h-screen bg-[var(--ann-bg)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 text-center">
        <img src={annLogo} alt="ANN Logo" className="w-16 h-16 object-contain rounded-2xl mx-auto" />

        <h1 className="text-2xl font-extrabold text-[var(--ann-text-dark)] mt-6">
          Welcome, {appUser?.name || "Champion"}
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          {appUser?.champion_code}
          {appUser?.role && (
            <span className="ml-2 text-[var(--ann-purple)] font-semibold">
              {roleLabel}
            </span>
          )}
        </p>

        <div className="mt-6 bg-purple-50 border border-purple-100 rounded-2xl p-5 text-left">
          <p className="text-sm font-semibold text-[var(--ann-purple)]">
            Your account is active.
          </p>
          <p className="text-sm text-gray-600 mt-2 leading-6">
            {ROLE_MESSAGES[appUser?.role] ||
              "Role-specific tools are coming soon. For now, please continue coordinating with the ANN team directly."}
          </p>
        </div>

        <button
          onClick={logout}
          className="mt-8 border border-gray-300 rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-700 hover:border-[var(--ann-pink)]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
