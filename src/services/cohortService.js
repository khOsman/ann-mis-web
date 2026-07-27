import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";
import { COHORT_STATUS } from "../constants/status";
import { createCohort } from "../entities";
import { batchUpdateWhere } from "../utils/firestoreBatch";

export const createCohortRecord = async (payload) => {
  const cohortData = createCohort({
    ...payload,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  const ref = await addDoc(collection(db, COLLECTIONS.COHORTS), cohortData);

  return ref.id;
};

// Query-builder — the query shape lives here once, shared by the one-time
// getter below and the live-updating useCohorts() hook.
export const cohortsQuery = () =>
  query(collection(db, COLLECTIONS.COHORTS), orderBy("created_at", "desc"));

export const cohortDocRef = (cohortId) => doc(db, COLLECTIONS.COHORTS, cohortId);

export const getCohorts = async () => {
  const snapshot = await getDocs(cohortsQuery());

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const getActiveCohorts = async () => {
  const cohorts = await getCohorts();

  return cohorts.filter((item) => item.is_deleted !== true);
};

export const getCohortById = async (cohortId) => {
  const snapshot = await getDoc(doc(db, COLLECTIONS.COHORTS, cohortId));

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

// cohort_name/cohort_code are denormalized onto participants, form_responses,
// forms, and fgds at creation time (no Firestore triggers exist here to keep
// those in sync automatically) — so an edit that actually changes either
// field fans out to every document that copied it, scoped to this cohort.
export const updateCohortRecord = async (cohortId, updates) => {
  const cohortRef = doc(db, COLLECTIONS.COHORTS, cohortId);

  let changedDenormalizedFields = null;

  if (updates.cohort_name !== undefined || updates.cohort_code !== undefined) {
    const currentSnap = await getDoc(cohortRef);
    const current = currentSnap.data() || {};
    const changed = {};

    if (updates.cohort_name !== undefined && updates.cohort_name !== current.cohort_name) {
      changed.cohort_name = updates.cohort_name;
    }

    if (updates.cohort_code !== undefined && updates.cohort_code !== current.cohort_code) {
      changed.cohort_code = updates.cohort_code;
    }

    if (Object.keys(changed).length > 0) changedDenormalizedFields = changed;
  }

  await updateDoc(cohortRef, {
    ...updates,
    updated_at: serverTimestamp(),
  });

  if (changedDenormalizedFields) {
    await Promise.all([
      batchUpdateWhere(COLLECTIONS.PARTICIPANTS, "cohort_id", cohortId, changedDenormalizedFields),
      batchUpdateWhere(COLLECTIONS.FORM_RESPONSES, "cohort_id", cohortId, changedDenormalizedFields),
      batchUpdateWhere(COLLECTIONS.FORMS, "cohort_id", cohortId, changedDenormalizedFields),
      batchUpdateWhere(COLLECTIONS.FGDS, "cohort_id", cohortId, changedDenormalizedFields),
    ]);
  }
};

export const archiveCohort = async ({
  cohortId,
  updatedByEmail = "",
  updatedByName = "",
}) => {
  await updateDoc(doc(db, COLLECTIONS.COHORTS, cohortId), {
    is_deleted: true,
    status: COHORT_STATUS.ARCHIVED,

    deleted_at: serverTimestamp(),
    deleted_by_email: updatedByEmail,
    deleted_by_name: updatedByName,

    updated_at: serverTimestamp(),
    updated_by_email: updatedByEmail,
    updated_by_name: updatedByName,
  });
};