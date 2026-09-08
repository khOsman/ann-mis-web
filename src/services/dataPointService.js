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

export const dataPointsQuery = () =>
  query(collection(db, COLLECTIONS.DATA_POINTS), orderBy("created_at", "desc"));

export const dataPointsByDatabaseQuery = (databaseId) =>
  query(
    collection(db, COLLECTIONS.DATA_POINTS),
    where("database_id", "==", databaseId),
    orderBy("created_at", "desc")
  );

export const getDataPoints = async () => {
  const snapshot = await getDocs(dataPointsQuery());
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

export const createDataPoint = async ({
  databaseId,
  key,
  label_en,
  label_bn = "",
  field_type,
  options = [],
}) => {
  const ref = await addDoc(collection(db, COLLECTIONS.DATA_POINTS), {
    database_id: databaseId,
    key,
    label_en,
    label_bn,
    field_type,
    options,
    system_field_key: null,
    is_system: false,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return ref.id;
};

export const updateDataPoint = async (dataPointId, updates) => {
  await updateDoc(doc(db, COLLECTIONS.DATA_POINTS, dataPointId), {
    ...updates,
    updated_at: serverTimestamp(),
  });
};

export const deleteDataPoint = async (dataPoint) => {
  if (dataPoint.is_system) {
    throw new Error("System data points can't be deleted.");
  }

  const usedByFieldsSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.FORM_FIELDS),
      where("data_point_id", "==", dataPoint.id)
    )
  );

  if (!usedByFieldsSnap.empty) {
    throw new Error(
      "This data point is mapped to a form field. Unmap it from the form first before deleting."
    );
  }

  await deleteDoc(doc(db, COLLECTIONS.DATA_POINTS, dataPoint.id));
};
