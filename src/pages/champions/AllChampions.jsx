import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { useChampions } from "../../hooks";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import {
  ACCOUNT_STATUS,
  CHAMPION_ROLE_LABELS,
  CHAMPION_ROLE_OPTIONS,
  MEMBER_STATUS,
  REGISTRATION_STATUS,
} from "../../constants/champions";
import {
  activateChampionMember,
  approveChampion,
  createChampionAccount,
  deleteChampion,
  rejectChampion,
} from "../../services/championsService";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const ROLE_FILTERS = [
  { key: "all", label: "All" },
  { key: "unassigned", label: "Unassigned" },
  ...Object.entries(CHAMPION_ROLE_LABELS).map(([key, label]) => ({ key, label })),
];

function ChampionRowActions({ champion, isSuperAdmin }) {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [selectedRole, setSelectedRole] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isPending = champion.registration_status === REGISTRATION_STATUS.PENDING;
  const isApproved = champion.registration_status === REGISTRATION_STATUS.APPROVED;

  const showRegularInviteButton =
    isApproved &&
    (champion.account_status === ACCOUNT_STATUS.NOT_CREATED ||
      champion.account_status === ACCOUNT_STATUS.INVITATION_SENT);

  const showSuperAdminResend = isSuperAdmin && isApproved && !showRegularInviteButton;

  const showActivate =
    champion.account_status === ACCOUNT_STATUS.PASSWORD_SET &&
    champion.member_status === MEMBER_STATUS.INACTIVE;

  const handleApprove = async () => {
    if (!selectedRole) {
      showAlert("error", "Select a role before approving.");
      return;
    }

    setActionLoading(true);

    try {
      await approveChampion({ championId: champion.id, role: selectedRole });
      showAlert("success", `${champion.name} approved.`);
    } catch (error) {
      showAlert("error", error.message || "Failed to approve champion.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const rejectionReason = window.prompt("Enter rejection reason:");
    if (!rejectionReason) return;

    setActionLoading(true);

    try {
      await rejectChampion({ championId: champion.id, rejectionReason });
      showAlert("success", `${champion.name} rejected.`);
    } catch (error) {
      showAlert("error", error.message || "Failed to reject champion.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    setActionLoading(true);

    try {
      await createChampionAccount({ championId: champion.id });
      showAlert("success", "Invitation email sent.");
    } catch (error) {
      showAlert("error", error.message || "Failed to send invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateMember = async () => {
    setActionLoading(true);

    try {
      await activateChampionMember({ championId: champion.id });
      showAlert("success", `${champion.name} activated.`);
    } catch (error) {
      showAlert("error", error.message || "Failed to activate champion.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);

    try {
      await deleteChampion({ championId: champion.id });
      showAlert(
        "success",
        `${champion.name} deleted. Their login account, if any, was removed too.`
      );
    } catch (error) {
      showAlert("error", error.message || "Failed to delete champion.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {isPending && (
        <>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--ann-pink)]"
          >
            <option value="">Select role...</option>
            {CHAMPION_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {CHAMPION_ROLE_LABELS[role]}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={actionLoading}
            onClick={handleApprove}
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
          >
            Approve
          </button>

          <button
            type="button"
            disabled={actionLoading}
            onClick={handleReject}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
          >
            Reject
          </button>
        </>
      )}

      {showRegularInviteButton && (
        <button
          type="button"
          disabled={actionLoading}
          onClick={handleSendInvitation}
          className="px-3 py-1.5 rounded-lg bg-[var(--ann-purple)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {champion.account_status === ACCOUNT_STATUS.NOT_CREATED
            ? "Send Invitation"
            : "Resend Invitation"}
        </button>
      )}

      {showSuperAdminResend && (
        <button
          type="button"
          disabled={actionLoading}
          onClick={handleSendInvitation}
          className="px-3 py-1.5 rounded-lg bg-[var(--ann-purple)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
        >
          Resend Invitation
        </button>
      )}

      {showActivate && (
        <button
          type="button"
          disabled={actionLoading}
          onClick={handleActivateMember}
          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
        >
          Activate
        </button>
      )}

      <button
        onClick={() =>
          navigate(ROUTES.championProfile.replace(":championId", champion.id))
        }
        className="px-3 py-1.5 rounded-lg bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90"
      >
        View
      </button>

      {isSuperAdmin && (
        <button
          type="button"
          disabled={deleting}
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title={`Delete ${champion.name}?`}
        message="This permanently deletes their Champions Pool record and, if they ever had an account created, removes their login from Firebase Authentication too. This cannot be undone."
        confirmText="Delete Permanently"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

export default function AllChampions() {
  const { data, loading, error } = useChampions();
  const { isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFilter = searchParams.get("role") || "all";

  const setRoleFilter = (key) => {
    setSearchParams(key === "all" ? {} : { role: key });
  };

  const totalChampions = data.length;

  const pendingApplications = data.filter(
    (m) => m.registration_status === "Pending"
  ).length;

  const approvedChampions = data.filter(
    (m) => m.registration_status === "Approved"
  ).length;

  const activeChampions = data.filter(
    (m) => m.member_status === "Active"
  ).length;

  const filteredData = data.filter((champion) => {
    if (roleFilter === "all") return true;
    if (roleFilter === "unassigned") return !champion.role;
    return champion.role === roleFilter;
  });

  return (
    <AdminLayout
      title="Champions Pool"
      subtitle="Manage registrations across Selection Committee, Facilitator, Co-Facilitator, Mentor and YCN"
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">

        {/* Summary Cards */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Applications</p>

            <h2 className="text-3xl font-bold text-[var(--ann-purple)] mt-2">
              {totalChampions}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pending Review</p>

            <h2 className="text-3xl font-bold text-amber-500 mt-2">
              {pendingApplications}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Approved</p>

            <h2 className="text-3xl font-bold text-green-600 mt-2">
              {approvedChampions}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active Champions</p>

            <h2 className="text-3xl font-bold text-blue-600 mt-2">
              {activeChampions}
            </h2>
          </div>

        </div>

        {/* Table */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">

          <div className="px-6 py-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--ann-text-dark)]">
                Champions Pool Applications
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Review, approve, assign a role, and manage Champions right here.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {ROLE_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setRoleFilter(filter.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    roleFilter === filter.key
                      ? "bg-[var(--ann-pink)] text-white border-[var(--ann-pink)]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[var(--ann-pink)]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500">
              Loading Champions...
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-500">
              {error.message}
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead className="bg-gray-50 border-b">

                  <tr className="text-left text-sm font-semibold text-gray-700">

                    <th className="px-6 py-4">Champion ID</th>

                    <th className="px-6 py-4">Name</th>

                    <th className="px-6 py-4">Role</th>

                    <th className="px-6 py-4">Institution</th>

                    <th className="px-6 py-4">Registration</th>

                    <th className="px-6 py-4">Account</th>

                    <th className="px-6 py-4">Member</th>

                    <th className="px-6 py-4 text-center">Action</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-16 text-center text-gray-500"
                      >
                        No Champions found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((champion) => (
                      <tr
                        key={champion.id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 font-semibold">
                          {champion.champion_code}
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">
                              {champion.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {champion.email}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {champion.role
                            ? CHAMPION_ROLE_LABELS[champion.role] || champion.role
                            : (
                              <span className="text-amber-600 text-xs font-semibold">
                                Unassigned
                              </span>
                            )}
                        </td>

                        <td className="px-6 py-4">
                          {champion.institution}
                        </td>

                        <td className="px-6 py-4">
                          {champion.registration_status}
                        </td>

                        <td className="px-6 py-4">
                          {champion.account_status}
                        </td>

                        <td className="px-6 py-4">
                          {champion.member_status}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <ChampionRowActions
                            champion={champion}
                            isSuperAdmin={isSuperAdmin}
                          />
                        </td>

                      </tr>
                    ))
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </PageContainer>
    </AdminLayout>
  );
}
