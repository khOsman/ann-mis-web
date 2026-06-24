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

export const getParticipants = async () => {
  const q = query(
    collection(db, "participants"),
    orderBy("submitted_at", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const getParticipantById = async (participantId) => {
  const snapshot = await getDoc(doc(db, "participants", participantId));

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

export const updateParticipant = async (participantId, updates) => {
  await updateDoc(doc(db, "participants", participantId), {
    ...updates,
    updated_at: serverTimestamp(),
  });
};