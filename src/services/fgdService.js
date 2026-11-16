import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";
import { SELECTION_STATUS } from "../constants/status";
import { FGD_ATTENDANCE_STATUS, FGD_STATUS } from "../constants/fgd";
import { cleanupChampionFgdAssignments } from "./cohortDataDeletionService";

export const fgdsByCohortQuery = (cohortId) =>
  query(
    collection(db, COLLECTIONS.FGDS),
    where("cohort_id", "==", cohortId),
    orderBy("sequence_no", "asc")
  );

export const fgdDocRef = (fgdId) => doc(db, COLLECTIONS.FGDS, fgdId);

export const getFGDsByCohort = async (cohortId) => {
  const snapshot = await getDocs(fgdsByCohortQuery(cohortId));

  return snapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
  }));
};

export const getFGDById = async (fgdId) => {
  const snapshot = await getDoc(fgdDocRef(fgdId));

  if (!snapshot.exists()) {
    throw new Error("FGD not found.");
  }

  return {
    ...snapshot.data(),
    id: snapshot.id,
  };
};

export const deleteFGDsForCohort = async ({
  cohortId,
  updatedByEmail = "",
  updatedByName = "",
}) => {
  if (!cohortId) {
    throw new Error("Cohort is required.");
  }

  const fgdSnap = await getDocs(
    query(collection(db, COLLECTIONS.FGDS), where("cohort_id", "==", cohortId))
  );

  if (fgdSnap.empty) return;

  const fgdIds = new Set(fgdSnap.docs.map((item) => item.id));

  const participantSnap = await getDocs(
    query(collection(db, COLLECTIONS.PARTICIPANTS), where("cohort_id", "==", cohortId))
  );

  const affectedParticipants = participantSnap.docs.filter((item) =>
    fgdIds.has(item.data().fgd_id)
  );

  const batch = writeBatch(db);

  fgdSnap.docs.forEach((fgdDoc) => {
    batch.delete(fgdDoc.ref);
  });

  affectedParticipants.forEach((participantDoc) => {
    batch.update(participantDoc.ref, {
      // FGD assignment
      fgd_id: "",
      fgd_code: "",
      fgd_name: "",
      fgd_attendance_status: "",

      // Evaluation data entered by the selection committee
      fgd_score: "",
      fgd_feedback: "",
      selection_committee_feedback: "",
      selection_committee_notes: "",
      selection_recommendation: "",
      selection_status: SELECTION_STATUS.PENDING,
      fgd_evaluated_by: "",
      fgd_evaluated_at: null,

      updated_at: serverTimestamp(),
    });
  });

  const cohortRef = doc(db, COLLECTIONS.COHORTS, cohortId);

  batch.update(cohortRef, {
    total_fgds: 0,
    updated_at: serverTimestamp(),
    updated_by_email: updatedByEmail,
    updated_by_name: updatedByName,
  });

  await batch.commit();
};

// Deletes every FGD of a cohort and puts everyone back in the queue — only
// while nothing has happened in any of them. Once attendance has been marked,
// a result recorded or an evaluation (even a draft) saved, deleting would
// destroy real work, so it is refused: further FGDs are generated as new
// rounds instead (see fgdRoundService.js). Committee assignments on the
// deleted FGDs are removed from the committee members too.
export const resetFGDsForCohort = async ({
  cohortId,
  updatedByEmail = "",
  updatedByName = "",
}) => {
  if (!cohortId) {
    throw new Error("Cohort is required.");
  }

  const [fgdSnap, participantSnap] = await Promise.all([
    getDocs(query(collection(db, COLLECTIONS.FGDS), where("cohort_id", "==", cohortId))),
    getDocs(
      query(collection(db, COLLECTIONS.PARTICIPANTS), where("cohort_id", "==", cohortId))
    ),
  ]);

  if (fgdSnap.empty) return;

  const progressed = participantSnap.docs.filter((item) => {
    const data = item.data();

    return (
      (data.fgd_id && data.fgd_attendance_status &&
        data.fgd_attendance_status !== FGD_ATTENDANCE_STATUS.PENDING) ||
      Number(data.evaluation_count) > 0 ||
      (data.selection_status && data.selection_status !== SELECTION_STATUS.PENDING)
    );
  });

  if (progressed.length > 0) {
    throw new Error(
      `${progressed.length} participant(s) already have attendance or results recorded, so these FGDs cannot be reset. Generate new FGDs instead.`
    );
  }

  const fgdIds = fgdSnap.docs.map((item) => item.id);

  for (let i = 0; i < fgdIds.length; i += 30) {
    const evaluationSnap = await getDocs(
      query(
        collection(db, COLLECTIONS.PARTICIPANT_EVALUATIONS),
        where("fgd_id", "in", fgdIds.slice(i, i + 30))
      )
    );

    if (!evaluationSnap.empty) {
      throw new Error(
        "Evaluations (including drafts) already exist for these FGDs, so they cannot be reset."
      );
    }
  }

  await deleteFGDsForCohort({ cohortId, updatedByEmail, updatedByName });

  await cleanupChampionFgdAssignments(fgdIds);

  // Held participants are ordinary new registrations again, and numbering
  // starts over, since no FGD is left.
  const heldIds = participantSnap.docs
    .filter((item) => item.data().fgd_held)
    .map((item) => item.id);

  for (let i = 0; i < heldIds.length; i += 400) {
    const batch = writeBatch(db);

    heldIds.slice(i, i + 400).forEach((id) => {
      batch.update(doc(db, COLLECTIONS.PARTICIPANTS, id), {
        fgd_held: false,
        updated_at: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  await updateDoc(doc(db, COLLECTIONS.COHORTS, cohortId), {
    fgd_sequence_counter: 0,
    updated_at: serverTimestamp(),
  });
};

export const participantsByFGDQuery = (fgdId) =>
  query(collection(db, COLLECTIONS.PARTICIPANTS), where("fgd_id", "==", fgdId));

export const getParticipantsByFGD = async (fgdId) => {
  const snapshot = await getDocs(participantsByFGDQuery(fgdId));

  return snapshot.docs
    .map((item) => ({
      ...item.data(),
      id: item.id,
    }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
};

export const updateFGDParticipant = async (participantId, updates) => {
  const participantRef = doc(db, COLLECTIONS.PARTICIPANTS, participantId);

  await updateDoc(participantRef, {
    ...updates,
    updated_at: serverTimestamp(),
  });

  // cohort.total_selected has no Firestore trigger keeping it in sync —
  // recomputed from a count query (not incremented/decremented) since
  // selection_status can move between Selected/Waitlisted/Rejected in
  // either direction depending on how an evaluation is edited.
  if (updates.selection_status !== undefined) {
    const participantSnap = await getDoc(participantRef);
    const cohortId = participantSnap.data()?.cohort_id;

    if (cohortId) {
      const selectedSnap = await getDocs(
        query(
          collection(db, COLLECTIONS.PARTICIPANTS),
          where("cohort_id", "==", cohortId),
          where("selection_status", "==", SELECTION_STATUS.SELECTED)
        )
      );

      await updateDoc(doc(db, COLLECTIONS.COHORTS, cohortId), {
        total_selected: selectedSnap.size,
        updated_at: serverTimestamp(),
      });
    }
  }
};

// Schedule/venue/meet_link are denormalized onto every assigned champion's
// assigned_fgds[] entry at assignment time (see fgdAssignment.js on the
// backend) — no Firestore triggers exist here to keep those copies in sync,
// so an edit here has to explicitly fan out to each committee member.
export const updateFGDSchedule = async (fgdId, updates) => {
  const fgdRef = doc(db, COLLECTIONS.FGDS, fgdId);

  await updateDoc(fgdRef, {
    ...updates,
    updated_at: serverTimestamp(),
  });

  const fgdSnap = await getDoc(fgdRef);
  if (!fgdSnap.exists()) return;

  const fgd = fgdSnap.data();
  const committeeMembers = fgd.committee_members || [];

  if (committeeMembers.length === 0) return;

  const scheduleFields = {
    fgd_code: fgd.fgd_code || "",
    fgd_name: fgd.fgd_name || "",
    cohort_name: fgd.cohort_name || "",
    session_date: fgd.session_date || "",
    session_start_time: fgd.session_start_time || "",
    session_end_time: fgd.session_end_time || "",
    venue: fgd.venue || "",
    meet_link: fgd.meet_link || "",
  };

  await Promise.all(
    committeeMembers.map(async (member) => {
      const championRef = doc(db, COLLECTIONS.CHAMPIONS_POOL, member.champion_id);
      const championSnap = await getDoc(championRef);

      if (!championSnap.exists()) return;

      const champion = championSnap.data();
      const assignedFgds = (champion.assigned_fgds || []).map((entry) =>
        entry.fgd_id === fgdId ? { ...entry, ...scheduleFields } : entry
      );

      await updateDoc(championRef, {
        assigned_fgds: assignedFgds,
        updated_at: serverTimestamp(),
      });
    })
  );
};

// Once an FGD is closed out, anyone still marked Pending never actually
// showed up (there's no session left for them to attend) — flip them to
// Absent so the roster doesn't sit with a stale "awaiting attendance" state
// forever. Chunked at 400 per batch to stay under Firestore's 500-write cap.
const markPendingParticipantsAbsent = async (fgdId) => {
  const snapshot = await getDocs(participantsByFGDQuery(fgdId));
  const pendingDocs = snapshot.docs.filter(
    (item) =>
      (item.data().fgd_attendance_status || FGD_ATTENDANCE_STATUS.PENDING) ===
      FGD_ATTENDANCE_STATUS.PENDING
  );

  if (pendingDocs.length === 0) return;

  for (let i = 0; i < pendingDocs.length; i += 400) {
    const batch = writeBatch(db);

    pendingDocs.slice(i, i + 400).forEach((item) => {
      batch.update(item.ref, {
        fgd_attendance_status: FGD_ATTENDANCE_STATUS.ABSENT,
        updated_at: serverTimestamp(),
      });
    });

    await batch.commit();
  }
};

export const updateFGDStatus = async (fgdId, status) => {
  await updateDoc(doc(db, COLLECTIONS.FGDS, fgdId), {
    status,
    updated_at: serverTimestamp(),
  });

  if (status === FGD_STATUS.COMPLETED) {
    await markPendingParticipantsAbsent(fgdId);
  }
};

// Grace period after the scheduled end time before an FGD is considered
// over — a discussion that was supposed to end at 7:30pm might genuinely
// still be running a few minutes late, so auto-completing right at 7:30pm
// sharp would be premature.
const FGD_END_BUFFER_MINUTES = 30;

// session_date/session_start_time/session_end_time come from plain
// <input type="date"> / <input type="time"> fields, so they're always
// "YYYY-MM-DD" / "HH:MM" — safe to concatenate into an ISO-ish datetime
// string and compare against wall-clock time in the browser's own timezone.
export const hasFGDScheduleEnded = (fgd) => {
  if (!fgd?.session_date || !fgd?.session_end_time) return false;

  const end = new Date(`${fgd.session_date}T${fgd.session_end_time}`);
  if (Number.isNaN(end.getTime())) return false;

  const bufferedEnd = end.getTime() + FGD_END_BUFFER_MINUTES * 60 * 1000;
  return bufferedEnd < Date.now();
};

// No scheduled-job infrastructure exists to flip FGDs to Completed the
// moment their session ends, so this reconciles opportunistically instead —
// called whenever an FGD's live data is loaded in the admin UI. Once status
// is Completed the status transition itself is a no-op, so it can't loop or
// fight a manual edit back to Draft/Active before the schedule has passed.
//
// Also backfills Pending attendance on FGDs that were already Completed
// before markPendingParticipantsAbsent existed — those never got their
// stale Pending participants flipped to Absent, so every time one of those
// FGDs is viewed this catches it up (a no-op once it has been).
export const syncFGDStatusIfEnded = async (fgd) => {
  if (!fgd) return;

  if (fgd.status === FGD_STATUS.COMPLETED) {
    await markPendingParticipantsAbsent(fgd.id);
    return;
  }

  if (!hasFGDScheduleEnded(fgd)) return;

  await updateFGDStatus(fgd.id, FGD_STATUS.COMPLETED);
};

// Distributes participants being manually reassigned across a chosen set of
// destination FGDs in a balanced way — distinct from
// distributeParticipantsIntoFGDGroups above, which assumes empty groups of a
// fixed target size. Here the destination FGDs already have different
// current sizes (and possibly different participant_limit values), so this
// greedily sends each next participant to whichever selected FGD currently
// has the fewest — preferring one still under its participant_limit, but
// falling back to the overall-lowest once every selected FGD is full so a
// bulk reassignment never gets stuck without a placement.
export const distributeAcrossFGDs = (participants, destinationFgds) => {
  const runningCounts = new Map(
    destinationFgds.map((fgd) => [fgd.id, Number(fgd.total_participants) || 0])
  );

  const pickDestination = () => {
    const underCapacity = destinationFgds.filter((fgd) => {
      const limit = Number(fgd.participant_limit) || Infinity;
      return runningCounts.get(fgd.id) < limit;
    });

    const pool = underCapacity.length > 0 ? underCapacity : destinationFgds;

    return pool.reduce(
      (lowest, fgd) =>
        runningCounts.get(fgd.id) < runningCounts.get(lowest.id) ? fgd : lowest,
      pool[0]
    );
  };

  return participants.map((participant) => {
    const destinationFgd = pickDestination();
    runningCounts.set(destinationFgd.id, runningCounts.get(destinationFgd.id) + 1);
    return { participant, destinationFgd };
  });
};

// Moves one or many participants into a (possibly different, per-participant)
// destination FGD — the actual write behind Reassign Participants. Mirrors
// what fresh FGD generation sets on a participant (fgdService.js above) since
// conceptually this is "re-generate this one person into a new group", and
// mirrors evaluationService.js's removeEvaluation for clearing stale
// evaluations tied to the FGD they're leaving.
export const reassignParticipants = async (pairs) => {
  if (!pairs || pairs.length === 0) return { movedCount: 0 };

  const CHUNK_SIZE = 200;
  const participantIds = pairs.map((p) => p.participantId);

  const participantSnaps = await Promise.all(
    participantIds.map((id) => getDoc(doc(db, COLLECTIONS.PARTICIPANTS, id)))
  );
  const participantsById = new Map(
    participantSnaps
      .filter((snap) => snap.exists())
      .map((snap) => [snap.id, { ...snap.data(), id: snap.id }])
  );

  const destinationFgdIds = [...new Set(pairs.map((p) => p.destinationFgdId))];
  const sourceFgdIds = [...participantsById.values()]
    .map((p) => p.fgd_id)
    .filter(Boolean);
  const allFgdIds = [...new Set([...destinationFgdIds, ...sourceFgdIds])];

  const fgdSnaps = await Promise.all(
    allFgdIds.map((id) => getDoc(doc(db, COLLECTIONS.FGDS, id)))
  );
  const fgdsById = new Map(
    fgdSnaps
      .filter((snap) => snap.exists())
      .map((snap) => [snap.id, { ...snap.data(), id: snap.id }])
  );

  const evaluationIdLists = await Promise.all(
    participantIds.map(async (participantId) => {
      const snap = await getDocs(
        query(
          collection(db, COLLECTIONS.PARTICIPANT_EVALUATIONS),
          where("participant_id", "==", participantId)
        )
      );
      return snap.docs.map((item) => item.id);
    })
  );
  const evaluationIds = evaluationIdLists.flat();

  const destinationDeltas = new Map();
  const sourceDeltas = new Map();
  const selectedCohortIds = new Set();

  const validPairs = pairs.filter(
    ({ participantId, destinationFgdId }) =>
      participantsById.has(participantId) && fgdsById.has(destinationFgdId)
  );

  for (let i = 0; i < validPairs.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);

    validPairs.slice(i, i + CHUNK_SIZE).forEach(({ participantId, destinationFgdId }) => {
      const participant = participantsById.get(participantId);
      const destinationFgd = fgdsById.get(destinationFgdId);

      batch.update(doc(db, COLLECTIONS.PARTICIPANTS, participantId), {
        fgd_id: destinationFgdId,
        fgd_code: destinationFgd.fgd_code,
        fgd_name: destinationFgd.fgd_name,
        fgd_attendance_status: FGD_ATTENDANCE_STATUS.PENDING,
        fgd_feedback: "",
        fgd_score: "",
        selection_committee_feedback: "",
        evaluation_count: 0,
        average_evaluation_score: null,
        selection_status: SELECTION_STATUS.PENDING,
        updated_at: serverTimestamp(),
      });

      destinationDeltas.set(
        destinationFgdId,
        (destinationDeltas.get(destinationFgdId) || 0) + 1
      );

      if (participant.fgd_id && participant.fgd_id !== destinationFgdId) {
        sourceDeltas.set(
          participant.fgd_id,
          (sourceDeltas.get(participant.fgd_id) || 0) + 1
        );
      }

      if (
        participant.selection_status === SELECTION_STATUS.SELECTED &&
        participant.cohort_id
      ) {
        selectedCohortIds.add(participant.cohort_id);
      }
    });

    await batch.commit();
  }

  for (let i = 0; i < evaluationIds.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    evaluationIds
      .slice(i, i + CHUNK_SIZE)
      .forEach((evaluationId) =>
        batch.delete(doc(db, COLLECTIONS.PARTICIPANT_EVALUATIONS, evaluationId))
      );
    await batch.commit();
  }

  // Distinct-FGD counter updates are naturally few (bounded by how many
  // source/destination FGDs were actually touched, not by participant
  // count) — one small batch covers both directions.
  const counterBatch = writeBatch(db);

  destinationDeltas.forEach((delta, fgdId) => {
    const fgd = fgdsById.get(fgdId);
    counterBatch.update(doc(db, COLLECTIONS.FGDS, fgdId), {
      total_participants: (Number(fgd.total_participants) || 0) + delta,
      updated_at: serverTimestamp(),
    });
  });

  sourceDeltas.forEach((delta, fgdId) => {
    const fgd = fgdsById.get(fgdId);
    counterBatch.update(doc(db, COLLECTIONS.FGDS, fgdId), {
      total_participants: Math.max(0, (Number(fgd.total_participants) || 0) - delta),
      updated_at: serverTimestamp(),
    });
  });

  if (destinationDeltas.size > 0 || sourceDeltas.size > 0) {
    await counterBatch.commit();
  }

  // total_selected has no trigger keeping it in sync — recomputed per
  // affected cohort, mirroring updateFGDParticipant/removeEvaluation.
  await Promise.all(
    [...selectedCohortIds].map(async (cohortId) => {
      const selectedSnap = await getDocs(
        query(
          collection(db, COLLECTIONS.PARTICIPANTS),
          where("cohort_id", "==", cohortId),
          where("selection_status", "==", SELECTION_STATUS.SELECTED)
        )
      );

      await updateDoc(doc(db, COLLECTIONS.COHORTS, cohortId), {
        total_selected: selectedSnap.size,
        updated_at: serverTimestamp(),
      });
    })
  );

  return { movedCount: validPairs.length };
};