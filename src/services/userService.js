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

export const usersQuery = () =>
  query(collection(db, COLLECTIONS.USERS), orderBy("created_at", "desc"));

export const userDocRef = (userId) => doc(db, COLLECTIONS.USERS, userId);

export const getUsers = async () => {
  const snapshot = await getDocs(usersQuery());

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