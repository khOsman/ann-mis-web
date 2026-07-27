import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { updateUser, notifyUserAccessUpdate, deleteUser } from "../../services/userService";
import { useUser } from "../../hooks";
import {
  getPermissionsByRole,
  USER_ROLES,
  USER_STATUSES,
} from "../../constants/roles";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { isSuperAdmin, appUser } = useAuth();

  const { data: userData, loading } = useUser(userId);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    role: "",
    status: "",
    permissions: {},
  });

  // Seed the editable form once when the doc first loads (or when
  // navigating to a different user) — not on every subsequent live update,
  // so an admin's in-progress edits aren't clobbered by someone else's write.
  useEffect(() => {
    if (!userData) return;

    setForm({
      role: userData.role || USER_ROLES.PENDING,
      status: userData.status || USER_STATUSES.PENDING,
      permissions: userData.permissions || getPermissionsByRole(userData.role),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.id]);

  useEffect(() => {
    if (!loading && !userData) {
      showAlert("error", "User not found.");
      navigate("/admin/users");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, userData]);

  const handleRoleChange = (role) => {
    setForm((prev) => ({
      ...prev,
      role,
      permissions: getPermissionsByRole(role),
    }));
  };

  const handlePermissionChange = (key) => {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions?.[key],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await updateUser(userId, {
        role: form.role,
        status: form.status,
        permissions: form.permissions,
      });

      try {
        await notifyUserAccessUpdate(userId);
        showAlert("success", "User access updated and notification email sent.");
      } catch (emailError) {
        console.error("Failed to send access update email:", emailError);
        showAlert(
          "success",
          "User access updated, but the notification email failed to send."
        );
      }

      navigate("/admin/users");
    } catch (error) {
      showAlert("error", error.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);

    try {
      await deleteUser(userId);
      showAlert(
        "success",
        `${userData.name || userData.email} deleted. Their login account, if any, was removed too.`
      );
      navigate("/admin/users");
    } catch (error) {
      showAlert("error", error.message || "Failed to delete user.");
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

  if (loading) {
    return (
      <AdminLayout title="User Profile" subtitle="Loading user access">
        <PageContainer className="py-6">
          <p className="text-gray-500">Loading user...</p>
        </PageContainer>
      </AdminLayout>
    );
  }

  if (!userData) return null;

  return (
    <AdminLayout
      title="User Profile"
      subtitle="Manage user role, status, and feature access"
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <button
          onClick={() => navigate("/admin/users")}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to Users
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            {userData.photo_url ? (
              <img
                src={userData.photo_url}
                alt={userData.name || "User"}
                className="w-20 h-20 rounded-3xl object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-3xl bg-pink-50 text-[var(--ann-pink)] flex items-center justify-center text-3xl font-extrabold">
                {(userData.name || userData.email || "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <h2 className="text-2xl font-extrabold text-[var(--ann-text-dark)] mt-5">
              {userData.name || "-"}
            </h2>

            <p className="text-sm text-gray-500 mt-1">{userData.email}</p>

            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Current Role</p>
                <p className="font-semibold text-gray-800">
                  {userData.role || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Current Status</p>
                <p className="font-semibold text-gray-800">
                  {userData.status || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Created At</p>
                <p className="font-semibold text-gray-800">
                  {formatDate(userData.created_at)}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Updated At</p>
                <p className="font-semibold text-gray-800">
                  {formatDate(userData.updated_at)}
                </p>
              </div>
            </div>

            {isSuperAdmin && userData.id !== appUser?.id && (
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-6 w-full border border-red-300 text-red-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete User"}
              </button>
            )}
          </div>

          <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Access Control
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                >
                  <option value={USER_ROLES.PENDING}>Pending</option>
                  <option value={USER_ROLES.VIEWER}>Viewer</option>
                  <option value={USER_ROLES.ADMIN}>Admin</option>
                  <option value={USER_ROLES.SUPER_ADMIN}>Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                >
                  <option value={USER_STATUSES.PENDING}>Pending</option>
                  <option value={USER_STATUSES.ACTIVE}>Active</option>
                  <option value={USER_STATUSES.INACTIVE}>Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="font-bold text-[var(--ann-text-dark)]">
                Feature Permissions
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {Object.keys(form.permissions || {}).map((key) => (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl px-4 py-3"
                  >
                    <span className="capitalize text-sm font-medium text-gray-700">
                      {key.replaceAll("_", " ")}
                    </span>

                    <input
                      type="checkbox"
                      checked={form.permissions?.[key] || false}
                      onChange={() => handlePermissionChange(key)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[var(--ann-pink)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </PageContainer>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={`Delete ${userData.name || userData.email}?`}
        message="This permanently deletes their MIS user record and, if they've ever signed in, removes their login from Firebase Authentication too. This cannot be undone."
        confirmText="Delete Permanently"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteUser}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </AdminLayout>
  );
}