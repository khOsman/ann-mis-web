import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { ROUTES } from "../../constants/routes";
import { useAlert } from "../../context/AlertContext";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function AllCohorts() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [archiveTarget, setArchiveTarget] = useState(null);

  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchCohorts = async () => {
    setLoading(true);

    try {
      const q = query(collection(db, "cohorts"), orderBy("created_at", "desc"));
      const snapshot = await getDocs(q);

      const data = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...item.data(),
        }))
        .filter((item) => item.is_deleted !== true);

      setCohorts(data);
    } catch (error) {
      console.error("Failed to fetch cohorts:", error);
      showAlert("error", error.message || "Failed to load cohorts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, []);

  const filteredCohorts = useMemo(() => {
    return cohorts.filter((cohort) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        cohort.cohort_code?.toLowerCase().includes(keyword) ||
        cohort.cohort_name?.toLowerCase().includes(keyword) ||
        cohort.division?.toLowerCase().includes(keyword) ||
        cohort.district?.toLowerCase().includes(keyword) ||
        cohort.cohort_year?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All" || cohort.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [cohorts, search, statusFilter]);

  const handleArchive = async () => {
  if (!archiveTarget) return;

  try {
    const user = auth.currentUser;

    await updateDoc(doc(db, "cohorts", archiveTarget.id), {
      is_deleted: true,
      status: "Archived",
      deleted_at: serverTimestamp(),
      deleted_by_email: user?.email || "",
      deleted_by_name: user?.displayName || "",
      updated_at: serverTimestamp(),
      updated_by_email: user?.email || "",
      updated_by_name: user?.displayName || "",
    });

    showAlert("success", "Cohort archived successfully.");
    setArchiveTarget(null);
    fetchCohorts();
  } catch (error) {
    console.error("Failed to archive cohort:", error);
    showAlert("error", error.message || "Failed to archive cohort.");
  }
};

  const formatDate = (timestamp) => {
  if (!timestamp?.toDate) return "-";

  return timestamp.toDate().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-50 text-green-700 border-green-200";
      case "Closed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "Archived":
        return "bg-red-50 text-red-700 border-red-200";
      case "Draft":
      default:
        return "bg-pink-50 text-[var(--ann-pink)] border-pink-100";
    }
  };

  return (
    <AdminLayout title="All Cohorts" subtitle="View and manage ANN cohorts">
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                Cohort List
              </h3>
              <p className="text-sm text-gray-500">
                Manage created cohorts, locations, status, and metadata.
              </p>
            </div>

            <button
              onClick={() => navigate(ROUTES.createCohort)}
              className="bg-[var(--ann-pink)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
            >
              + Create Cohort
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, cohort, division, district, year..."
              className="md:col-span-2 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
            >
              <option>All</option>
              <option>Draft</option>
              <option>Active</option>
              <option>Closed</option>
              <option>Archived</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full min-w-[1250px] text-sm">
              <thead className="bg-[#F9FAFB] text-gray-500">
                <tr>
                  <th className="text-left p-4">Code</th>
                  <th className="text-left p-4">Cohort</th>
                  <th className="text-left p-4">Location</th>
                  <th className="text-left p-4">Year</th>
                  <th className="text-left p-4">Registration Window</th>
                  <th className="text-left p-4">Targets</th>
                  <th className="text-left p-4">Progress</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Created By</th>
                  <th className="text-left p-4">Updated</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" className="p-6 text-center text-gray-500">
                      Loading cohorts...
                    </td>
                  </tr>
                ) : filteredCohorts.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-6 text-center text-gray-500">
                      No cohort found.
                    </td>
                  </tr>
                ) : (
                  filteredCohorts.map((cohort) => (
                    <tr key={cohort.id} className="border-t border-gray-100">
                      <td className="p-4 font-bold text-[var(--ann-purple)]">
                        {cohort.cohort_code || "-"}
                      </td>

                      <td className="p-4 font-semibold text-[var(--ann-text-dark)]">
                        {cohort.cohort_name || "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        <div>{cohort.district || "-"}</div>
                        <div className="text-xs text-gray-400">
                          {cohort.division || "-"}
                        </div>
                      </td>

                      <td className="p-4 text-gray-600">
                        {cohort.cohort_year || "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        {cohort.registration_start_date || "-"} →{" "}
                        {cohort.registration_end_date || "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        Selection: {cohort.selection_target || 0}
                        <br />
                        Graduation: {cohort.graduation_target || 0}
                      </td>

                      <td className="p-4 text-gray-600">
                        Reg: {cohort.total_registrations || 0}
                        <br />
                        Sel: {cohort.total_selected || 0}
                        <br />
                        Enr: {cohort.total_enrolled || 0}
                        <br />
                        Grad: {cohort.total_graduated || 0}
                        <br />
                        Projects: {cohort.total_projects || 0}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusBadgeClass(
                            cohort.status
                          )}`}
                        >
                          {cohort.status || "Draft"}
                        </span>
                      </td>

                      <td className="p-4 text-gray-600">
                        <div>
                          {cohort.created_by_name ||
                            cohort.created_by_email ||
                            "-"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(cohort.created_at)}
                        </div>
                      </td>

                      <td className="p-4 text-gray-600">
                        <div>
                          {cohort.updated_by_name ||
                            cohort.updated_by_email ||
                            "-"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(cohort.updated_at)}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() =>
                              navigate(`/admin/cohorts/${cohort.id}`)
                            }
                            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold"
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/admin/cohorts/${cohort.id}/edit`)
                            }
                            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => setArchiveTarget(cohort)}
                            className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageContainer>
      <ConfirmDialog
        open={!!archiveTarget}
        title="Archive Cohort?"
        message={`Are you sure you want to archive ${
          archiveTarget?.cohort_name || "this cohort"
        }? This cohort will be removed from active operations but kept for audit history.`}
        confirmText="Archive"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </AdminLayout>
  );
}