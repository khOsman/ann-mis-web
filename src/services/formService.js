import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebase";
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

export const cloneForm = async (formId) => {
  const sourceRef = doc(db, COLLECTIONS.FORMS, formId);
  const sourceSnap = await getDoc(sourceRef);

  if (!sourceSnap.exists()) {
    throw new Error("Source form not found.");
  }

  const source = sourceSnap.data();
  const user = auth.currentUser;

  const baseSlug = normalizeSlug(
    `${source.public_slug || source.form_title || "form"}-copy`
  );

  let newSlug = baseSlug;
  let suffix = 2;

  while (!(await isSlugAvailable(newSlug))) {
    newSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const newFormRef = await addDoc(collection(db, COLLECTIONS.FORMS), {
    form_title: `${source.form_title || "Untitled Form"} (Copy)`,
    description_en: source.description_en || "",
    description_bn: source.description_bn || "",
    cohort_id: source.cohort_id || "",
    cohort_name: source.cohort_name || "",
    cohort_code: source.cohort_code || "",
    form_type: source.form_type || "registration",
    status: "Draft",
    public_slug: newSlug,
    banner_type: source.banner_type || "default",
    banner_url: source.banner_url || "/default-form-banner.png",
    banner_file_name: source.banner_file_name || "",

    total_responses: 0,
    is_deleted: false,

    created_at: serverTimestamp(),
    created_by_email: user?.email || "",
    created_by_name: user?.displayName || "",

    updated_at: serverTimestamp(),
    updated_by_email: user?.email || "",
    updated_by_name: user?.displayName || "",
  });

  const fieldsSnap = await getDocs(
    query(collection(db, COLLECTIONS.FORM_FIELDS), where("form_id", "==", formId))
  );

  if (!fieldsSnap.empty) {
    const batch = writeBatch(db);

    fieldsSnap.docs.forEach((fieldDoc) => {
      const newFieldRef = doc(collection(db, COLLECTIONS.FORM_FIELDS));

      batch.set(newFieldRef, {
        ...fieldDoc.data(),
        form_id: newFormRef.id,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  return newFormRef.id;
};

