import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import annLogo from "../assets/ann-logo.png";


export default function Login() {
  const [championEmail, setChampionEmail] = useState("");
  const [championPassword, setChampionPassword] = useState("");
  const [championLoggingIn, setChampionLoggingIn] = useState(false);
  const [championError, setChampionError] = useState("");

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;

      if (!email.endsWith("@brac.net")) {
        await signOut(auth);
        alert("Only BRAC official email accounts are allowed.");
        return;
      }

      window.location.href = "/admin";
    } catch (error) {
      alert(error.message);
    }
  };

  const handleChampionLogin = async (e) => {
    e.preventDefault();
    setChampionError("");
    setChampionLoggingIn(true);

    try {
      await signInWithEmailAndPassword(auth, championEmail.trim().toLowerCase(), championPassword);
      window.location.href = "/champions";
    } catch (error) {
      if (error.code === "auth/operation-not-allowed") {
        setChampionError(
          "Email/Password sign-in is not enabled for this project yet. Ask an admin to enable it in Firebase Console → Authentication → Sign-in method."
        );
      } else if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setChampionError("Incorrect email or password.");
      } else {
        setChampionError(error.message || "Failed to sign in.");
      }
    } finally {
      setChampionLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ann-bg)] flex flex-col items-center justify-center px-4 sm:px-6 py-6">
      <div className="w-full max-w-[1180px] bg-white rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <section className="relative bg-[var(--ann-purple)] text-white px-6 py-10 sm:p-10 lg:p-14 overflow-hidden">
          <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full border-[28px] border-[#FF008C]/50" />
          <div className="absolute top-8 right-8 text-[#FF008C]/30 text-5xl font-bold hidden sm:block">‹‹‹</div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <img src={annLogo} alt="Amra Notun Network" className="w-52 sm:w-64 lg:w-72 object-contain mb-8 lg:mb-12" />

            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              Amra Notun <span className="text-[var(--ann-pink)]">Network</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-purple-100 max-w-md">
              Empowering young changemakers to drive social change and build a better tomorrow.
            </p>
          </div>
        </section>

        <section className="px-6 py-10 sm:p-10 lg:p-16 flex items-center justify-center">
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--ann-text-dark)]">Welcome to</h2>
            <h1 className="text-4xl sm:text-5xl font-extrabold mt-2">
              <span className="text-[var(--ann-purple)]">ANN</span>{" "}
              <span className="text-[var(--ann-pink)]">MIS</span>
            </h1>

            <div className="w-16 sm:w-20 h-1 bg-[var(--ann-pink)] mx-auto my-6 sm:my-8 rounded-full" />

            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Please sign in with your BRAC Google account to access the admin dashboard.
            </p>

            <button
              onClick={handleLogin}
              className="mt-8 sm:mt-10 w-full border border-gray-300 rounded-xl px-5 py-3 sm:py-4 flex items-center justify-center gap-3 sm:gap-4 text-base sm:text-lg font-semibold text-gray-800 hover:border-[var(--ann-pink)] hover:shadow-lg transition"
            >
              <span className="text-2xl sm:text-3xl font-bold text-[#4285F4]">G</span>
              Sign in with Google
            </button>

            <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3 text-xs sm:text-sm font-medium text-[var(--ann-purple)]">
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-50 flex items-center justify-center">🛡️</span>
              <span>Only @brac.net users can access this system.</span>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Champion Login
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleChampionLogin} className="mt-5 space-y-3 text-left">
              <input
                type="email"
                placeholder="Email"
                value={championEmail}
                onChange={(e) => setChampionEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
              />
              <input
                type="password"
                placeholder="Password"
                value={championPassword}
                onChange={(e) => setChampionPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
              />

              {championError && (
                <p className="text-xs text-red-600">{championError}</p>
              )}

              <button
                type="submit"
                disabled={championLoggingIn}
                className="w-full bg-[var(--ann-purple)] text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {championLoggingIn ? "Signing in..." : "Sign in as Champion"}
              </button>
            </form>

            <div className="mt-8 bg-pink-50 border border-pink-100 rounded-2xl p-5 text-left">
            <p className="font-bold text-[var(--ann-pink)]">
                Need access?
            </p>

            <p className="text-sm text-gray-600 mt-1">
                Please contact your system administrator if you believe you should have access.
            </p>
        </div>
          </div>
        </section>
      </div>



      <footer className="mt-6 text-center text-xs sm:text-sm text-gray-500">
        © 2026 BRAC | Amra Notun Network (ANN)
      </footer>
    </div>
  );
}
