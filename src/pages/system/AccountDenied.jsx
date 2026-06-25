import { Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";


export default function AccessDenied() {
  const { appUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
      await logout();
      navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--ann-bg)] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center">
          <Lock size={36} className="text-red-500" />
        </div>

        <h1 className="mt-6 text-3xl font-extrabold text-[var(--ann-purple)]">
          Access Denied
        </h1>

        <p className="mt-4 text-gray-600 leading-7">
          You do not currently have permission to access this module.
          Please contact your system administrator if you believe you
          should have access.
        </p>

        <div className="mt-6 bg-gray-50 rounded-2xl p-4">
          <p className="font-semibold text-red-600">
            Permission Required
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Your account is active, but this feature is not available
            for your current role.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 w-full bg-[var(--ann-pink)] text-white py-3 rounded-2xl font-semibold hover:opacity-90"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}