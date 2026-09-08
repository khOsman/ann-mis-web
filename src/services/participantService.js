import {
  collection,
  deleteDoc,
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

// Unscoped — reads the whole `participants` collection across all cohorts.
// Preserved as-is during the live-data migration (no admin capability
// removed); worth query-scoping by cohort_id first if Firestore read usage
// ever approaches the Spark plan's daily quota.
export const participantsQuery = () =>
  query(collection(db, "participants"), orderBy("submitted_at", "desc"));

export const participantDocRef = (participantId) => doc(db, "participants", participantId);

export const getParticipants = async () => {
  const snapshot = await getDocs(participantsQuery());

  return snapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
  }));
};

export const getParticipantById = async (participantId) => {
  const snapshot = await getDoc(participantDocRef(participantId));

  if (!snapshot.exists()) return null;

  return {
    ...snapshot.data(),
    id: snapshot.id,
  };
};

export const updateParticipant = async (participantId, updates) => {
  await updateDoc(doc(db, "participants", participantId), {
    ...updates,
    updated_at: serverTimestamp(),
  });
};

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizePhone = (value) => String(value || "").replace(/\D/g, "");

// A pending/never-set submitted_at sorts as the oldest possible — a doc with
// a real timestamp always wins a duplicate-group comparison over one without.
const submittedAtMillis = (participant) =>
  participant.submitted_at?.toMillis?.() ?? participant.submitted_at?.seconds * 1000 ?? 0;

// Anyone already pulled into an FGD or evaluated is no longer "just a
// registration" — auto-removing them would leave orphaned FGD rosters and
// evaluation records behind, so they're flagged for manual review instead
// of being deleted automatically.
const hasProgressedPastRegistration = (participant) =>
  Boolean(participant.fgd_id) ||
  Number(participant.evaluation_count) > 0 ||
  Boolean(participant.selection_status && participant.selection_status !== "Pending");

// Groups participants by a normalized identity field, keeping only groups
// with more than one member (i.e. actual duplicates).
const groupDuplicates = (participants, keyFn) => {
  const groups = new Map();

  participants.forEach((participant) => {
    const key = keyFn(participant);
    if (!key) return;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(participant);
  });

  return [...groups.values()].filter((group) => group.length > 1);
};

// Scans every participant in a cohort for duplicate email/phone, keeps the
// most recently submitted registration per duplicate group, and removes the
// rest (their participant + form_response docs) — used when registration
// closes for that cohort's form. Anyone already assigned to an FGD or
// evaluated is left alone and reported separately for manual review.
export const deduplicateCohortParticipants = async (cohortId) => {
  if (!cohortId) {
    return { removedCount: 0, removed: [], protectedDuplicates: [] };
  }

  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.PARTICIPANTS), where("cohort_id", "==", cohortId))
  );
  const participants = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));

  const duplicateGroups = [
    ...groupDuplicates(participants, (p) => normalizeEmail(p.email)),
    ...groupDuplicates(participants, (p) => normalizePhone(p.phone)),
  ];

  // A participant can show up in both the email-grouping and the
  // phone-grouping — collapse to one decision per participant id.
  const toRemoveById = new Map();

  duplicateGroups.forEach((group) => {
    const sorted = [...group].sort((a, b) => submittedAtMillis(b) - submittedAtMillis(a));
    const [, ...duplicates] = sorted; // keep the latest, mark the rest

    duplicates.forEach((participant) => {
      toRemoveById.set(participant.id, participant);
    });
  });

  const removed = [];
  const protectedDuplicates = [];

  toRemoveById.forEach((participant) => {
    if (hasProgressedPastRegistration(participant)) {
      protectedDuplicates.push(participant);
    } else {
      removed.push(participant);
    }
  });

  if (removed.length > 0) {
    for (let i = 0; i < removed.length; i += 200) {
      const batch = writeBatch(db);

      removed.slice(i, i + 200).forEach((participant) => {
        batch.delete(doc(db, COLLECTIONS.PARTICIPANTS, participant.id));

        if (participant.response_id) {
          batch.delete(doc(db, COLLECTIONS.FORM_RESPONSES, participant.response_id));
        }
      });

      await batch.commit();
    }

    const cohortRef = doc(db, COLLECTIONS.COHORTS, cohortId);
    const cohortSnap = await getDoc(cohortRef);

    if (cohortSnap.exists()) {
      const currentTotal = Number(cohortSnap.data().total_registrations) || 0;

      await updateDoc(cohortRef, {
        total_registrations: Math.max(0, currentTotal - removed.length),
        updated_at: serverTimestamp(),
      });
    }
  }

  return {
    removedCount: removed.length,
    removed: removed.map((p) => ({
      id: p.id,
      name: p.name,
      participant_code: p.participant_code,
      email: p.email,
      phone: p.phone,
    })),
    protectedDuplicates: protectedDuplicates.map((p) => ({
      id: p.id,
      name: p.name,
      participant_code: p.participant_code,
      email: p.email,
      phone: p.phone,
    })),
  };
};