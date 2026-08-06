import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";

const DELETE_CHUNK_SIZE = 450; // stay under Firestore's 500-operation batch cap
const WHERE_IN_CHUNK_SIZE = 30; // Firestore "in" query limit

const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const getIdsWhere = async (collectionName, field, value) => {
  const snapshot = await getDocs(
    query(collection(db, collectionName), where(field, "==", value))
  );
  return snapshot.docs.map((item) => item.id);
};

const getIdsWhereIn = async (collectionName, field, values) => {
  if (values.length === 0) return [];

  const ids = [];

  for (const group of chunk(values, WHERE_IN_CHUNK_SIZE)) {
    const snapshot = await getDocs(
      query(collection(db, collectionName), where(field, "in", group))
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

// Deleting an FGD leaves a stale reference on any champion still assigned
// to it (assigned_fgd_ids / assigned_fgds / assigned_fgd_count) — this
// mirrors the same filter logic ann-mis-server's POST /champions/:id/
// unassign-fgd uses for a single champion/FGD, just fanned out across
// every champion touched by this cohort wipe.
const cleanupChampionFgdAssignments = async (fgdIds) => {
  if (fgdIds.length === 0) return 0;

  const fgdIdSet = new Set(fgdIds);
  const affectedChampions = new Map();

  for (const group of chunk(fgdIds, WHERE_IN_CHUNK_SIZE)) {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.CHAMPIONS_POOL),
        where("assigned_fgd_ids", "array-contains-any", group)
      )
    );
    snapshot.docs.forEach((item) => affectedChampions.set(item.id, item.data()));
  }

  const championIds = [...affectedChampions.keys()];

  for (const group of chunk(championIds, DELETE_CHUNK_SIZE)) {
    const batch = writeBatch(db);
    group.forEach((championId) => {
      const champion = affectedChampions.get(championId);
      const remainingFgds = (champion.assigned_fgds || []).filter(
        (item) => !fgdIdSet.has(item.fgd_id)
      );

      batch.update(doc(db, COLLECTIONS.CHAMPIONS_POOL, championId), {
        assigned_fgds: remainingFgds,
        assigned_fgd_ids: remainingFgds.map((item) => item.fgd_id),
        assigned_fgd_count: remainingFgds.length,
        updated_at: serverTimestamp(),
      });
    });
    await batch.commit();
  }

  return championIds.length;
};

const gatherDirectCohortIds = async (cohortId) => {
  const [participantIds, responseIds, fgdIds, formIds] = await Promise.all([
    getIdsWhere(COLLECTIONS.PARTICIPANTS, "cohort_id", cohortId),
    getIdsWhere(COLLECTIONS.FORM_RESPONSES, "cohort_id", cohortId),
    getIdsWhere(COLLECTIONS.FGDS, "cohort_id", cohortId),
    getIdsWhere(COLLECTIONS.FORMS, "cohort_id", cohortId),
  ]);

  return { participantIds, responseIds, fgdIds, formIds };
};

// Read-only — lets the UI show exact counts before the admin confirms.
export const previewCohortDataDeletion = async (cohortId) => {
  const { participantIds, responseIds, fgdIds, formIds } =
    await gatherDirectCohortIds(cohortId);

  return {
    participantCount: participantIds.length,
    responseCount: responseIds.length,
    fgdCount: fgdIds.length,
    formCount: formIds.length,
  };
};

// Shared by deleteAllCohortData and deleteCohortCompletely below — wipes
// every participant, form response, FGD, and form tied to this cohort
// (plus their form_fields and participant_evaluations, which would
// otherwise be orphaned once their parent form/FGD is gone). Does not
// touch the cohort document itself.
const wipeAllCohortData = async (cohortId) => {
  const { participantIds, responseIds, fgdIds, formIds } =
    await gatherDirectCohortIds(cohortId);

  const [formFieldIds, evaluationIds] = await Promise.all([
    getIdsWhereIn(COLLECTIONS.FORM_FIELDS, "form_id", formIds),
    getIdsWhereIn(COLLECTIONS.PARTICIPANT_EVALUATIONS, "fgd_id", fgdIds),
  ]);

  await Promise.all([
    batchDelete(COLLECTIONS.PARTICIPANTS, participantIds),
    batchDelete(COLLECTIONS.FORM_RESPONSES, responseIds),
    batchDelete(COLLECTIONS.FGDS, fgdIds),
    batchDelete(COLLECTIONS.FORMS, formIds),
    batchDelete(COLLECTIONS.FORM_FIELDS, formFieldIds),
    batchDelete(COLLECTIONS.PARTICIPANT_EVALUATIONS, evaluationIds),
  ]);

  // Runs after the FGDs are gone, not in parallel with them — it queries
  // champions by assigned_fgd_ids, and racing that query against the FGD
  // deletes above wouldn't change which champions match anyway, but doing
  // it after keeps the intent obvious: this is cleanup of what deleting
  // those FGDs left behind.
  const updatedChampions = await cleanupChampionFgdAssignments(fgdIds);

  return {
    deletedParticipants: participantIds.length,
    updatedChampions,
    deletedResponses: responseIds.length,
    deletedFgds: fgdIds.length,
    deletedForms: formIds.length,
    deletedFormFields: formFieldIds.length,
    deletedEvaluations: evaluationIds.length,
  };
};

// Deletes every participant, form response, FGD, and form tied to this
// cohort, then resets the cohort's own aggregate stats back to a clean
// slate. The cohort document itself is NOT deleted — this is the
// "wipe and start over" action, available to any admin.
export const deleteAllCohortData = async (cohortId) => {
  const counts = await wipeAllCohortData(cohortId);

  await updateDoc(doc(db, COLLECTIONS.COHORTS, cohortId), {
    total_registrations: 0,
    total_selected: 0,
    total_enrolled: 0,
    total_graduated: 0,
    total_dropouts: 0,
    total_fgds: 0,
    current_participant_sequence: 0,
    updated_at: serverTimestamp(),
  });

  return counts;
};

// Deletes every participant, form response, FGD, and form tied to this
// cohort, AND the cohort document itself — a genuinely irreversible,
// super-admin-only action (see firestore.rules: cohorts delete is
// isSuperAdmin() only, unlike the isAdmin()-level archive/update).
export const deleteCohortCompletely = async (cohortId) => {
  const counts = await wipeAllCohortData(cohortId);

  await deleteDoc(doc(db, COLLECTIONS.COHORTS, cohortId));

  return counts;
};
