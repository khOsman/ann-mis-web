import {
  addDoc,
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const normalizeLabel = (answer) => {
  return `${answer.field_label_en || ""} ${
    answer.field_label_bn || ""
  }`.toLowerCase();
};

const getAnswerValueByKeywords = (responseAnswers, keywords) => {
  const matchedAnswer = responseAnswers.find((answer) => {
    const label = normalizeLabel(answer);

    return keywords.some((keyword) => label.includes(keyword.toLowerCase()));
  });

  return matchedAnswer?.value || "";
};

const calculateAge = (dateString) => {
  if (!dateString) return "";

  const birthDate = new Date(dateString);

  if (Number.isNaN(birthDate.getTime())) return "";

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

const normalizeGender = (value) => {
  if (!value) return "";

  const text = String(value).trim().toLowerCase();

  if (text.includes("female") || text.includes("নারী")) {
    return "Female";
  }

  if (text.includes("male") || text.includes("পুরুষ")) {
    return "Male";
  }

  if (text.includes("other") || text.includes("অন্যান্য")) {
    return "Other";
  }

  return value;
};

export const submitPublicRegistration = async ({
  formMeta,
  fields,
  answers,
}) => {
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
    "participant name",
    "applicant name",
    "নাম",
  ]);

  const email = getAnswerValueByKeywords(responseAnswers, [
    "email",
    "e-mail",
    "ইমেইল",
  ]);

  const phone = getAnswerValueByKeywords(responseAnswers, [
    "phone",
    "mobile",
    "contact",
    "contact number",
    "mobile number",
    "মোবাইল",
    "ফোন",
  ]);

  const gender = normalizeGender(
    getAnswerValueByKeywords(responseAnswers, [
      "gender",
      "sex",
      "লিঙ্গ",
    ])
  );

  const dateOfBirth = responseAnswers.find((answer) => answer.field_type === "date")?.value || "";

  const age = calculateAge(dateOfBirth);

  const formRef = doc(db, "forms", formMeta.id);
  const cohortRef = doc(db, "cohorts", formMeta.cohort_id);
  const responseRef = doc(collection(db, "form_responses"));
  const participantRef = doc(collection(db, "participants"));

  const unixTime = Math.floor(Date.now() / 1000);

  await runTransaction(db, async (transaction) => {
    const cohortSnap = await transaction.get(cohortRef);

    if (!cohortSnap.exists()) {
      throw new Error("Cohort not found.");
    }

    const cohortData = cohortSnap.data();
    const currentSequence = Number(
      cohortData.current_participant_sequence || 0
    );

    const nextSequence = currentSequence + 1;

    const participantCode = `ANN-${formMeta.cohort_code}-${String(
      nextSequence
    ).padStart(4, "0")}-${unixTime}`;

    transaction.set(responseRef, {
      form_id: formMeta.id,
      form_title: formMeta.form_title,
      public_slug: formMeta.public_slug,

      cohort_id: formMeta.cohort_id,
      cohort_name: formMeta.cohort_name,
      cohort_code: formMeta.cohort_code,

      participant_id: participantRef.id,
      participant_code: participantCode,

      search_name: name,
      search_email: email,
      search_phone: phone,

      name,
      email,
      phone,
      gender,
      date_of_birth: dateOfBirth,
      age,

      answers: responseAnswers,

      submitted_at: serverTimestamp(),
    });

    transaction.set(participantRef, {
      participant_code: participantCode,

      cohort_id: formMeta.cohort_id,
      cohort_name: formMeta.cohort_name,
      cohort_code: formMeta.cohort_code,

      form_id: formMeta.id,
      form_title: formMeta.form_title,
      response_id: responseRef.id,

      name,
      email,
      phone,
      gender,
      date_of_birth: dateOfBirth,
      age,

      search_name: name,
      search_email: email,
      search_phone: phone,

      registration_status: "Registered",
      selection_status: "Pending",
      enrollment_status: "Pending",
      graduation_status: "Pending",
      project_status: "Pending",

      submitted_at: serverTimestamp(),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    transaction.update(formRef, {
      total_responses: increment(1),
      updated_at: serverTimestamp(),
    });

    transaction.update(cohortRef, {
      total_registrations: increment(1),
      current_participant_sequence: nextSequence,
      updated_at: serverTimestamp(),
    });
  });

  return responseRef.id;
};