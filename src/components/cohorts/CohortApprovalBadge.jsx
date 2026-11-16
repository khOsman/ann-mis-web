import {
  COHORT_APPROVAL_STATUS,
  getCohortApprovalStatus,
} from "../../constants/cohortApproval";

const BADGE_CLASS = {
  [COHORT_APPROVAL_STATUS.APPROVED]: "bg-green-50 text-green-700 border-green-200",
  [COHORT_APPROVAL_STATUS.PENDING]: "bg-amber-50 text-amber-700 border-amber-200",
  [COHORT_APPROVAL_STATUS.CHANGES_REQUESTED]:
    "bg-orange-50 text-orange-700 border-orange-200",
  [COHORT_APPROVAL_STATUS.REJECTED]: "bg-red-50 text-red-700 border-red-200",
  [COHORT_APPROVAL_STATUS.NOT_SUBMITTED]: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function CohortApprovalBadge({ cohort, hideWhenApproved = false }) {
  const status = getCohortApprovalStatus(cohort);

  if (hideWhenApproved && status === COHORT_APPROVAL_STATUS.APPROVED) return null;

  return (
    <span
      className={`px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${
        BADGE_CLASS[status] || BADGE_CLASS[COHORT_APPROVAL_STATUS.NOT_SUBMITTED]
      }`}
    >
      {status}
    </span>
  );
}
