import { useState } from "react";
import { auth } from "../../firebase";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import {
  COHORT_DECISION,
  decideCohortApproval,
  submitCohortForApproval,
  withdrawCohortApprovalRequest,
} from "../../services/cohortApprovalService";
import {
  COHORT_APPROVAL_STATUS,
  getCohortApprovalStatus,
} from "../../constants/cohortApproval";

const DECISION_COPY = {
  [COHORT_DECISION.APPROVE]: {
    title: "Approve this cohort?",
    body: "The cohort becomes Active and its registration form can be published.",
    confirm: "Approve",
    remarkLabel: "Remarks (optional)",
    remarkRequired: false,
    buttonClass: "bg-green-600 hover:bg-green-700",
  },
  [COHORT_DECISION.CHANGES]: {
    title: "Request changes",
    body: "The cohort goes back to the requester, who can edit it and resubmit.",
    confirm: "Send back for changes",
    remarkLabel: "What needs to change? (required)",
    remarkRequired: true,
    buttonClass: "bg-orange-500 hover:bg-orange-600",
  },
  [COHORT_DECISION.REJECT]: {
    title: "Reject this cohort",
    body: "The cohort is rejected and cannot be resubmitted. A new cohort would have to be created.",
    confirm: "Reject",
    remarkLabel: "Reason for rejection (required)",
    remarkRequired: true,
    buttonClass: "bg-red-600 hover:bg-red-700",
  },
};

// Buttons for the actions the signed-in user may take on a cohort's
// approval request, plus the remark dialog for a decision. Shows nothing
// when there is nothing the user can do.
//   * cohortRequest permission: submit / resubmit, and withdraw a pending request
//   * cohortApproval permission: approve / request changes / reject a pending request
export default function CohortApprovalActions({ cohort, compact = false, onDone }) {
  const { showAlert } = useAlert();
  const { hasPermission, isSuperAdmin } = useAuth();

  const [dialog, setDialog] = useState(null); // a COHORT_DECISION value
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  const status = getCohortApprovalStatus(cohort);
  const canRequest = hasPermission("cohortRequest");
  const canDecide = hasPermission("cohortApproval") || isSuperAdmin;

  const run = async (task, successMessage) => {
    setBusy(true);

    try {
      await task();
      showAlert("success", successMessage);
      setDialog(null);
      setRemarks("");
      onDone?.();
    } catch (error) {
      console.error("Cohort approval action failed:", error);
      showAlert("error", error.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const baseButton =
    "rounded-xl text-sm font-semibold disabled:opacity-50 " +
    (compact ? "px-3 py-2 text-xs" : "px-4 py-2.5");

  const buttons = [];

  if (
    canRequest &&
    (status === COHORT_APPROVAL_STATUS.NOT_SUBMITTED ||
      status === COHORT_APPROVAL_STATUS.CHANGES_REQUESTED)
  ) {
    buttons.push(
      <button
        key="submit"
        type="button"
        disabled={busy}
        onClick={() =>
          run(
            () => submitCohortForApproval({ cohortId: cohort.id, user: auth.currentUser }),
            "Submitted for approval."
          )
        }
        className={`${baseButton} bg-[var(--ann-pink)] text-white hover:opacity-90`}
      >
        {status === COHORT_APPROVAL_STATUS.CHANGES_REQUESTED
          ? "Resubmit for Approval"
          : "Submit for Approval"}
      </button>
    );
  }

  if (canRequest && status === COHORT_APPROVAL_STATUS.PENDING) {
    buttons.push(
      <button
        key="withdraw"
        type="button"
        disabled={busy}
        onClick={() =>
          run(
            () =>
              withdrawCohortApprovalRequest({ cohortId: cohort.id, user: auth.currentUser }),
            "Request withdrawn. You can edit the cohort and submit again."
          )
        }
        className={`${baseButton} border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]`}
      >
        Withdraw Request
      </button>
    );
  }

  if (canDecide && status === COHORT_APPROVAL_STATUS.PENDING) {
    buttons.push(
      <button
        key="approve"
        type="button"
        disabled={busy}
        onClick={() => setDialog(COHORT_DECISION.APPROVE)}
        className={`${baseButton} bg-green-600 text-white hover:bg-green-700`}
      >
        Approve
      </button>,
      <button
        key="changes"
        type="button"
        disabled={busy}
        onClick={() => setDialog(COHORT_DECISION.CHANGES)}
        className={`${baseButton} border border-orange-300 text-orange-700 hover:bg-orange-50`}
      >
        Request Changes
      </button>,
      <button
        key="reject"
        type="button"
        disabled={busy}
        onClick={() => setDialog(COHORT_DECISION.REJECT)}
        className={`${baseButton} border border-red-200 text-red-600 hover:bg-red-50`}
      >
        Reject
      </button>
    );
  }

  if (buttons.length === 0) return null;

  const copy = dialog ? DECISION_COPY[dialog] : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">{buttons}</div>

      {copy && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">{copy.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {cohort.cohort_name} ({cohort.cohort_code})
            </p>
            <p className="text-sm text-gray-500 mt-3">{copy.body}</p>

            <label className="block text-sm font-semibold text-gray-700 mt-5 mb-2">
              {copy.remarkLabel}
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
              placeholder="Write your remarks here..."
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setDialog(null);
                  setRemarks("");
                }}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || (copy.remarkRequired && !remarks.trim())}
                onClick={() =>
                  run(
                    () =>
                      decideCohortApproval({
                        cohortId: cohort.id,
                        decision: dialog,
                        remarks,
                        user: auth.currentUser,
                      }),
                    dialog === COHORT_DECISION.APPROVE
                      ? "Cohort approved and activated."
                      : dialog === COHORT_DECISION.CHANGES
                      ? "Sent back to the requester for changes."
                      : "Cohort rejected."
                  )
                }
                className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 ${copy.buttonClass}`}
              >
                {busy ? "Saving..." : copy.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
