import { Clock3 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AccountPending() {
  const { appUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--ann-bg)] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-pink-50 flex items-center justify-center">
          <Clock3 size={36} className="text-[var(--ann-pink)]" />
        </div>

        <h1 className="mt-6 text-3xl font-extrabold text-[var(--ann-purple)]">
          Account Pending Approval
        </h1>

        <p className="mt-4 text-gray-600 leading-7">
          Your ANN MIS account has been created successfully. An administrator
          needs to review and approve your access before you can use the system.
        </p>

        <div className="mt-6 bg-gray-50 rounded-2xl p-4 text-left">
          <p className="text-sm text-gray-500">Account</p>
          <p className="font-semibold text-[var(--ann-text-dark)]">
            {appUser?.email || "-"}
          </p>

          <p className="text-sm text-gray-500 mt-3">Status</p>
          <p className="font-semibold text-orange-600">Pending Approval</p>
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