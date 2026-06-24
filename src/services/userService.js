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

export const getUsers = async () => {
  const q = query(collection(db, "users"), orderBy("created_at", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const getUserById = async (userId) => {
  const snapshot = await getDoc(doc(db, "users", userId));

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

export const updateUser = async (userId, updates) => {
  await updateDoc(doc(db, "users", userId), {
    ...updates,
    updated_at: serverTimestamp(),
  });
};