import { arrayUnion, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";
import { COHORT_STATUS } from "../constants/status";
import {
  COHORT_APPROVAL_ACTION,
  COHORT_APPROVAL_STATUS,
  getCohortApprovalStatus,
} from "../constants/cohortApproval";

// Every function here is a single write that touches only approval fields
// (plus `status` on approval), which is exactly the shape firestore.rules
// allows for each actor — see the cohorts block there. Details of the
// cohort itself are edited separately (updateCohortRecord) before a
// (re)submission, never in the same write.

const actorFields = (user) => ({
  name: user?.displayName || user?.name || "",
  email: user?.email || "",
});

// An array element can't carry serverTimestamp(), so history entries use an
// ISO string; the top-level *_at fields use server time.
const historyEntry = (action, actor, remarks = "") => ({
  action,
  by_name: actor.name,
  by_email: actor.email,
  at: new Date().toISOString(),
  remarks: remarks.trim(),
});

const cohortRef = (cohortId) => doc(db, COLLECTIONS.COHORTS, cohortId);

const readCohort = async (cohortId) => {
  const snapshot = await getDoc(cohortRef(cohortId));

  if (!snapshot.exists()) throw new Error("Cohort not found.");

  return snapshot.data();
};

// Requester (Youth Coordinator / admin): send a Not Submitted or
// Changes Requested cohort to the Programme Head.
export const submitCohortForApproval = async ({ cohortId, user }) => {
  const current = await readCohort(cohortId);
  const status = getCohortApprovalStatus(current);

  if (
    status !== COHORT_APPROVAL_STATUS.NOT_SUBMITTED &&
    status !== COHORT_APPROVAL_STATUS.CHANGES_REQUESTED
  ) {
    throw new Error(`A cohort that is "${status}" cannot be submitted for approval.`);
  }

  const actor = actorFields(user);
  const isResubmission = status === COHORT_APPROVAL_STATUS.CHANGES_REQUESTED;

  await updateDoc(cohortRef(cohortId), {
    approval_status: COHORT_APPROVAL_STATUS.PENDING,
    approval_requested_by_name: actor.name,
    approval_requested_by_email: actor.email,
    approval_requested_at: serverTimestamp(),
    approval_history: arrayUnion(
      historyEntry(
        isResubmission
          ? COHORT_APPROVAL_ACTION.RESUBMITTED
          : COHORT_APPROVAL_ACTION.SUBMITTED,
        actor
      )
    ),
    updated_at: serverTimestamp(),
    updated_by_name: actor.name,
    updated_by_email: actor.email,
  });
};

// Requester takes a pending request back, to correct something before the
// Programme Head has decided.
export const withdrawCohortApprovalRequest = async ({ cohortId, user }) => {
  const current = await readCohort(cohortId);

  if (getCohortApprovalStatus(current) !== COHORT_APPROVAL_STATUS.PENDING) {
    throw new Error("Only a request that is still pending can be withdrawn.");
  }

  const actor = actorFields(user);

  await updateDoc(cohortRef(cohortId), {
    approval_status: COHORT_APPROVAL_STATUS.NOT_SUBMITTED,
    approval_history: arrayUnion(
      historyEntry(COHORT_APPROVAL_ACTION.WITHDRAWN, actor)
    ),
    updated_at: serverTimestamp(),
    updated_by_name: actor.name,
    updated_by_email: actor.email,
  });
};

export const COHORT_DECISION = {
  APPROVE: "approve",
  CHANGES: "changes",
  REJECT: "reject",
};

// Programme Head: decide a pending request. Approving makes the cohort
// Active (which, together with the approval itself, lets its registration
// form be published). Changes and rejection require a remark the requester
// will see.
export const decideCohortApproval = async ({ cohortId, decision, remarks = "", user }) => {
  const trimmedRemarks = remarks.trim();

  if (decision !== COHORT_DECISION.APPROVE && !trimmedRemarks) {
    throw new Error("Please add a remark explaining your decision.");
  }

  const current = await readCohort(cohortId);

  if (getCohortApprovalStatus(current) !== COHORT_APPROVAL_STATUS.PENDING) {
    throw new Error("This request is no longer pending. Refresh to see its latest state.");
  }

  const actor = actorFields(user);

  const outcome = {
    [COHORT_DECISION.APPROVE]: {
      approval_status: COHORT_APPROVAL_STATUS.APPROVED,
      action: COHORT_APPROVAL_ACTION.APPROVED,
    },
    [COHORT_DECISION.CHANGES]: {
      approval_status: COHORT_APPROVAL_STATUS.CHANGES_REQUESTED,
      action: COHORT_APPROVAL_ACTION.CHANGES_REQUESTED,
    },
    [COHORT_DECISION.REJECT]: {
      approval_status: COHORT_APPROVAL_STATUS.REJECTED,
      action: COHORT_APPROVAL_ACTION.REJECTED,
    },
  }[decision];

  if (!outcome) throw new Error("Unknown decision.");

  const updates = {
    approval_status: outcome.approval_status,
    approval_decided_by_name: actor.name,
    approval_decided_by_email: actor.email,
    approval_decided_at: serverTimestamp(),
    approval_remarks: trimmedRemarks,
    approval_history: arrayUnion(
      historyEntry(outcome.action, actor, trimmedRemarks)
    ),
    updated_at: serverTimestamp(),
    updated_by_name: actor.name,
    updated_by_email: actor.email,
  };

  if (decision === COHORT_DECISION.APPROVE) {
    updates.status = COHORT_STATUS.ACTIVE;
  }

  await updateDoc(cohortRef(cohortId), updates);
};
