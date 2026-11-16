import CohortApprovalBadge from "./CohortApprovalBadge";
import CohortApprovalActions from "./CohortApprovalActions";
import {
  COHORT_APPROVAL_STATUS,
  getCohortApprovalStatus,
} from "../../constants/cohortApproval";

const formatWhen = (iso) => {
  if (!iso) return "";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const STATUS_NOTE = {
  [COHORT_APPROVAL_STATUS.NOT_SUBMITTED]:
    "This cohort is a draft. Submit it for approval when it is ready.",
  [COHORT_APPROVAL_STATUS.PENDING]:
    "Waiting for the Programme Head's decision. The cohort cannot be edited meanwhile, and its registration form cannot be published yet.",
  [COHORT_APPROVAL_STATUS.CHANGES_REQUESTED]:
    "The Programme Head asked for changes. Edit the cohort, then resubmit it for approval.",
  [COHORT_APPROVAL_STATUS.APPROVED]:
    "Approved. The cohort is active and its registration form can be published.",
  [COHORT_APPROVAL_STATUS.REJECTED]:
    "Rejected. This cohort cannot be resubmitted; create a new cohort if it is still needed.",
};

// Approval state of one cohort: current status, the Programme Head's latest
// remark when it matters, the actions the signed-in user can take, and the
// full history. Cohorts from before the approval workflow (no history, no
// approval_status) show as Approved with no history, which is accurate.
export default function CohortApprovalPanel({ cohort }) {
  const status = getCohortApprovalStatus(cohort);
  const history = [...(cohort.approval_history || [])].reverse();
  const showRemark =
    cohort.approval_remarks &&
    (status === COHORT_APPROVAL_STATUS.CHANGES_REQUESTED ||
      status === COHORT_APPROVAL_STATUS.REJECTED);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">Approval</h3>
          <CohortApprovalBadge cohort={cohort} />
        </div>

        <CohortApprovalActions cohort={cohort} />
      </div>

      <p className="text-sm text-gray-500">{STATUS_NOTE[status]}</p>

      {showRemark && (
        <div
          className={`rounded-xl border p-4 ${
            status === COHORT_APPROVAL_STATUS.REJECTED
              ? "border-red-200 bg-red-50"
              : "border-orange-200 bg-orange-50"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Remarks from {cohort.approval_decided_by_name || "the Programme Head"}
          </p>
          <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
            {cohort.approval_remarks}
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">History</p>
          <ul className="space-y-3">
            {history.map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--ann-pink)]" />
                <div>
                  <p className="text-gray-800">
                    <span className="font-semibold">{entry.action}</span>
                    {entry.by_name || entry.by_email
                      ? ` by ${entry.by_name || entry.by_email}`
                      : ""}
                    <span className="text-gray-400"> · {formatWhen(entry.at)}</span>
                  </p>
                  {entry.remarks && (
                    <p className="text-gray-600 whitespace-pre-wrap">{entry.remarks}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
