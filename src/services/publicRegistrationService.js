import {
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { createParticipant } from "../entities";
import { REGISTRATION_STATUS } from "../constants/status";
import { COLLECTIONS } from "../constants/collections";
import { GENDERS } from "../constants/genders";

const normalizeLabel = (answer) => {
  return `${answer.field_label_en || ""} ${
    answer.field_label_bn || ""
  }`.toLowerCase();
};

export const getAnswerValueByKeywords = (responseAnswers, keywords) => {
  const matchedAnswer = responseAnswers.find((answer) => {
    const label = normalizeLabel(answer);
    return keywords.some((keyword) => label.includes(keyword.toLowerCase()));
  });

  return matchedAnswer?.value || "";
};

export const calculateAge = (dateString) => {
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

export const normalizeGender = (value) => {
  if (!value) return "";

  const text = String(value).trim().toLowerCase();

  if (text.includes("female") || text.includes("নারী")) {
  return GENDERS.FEMALE;
  }

  if (text.includes("male") || text.includes("পুরুষ")) {
    return GENDERS.MALE;
  }

  if (text.includes("other") || text.includes("অন্যান্য")) {
    return GENDERS.OTHER;
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

  // A field explicitly mapped to a Data Point (Form Builder → "Map to Data
  // Point") always wins over keyword-guessing, since it's an admin's
  // explicit choice rather than an inference. Unmapped fields fall through
  // to the keyword search below exactly as before — zero behavior change
  // for any field an admin hasn't touched.
  const mappedValues = {};
  const customData = {};

  fields.forEach((field) => {
    if (field.field_type === "section") return;

    const value = answers[field.id];
    const hasValue = Array.isArray(value) ? value.length > 0 : Boolean(value);
    if (!hasValue) return;

    if (field.mapped_participant_field) {
      mappedValues[field.mapped_participant_field] = value;
    } else if (field.data_point_id && field.data_point_key) {
      customData[field.data_point_key] = value;
    }
  });

  const name =
    mappedValues.name ||
    getAnswerValueByKeywords(responseAnswers, [
      "name",
      "full name",
      "participant name",
      "applicant name",
      "নাম",
    ]);

  const email =
    mappedValues.email ||
    getAnswerValueByKeywords(responseAnswers, ["email", "e-mail", "ইমেইল"]);

  const phone =
    mappedValues.phone ||
    getAnswerValueByKeywords(responseAnswers, [
      "phone",
      "mobile",
      "contact",
      "contact number",
      "mobile number",
      "মোবাইল",
      "ফোন",
    ]);

  const gender = normalizeGender(
    mappedValues.gender ||
      getAnswerValueByKeywords(responseAnswers, ["gender", "sex", "লিঙ্গ"])
  );

  const dateOfBirth =
    mappedValues.date_of_birth ||
    responseAnswers.find((answer) => answer.field_type === "date")?.value ||
    "";

  const age = calculateAge(dateOfBirth);

  const institution =
    mappedValues.institution ||
    getAnswerValueByKeywords(responseAnswers, [
      "institution",
      "school",
      "college",
      "university",
      "প্রতিষ্ঠান",
      "শিক্ষা প্রতিষ্ঠান",
    ]);

  const formRef = doc(db, "forms", formMeta.id);
  const cohortRef = doc(db, "cohorts", formMeta.cohort_id);
  const responseRef = doc(collection(db, COLLECTIONS.FORM_RESPONSES));
  const participantRef = doc(collection(db, COLLECTIONS.PARTICIPANTS));

  const unixTime = Math.floor(Date.now() / 1000);

  await runTransaction(db, async (transaction) => {
    const cohortSnap = await transaction.get(cohortRef);

    if (!cohortSnap.exists()) {
      throw new Error("Cohort not found.");
    }

    const cohortData = cohortSnap.data();
    const currentSequence = Number(cohortData.current_participant_sequence || 0);
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
      institution,
      custom_data: customData,

      answers: responseAnswers,

      submitted_at: serverTimestamp(),
    });

    const participantData = createParticipant({
      id: participantRef.id,

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
      institution,
      custom_data: customData,

      search_name: name,
      search_email: email,
      search_phone: phone,

      registration_status: REGISTRATION_STATUS.REGISTERED,

      submitted_at: serverTimestamp(),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    transaction.set(participantRef, participantData);

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