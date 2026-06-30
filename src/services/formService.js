import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";

export const getFGDsByCohort = async (cohortId) => {
  const q = query(
    collection(db, COLLECTIONS.FGDS),
    where("cohort_id", "==", cohortId),
    orderBy("fgd_code", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const normalizeSlug = (slug) => {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
};

export const isSlugAvailable = async (slug, currentFormId = null) => {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) return false;

  const q = query(
    collection(db, "forms"),
    where("public_slug", "==", slug),
    where("is_deleted", "==", false)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return true;

  if (currentFormId) {
    return snapshot.docs.every((item) => item.id === currentFormId);
  }

  return false;
};

