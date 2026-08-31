import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { useChampions } from "../../hooks";
import { ROUTES } from "../../constants/routes";
import { formatTimeRangeBDT } from "../../utils/time";
import { formatBDPhone } from "../../utils/phone";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import RoleCheckboxGroup from "../../components/champions/RoleCheckboxGroup";
import {
  ACCOUNT_STATUS,
  ACCOUNT_STATUS_OPTIONS,
  CHAMPION_ROLE_LABELS,
  MEMBER_STATUS,
  MEMBER_STATUS_OPTIONS,
  REGISTRATION_STATUS,
  REGISTRATION_STATUS_OPTIONS,
  getChampionRoles,
} from "../../constants/champions";
import {
  activateChampionMember,
  approveChampion,
  assignChampionRoles,
  createChampionAccount,
  deleteChampion,
  rejectChampion,
  updateChampion,
} from "../../services/championsService";

const EDIT_FIELDS = [
  ["champion_code", "Champion Code", "text"],
  ["name", "Full Name", "text"],
  ["email", "Email Address", "email"],
  ["phone", "Phone", "text"],
  ["date_of_birth", "Date of Birth", "date"],
  ["institution", "Institution", "text"],
];

export default function ChampionProfile() {
  const { championId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const { isSuperAdmin, isViewer } = useAuth();

  // AllChampions.jsx and SelectionCommittee.jsx both link here — each
  // passes where it came from via navigation state so "Back" (and the
  // post-delete redirect) return there instead of always landing on
  // All Champions.
  const backTo = location.state?.from || ROUTES.champions;
  const backLabel = location.state?.fromLabel || "Champions";
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [managingRoles, setManagingRoles] = useState(false);
  const [manageRolesValue, setManageRolesValue] = useState([]);

  const {
    data: champion,
    loading,
    error,
  } = useChampions(championId);

  const handleApprove = async () => {
    if (selectedRoles.length === 0) {
      showAlert("error", "Select at least one role before approving.");
      return;
    }

    setActionLoading(true);

    try {
      await approveChampion({ championId, roles: selectedRoles });

      showAlert("success", "Champion approved successfully.");
      // No manual refetch needed — the live listener updates `champion` automatically.
    } catch (error) {
      showAlert("error", error.message || "Failed to approve champion.");
    } finally {
      setActionLoading(false);
    }
  };

  const startManagingRoles = () => {
    setManageRolesValue(getChampionRoles(champion));
    setManagingRoles(true);
  };

  const handleSaveRoles = async () => {
    if (manageRolesValue.length === 0) {
      showAlert("error", "Select at least one role.");
      return;
    }

    setActionLoading(true);

    try {
      await assignChampionRoles({ championId, roles: manageRolesValue });
      showAlert("success", "Roles updated successfully.");
      setManagingRoles(false);
      // No manual refetch needed — the live listener updates `champion` automatically.
    } catch (error) {
      showAlert("error", error.message || "Failed to update roles.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const rejectionReason = window.prompt("Enter rejection reason:");
    if (!rejectionReason) return;

    setActionLoading(true);

    try {
      await rejectChampion({ championId, rejectionReason });

      showAlert("success", "Champion rejected.");
      // No manual refetch needed — the live listener updates `champion` automatically.
    } catch (error) {
      showAlert("error", error.message || "Failed to reject champion.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    setActionLoading(true);

    try {
      await createChampionAccount({ championId });

      showAlert(
        "success",
        "Invitation email sent. The Champion can set their password from the link."
      );
      // No manual refetch needed — the live listener updates `champion` automatically.
    } catch (error) {
      showAlert("error", error.message || "Failed to send invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateMember = async () => {
    setActionLoading(true);

    try {
      await activateChampionMember({ championId });

      showAlert("success", "Champion activated.");
      // No manual refetch needed — the live listener updates `champion` automatically.
    } catch (error) {
      showAlert("error", error.message || "Failed to activate champion.");
    } finally {
      setActionLoading(false);
    }
  };

  const startEditing = () => {
    setEditForm({
      champion_code: champion.champion_code || "",
      name: champion.name || "",
      email: champion.email || "",
      phone: champion.phone || "",
      date_of_birth: champion.date_of_birth || "",
      institution: champion.institution || "",
      address: champion.address || "",
      roles: getChampionRoles(champion),
      registration_status: champion.registration_status || "",
      account_status: champion.account_status || "",
      member_status: champion.member_status || "",
    });
    setEditing(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    setActionLoading(true);

    try {
      await updateChampion({ championId, updates: editForm });

      showAlert("success", "Champion updated successfully.");
      setEditing(false);
      // No manual refetch needed — the live listener updates `champion` automatically.
    } catch (error) {
      showAlert("error", error.message || "Failed to update champion.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);

    try {
      await deleteChampion({ championId });
      showAlert(
        "success",
        "Champion deleted. Their login account, if any, was removed too."
      );
      navigate(backTo);
    } catch (error) {
      showAlert("error", error.message || "Failed to delete champion.");
    } finally {
      setDeleting(false);
    }
  };

  const isApproved = champion?.registration_status === REGISTRATION_STATUS.APPROVED;

  const showRegularInviteButton =
    isApproved &&
    (champion?.account_status === ACCOUNT_STATUS.NOT_CREATED ||
      champion?.account_status === ACCOUNT_STATUS.INVITATION_SENT);

  const showSuperAdminResend = isSuperAdmin && isApproved && !showRegularInviteButton;

  return (
    <AdminLayout
      title="Champion Profile"
      subtitle="Review Champion details, assign a role, and manage onboarding status"
    >
      <PageContainer className="py-6 lg:py-8 space-y-4">
        <button
          onClick={() => navigate(backTo)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to {backLabel}
        </button>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            Loading Champion...
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-10 text-center text-red-600">
            {error.message}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--ann-text-dark)]">
                    {champion.name}
                  </h2>

                  <p className="text-gray-500 mt-1">
                    {champion.champion_code}
                    {getChampionRoles(champion).length > 0 && (
                      <span className="ml-2 text-[var(--ann-purple)] font-semibold">
                        {getChampionRoles(champion)
                          .map((r) => CHAMPION_ROLE_LABELS[r] || r)
                          .join(", ")}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {champion.registration_status ===
                    REGISTRATION_STATUS.PENDING && !isViewer && (
                    <>
                      <RoleCheckboxGroup
                        value={selectedRoles}
                        onChange={setSelectedRoles}
                      />

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleApprove}
                        className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleReject}
                        className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {isApproved && !isViewer && !managingRoles && (
                    <button
                      type="button"
                      onClick={startManagingRoles}
                      className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
                    >
                      Manage Roles
                    </button>
                  )}

                  {showRegularInviteButton && !isViewer && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleSendInvitation}
                      className="bg-[var(--ann-purple)] text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      {champion.account_status === ACCOUNT_STATUS.NOT_CREATED
                        ? "Send Invitation"
                        : "Resend Invitation"}
                    </button>
                  )}

                  {showSuperAdminResend && !isViewer && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleSendInvitation}
                      className="bg-[var(--ann-purple)] text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      Resend Invitation
                    </button>
                  )}

                  {champion.account_status === ACCOUNT_STATUS.PASSWORD_SET &&
                    champion.member_status === MEMBER_STATUS.INACTIVE &&
                    !isViewer && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleActivateMember}
                        className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        Activate Champion
                      </button>
                    )}

                  {isSuperAdmin && !editing && (
                    <button
                      type="button"
                      onClick={startEditing}
                      className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
                    >
                      Edit
                    </button>
                  )}

                  {isSuperAdmin && !editing && (
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setShowDeleteConfirm(true)}
                      className="border border-red-300 text-red-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {managingRoles && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-lg mb-4">Manage Roles</h3>

                <RoleCheckboxGroup
                  value={manageRolesValue}
                  onChange={setManageRolesValue}
                />

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setManagingRoles(false)}
                    className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:border-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleSaveRoles}
                    className="bg-[var(--ann-pink)] text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {actionLoading ? "Saving..." : "Save Roles"}
                  </button>
                </div>
              </div>
            )}

            {editing ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="border-b px-6 py-4 flex items-center justify-between">
                  <h3 className="font-bold text-lg">
                    Edit Champion (Super Admin)
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6 p-6">
                  {EDIT_FIELDS.map(([name, label, type]) => (
                    <div key={name}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {label}
                      </label>
                      <input
                        type={type}
                        name={name}
                        value={editForm[name]}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--ann-pink)]"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Roles
                    </label>
                    <RoleCheckboxGroup
                      value={editForm.roles}
                      onChange={(roles) =>
                        setEditForm((prev) => ({ ...prev, roles }))
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={editForm.address}
                      onChange={handleEditChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--ann-pink)] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Registration Status
                    </label>
                    <select
                      name="registration_status"
                      value={editForm.registration_status}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--ann-pink)]"
                    >
                      {REGISTRATION_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Account Status
                    </label>
                    <select
                      name="account_status"
                      value={editForm.account_status}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--ann-pink)]"
                    >
                      {ACCOUNT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Member Status
                    </label>
                    <select
                      name="member_status"
                      value={editForm.member_status}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--ann-pink)]"
                    >
                      {MEMBER_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:border-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleSaveEdit}
                      className="bg-[var(--ann-pink)] text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      {actionLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="border-b px-6 py-4">
                  <h3 className="font-bold text-lg">Basic Information</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6 p-6">
                  <Info label="Email" value={champion.email} />
                  <Info label="Phone" value={formatBDPhone(champion.phone)} />
                  <Info label="Institution" value={champion.institution} />
                  <Info label="Date of Birth" value={champion.date_of_birth} />
                  <Info label="Address" value={champion.address} />
                </div>
              </div>
            )}

            {!editing && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="border-b px-6 py-4">
                  <h3 className="font-bold text-lg">Account Information</h3>
                </div>

                <div className="grid md:grid-cols-3 gap-6 p-6">
                  <Info
                    label="Role"
                    value={getChampionRoles(champion)
                      .map((r) => CHAMPION_ROLE_LABELS[r] || r)
                      .join(", ")}
                  />
                  <Info
                    label="Registration"
                    value={champion.registration_status}
                  />
                  <Info label="Account" value={champion.account_status} />
                  <Info label="Member" value={champion.member_status} />
                </div>
              </div>
            )}

            {!editing && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="border-b px-6 py-4">
                  <h3 className="font-bold text-lg">Assigned FGDs</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    A committee member can be assigned to more than one FGD.
                  </p>
                </div>

                {champion.assigned_fgds?.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {champion.assigned_fgds.map((assignment) => (
                      <div
                        key={assignment.fgd_id}
                        className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {assignment.fgd_code}{" "}
                            <span className="text-gray-400 font-normal">
                              {assignment.fgd_name}
                            </span>
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {assignment.cohort_name || "-"} •{" "}
                            {assignment.session_date || "Date not set"}
                            {formatTimeRangeBDT(
                              assignment.session_start_time,
                              assignment.session_end_time
                            ) &&
                              ` • ${formatTimeRangeBDT(
                                assignment.session_start_time,
                                assignment.session_end_time
                              )}`}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              ROUTES.selectionFGDDetails.replace(
                                ":fgdId",
                                assignment.fgd_id
                              )
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90 self-start sm:self-center"
                        >
                          View FGD
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 px-6 py-6">
                    Not assigned to any FGD yet.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </PageContainer>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={`Delete ${champion?.name || "this champion"}?`}
        message="This permanently deletes their Champions Pool record and, if they ever had an account created, removes their login from Firebase Authentication too. This cannot be undone."
        confirmText="Delete Permanently"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </AdminLayout>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="font-semibold mt-1">{value || "-"}</p>
    </div>
  );
}
