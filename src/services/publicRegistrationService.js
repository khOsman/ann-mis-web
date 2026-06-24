import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const getAnswerValueByKeywords = (responseAnswers, keywords) => {
  const matchedAnswer = responseAnswers.find((answer) => {
    const label = `${answer.field_label_en || ""} ${answer.field_label_bn || ""}`.toLowerCase();

    return keywords.some((keyword) => label.includes(keyword.toLowerCase()));
  });

  return matchedAnswer?.value || "";
};

export const submitPublicRegistration = async ({ formMeta, fields, answers }) => {
  const responseAnswers = fields
    .filter((field) => field.field_type !== "section")
    .map((field) => ({
      field_id: field.id,
      field_label_en: field.label_en || field.label || "",
      field_label_bn: field.label_bn || "",
      field_type: field.field_type,
      value: answers[field.id] || "",
    }));

  const name = getAnswerValueByKeywords(responseAnswers, [
    "name",
    "full name",
    "নাম",
  ]);

  const email = getAnswerValueByKeywords(responseAnswers, [
    "email",
    "ইমেইল",
  ]);

  const phone = getAnswerValueByKeywords(responseAnswers, [
    "phone",
    "mobile",
    "contact",
    "মোবাইল",
    "ফোন",
  ]);

  const responseRef = await addDoc(collection(db, "form_responses"), {
    form_id: formMeta.id,
    form_title: formMeta.form_title,
    public_slug: formMeta.public_slug,

    cohort_id: formMeta.cohort_id,
    cohort_name: formMeta.cohort_name,
    cohort_code: formMeta.cohort_code,

    search_name: name,
    search_email: email,
    search_phone: phone,

    answers: responseAnswers,

    submitted_at: serverTimestamp(),
  });

  await addDoc(collection(db, "participants"), {
    cohort_id: formMeta.cohort_id,
    cohort_name: formMeta.cohort_name,
    cohort_code: formMeta.cohort_code,

    form_id: formMeta.id,
    form_title: formMeta.form_title,
    response_id: responseRef.id,

    name,
    email,
    phone,

    registration_status: "Registered",
    selection_status: "Pending",
    enrollment_status: "Pending",
    graduation_status: "Pending",
    project_status: "Pending",

    submitted_at: serverTimestamp(),
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await updateDoc(doc(db, "forms", formMeta.id), {
    total_responses: increment(1),
    updated_at: serverTimestamp(),
  });

  await updateDoc(doc(db, "cohorts", formMeta.cohort_id), {
    total_registrations: increment(1),
    updated_at: serverTimestamp(),
  });

  return responseRef.id;
};