import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";
import { SELECTION_STATUS } from "../constants/status";
import { apiClient } from "./apiClient";

const DELETE_CHUNK_SIZE = 450; // stay under Firestore's 500-operation batch cap
const WHERE_IN_CHUNK_SIZE = 30; // Firestore "in" query limit

const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const getEvaluationIdsForParticipants = async (participantIds) => {
  const ids = [];

  for (const group of chunk(participantIds, WHERE_IN_CHUNK_SIZE)) {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.PARTICIPANT_EVALUATIONS),
        where("participant_id", "in", group)
      )
    );
    snapshot.docs.forEach((item) => ids.push(item.id));
  }

  return ids;
};

const batchDelete = async (collectionName, ids) => {
  for (const group of chunk(ids, DELETE_CHUNK_SIZE)) {
    const batch = writeBatch(db);
    group.forEach((id) => batch.delete(doc(db, collectionName, id)));
    await batch.commit();
  }
};

const fetchParticipants = async (participantIds) => {
  const snapshots = await Promise.all(
    participantIds.map((id) => getDoc(doc(db, COLLECTIONS.PARTICIPANTS, id)))
  );

  return snapshots
    .filter((snap) => snap.exists())
    .map((snap) => ({ ...snap.data(), id: snap.id }));
};

// Read-only — lets the UI show exact counts before the admin confirms.
export const previewParticipantDelete = async (participantIds) => {
  const participants = await fetchParticipants(participantIds);
  const responseCount = participants.filter((p) => p.response_id).length;
  const evaluationIds = await getEvaluationIdsForParticipants(participantIds);
  const affectedFgdIds = [
    ...new Set(participants.map((p) => p.fgd_id).filter(Boolean)),
  ];

  return {
    participantCount: participants.length,
    responseCount,
    evaluationCount: evaluationIds.length,
    affectedFgdIds,
  };
};

// Permanently deletes the given participants and everything tied to them —
// this is a super-admin-only action (see firestore.rules: `participants`
// delete is isSuperAdmin() only), used both for reviewed duplicate cleanup
// and for ad-hoc single/bulk removal, unlike deduplicateCohortParticipants
// (participantService.js) which only ever auto-removes a duplicate still at
// plain Pending registration.
export const hardDeleteParticipants = async (participantIds) => {
  if (participantIds.length === 0) {
    return { deletedCount: 0, deletedResponses: 0, deletedEvaluations: 0 };
  }

  const participants = await fetchParticipants(participantIds);
  const responseIds = participants.map((p) => p.response_id).filter(Boolean);
  const evaluationIds = await getEvaluationIdsForParticipants(participantIds);

  await Promise.all([
    batchDelete(COLLECTIONS.PARTICIPANTS, participantIds),
    batchDelete(COLLECTIONS.FORM_RESPONSES, responseIds),
    batchDelete(COLLECTIONS.PARTICIPANT_EVALUATIONS, evaluationIds),
  ]);

  // cohort.total_registrations is a live, actively-incremented counter —
  // decrement per affected cohort. total_selected has no trigger keeping it
  // in sync, so it's recomputed via a fresh count query for any cohort that
  // lost a Selected participant, mirroring fgdService.js's
  // reassignParticipants (the same pattern used there).
  const registrationDeltaByCohort = new Map();
  const selectedCohortIds = new Set();
  const fgdDeltas = new Map();

  participants.forEach((participant) => {
    if (participant.cohort_id) {
      registrationDeltaByCohort.set(
        participant.cohort_id,
        (registrationDeltaByCohort.get(participant.cohort_id) || 0) + 1
      );

      if (participant.selection_status === SELECTION_STATUS.SELECTED) {
        selectedCohortIds.add(participant.cohort_id);
      }
    }

    if (participant.fgd_id) {
      fgdDeltas.set(participant.fgd_id, (fgdDeltas.get(participant.fgd_id) || 0) + 1);
    }
  });

  await Promise.all(
    [...registrationDeltaByCohort.entries()].map(async ([cohortId, delta]) => {
      const cohortRef = doc(db, COLLECTIONS.COHORTS, cohortId);
      const cohortSnap = await getDoc(cohortRef);

      if (!cohortSnap.exists()) return;

      const currentTotal = Number(cohortSnap.data().total_registrations) || 0;

      await updateDoc(cohortRef, {
        total_registrations: Math.max(0, currentTotal - delta),
        updated_at: serverTimestamp(),
      });
    })
  );

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

  await Promise.all(
    [...fgdDeltas.entries()].map(async ([fgdId, delta]) => {
      const fgdRef = doc(db, COLLECTIONS.FGDS, fgdId);
      const fgdSnap = await getDoc(fgdRef);

      if (!fgdSnap.exists()) return;

      const currentTotal = Number(fgdSnap.data().total_participants) || 0;

      await updateDoc(fgdRef, {
        total_participants: Math.max(0, currentTotal - delta),
        updated_at: serverTimestamp(),
      });
    })
  );

  // Best-effort — Firestore is already the source of truth and stands
  // regardless of this call's outcome, since a never-impersonated
  // participant has no Auth account to clean up in the first place.
  try {
    await apiClient.post(
      "/api/participants/bulk-delete-auth",
      { participantIds },
      { authenticated: true }
    );
  } catch (err) {
    console.error("Failed to clean up participant auth accounts:", err);
  }

  return {
    deletedCount: participants.length,
    deletedResponses: responseIds.length,
    deletedEvaluations: evaluationIds.length,
  };
};
