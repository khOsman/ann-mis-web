import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";

// The six identity fields the rest of the app already has dedicated
// participant columns for — pre-seeded so an admin can immediately map a
// mis-worded question (e.g. "Select your current educational institution")
// without having to invent these from scratch.
export const SYSTEM_DATA_POINTS = [
  { key: "name", label_en: "Name", field_type: "text", system_field_key: "name" },
  { key: "email", label_en: "Email", field_type: "email", system_field_key: "email" },
  { key: "phone", label_en: "Phone", field_type: "phone", system_field_key: "phone" },
  { key: "gender", label_en: "Gender", field_type: "text", system_field_key: "gender" },
  {
    key: "date_of_birth",
    label_en: "Date of Birth",
    field_type: "date",
    system_field_key: "date_of_birth",
  },
  {
    key: "institution",
    label_en: "Institution",
    field_type: "text",
    system_field_key: "institution",
  },
];

const SYSTEM_DATABASE_NAME = "System Identity Fields";

export const databasesQuery = () =>
  query(collection(db, COLLECTIONS.DATABASES), orderBy("created_at", "desc"));

export const getDatabases = async () => {
  const snapshot = await getDocs(databasesQuery());
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

export const createDatabase = async ({ name, description = "" }) => {
  const ref = await addDoc(collection(db, COLLECTIONS.DATABASES), {
    name,
    description,
    is_system: false,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return ref.id;
};

export const updateDatabase = async (databaseId, updates) => {
  await updateDoc(doc(db, COLLECTIONS.DATABASES, databaseId), {
    ...updates,
    updated_at: serverTimestamp(),
  });
};

export const deleteDatabase = async (databaseId) => {
  const dataPointsSnap = await getDocs(
    query(collection(db, COLLECTIONS.DATA_POINTS), where("database_id", "==", databaseId))
  );

  if (!dataPointsSnap.empty) {
    throw new Error(
      "This database still has data points in it. Remove them first before deleting the database."
    );
  }

  await deleteDoc(doc(db, COLLECTIONS.DATABASES, databaseId));
};

// Idempotent — safe to call every time the Database page loads. Creates the
// built-in "System Identity Fields" database + its 6 data points only the
// first time, so every environment ends up with the same well-known
// mappings available without a manual setup step.
export const seedSystemDatabaseIfMissing = async () => {
  const existingSnap = await getDocs(
    query(collection(db, COLLECTIONS.DATABASES), where("is_system", "==", true))
  );

  if (!existingSnap.empty) return existingSnap.docs[0].id;

  const databaseRef = await addDoc(collection(db, COLLECTIONS.DATABASES), {
    name: SYSTEM_DATABASE_NAME,
    description: "Built-in identity fields already used throughout the MIS.",
    is_system: true,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await Promise.all(
    SYSTEM_DATA_POINTS.map((dataPoint) =>
      addDoc(collection(db, COLLECTIONS.DATA_POINTS), {
        database_id: databaseRef.id,
        key: dataPoint.key,
        label_en: dataPoint.label_en,
        label_bn: "",
        field_type: dataPoint.field_type,
        options: [],
        system_field_key: dataPoint.system_field_key,
        is_system: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
    )
  );

  return databaseRef.id;
};
