import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export const getDashboardData = async () => {
  const cohortSnapshot = await getDocs(collection(db, "cohorts"));

  const cohorts = cohortSnapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }))
    .filter((item) => item.is_deleted !== true);

  const activeOnly = cohorts.filter((item) => item.status === "Active");

  return {
    stats: {
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
    },

    activeCohorts: activeOnly
      .sort((a, b) => {
        const aTime = a.created_at?.toDate?.()?.getTime?.() || 0;
        const bTime = b.created_at?.toDate?.()?.getTime?.() || 0;
        return bTime - aTime;
      })
      .slice(0, 3),
  };
};