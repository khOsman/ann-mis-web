import { REGISTRATION_STATUS, SELECTION_STATUS } from "../constants/status";
import { FGD_ATTENDANCE_STATUS, FGD_STATUS } from "../constants/fgd";

// Pure planning for an FGD generation round — no database access, so every
// rule here can be tested exhaustively and previewed instantly in the UI.
//
// A round draws from four pools of participants in one cohort:
//   * leftover  — registered, not in any FGD, held back by an earlier round
//                 because they were too few to fill an FGD
//   * new       — registered, not in any FGD, never held
//   * absent    — placed in an FGD that is Completed and marked Absent
//   * waitlisted— evaluated and Waitlisted
// Leftover then new registrations are always taken first, strictly first come
// first served by registration time. Absent / waitlisted people are added
// only when staff pick them, to top up an incomplete group or to form
// groups of their own.

export const MAX_FGD_SIZE = 100;
export const MIN_RECOMMENDED_FGD_SIZE = 10;

export const SOURCE = {
  LEFTOVER: "leftover",
  NEW: "new",
  ABSENT: "absent",
  WAITLISTED: "waitlisted",
};

// ---- ordering -------------------------------------------------------------

export const registeredAtMillis = (participant) => {
  const stamp = participant.submitted_at || participant.created_at;

  if (!stamp) return 0;
  if (typeof stamp.toMillis === "function") return stamp.toMillis();
  if (typeof stamp.seconds === "number") return stamp.seconds * 1000;

  return 0;
};

// The participant code ends in "-<sequence>-<unix time>"; the sequence is the
// cohort's own registration counter, so it breaks ties between registrations
// stamped with the same time (bulk imports, simultaneous submissions).
const registrationSequence = (participant) => {
  const match = /-(\d+)-\d+$/.exec(participant.participant_code || "");

  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

export const compareFifo = (a, b) =>
  registeredAtMillis(a) - registeredAtMillis(b) ||
  registrationSequence(a) - registrationSequence(b) ||
  String(a.id).localeCompare(String(b.id));

export const sortFifo = (participants) => [...participants].sort(compareFifo);

// ---- pools ----------------------------------------------------------------

export const buildPools = (participants, fgds) => {
  const fgdsById = new Map(fgds.map((fgd) => [fgd.id, fgd]));
  const leftover = [];
  const fresh = [];
  const absent = [];
  const waitlisted = [];

  participants.forEach((participant) => {
    if (participant.registration_status !== REGISTRATION_STATUS.REGISTERED) return;

    const selection = participant.selection_status || SELECTION_STATUS.PENDING;

    if (!participant.fgd_id) {
      if (selection === SELECTION_STATUS.PENDING) {
        (participant.fgd_held ? leftover : fresh).push(participant);
      } else if (selection === SELECTION_STATUS.WAITLISTED) {
        waitlisted.push(participant);
      }
      return;
    }

    if (selection === SELECTION_STATUS.WAITLISTED) {
      waitlisted.push(participant);
      return;
    }

    // Absent only counts once that FGD is over: until then the person might
    // still attend, and the system flips leftover Pending people to Absent
    // itself when an FGD is completed.
    if (
      selection === SELECTION_STATUS.PENDING &&
      participant.fgd_attendance_status === FGD_ATTENDANCE_STATUS.ABSENT &&
      fgdsById.get(participant.fgd_id)?.status === FGD_STATUS.COMPLETED
    ) {
      absent.push(participant);
    }
  });

  return {
    leftover: sortFifo(leftover),
    fresh: sortFifo(fresh),
    absent: sortFifo(absent),
    waitlisted: sortFifo(waitlisted),
  };
};

// How many times someone has already come back through the same pool, from
// the history written each time they are re-placed. Used to flag repeat cases.
export const repeatCount = (participant, outcome) =>
  (participant.fgd_history || []).filter((entry) => entry.outcome === outcome).length;

export const maxFgdSequence = (fgds) =>
  fgds.reduce((max, fgd) => {
    const fromCode = /(\d+)$/.exec(fgd.fgd_code || "");

    return Math.max(
      max,
      Number(fgd.sequence_no) || 0,
      fromCode ? Number(fromCode[1]) : 0
    );
  }, 0);

// Seats still free in the last group if only the queue were placed.
export const seatsToFillLastGroup = (queueSize, limit) => {
  const size = Number(limit);

  if (!Number.isInteger(size) || size < 1) return 0;

  const remainder = queueSize % size;

  return remainder === 0 ? 0 : size - remainder;
};

// ---- planning -------------------------------------------------------------

const pad = (value, width) => String(value).padStart(width, "0");

const emptyComposition = () => ({
  [SOURCE.LEFTOVER]: 0,
  [SOURCE.NEW]: 0,
  [SOURCE.ABSENT]: 0,
  [SOURCE.WAITLISTED]: 0,
});

export const fgdCodeFor = (cohortCode, sequenceNo) =>
  `${cohortCode}-FGD-${pad(sequenceNo, 3)}`;

export const fgdNameFor = (sequenceNo) => `FGD ${pad(sequenceNo, 2)}`;

export const planRound = ({
  leftover = [],
  fresh = [],
  absentPicked = [],
  waitlistedPicked = [],
  limit,
  allowSmallLast = false,
  existingMaxSequence = 0,
  cohortCode = "",
}) => {
  const errors = [];
  const warnings = [];
  const size = Number(limit);

  if (!Number.isInteger(size) || size < 1) {
    errors.push("Participants per FGD must be a whole number of at least 1.");
  } else if (size > MAX_FGD_SIZE) {
    errors.push(`Participants per FGD cannot be more than ${MAX_FGD_SIZE}.`);
  } else if (size < MIN_RECOMMENDED_FGD_SIZE) {
    warnings.push(
      `An FGD size of ${size} is below the usual minimum of ${MIN_RECOMMENDED_FGD_SIZE}.`
    );
  }

  // Leftover first, then new registrations — each already first come first
  // served — then whoever staff picked from Absent and Waitlisted.
  const members = [
    ...leftover.map((participant) => ({ participant, source: SOURCE.LEFTOVER })),
    ...fresh.map((participant) => ({ participant, source: SOURCE.NEW })),
    ...absentPicked.map((participant) => ({ participant, source: SOURCE.ABSENT })),
    ...waitlistedPicked.map((participant) => ({ participant, source: SOURCE.WAITLISTED })),
  ];

  const seen = new Set();

  members.forEach(({ participant }) => {
    if (seen.has(participant.id)) {
      errors.push(`A participant appears twice in this round (${participant.id}).`);
    }
    seen.add(participant.id);
  });

  if (members.length === 0) {
    errors.push(
      "There is nobody to place. No new registrations or leftover participants are waiting, and none were picked from Absent or Waitlisted."
    );
  }

  const empty = {
    errors,
    warnings,
    groups: [],
    held: [],
    newlyHeld: [],
    totalPlaced: 0,
    limit: size,
  };

  if (errors.length > 0) return empty;

  const fullGroupCount = Math.floor(members.length / size);
  const groupsOfMembers = [];

  for (let index = 0; index < fullGroupCount; index += 1) {
    groupsOfMembers.push({ members: members.slice(index * size, (index + 1) * size), isSmall: false });
  }

  const remainder = members.slice(fullGroupCount * size);
  let held = [];

  if (remainder.length > 0) {
    if (allowSmallLast) {
      groupsOfMembers.push({ members: remainder, isSmall: true });

      if (remainder.length < MIN_RECOMMENDED_FGD_SIZE) {
        warnings.push(
          `The last FGD would have only ${remainder.length} participant(s), below the usual minimum of ${MIN_RECOMMENDED_FGD_SIZE}.`
        );
      }
    } else {
      const pickedInRemainder = remainder.filter(
        ({ source }) => source === SOURCE.ABSENT || source === SOURCE.WAITLISTED
      );

      if (pickedInRemainder.length > 0) {
        const seatsMissing = size - remainder.length;

        errors.push(
          `${pickedInRemainder.length} participant(s) picked from Absent / Waitlisted would land in an incomplete last group of ${remainder.length}. ` +
            `Pick ${seatsMissing} more to fill it, remove the extra picks, or allow a smaller last FGD.`
        );

        return { ...empty, errors, warnings };
      }

      // Everyone left over is from the queue: hold them for the next round.
      held = remainder;
    }
  }

  const groups = groupsOfMembers.map((group, index) => {
    const sequenceNo = existingMaxSequence + index + 1;
    const composition = emptyComposition();

    group.members.forEach(({ source }) => {
      composition[source] += 1;
    });

    return {
      sequenceNo,
      code: fgdCodeFor(cohortCode, sequenceNo),
      name: fgdNameFor(sequenceNo),
      members: group.members,
      composition,
      isSmall: group.isSmall,
    };
  });

  return {
    errors,
    warnings,
    groups,
    held,
    // Only people not already marked as held need a write.
    newlyHeld: held.filter(({ source }) => source === SOURCE.NEW),
    totalPlaced: groups.reduce((sum, group) => sum + group.members.length, 0),
    limit: size,
  };
};
