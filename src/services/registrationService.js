import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export const getFormResponseById = async (responseId) => {
  const snapshot = await getDoc(doc(db, "form_responses", responseId));

  if (!snapshot.exists()) return null;

  return {
    ...snapshot.data(),
    id: snapshot.id,
  };
};