import { ShieldX } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AccountInactive() {
  const { appUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--ann-bg)] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center">
          <ShieldX size={36} className="text-red-500" />
        </div>

        <h1 className="mt-6 text-3xl font-extrabold text-[var(--ann-purple)]">
          Account Inactive
        </h1>

        <p className="mt-4 text-gray-600 leading-7">
          Your account is currently inactive. Please contact the system
          administrator if you believe this is a mistake.
        </p>

        <div className="mt-6 bg-gray-50 rounded-2xl p-4 text-left">
          <p className="text-sm text-gray-500">Account</p>
          <p className="font-semibold text-[var(--ann-text-dark)]">
            {appUser?.email || "-"}
          </p>

          <p className="text-sm text-gray-500 mt-3">Status</p>
          <p className="font-semibold text-red-600">Inactive</p>
        </div>

        <button
          onClick={logout}
          className="mt-6 w-full bg-[var(--ann-pink)] text-white py-3 rounded-2xl font-semibold hover:opacity-90"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}