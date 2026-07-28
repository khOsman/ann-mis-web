import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { ROUTES } from "../../constants/routes";
import {
  COHORT_STATUS,
  COHORT_STATUS_OPTIONS,
} from "../../constants/status";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import CohortStatusBadge from "../../components/cohorts/CohortStatusBadge";
import { useCohorts } from "../../hooks";
import {
  previewCohortDataDeletion,
  deleteCohortCompletely,
} from "../../services/cohortDataDeletionService";

const STATUS_FILTER_ALL = "All";

export default function AllCohorts() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { isSuperAdmin, isViewer } = useAuth();

  const {
    data: cohorts,
    loading,
    remove,
  } = useCohorts();

  const [archiveTarget, setArchiveTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePreview, setDeletePreview] = useState(null);
  const [loadingDeletePreview, setLoadingDeletePreview] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filteredCohorts = useMemo(() => {
    return cohorts.filter((cohort) => {
      const keyword = search.toLowerCase().trim();

      const matchesSearch =
        !keyword ||
        cohort.cohort_code?.toLowerCase().includes(keyword) ||
        cohort.cohort_name?.toLowerCase().includes(keyword) ||
        cohort.division?.toLowerCase().includes(keyword) ||
        cohort.district?.toLowerCase().includes(keyword) ||
        cohort.cohort_year?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === STATUS_FILTER_ALL || cohort.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [cohorts, search, statusFilter]);

  const handleArchive = async () => {
    if (!archiveTarget) return;

    try {
      const user = auth.currentUser;

      await remove({
        cohortId: archiveTarget.id,
        updatedByEmail: user?.email || "",
        updatedByName: user?.displayName || "",
      });

      showAlert("success", "Cohort archived successfully.");
      setArchiveTarget(null);
    } catch (error) {
      console.error("Failed to archive cohort:", error);
      showAlert("error", error.message || "Failed to archive cohort.");
    }
  };

  const openDeleteTarget = async (cohort) => {
    setDeleteTarget(cohort);
    setLoadingDeletePreview(true);

    try {
      const preview = await previewCohortDataDeletion(cohort.id);
      setDeletePreview(preview);
    } catch (error) {
      showAlert("error", error.message || "Failed to load delete preview.");
    } finally {
      setLoadingDeletePreview(false);
    }
  };

  const closeDeleteTarget = () => {
    setDeleteTarget(null);
    setDeletePreview(null);
    setDeleteConfirmText("");
  };

  const handleDeleteCohort = async () => {
    if (!deleteTarget) return;

    setShowDeleteConfirmDialog(false);
    setDeleting(true);

    try {
      await deleteCohortCompletely(deleteTarget.id);
      showAlert("success", `${deleteTarget.cohort_name || "Cohort"} permanently deleted.`);
      closeDeleteTarget();
    } catch (error) {
      console.error("Failed to delete cohort:", error);
      showAlert("error", error.message || "Failed to delete cohort.");
    } finally {
      setDeleting(false);
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

            {!isViewer && (
              <button
                onClick={() => navigate(ROUTES.createCohort)}
                className="bg-[var(--ann-pink)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
              >
                + Create Cohort
              </button>
            )}
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
              <option value={STATUS_FILTER_ALL}>{STATUS_FILTER_ALL}</option>

              {COHORT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
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
                        <CohortStatusBadge
                          status={cohort.status || COHORT_STATUS.DRAFT}
                        />
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
                              navigate(`/admin/cohorts/${cohort.id}`, {
                                state: { from: ROUTES.cohorts, fromLabel: "Cohorts" },
                              })
                            }
                            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold"
                          >
                            View
                          </button>

                          {!isViewer && (
                            <button
                              onClick={() =>
                                navigate(`/admin/cohorts/${cohort.id}/edit`)
                              }
                              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold"
                            >
                              Edit
                            </button>
                          )}

                          {!isViewer && (
                            <button
                              onClick={() => setArchiveTarget(cohort)}
                              className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                            >
                              Archive
                            </button>
                          )}

                          {isSuperAdmin && (
                            <button
                              onClick={() => openDeleteTarget(cohort)}
                              className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-semibold"
                            >
                              Delete
                            </button>
                          )}
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

      {deleteTarget && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-red-100 p-6">
            <h3 className="text-lg font-bold text-red-600">
              Permanently Delete {deleteTarget.cohort_name || "Cohort"}?
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Super admin only. This deletes the cohort record itself, not just its
              data — unlike archiving, this cannot be undone.
            </p>

            {loadingDeletePreview ? (
              <p className="text-sm text-gray-500 mt-5">Loading counts...</p>
            ) : (
              deletePreview && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-red-50 rounded-xl p-4 mt-5">
                  <div>
                    <p className="text-gray-500">Participants</p>
                    <p className="font-bold text-lg text-red-700">
                      {deletePreview.participantCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Form Responses</p>
                    <p className="font-bold text-lg text-red-700">
                      {deletePreview.responseCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">FGDs</p>
                    <p className="font-bold text-lg text-red-700">
                      {deletePreview.fgdCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Forms</p>
                    <p className="font-bold text-lg text-red-700">
                      {deletePreview.formCount}
                    </p>
                  </div>
                </div>
              )
            )}

            <div className="mt-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type{" "}
                <span className="font-mono text-red-600">
                  {deleteTarget.cohort_code}
                </span>{" "}
                to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deleteTarget.cohort_code}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteTarget}
                className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  deleteConfirmText !== deleteTarget.cohort_code ||
                  deleting ||
                  loadingDeletePreview
                }
                onClick={() => setShowDeleteConfirmDialog(true)}
                className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirmDialog}
        title={`Delete ${deleteTarget?.cohort_code || "this cohort"} permanently?`}
        message={`This will permanently delete the cohort record and ${deletePreview?.participantCount || 0} participant(s), ${deletePreview?.responseCount || 0} form response(s), ${deletePreview?.fgdCount || 0} FGD(s), and ${deletePreview?.formCount || 0} form(s). This cannot be undone.`}
        confirmText="Delete Everything"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteCohort}
        onCancel={() => setShowDeleteConfirmDialog(false)}
      />
    </AdminLayout>
  );
}