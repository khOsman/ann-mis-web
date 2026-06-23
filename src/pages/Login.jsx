import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import annLogo from "../assets/ann-logo.png";

export default function Login() {
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

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <section className="relative bg-[#2B2368] text-white p-10 lg:p-14 overflow-hidden">
          <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full border-[28px] border-[#FF008C]/60" />
          <div className="absolute top-10 right-10 text-[#FF008C]/40 text-6xl font-bold">‹‹‹</div>
          <div className="absolute bottom-10 right-20 grid grid-cols-5 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-[#FF008C]" />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <img
              src={annLogo}
              alt="Amra Notun Network"
              className="w-72 max-w-full object-contain mb-12"
            />

            <h1 className="text-4xl font-extrabold leading-tight">
              Amra Notun <span className="text-[#FF008C]">Network</span>
            </h1>

            <p className="mt-5 text-lg text-purple-100 max-w-md">
              Empowering young changemakers to drive social change and build a better tomorrow.
            </p>
          </div>
        </section>

        <section className="p-10 lg:p-16 flex items-center justify-center">
          <div className="w-full max-w-md text-center">
            <h2 className="text-3xl font-bold text-[#1F2937]">Welcome to</h2>
            <h1 className="text-5xl font-extrabold mt-2">
              <span className="text-[#2B2368]">ANN</span>{" "}
              <span className="text-[#FF008C]">MIS</span>
            </h1>

            <div className="w-20 h-1 bg-[#FF008C] mx-auto my-8 rounded-full" />

            <p className="text-gray-600 leading-relaxed">
              Please sign in with your BRAC Google account to access the admin dashboard.
            </p>

            <button
              onClick={handleLogin}
              className="mt-10 w-full border border-gray-300 rounded-xl px-6 py-4 flex items-center justify-center gap-4 text-lg font-semibold text-gray-800 hover:border-[#FF008C] hover:shadow-lg transition"
            >
              <span className="text-3xl font-bold text-[#4285F4]">G</span>
              Sign in with Google
            </button>

            <div className="mt-8 flex items-center justify-center gap-3 text-sm font-medium text-[#2B2368]">
              <span className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center">🛡️</span>
              <span>Only users with @brac.net email can access this system.</span>
            </div>

            <div className="mt-10 bg-pink-50 border border-pink-100 rounded-2xl p-5 text-left">
              <p className="font-bold text-[#FF008C]">Need access?</p>
              <p className="text-sm text-gray-600 mt-1">
                Please contact your system administrator if you believe you should have access.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-8 text-center text-sm text-gray-500">
        © 2026 BRAC | Amra Notun Network (ANN)
        <br />
        All rights reserved.
      </footer>
    </div>
  );
}