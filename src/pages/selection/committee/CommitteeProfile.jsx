import { useState } from "react";
import { useParams } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";

import { auth } from "../../../firebase";
import AdminLayout from "../../../layouts/AdminLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAlert } from "../../../context/AlertContext";
import { useSelectionCommittee } from "../../../hooks";
import {
  ACCOUNT_STATUS,
  MEMBER_STATUS,
  REGISTRATION_STATUS,
} from "../../../constants/selectionCommittee";
import {
  approveSelectionCommitteeMember,
  createSelectionCommitteeAccount,
  rejectSelectionCommitteeMember,
} from "../../../services/selectionCommitteeService";

export default function CommitteeProfile() {
  const { memberId } = useParams();
  const { showAlert } = useAlert();
  const [actionLoading, setActionLoading] = useState(false);

  const {
    data: member,
    loading,
    error,
    refresh,
  } = useSelectionCommittee(memberId);

  const handleApprove = async () => {
    setActionLoading(true);

    try {
      await approveSelectionCommitteeMember({ memberId });

      showAlert("success", "Committee member approved successfully.");
      await refresh();
    } catch (error) {
      showAlert("error", error.message || "Failed to approve member.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const rejectionReason = window.prompt("Enter rejection reason:");
    if (!rejectionReason) return;

    setActionLoading(true);

    try {
      await rejectSelectionCommitteeMember({ memberId, rejectionReason });

      showAlert("success", "Committee member rejected.");
      await refresh();
    } catch (error) {
      showAlert("error", error.message || "Failed to reject member.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    setActionLoading(true);

    try {
      const result = await createSelectionCommitteeAccount({ memberId });

      await sendPasswordResetEmail(auth, result.email, {
        url: `${window.location.origin}/`,
        handleCodeInApp: false,
      });

      showAlert(
        "success",
        "Invitation email sent. The member can set their password from the link."
      );

      await refresh();
    } catch (error) {
      showAlert("error", error.message || "Failed to send invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Committee Profile"
      subtitle="Review committee member details and onboarding status"
    >
      <PageContainer className="py-6 lg:py-8">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            Loading committee member...
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
                    {member.name}
                  </h2>

                  <p className="text-gray-500 mt-1">
                    {member.committee_code}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {member.registration_status ===
                    REGISTRATION_STATUS.PENDING && (
                    <>
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

                  {member.registration_status ===
                    REGISTRATION_STATUS.APPROVED &&
                    member.account_status === ACCOUNT_STATUS.NOT_CREATED && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleSendInvitation}
                        className="bg-[var(--ann-purple)] text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        Send Invitation
                      </button>
                    )}

                  {member.registration_status ===
                    REGISTRATION_STATUS.APPROVED &&
                    member.account_status === ACCOUNT_STATUS.INVITATION_SENT && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleSendInvitation}
                        className="bg-[var(--ann-purple)] text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        Resend Invitation
                      </button>
                    )}

                  {member.account_status === ACCOUNT_STATUS.PASSWORD_SET &&
                    member.member_status === MEMBER_STATUS.INACTIVE && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        Activate Member
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
                <Info label="Email" value={member.email} />
                <Info label="Phone" value={member.phone} />
                <Info label="Institution" value={member.institution} />
                <Info label="Date of Birth" value={member.date_of_birth} />
                <Info label="Address" value={member.address} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="font-bold text-lg">Account Information</h3>
              </div>

              <div className="grid md:grid-cols-3 gap-6 p-6">
                <Info
                  label="Registration"
                  value={member.registration_status}
                />
                <Info label="Account" value={member.account_status} />
                <Info label="Member" value={member.member_status} />
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