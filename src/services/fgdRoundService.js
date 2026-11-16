import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";
import { SELECTION_STATUS } from "../constants/status";
import { FGD_ATTENDANCE_STATUS, FGD_STATUS } from "../constants/fgd";
import { createFGD } from "../entities";
import { SOURCE } from "./fgdRoundPlanner";

// Writes one planned FGD generation round (see fgdRoundPlanner.js).
//
// Each FGD is created in its own transaction that first re-reads every
// participant it is about to place and refuses the whole group if anyone has
// changed since the plan was made (placed by someone else, status changed,
// no longer absent...). So two staff generating at the same moment, or a
// plan that has gone stale, can never put a person in two FGDs or overwrite a
// result — the loser simply gets a clear message and re-previews.
//
// Absent / waitlisted people arrive from an earlier FGD: their earlier
// evaluations are moved to `participant_evaluation_history` (not deleted) so
// the record survives but no longer counts towards the new average, and an
// entry is added to `fgd_history` on the participant so repeat cases can be
// flagged.

// Firestore caps a transaction at 500 writes; leave headroom.
const MAX_TRANSACTION_WRITES = 450;
const WHERE_IN_CHUNK = 30;
const BATCH_CHUNK = 400;

export class StaleSelectionError extends Error {
  constructor(message) {
    super(message);
    this.name = "StaleSelectionError";
    this.code = "stale-selection";
  }
}

const pickedFromEarlierFgd = (source) =>
  source === SOURCE.ABSENT || source === SOURCE.WAITLISTED;

const participantLabel = (participant) =>
  participant.name || participant.participant_code || participant.id;

// Evaluation doc IDs per participant, read once up front (a transaction
// cannot run a query). Each ID is re-read inside the transaction.
const fetchEvaluationIds = async (participantIds) => {
  const byParticipant = new Map(participantIds.map((id) => [id, []]));

  for (let i = 0; i < participantIds.length; i += WHERE_IN_CHUNK) {
    const chunk = participantIds.slice(i, i + WHERE_IN_CHUNK);
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.PARTICIPANT_EVALUATIONS),
        where("participant_id", "in", chunk)
      )
    );

    snapshot.docs.forEach((item) => {
      byParticipant.get(item.data().participant_id)?.push(item.id);
    });
  }

  return byParticipant;
};

// Re-checks a picked participant against what the plan assumed.
const assertStillEligible = ({ member, current }) => {
  const label = participantLabel(member.participant);
  const selection = current.selection_status || SELECTION_STATUS.PENDING;
  const plannedFgdId = member.participant.fgd_id || "";
  const currentFgdId = current.fgd_id || "";

  if (member.source === SOURCE.LEFTOVER || member.source === SOURCE.NEW) {
    if (currentFgdId || selection !== SELECTION_STATUS.PENDING) {
      throw new StaleSelectionError(
        `${label} has already been placed or evaluated by someone else.`
      );
    }
    return;
  }

  if (currentFgdId !== plannedFgdId) {
    throw new StaleSelectionError(`${label} has been moved to another FGD since you selected them.`);
  }

  if (member.source === SOURCE.ABSENT) {
    if (
      selection !== SELECTION_STATUS.PENDING ||
      current.fgd_attendance_status !== FGD_ATTENDANCE_STATUS.ABSENT
    ) {
      throw new StaleSelectionError(`${label} is no longer marked Absent.`);
    }
    return;
  }

  if (selection !== SELECTION_STATUS.WAITLISTED) {
    throw new StaleSelectionError(`${label} is no longer Waitlisted.`);
  }
};

const createGroupInTransaction = async ({
  cohort,
  group,
  existingMaxSequence,
  evaluationIdsByParticipant,
  user,
}) => {
  const cohortRef = doc(db, COLLECTIONS.COHORTS, cohort.id);
  const fgdRef = doc(collection(db, COLLECTIONS.FGDS));

  return runTransaction(db, async (transaction) => {
    // ---- reads (all before any write) ----
    const cohortSnap = await transaction.get(cohortRef);

    if (!cohortSnap.exists()) throw new Error("Cohort not found.");

    const participantSnaps = await Promise.all(
      group.members.map(({ participant }) =>
        transaction.get(doc(db, COLLECTIONS.PARTICIPANTS, participant.id))
      )
    );

    participantSnaps.forEach((snap, index) => {
      const member = group.members[index];

      if (!snap.exists()) {
        throw new StaleSelectionError(`${participantLabel(member.participant)} no longer exists.`);
      }

      assertStillEligible({ member, current: snap.data() });
    });

    const earlierFgdIds = [
      ...new Set(
        participantSnaps
          .map((snap, index) =>
            pickedFromEarlierFgd(group.members[index].source) ? snap.data().fgd_id : ""
          )
          .filter(Boolean)
      ),
    ];

    const earlierFgdSnaps = await Promise.all(
      earlierFgdIds.map((id) => transaction.get(doc(db, COLLECTIONS.FGDS, id)))
    );

    const evaluationRefs = [];

    group.members.forEach(({ participant, source }) => {
      if (!pickedFromEarlierFgd(source)) return;

      (evaluationIdsByParticipant.get(participant.id) || []).forEach((evaluationId) => {
        evaluationRefs.push(doc(db, COLLECTIONS.PARTICIPANT_EVALUATIONS, evaluationId));
      });
    });

    const evaluationSnaps = await Promise.all(
      evaluationRefs.map((ref) => transaction.get(ref))
    );
    const existingEvaluations = evaluationSnaps.filter((snap) => snap.exists());

    const writeCount =
      2 + group.members.length + earlierFgdSnaps.length + existingEvaluations.length * 2;

    if (writeCount > MAX_TRANSACTION_WRITES) {
      throw new Error(
        `${group.name} would need ${writeCount} writes, more than one transaction allows. Use a smaller FGD size.`
      );
    }

    // ---- writes ----
    // Numbering continues from the highest existing number and is serialized
    // through the cohort document, so concurrent rounds never reuse one.
    const counter = Math.max(
      Number(cohortSnap.data().fgd_sequence_counter) || 0,
      existingMaxSequence,
      group.sequenceNo - 1
    );
    const sequenceNo = counter + 1;
    const fgdCode = `${cohort.cohort_code}-FGD-${String(sequenceNo).padStart(3, "0")}`;
    const fgdName = `FGD ${String(sequenceNo).padStart(2, "0")}`;

    transaction.set(
      fgdRef,
      createFGD({
        id: fgdRef.id,

        cohort_id: cohort.id,
        cohort_name: cohort.cohort_name,
        cohort_code: cohort.cohort_code,

        sequence_no: sequenceNo,
        fgd_code: fgdCode,
        fgd_name: fgdName,

        participant_limit: group.limit,
        total_participants: group.members.length,
        total_pending_feedback: group.members.length,

        status: FGD_STATUS.DRAFT,

        created_at: serverTimestamp(),
        created_by_email: user?.email || "",
        created_by_name: user?.displayName || "",

        updated_at: serverTimestamp(),
        updated_by_email: user?.email || "",
        updated_by_name: user?.displayName || "",
      })
    );

    transaction.update(cohortRef, {
      fgd_sequence_counter: sequenceNo,
      updated_at: serverTimestamp(),
    });

    group.members.forEach(({ participant, source }, index) => {
      const current = participantSnaps[index].data();

      const updates = {
        fgd_id: fgdRef.id,
        fgd_code: fgdCode,
        fgd_name: fgdName,
        fgd_attendance_status: FGD_ATTENDANCE_STATUS.PENDING,
        fgd_feedback: "",
        fgd_score: "",
        selection_committee_feedback: "",
        evaluation_count: 0,
        average_evaluation_score: null,
        selection_status: SELECTION_STATUS.PENDING,
        fgd_held: false,
        updated_at: serverTimestamp(),
      };

      if (pickedFromEarlierFgd(source)) {
        updates.fgd_history = arrayUnion({
          outcome: source === SOURCE.ABSENT ? "Absent" : "Waitlisted",
          from_fgd_id: current.fgd_id || "",
          from_fgd_code: current.fgd_code || "",
          from_fgd_name: current.fgd_name || "",
          evaluation_count: Number(current.evaluation_count) || 0,
          average_score:
            typeof current.average_evaluation_score === "number"
              ? current.average_evaluation_score
              : null,
          moved_to_fgd_code: fgdCode,
          at: new Date().toISOString(),
        });
      }

      transaction.update(doc(db, COLLECTIONS.PARTICIPANTS, participant.id), updates);
    });

    earlierFgdSnaps.forEach((snap) => {
      if (!snap.exists()) return;

      const leaving = participantSnaps.filter(
        (participantSnap, index) =>
          pickedFromEarlierFgd(group.members[index].source) &&
          participantSnap.data().fgd_id === snap.id
      ).length;

      transaction.update(snap.ref, {
        total_participants: Math.max(0, (Number(snap.data().total_participants) || 0) - leaving),
        updated_at: serverTimestamp(),
      });
    });

    existingEvaluations.forEach((snap) => {
      const data = snap.data();

      transaction.set(doc(db, COLLECTIONS.PARTICIPANT_EVALUATION_HISTORY, snap.id), {
        ...data,
        archived_at: serverTimestamp(),
        archived_reason: "Re-placed in a new FGD",
        archived_to_fgd_id: fgdRef.id,
        archived_to_fgd_code: fgdCode,
      });
      transaction.delete(snap.ref);
    });

    return { id: fgdRef.id, code: fgdCode, name: fgdName, size: group.members.length };
  });
};

const markHeld = async (participantIds) => {
  for (let i = 0; i < participantIds.length; i += BATCH_CHUNK) {
    const batch = writeBatch(db);

    participantIds.slice(i, i + BATCH_CHUNK).forEach((id) => {
      batch.update(doc(db, COLLECTIONS.PARTICIPANTS, id), {
        fgd_held: true,
        updated_at: serverTimestamp(),
      });
    });

    await batch.commit();
  }
};

// Returns { created: [{ id, code, name, size }], failure: null | { group, message } }.
// Stops at the first group that cannot be created, so what exists is always a
// clean prefix of the plan; the caller refreshes the pools and previews again.
export const executeFgdRound = async ({ cohort, plan, existingMaxSequence, user }) => {
  if (!cohort?.id) throw new Error("Cohort is required.");

  if (plan.errors.length > 0) throw new Error(plan.errors[0]);

  const earlierPickedIds = plan.groups.flatMap((group) =>
    group.members
      .filter(({ source }) => pickedFromEarlierFgd(source))
      .map(({ participant }) => participant.id)
  );

  const evaluationIdsByParticipant = await fetchEvaluationIds(earlierPickedIds);

  // Fail before anything is written if any group is too big for a transaction.
  plan.groups.forEach((group) => {
    const evaluationCount = group.members.reduce(
      (sum, { participant, source }) =>
        sum +
        (pickedFromEarlierFgd(source)
          ? (evaluationIdsByParticipant.get(participant.id) || []).length
          : 0),
      0
    );
    const writes = 2 + group.members.length + group.members.length + evaluationCount * 2;

    if (writes > MAX_TRANSACTION_WRITES) {
      throw new Error(
        `${group.name} would need about ${writes} writes, more than one transaction allows. Use a smaller FGD size.`
      );
    }
  });

  const created = [];
  let failure = null;

  for (const group of plan.groups) {
    try {
      created.push(
        await createGroupInTransaction({
          cohort,
          group: { ...group, limit: plan.limit },
          existingMaxSequence,
          evaluationIdsByParticipant,
          user,
        })
      );
    } catch (error) {
      failure = { group, message: error.message || "Could not create this FGD." };
      break;
    }
  }

  if (!failure && plan.newlyHeld.length > 0) {
    await markHeld(plan.newlyHeld.map(({ participant }) => participant.id));
  }

  // Cohort bookkeeping: the FGD count, and one audit entry per round.
  if (created.length > 0) {
    const fgdSnap = await getDocs(
      query(collection(db, COLLECTIONS.FGDS), where("cohort_id", "==", cohort.id))
    );

    const composition = plan.groups
      .slice(0, created.length)
      .reduce(
        (sum, group) => {
          Object.entries(group.composition).forEach(([source, count]) => {
            sum[source] += count;
          });
          return sum;
        },
        { leftover: 0, new: 0, absent: 0, waitlisted: 0 }
      );

    await updateDoc(doc(db, COLLECTIONS.COHORTS, cohort.id), {
      total_fgds: fgdSnap.size,
      fgd_rounds: arrayUnion({
        at: new Date().toISOString(),
        by_name: user?.displayName || "",
        by_email: user?.email || "",
        fgd_size: plan.limit,
        fgd_codes: created.map((item) => item.code),
        placed: created.reduce((sum, item) => sum + item.size, 0),
        held_back: failure ? 0 : plan.held.length,
        from: composition,
        completed: !failure,
      }),
      updated_at: serverTimestamp(),
      updated_by_email: user?.email || "",
      updated_by_name: user?.displayName || "",
    });
  }

  return { created, failure, heldCount: failure ? 0 : plan.held.length };
};
