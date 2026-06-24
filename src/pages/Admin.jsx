import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { useAlert } from "../context/AlertContext";
import AdminLayout from "../layouts/AdminLayout";
import PageContainer from "../layouts/PageContainer";
import StatCard from "../components/dashboard/StatCard";
import { ROUTES } from "../constants/routes";
import { getPermissionsByRole } from "../constants/roles";

export default function Admin() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [activeCohorts, setActiveCohorts] = useState([]);

  const [dashboardStats, setDashboardStats] = useState({
    activeCohorts: 0,
    totalRegistrations: 0,
    totalSelected: 0,
    totalEnrolled: 0,
    totalGraduated: 0,
    totalProjects: 0,
  });

  const fetchDashboardData = async () => {
    const cohortSnapshot = await getDocs(collection(db, "cohorts"));

    const cohorts = cohortSnapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .filter((item) => item.is_deleted !== true);

    const activeOnly = cohorts.filter((item) => item.status === "Active");

    setDashboardStats({
      activeCohorts: activeOnly.length,
      totalRegistrations: cohorts.reduce(
        (sum, item) => sum + Number(item.total_registrations || 0),
        0
      ),
      totalSelected: cohorts.reduce(
        (sum, item) => sum + Number(item.total_selected || 0),
        0
      ),
      totalEnrolled: cohorts.reduce(
        (sum, item) => sum + Number(item.total_enrolled || 0),
        0
      ),
      totalGraduated: cohorts.reduce(
        (sum, item) => sum + Number(item.total_graduated || 0),
        0
      ),
      totalProjects: cohorts.reduce(
        (sum, item) => sum + Number(item.total_projects || 0),
        0
      ),
    });

    const recentCohorts = activeOnly
      .sort((a, b) => {
        const aTime = a.created_at?.toDate?.()?.getTime?.() || 0;
        const bTime = b.created_at?.toDate?.()?.getTime?.() || 0;
        return bTime - aTime;
      })
      .slice(0, 3);

    setActiveCohorts(recentCohorts);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user || !user.email.endsWith("@brac.net")) {
          await signOut(auth);
          window.location.href = "/";
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email,
            photo_url: user.photoURL || "",
            role: "pending",
            status: "pending",
            permissions: getPermissionsByRole("pending"),
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });

          showAlert(
            "info",
            "Your BRAC account has been registered and is awaiting administrator approval."
          );

          setTimeout(async () => {
            await signOut(auth);
            window.location.href = "/";
          }, 2500);

          return;
        }

        const userData = userSnap.data();

        if (userData.status !== "active") {
          showAlert(
            "warning",
            "Your account is currently inactive. Please contact the administrator."
          );

          setTimeout(async () => {
            await signOut(auth);
            window.location.href = "/";
          }, 2500);

          return;
        }

        if (!["super_admin", "admin"].includes(userData.role)) {
          showAlert(
            "error",
            "You do not have permission to access ANN MIS. Please contact the administrator."
          );

          setTimeout(async () => {
            await signOut(auth);
            window.location.href = "/";
          }, 2500);

          return;
        }

        await fetchDashboardData();

        setAllowed(true);
        setLoading(false);
      } catch (error) {
        console.error("Access check failed:", error);
        showAlert("error", error.message || "Access check failed.");

        setTimeout(async () => {
          setLoading(false);
          await signOut(auth);
          window.location.href = "/";
        }, 2500);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ann-bg)]">
        <p className="text-[var(--ann-purple)] font-medium">
          Checking access...
        </p>
      </div>
    );
  }

  if (!allowed) return null;

  const firstRowStats = [
    ["Active Cohorts", dashboardStats.activeCohorts, "Currently operational"],
    [
      "Total Registrations",
      dashboardStats.totalRegistrations,
      "Application submitted",
    ],
    ["Total Selected", dashboardStats.totalSelected, "Selected for FGD"],
  ];

  const secondRowStats = [
    ["Total Enrolled", dashboardStats.totalEnrolled, "Successfully admitted"],
    ["Total Graduated", dashboardStats.totalGraduated, "Completed programme"],
    ["Total Projects", dashboardStats.totalProjects, "Community projects"],
  ];

  const quickActions = [
    {
      label: "Create New Cohort",
      path: ROUTES.createCohort,
    },
    {
      label: "Design Registration Form",
      path: ROUTES.forms,
    },
    {
      label: "View Participants",
      path: ROUTES.participants,
    },
    {
      label: "Generate Report",
      path: ROUTES.reports,
    },
  ];

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="ANN operational overview and quick actions"
    >
      <PageContainer className="py-6 lg:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
          {firstRowStats.map(([title, value, subtitle]) => (
            <StatCard
              key={title}
              title={title}
              value={value}
              subtitle={subtitle}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 mt-4">
          {secondRowStats.map(([title, value, subtitle]) => (
            <StatCard
              key={title}
              title={title}
              value={value}
              subtitle={subtitle}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5 lg:mt-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-2 lg:p-4 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                  Active Cohorts
                </h3>
                <p className="text-sm text-gray-500">
                  Recent cohort progress summary
                </p>
              </div>

              <button
                onClick={() => navigate(ROUTES.cohorts)}
                className="text-sm font-semibold text-[var(--ann-pink)] text-left"
              >
                View all
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-[#F9FAFB] text-gray-500">
                  <tr>
                    <th className="text-left p-4">Cohort</th>
                    <th className="text-left p-4">Registrations</th>
                    <th className="text-left p-4">Selected</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {activeCohorts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-gray-500">
                        No active cohort found.
                      </td>
                    </tr>
                  ) : (
                    activeCohorts.map((cohort) => (
                      <tr
                        key={cohort.id}
                        className="border-t border-gray-100 cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/admin/cohorts/${cohort.id}`)}
                      >
                        <td className="p-4 font-semibold text-[var(--ann-text-dark)]">
                          <div>{cohort.cohort_name || "-"}</div>
                          <div className="text-xs text-gray-400">
                            {cohort.cohort_code || "-"} •{" "}
                            {cohort.district || "-"}
                          </div>
                        </td>

                        <td className="p-4 text-gray-600">
                          {cohort.total_registrations || 0}
                        </td>

                        <td className="p-4 text-gray-600">
                          {cohort.total_selected || 0}
                        </td>

                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full bg-pink-50 text-[var(--ann-pink)] text-xs font-semibold">
                            {cohort.status || "Draft"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-2 lg:p-4 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Quick Actions
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Start common operational tasks
            </p>

            <div className="mt-5 space-y-3">
              {quickActions.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="w-full text-left px-4 py-3 rounded-2xl border border-gray-200 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] font-medium transition"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}