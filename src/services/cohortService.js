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

export const updateCohortRecord = async (cohortId, updates) => {
  await updateDoc(doc(db, COLLECTIONS.COHORTS, cohortId), {
    ...updates,
    updated_at: serverTimestamp(),
  });
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