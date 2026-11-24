// Phone Call Interview: before an FGD, someone phones each participant in the
// group to confirm they will attend. Every call attempt is logged (see
// phoneCallService.js); a participant's current status is simply the result
// of their most recent attempt, and "Pending" means nobody has called yet.

export const CALL_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  NOT_REACHABLE: "Not reachable",
  RESCHEDULE: "Reschedule requested",
};

// What a caller can record for one attempt ("Pending" is only the absence of
// an attempt, so it is not selectable).
export const CALL_RESULT_OPTIONS = [
  CALL_STATUS.CONFIRMED,
  CALL_STATUS.DECLINED,
  CALL_STATUS.NOT_REACHABLE,
  CALL_STATUS.RESCHEDULE,
];

// A reason is required where someone later has to act on it; for the other
// two outcomes a note is optional.
export const CALL_NOTE_REQUIRED = [CALL_STATUS.DECLINED, CALL_STATUS.RESCHEDULE];

export const CALL_NOTE_MAX_LENGTH = 1000;

export const CALL_STATUS_STYLE = {
  [CALL_STATUS.PENDING]: "bg-gray-100 text-gray-600 border-gray-200",
  [CALL_STATUS.CONFIRMED]: "bg-green-50 text-green-700 border-green-200",
  [CALL_STATUS.DECLINED]: "bg-red-50 text-red-700 border-red-200",
  [CALL_STATUS.NOT_REACHABLE]: "bg-amber-50 text-amber-700 border-amber-200",
  [CALL_STATUS.RESCHEDULE]: "bg-blue-50 text-blue-700 border-blue-200",
};

// Who can be named as a caller for an FGD.
export const CALLER_TYPE = {
  STAFF: "staff",
  CHAMPION: "champion",
};

// Staff roles that can be assigned (and, without an assignment, can call).
export const CALLER_STAFF_ROLES = ["super_admin", "admin", "youth_coordinator"];
