import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, deleteUser } from "../../services/userService";
import { openImpersonationTab } from "../../services/impersonationService";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function AllUsers() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { isAdmin, isSuperAdmin, appUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      showAlert("error", error.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase();

    return users.filter((user) => {
      return (
        user.name?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.role?.toLowerCase().includes(keyword) ||
        user.status?.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

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

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteUser(deleteTarget.id);
      showAlert(
        "success",
        `${deleteTarget.name || deleteTarget.email} deleted. Their login account, if any, was removed too.`
      );
      setDeleteTarget(null);
      await fetchUsers();
    } catch (error) {
      showAlert("error", error.message || "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  const handleLoginAs = async (user) => {
    setImpersonatingId(user.id);

    try {
      await openImpersonationTab({ targetType: "user", targetId: user.id });
    } catch (error) {
      showAlert("error", error.message || "Failed to start impersonation session.");
    } finally {
      setImpersonatingId(null);
    }
  };

  const statusClass = (status) => {
    if (status === "active") return "bg-green-50 text-green-700";
    if (status === "pending") return "bg-yellow-50 text-yellow-700";
    if (status === "inactive") return "bg-red-50 text-red-700";
    return "bg-gray-50 text-gray-600";
  };

  return (
    <AdminLayout title="User Management" subtitle="Manage ANN MIS users and access">
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                All Users
              </h3>
              <p className="text-sm text-gray-500">
                Review users, roles, statuses, and permissions.
              </p>
            </div>
          </div>

          <div className="mb-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, role, status..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="bg-[#F9FAFB] text-gray-500">
                <tr>
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Created</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-gray-500">
                      No user found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-gray-100">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.photo_url ? (
                            <img
                              src={user.photo_url}
                              alt={user.name || "User"}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-pink-50 text-[var(--ann-pink)] flex items-center justify-center font-bold">
                              {(user.name || user.email || "?").charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <p className="font-semibold text-[var(--ann-text-dark)]">
                              {user.name || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-gray-600">{user.email || "-"}</td>

                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full bg-pink-50 text-[var(--ann-pink)] text-xs font-semibold">
                          {user.role || "pending"}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
                            user.status
                          )}`}
                        >
                          {user.status || "pending"}
                        </span>
                      </td>

                      <td className="p-4 text-gray-600">
                        {formatDate(user.created_at)}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              navigate(`/admin/users/${user.uid}`)
                            }
                            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold"
                          >
                            View Profile
                          </button>

                          {isAdmin && user.status === "active" && user.id !== appUser?.id && (
                            <button
                              onClick={() => handleLoginAs(user)}
                              disabled={impersonatingId === user.id}
                              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold disabled:opacity-50"
                            >
                              {impersonatingId === user.id ? "Starting..." : "Login as"}
                            </button>
                          )}

                          {isSuperAdmin && user.id !== appUser?.id && (
                            <button
                              onClick={() => setDeleteTarget(user)}
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
        title={`Delete ${deleteTarget?.name || deleteTarget?.email || "this user"}?`}
        message="This permanently deletes their MIS user record and, if they've ever signed in, removes their login from Firebase Authentication too. This cannot be undone."
        confirmText={deleting ? "Deleting..." : "Delete Permanently"}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}