import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

const CHUNK_SIZE = 450; // stay under Firestore's 500-operation batch cap

export const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Batch-applies `updates` to every document in `collectionName` where
// `field == value`. Used to keep denormalized copies (e.g. a cohort's
// name/code duplicated onto its participants/forms/fgds) in sync when the
// source document is edited — Firestore has no server-side triggers here,
// so this fan-out has to happen explicitly in the write path that changes
// the source of truth.
export const batchUpdateWhere = async (collectionName, field, value, updates) => {
  const snapshot = await getDocs(
    query(collection(db, collectionName), where(field, "==", value))
  );
  const ids = snapshot.docs.map((item) => item.id);

  for (const group of chunkArray(ids, CHUNK_SIZE)) {
    const batch = writeBatch(db);
    group.forEach((id) => batch.update(doc(db, collectionName, id), updates));
    await batch.commit();
  }

  return ids.length;
};
