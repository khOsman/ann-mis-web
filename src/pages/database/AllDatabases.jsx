import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { useDatabases, useDataPoints } from "../../hooks";
import {
  createDatabase,
  deleteDatabase,
  seedSystemDatabaseIfMissing,
} from "../../services/databaseService";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function AllDatabases() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { isViewer } = useAuth();

  const { data: databases, loading } = useDatabases();
  const { data: dataPoints } = useDataPoints();

  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    seedSystemDatabaseIfMissing();
  }, []);

  const dataPointCount = (databaseId) =>
    dataPoints.filter((item) => item.database_id === databaseId).length;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showAlert("warning", "Database name is required.");
      return;
    }

    setCreating(true);

    try {
      await createDatabase({ name: name.trim(), description: description.trim() });
      showAlert("success", "Database created successfully.");
      setName("");
      setDescription("");
      setShowCreateForm(false);
    } catch (error) {
      showAlert("error", error.message || "Failed to create database.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);

    try {
      await deleteDatabase(target.id);
      showAlert("success", "Database deleted successfully.");
    } catch (error) {
      showAlert("error", error.message || "Failed to delete database.");
    }
  };

  return (
    <AdminLayout
      title="Database"
      subtitle="Define reusable data points and map registration questions to them"
    >
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                Databases
              </h3>
              <p className="text-sm text-gray-500">
                Group related data points (e.g. "Personal Information") once, then
                map any form question to one in the Form Builder — no more
                guessing from question wording.
              </p>
            </div>

            {!isViewer && (
              <button
                onClick={() => setShowCreateForm((prev) => !prev)}
                className="bg-[var(--ann-pink)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
              >
                {showCreateForm ? "Cancel" : "+ Create Database"}
              </button>
            )}
          </div>

          {showCreateForm && (
            <form
              onSubmit={handleCreate}
              className="mb-6 border border-gray-200 rounded-2xl p-5 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Database Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Personal Information"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (optional)
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What kind of data points belong here?"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-[var(--ann-pink)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Database"}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-[#F9FAFB] text-gray-500">
                <tr>
                  <th className="text-left p-4">Database</th>
                  <th className="text-left p-4">Description</th>
                  <th className="text-left p-4">Data Points</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500">
                      Loading databases...
                    </td>
                  </tr>
                ) : databases.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500">
                      No database found.
                    </td>
                  </tr>
                ) : (
                  databases.map((database) => (
                    <tr key={database.id} className="border-t border-gray-100">
                      <td className="p-4 font-semibold text-[var(--ann-text-dark)]">
                        <div>{database.name}</div>
                        {database.is_system && (
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-lg">
                            System
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-gray-600">
                        {database.description || "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        {dataPointCount(database.id)}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() =>
                              navigate(`/admin/database/${database.id}`)
                            }
                            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold"
                          >
                            Manage Data Points
                          </button>

                          {!isViewer && !database.is_system && (
                            <button
                              onClick={() => setDeleteTarget(database)}
                              className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
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
        open={!!deleteTarget}
        title="Delete Database?"
        message="This can only be deleted once it has no data points left in it."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
