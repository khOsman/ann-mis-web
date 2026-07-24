import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import annLogo from "../../../assets/ann-logo.png";
import { activateCommitteeAccount } from "../../../services/selectionCommitteeService";

export default function CommitteeActivateAccount() {
  const [searchParams] = useSearchParams();
  const memberId = searchParams.get("id") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const missingParams = !memberId || !token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      await activateCommitteeAccount({ memberId, token, password });
      setDone(true);
    } catch (err) {
      setError(
        err.message ||
          "This activation link is invalid or has expired. Ask an admin to resend your invitation."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ann-bg)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 p-8 sm:p-10">
        <img src={annLogo} alt="ANN Logo" className="w-20 h-20 object-contain rounded-2xl mx-auto" />

        <h1 className="text-2xl font-extrabold text-[var(--ann-text-dark)] mt-6 text-center">
          Activate your account
        </h1>

        {missingParams ? (
          <p className="text-sm text-red-600 mt-4 text-center">
            This activation link is missing required information. Please use the
            link from your invitation email, or ask an admin to resend it.
          </p>
        ) : done ? (
          <div className="mt-4 text-center">
            <p className="text-sm text-green-700">
              Your password has been set. You can now log in.
            </p>
            <Link
              to="/"
              className="inline-block mt-5 bg-[var(--ann-pink)] text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-sm text-gray-500 text-center">
              Choose a password to finish setting up your Selection Committee
              account.
            </p>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[var(--ann-pink)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Activating..." : "Set password & activate"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
