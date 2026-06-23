import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import annLogo from "../assets/ann-logo.png";

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !user.email.endsWith("@brac.net")) {
        await signOut(auth);
        window.location.href = "/";
        return;
      }

      setAllowed(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <p className="text-[#2B2368] font-medium">Checking access...</p>
      </div>
    );
  }

  if (!allowed) return null;

  const menuItems = ["Dashboard", "Cohorts", "Forms", "Participants", "Projects", "Reports", "Settings"];

  const stats = [
    ["Total Registrations", "0"],
    ["Selected Participants", "0"],
    ["Enrolled Participants", "0"],
    ["Graduated Participants", "0"]
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      <aside className="w-72 bg-[#2B2368] text-white px-6 py-6">
        <div className="flex items-center gap-3 mb-10">
          <img src={annLogo} alt="ANN Logo" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-xl text-[#FF008C] font-bold leading-tight">ANN MIS</h1>
            <p className="text-xs text-pink-200">A Changemakers’ Network</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <div
              key={item}
              className={`px-4 py-3 rounded-xl cursor-pointer text-sm font-medium transition ${
                index === 0
                  ? "bg-[#FF008C] text-white shadow"
                  : "text-purple-100 hover:bg-white/10"
              }`}
            >
              {item}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1">
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1F2937]">Admin Dashboard</h2>
            <p className="text-sm text-gray-500">Manage ANN cohorts, forms, participants and reports.</p>
          </div>

          <button
            onClick={() => signOut(auth)}
            className="border border-[#FF008C] text-[#FF008C] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#FF008C] hover:text-white transition"
          >
            Logout
          </button>
        </header>

        <section className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {stats.map(([title, value]) => (
              <div key={title} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <p className="text-sm text-gray-500">{title}</p>
                <h3 className="text-3xl font-bold text-[#2B2368] mt-2">{value}</h3>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#1F2937] mb-2">Welcome to ANN MIS</h3>
            <p className="text-gray-600 text-sm">
              This system will manage registration forms, participant tracking, project monitoring,
              cohort performance, and customized reporting for Amra Notun Network.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}