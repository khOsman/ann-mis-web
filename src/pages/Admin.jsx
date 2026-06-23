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
    ["Total Registrations", "0", "Across all cohorts"],
    ["Selected", "0", "FGD selected participants"],
    ["Enrolled", "0", "Payment completed"],
    ["Graduated", "0", "Successfully completed"]
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      <aside className="w-72 bg-[#2B2368] text-white px-6 py-6 hidden lg:block">
        <div className="flex items-center gap-3 mb-10">
          <img src={annLogo} alt="ANN Logo" className="w-16 h-16 object-contain bg-white rounded-2xl p-1" />
          <div>
            <h1 className="text-xl font-extrabold leading-tight">ANN MIS</h1>
            <p className="text-xs text-pink-200">A Changemakers’ Network</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <div
              key={item}
              className={`px-4 py-3 rounded-xl cursor-pointer text-sm font-medium transition ${
                index === 0
                  ? "bg-[#FF008C] text-white shadow-lg"
                  : "text-purple-100 hover:bg-white/10"
              }`}
            >
              {item}
            </div>
          ))}
        </nav>

        <div className="mt-10 rounded-2xl bg-white/10 p-4">
          <p className="text-sm font-semibold">System Status</p>
          <p className="text-xs text-purple-100 mt-1">All services running</p>
        </div>
      </aside>

      <main className="flex-1">
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[#1F2937]">Dashboard</h2>
            <p className="text-sm text-gray-500">ANN operational overview and quick actions</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="bg-[#FF008C] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90">
              + Create Form
            </button>
            <button
              onClick={() => signOut(auth)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:border-[#FF008C] hover:text-[#FF008C]"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {stats.map(([title, value, subtitle]) => (
              <div key={title} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                <p className="text-sm text-gray-500">{title}</p>
                <h3 className="text-4xl font-extrabold text-[#2B2368] mt-2">{value}</h3>
                <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
            <div className="xl:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-[#1F2937]">Active Cohorts</h3>
                  <p className="text-sm text-gray-500">Recent cohort progress summary</p>
                </div>
                <button className="text-sm font-semibold text-[#FF008C]">View all</button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-[#F9FAFB] text-gray-500">
                    <tr>
                      <th className="text-left p-4">Cohort</th>
                      <th className="text-left p-4">Registrations</th>
                      <th className="text-left p-4">Selected</th>
                      <th className="text-left p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["Jessore-25", "Bogura-26", "Rajshahi-26"].map((cohort) => (
                      <tr key={cohort} className="border-t border-gray-100">
                        <td className="p-4 font-semibold text-[#1F2937]">{cohort}</td>
                        <td className="p-4 text-gray-600">0</td>
                        <td className="p-4 text-gray-600">0</td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full bg-pink-50 text-[#FF008C] text-xs font-semibold">
                            Draft
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#1F2937]">Quick Actions</h3>
              <p className="text-sm text-gray-500 mt-1">Start common operational tasks</p>

              <div className="mt-5 space-y-3">
                {["Create New Cohort", "Design Registration Form", "View Participants", "Generate Report"].map((item) => (
                  <button
                    key={item}
                    className="w-full text-left px-4 py-3 rounded-2xl border border-gray-200 hover:border-[#FF008C] hover:text-[#FF008C] font-medium transition"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}