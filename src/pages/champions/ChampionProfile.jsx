import { useState } from "react";
import { useParams } from "react-router-dom";

import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { useChampions } from "../../hooks";
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
  rejectChampion,
} from "../../services/championsService";

export default function ChampionProfile() {
  const { championId } = useParams();
  const { showAlert } = useAlert();
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  const {
    data: champion,
    loading,
    error,
    refresh,
  } = useChampions(championId);

  const handleApprove = async () => {
    if (!selectedRole) {
      showAlert("error", "Select a role before approving.");
      return;
    }

    setActionLoading(true);

    try {
      await approveChampion({ championId, role: selectedRole });

      showAlert("success", "Champion approved successfully.");
      await refresh();
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
      await rejectChampion({ championId, rejectionReason });

      showAlert("success", "Champion rejected.");
      await refresh();
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

      await refresh();
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
      await refresh();
    } catch (error) {
      showAlert("error", error.message || "Failed to activate champion.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Champion Profile"
      subtitle="Review Champion details, assign a role, and manage onboarding status"
    >
      <PageContainer className="py-6 lg:py-8">
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
                    {champion.role && (
                      <span className="ml-2 text-[var(--ann-purple)] font-semibold">
                        {CHAMPION_ROLE_LABELS[champion.role] || champion.role}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {champion.registration_status ===
                    REGISTRATION_STATUS.PENDING && (
                    <>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
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

                  {champion.registration_status ===
                    REGISTRATION_STATUS.APPROVED &&
                    champion.account_status === ACCOUNT_STATUS.NOT_CREATED && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleSendInvitation}
                        className="bg-[var(--ann-purple)] text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        Send Invitation
                      </button>
                    )}

                  {champion.registration_status ===
                    REGISTRATION_STATUS.APPROVED &&
                    champion.account_status === ACCOUNT_STATUS.INVITATION_SENT && (
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
                    champion.member_status === MEMBER_STATUS.INACTIVE && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleActivateMember}
                        className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        Activate Champion
                      </button>
                    )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="font-bold text-lg">Basic Information</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6 p-6">
                <Info label="Email" value={champion.email} />
                <Info label="Phone" value={champion.phone} />
                <Info label="Institution" value={champion.institution} />
                <Info label="Date of Birth" value={champion.date_of_birth} />
                <Info label="Address" value={champion.address} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="font-bold text-lg">Account Information</h3>
              </div>

              <div className="grid md:grid-cols-3 gap-6 p-6">
                <Info
                  label="Role"
                  value={champion.role ? CHAMPION_ROLE_LABELS[champion.role] : ""}
                />
                <Info
                  label="Registration"
                  value={champion.registration_status}
                />
                <Info label="Account" value={champion.account_status} />
                <Info label="Member" value={champion.member_status} />
              </div>
            </div>
          </div>
        )}
      </PageContainer>
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
