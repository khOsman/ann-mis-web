import {
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

export const getUsers = async () => {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    orderBy("created_at", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const getUserById = async (userId) => {
  const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, userId));

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

export const updateUser = async (userId, updates) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    ...updates,
    updated_at: serverTimestamp(),
  });
};