import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

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