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
import { REGISTRATION_STATUS, SELECTION_STATUS } from "../constants/status";
import { FGD_ATTENDANCE_STATUS, FGD_STATUS } from "../constants/fgd";
import { createFGD } from "../entities";

// An FGD group smaller than this isn't worth running on its own — if the
// leftover after filling full-size groups is below this, those leftover
// participants get spread one-by-one across the existing groups instead of
// forming an undersized final group.
const MIN_PARTICIPANTS_PER_FGD = 10;

export const distributeParticipantsIntoFGDGroups = (participants, limit) => {
  const total = participants.length;

  if (total <= limit) {
    return [participants];
  }

  const baseGroupCount = Math.floor(total / limit);
  const remainder = total % limit;

  const groups = [];

  for (let index = 0; index < baseGroupCount; index += 1) {
    groups.push(participants.slice(index * limit, (index + 1) * limit));
  }

  if (remainder === 0) {
    return groups;
  }

  const leftover = participants.slice(baseGroupCount * limit);

  if (remainder < MIN_PARTICIPANTS_PER_FGD) {
    // Top-to-bottom: give group 1 an extra participant, then group 2, etc.
    leftover.forEach((participant, index) => {
      groups[index % groups.length].push(participant);
    });
  } else {
    groups.push(leftover);
  }

  return groups;
};

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

export const generateFGDsForCohort = async ({
  cohort,
  participantLimit,
  createdByEmail = "",
  createdByName = "",
}) => {
  if (!cohort?.id) {
    throw new Error("Cohort is required.");
  }

  const limit = Number(participantLimit);

  if (!limit || limit <= 0) {
    throw new Error("Participant limit must be greater than 0.");
  }

  // Sorting is done client-side rather than via Firestore's orderBy("name"):
  // combining orderBy(field) with where() filters makes Firestore silently
  // drop any document missing that field entirely, which would exclude
  // otherwise-eligible participants (e.g. bulk-imported records with a
  // blank name) from FGD generation with no error.
  const participantsQuery = query(
    collection(db, COLLECTIONS.PARTICIPANTS),
    where("cohort_id", "==", cohort.id),
    where("registration_status", "==", REGISTRATION_STATUS.REGISTERED),
    where("selection_status", "==", SELECTION_STATUS.PENDING)
  );

  const participantSnap = await getDocs(participantsQuery);

  const participants = participantSnap.docs
    .map((item) => ({
      ...item.data(),
      id: item.id,
    }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  if (participants.length === 0) {
    throw new Error("No eligible registered participants found.");
  }

  const existingFgdSnap = await getDocs(
    query(collection(db, COLLECTIONS.FGDS), where("cohort_id", "==", cohort.id))
  );

  if (!existingFgdSnap.empty) {
    throw new Error("FGDs have already been generated for this cohort.");
  }

  const batch = writeBatch(db);
  const groups = distributeParticipantsIntoFGDGroups(participants, limit);
  const totalFGDs = groups.length;

  groups.forEach((groupParticipants, index) => {
    const sequenceNo = index + 1;

    const fgdRef = doc(collection(db, COLLECTIONS.FGDS));

    const fgdCode = `${cohort.cohort_code}-FGD-${String(sequenceNo).padStart(
      3,
      "0"
    )}`;

    const fgdName = `FGD ${String(sequenceNo).padStart(2, "0")}`;

    const fgd = createFGD({
      id: fgdRef.id,

      cohort_id: cohort.id,
      cohort_name: cohort.cohort_name,
      cohort_code: cohort.cohort_code,

      sequence_no: sequenceNo,
      fgd_code: fgdCode,
      fgd_name: fgdName,

      participant_limit: limit,
      total_participants: groupParticipants.length,
      total_pending_feedback: groupParticipants.length,

      status: FGD_STATUS.DRAFT,

      created_at: serverTimestamp(),
      created_by_email: createdByEmail,
      created_by_name: createdByName,

      updated_at: serverTimestamp(),
      updated_by_email: createdByEmail,
      updated_by_name: createdByName,
    });

    batch.set(fgdRef, fgd);

    groupParticipants.forEach((participant) => {
      const participantRef = doc(db, COLLECTIONS.PARTICIPANTS, participant.id);

      batch.update(participantRef, {
        fgd_id: fgdRef.id,
        fgd_code: fgdCode,
        fgd_name: fgdName,
        fgd_attendance_status: FGD_ATTENDANCE_STATUS.PENDING,
        fgd_feedback: "",
        fgd_score: "",
        selection_committee_feedback: "",
        updated_at: serverTimestamp(),
      });
    });
  });

  const cohortRef = doc(db, COLLECTIONS.COHORTS, cohort.id);

  batch.update(cohortRef, {
    total_fgds: totalFGDs,
    updated_at: serverTimestamp(),
    updated_by_email: createdByEmail,
    updated_by_name: createdByName,
  });

  await batch.commit();

  return {
    totalFGDs,
    totalParticipants: participants.length,
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

export const regenerateFGDsForCohort = async ({
  cohort,
  participantLimit,
  updatedByEmail = "",
  updatedByName = "",
}) => {
  await deleteFGDsForCohort({
    cohortId: cohort.id,
    updatedByEmail,
    updatedByName,
  });

  return generateFGDsForCohort({
    cohort,
    participantLimit,
    createdByEmail: updatedByEmail,
    createdByName: updatedByName,
  });
};

// No orderBy here — combining orderBy(field) with where() filters makes
// Firestore silently drop any document missing that field entirely. Sorted
// client-side instead (see generateFGDsForCohort for the same reasoning).
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

export const updateFGDStatus = async (fgdId, status) => {
  await updateDoc(doc(db, COLLECTIONS.FGDS, fgdId), {
    status,
    updated_at: serverTimestamp(),
  });
};

// session_date/session_start_time/session_end_time come from plain
// <input type="date"> / <input type="time"> fields, so they're always
// "YYYY-MM-DD" / "HH:MM" — safe to concatenate into an ISO-ish datetime
// string and compare against wall-clock time in the browser's own timezone.
export const hasFGDScheduleEnded = (fgd) => {
  if (!fgd?.session_date || !fgd?.session_end_time) return false;

  const end = new Date(`${fgd.session_date}T${fgd.session_end_time}`);
  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now();
};

// No scheduled-job infrastructure exists to flip FGDs to Completed the
// moment their session ends, so this reconciles opportunistically instead —
// called whenever an FGD's live data is loaded in the admin UI. Once status
// is Completed this is a no-op, so it can't loop or fight a manual edit
// back to Draft/Active before the schedule has passed.
export const syncFGDStatusIfEnded = async (fgd) => {
  if (!fgd || fgd.status === FGD_STATUS.COMPLETED) return;
  if (!hasFGDScheduleEnded(fgd)) return;

  await updateFGDStatus(fgd.id, FGD_STATUS.COMPLETED);
};