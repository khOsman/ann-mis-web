// Cohort approval workflow: a new cohort is created as a Draft, submitted by
// a Youth Coordinator or admin, and then decided by the Programme Head
// (approve / request changes / reject). Approval is what makes a cohort
// Active and allows its registration form to be published.
//
// Cohorts that existed before this workflow have no `approval_status` at
// all — getCohortApprovalStatus() treats those as Approved, so nothing that
// is already running is disturbed.

export const COHORT_APPROVAL_STATUS = {
  NOT_SUBMITTED: "Not Submitted",
  PENDING: "Pending Approval",
  CHANGES_REQUESTED: "Changes Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const COHORT_APPROVAL_ACTION = {
  SUBMITTED: "Submitted",
  RESUBMITTED: "Resubmitted",
  WITHDRAWN: "Withdrawn",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
  REJECTED: "Rejected",
};

export const getCohortApprovalStatus = (cohort) =>
  cohort?.approval_status || COHORT_APPROVAL_STATUS.APPROVED;

export const isCohortApproved = (cohort) =>
  getCohortApprovalStatus(cohort) === COHORT_APPROVAL_STATUS.APPROVED;

export const isCohortPendingApproval = (cohort) =>
  getCohortApprovalStatus(cohort) === COHORT_APPROVAL_STATUS.PENDING;

// The requester can still change the cohort's details while it has not been
// submitted, or after the Programme Head sent it back for changes.
export const isCohortEditableByRequester = (cohort) =>
  [
    COHORT_APPROVAL_STATUS.NOT_SUBMITTED,
    COHORT_APPROVAL_STATUS.CHANGES_REQUESTED,
  ].includes(getCohortApprovalStatus(cohort));

export const canSubmitCohortForApproval = isCohortEditableByRequester;

// Whether the signed-in user may open the Edit page for a cohort.
//  * Nobody edits a cohort while it is awaiting a decision or after it was
//    rejected (the Programme Head is reviewing / has closed it).
//  * Admins (and super admins) can edit any other cohort, as before.
//  * A Youth Coordinator can edit only a cohort they created, and only
//    while it is a draft or has been sent back for changes.
export const canEditCohort = ({ cohort, isAdmin, canRequest, userEmail }) => {
  const status = getCohortApprovalStatus(cohort);

  if (
    status === COHORT_APPROVAL_STATUS.PENDING ||
    status === COHORT_APPROVAL_STATUS.REJECTED
  ) {
    return false;
  }

  if (isAdmin) return true;

  return (
    Boolean(canRequest) &&
    isCohortEditableByRequester(cohort) &&
    Boolean(userEmail) &&
    cohort.created_by_email === userEmail
  );
};
