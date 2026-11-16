import {
  addDoc,
  collection,
  doc,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";
import { FGD_STATUS } from "../constants/fgd";
import { MEMBER_STATUS, ACCOUNT_STATUS, CHAMPION_ROLES, getChampionRoles } from "../constants/champions";
import {
  CALLER_STAFF_ROLES,
  CALLER_TYPE,
  CALL_NOTE_MAX_LENGTH,
  CALL_NOTE_REQUIRED,
  CALL_RESULT_OPTIONS,
  CALL_STATUS,
} from "../constants/phoneCall";
import { USER_STATUSES } from "../constants/roles";

// ---- queries --------------------------------------------------------------

export const phoneCallsByFgdQuery = (fgdId) =>
  query(collection(db, COLLECTIONS.PHONE_CALLS), where("fgd_id", "==", fgdId));

export const phoneCallsByCohortQuery = (cohortId) =>
  query(collection(db, COLLECTIONS.PHONE_CALLS), where("cohort_id", "==", cohortId));

// FGDs a person has been named as a caller for (by their sign-in id).
export const fgdsByCallerQuery = (uid) =>
  query(collection(db, COLLECTIONS.FGDS), where("phone_caller_ids", "array-contains", uid));

// ---- reading the log ------------------------------------------------------

// Attempts are append-only. A freshly written attempt has no server time yet
// (the timestamp arrives a moment later), so a missing time sorts as newest.
const callMillis = (call) =>
  call.created_at?.toMillis ? call.created_at.toMillis() : Number.MAX_SAFE_INTEGER;

const compareNewestFirst = (a, b) =>
  callMillis(b) - callMillis(a) || String(b.id).localeCompare(String(a.id));

// participant id -> { status, latest, attempts (newest first) }.
// A participant with no attempts is not in the map: they are Pending.
export const summarizeCalls = (calls) => {
  const byParticipant = new Map();

  calls.forEach((call) => {
    if (!byParticipant.has(call.participant_id)) byParticipant.set(call.participant_id, []);
    byParticipant.get(call.participant_id).push(call);
  });

  const summary = new Map();

  byParticipant.forEach((attempts, participantId) => {
    const sorted = [...attempts].sort(compareNewestFirst);

    summary.set(participantId, {
      status: sorted[0].status,
      latest: sorted[0],
      attempts: sorted,
    });
  });

  return summary;
};

export const statusOf = (summary, participantId) =>
  summary.get(participantId)?.status || CALL_STATUS.PENDING;

// Counts for a set of participants (those currently in the FGD), each by the
// status of their most recent attempt.
export const countStatuses = (participants, summary) => {
  const counts = {
    total: participants.length,
    [CALL_STATUS.PENDING]: 0,
    [CALL_STATUS.CONFIRMED]: 0,
    [CALL_STATUS.DECLINED]: 0,
    [CALL_STATUS.NOT_REACHABLE]: 0,
    [CALL_STATUS.RESCHEDULE]: 0,
  };

  participants.forEach((participant) => {
    counts[statusOf(summary, participant.id)] += 1;
  });

  return counts;
};

// ---- who may call ---------------------------------------------------------

// An FGD with nobody named is open to every admin-side user; once callers are
// named, only they (and admins) work its list.
export const callersOf = (fgd) => fgd?.phone_callers || [];

export const isNamedCaller = (fgd, uid) =>
  Boolean(uid) && callersOf(fgd).some((caller) => caller.id === uid);

// Staff user: admins can always call; a Youth Coordinator (anyone with the
// phoneCall permission) can when the FGD has no callers or names them.
export const canStaffCall = ({ fgd, uid, isAdmin, hasPhonePermission }) => {
  if (!fgd || fgd.status === FGD_STATUS.COMPLETED) return false;
  if (isAdmin) return true;
  if (!hasPhonePermission) return false;

  return callersOf(fgd).length === 0 || isNamedCaller(fgd, uid);
};

export const canChampionCall = ({ fgd, uid }) =>
  Boolean(fgd) && fgd.status !== FGD_STATUS.COMPLETED && isNamedCaller(fgd, uid);

// Whether a staff user may open this FGD's call sheet at all. Admins and
// read-only roles (no phoneCall permission) see every FGD; a caller-type user
// sees only FGDs with no callers named or that name them.
export const canStaffView = ({ fgd, uid, isAdmin, hasPhonePermission }) => {
  if (isAdmin || !hasPhonePermission) return true;

  return callersOf(fgd).length === 0 || isNamedCaller(fgd, uid);
};

// ---- eligible callers -----------------------------------------------------

export const eligibleStaffCallers = (users) =>
  users
    .filter(
      (user) =>
        user.status === USER_STATUSES.ACTIVE && CALLER_STAFF_ROLES.includes(user.role)
    )
    .map((user) => ({
      id: user.id,
      type: CALLER_TYPE.STAFF,
      name: user.name || user.email || user.id,
      email: user.email || "",
      role: user.role,
    }));

export const eligibleChampionCallers = (champions) =>
  champions
    .filter(
      (champion) =>
        getChampionRoles(champion).includes(CHAMPION_ROLES.SELECTION_COMMITTEE) &&
        champion.member_status === MEMBER_STATUS.ACTIVE &&
        champion.account_status === ACCOUNT_STATUS.ACTIVE
    )
    .map((champion) => ({
      id: champion.id,
      type: CALLER_TYPE.CHAMPION,
      name: champion.name || champion.email || champion.id,
      email: champion.email || "",
      role: "Selection Committee",
    }));

// Replaces an FGD's callers. Two arrays are kept: the full entries for
// display, and a flat list of sign-in ids that the database rules and the
// "FGDs I call" query use.
export const setFgdCallers = async ({ fgdId, callers }) => {
  const unique = [...new Map(callers.map((caller) => [caller.id, caller])).values()];

  await updateDoc(doc(db, COLLECTIONS.FGDS, fgdId), {
    phone_callers: unique,
    phone_caller_ids: unique.map((caller) => caller.id),
    updated_at: serverTimestamp(),
  });

  return unique.length;
};

// ---- logging a call -------------------------------------------------------

export const validateCall = ({ status, note }) => {
  const trimmed = (note || "").trim();

  if (!CALL_RESULT_OPTIONS.includes(status)) {
    return "Choose the outcome of the call.";
  }

  if (CALL_NOTE_REQUIRED.includes(status) && !trimmed) {
    return `Add a note explaining why the participant is "${status}".`;
  }

  if (trimmed.length > CALL_NOTE_MAX_LENGTH) {
    return `The note can be at most ${CALL_NOTE_MAX_LENGTH} characters.`;
  }

  return "";
};

// Appends one attempt to the log. Never edits or removes an earlier one.
export const logPhoneCall = async ({ fgd, participant, status, note, caller }) => {
  const problem = validateCall({ status, note });

  if (problem) throw new Error(problem);

  if (fgd.status === FGD_STATUS.COMPLETED) {
    throw new Error("This FGD is completed, so calls can no longer be logged.");
  }

  if (participant.fgd_id !== fgd.id) {
    throw new Error("This participant is no longer in this FGD.");
  }

  const ref = await addDoc(collection(db, COLLECTIONS.PHONE_CALLS), {
    participant_id: participant.id,
    participant_code: participant.participant_code || "",
    fgd_id: fgd.id,
    fgd_code: fgd.fgd_code || "",
    cohort_id: fgd.cohort_id || participant.cohort_id || "",
    status,
    note: (note || "").trim(),
    called_by_uid: caller.uid,
    called_by_name: caller.name || "",
    called_by_email: caller.email || "",
    called_by_type: caller.type,
    created_at: serverTimestamp(),
  });

  return ref.id;
};
