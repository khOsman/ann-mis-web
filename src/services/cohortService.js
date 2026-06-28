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

export const getCohorts = async () => {
  const q = query(
    collection(db, COLLECTIONS.COHORTS),
    orderBy("created_at", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
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

export const archiveCohort = async (
  cohortId,
  updatedByEmail,
  updatedByName
) => {
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