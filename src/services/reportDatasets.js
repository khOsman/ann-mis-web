import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { formatBDPhone } from "../utils/phone";

const formatTimestamp = (value) => {
  if (!value?.toDate) return value || "";

  return value.toDate().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const normalizeAnswerKey = (answer) => {
  return (
    answer.field_label_en ||
    answer.field_label_bn ||
    answer.field_id ||
    ""
  )
    .toString()
    .trim();
};

const flattenAnswers = (answers = []) => {
  const result = {};

  answers.forEach((answer) => {
    const key = normalizeAnswerKey(answer);

    if (!key) return;

    result[key] = Array.isArray(answer.value)
      ? answer.value.join(", ")
      : answer.value || "";
  });

  return result;
};

export const getParticipantMasterDataset = async () => {
  const participantSnapshot = await getDocs(collection(db, "participants"));
  const responseSnapshot = await getDocs(collection(db, "form_responses"));

  const responsesById = {};

  responseSnapshot.docs.forEach((item) => {
    responsesById[item.id] = {
      ...item.data(),
      id: item.id,
    };
  });

  const rows = participantSnapshot.docs.map((item) => {
    const participant = {
      ...item.data(),
      id: item.id,
    };

    const response = responsesById[participant.response_id];
    const formAnswers = flattenAnswers(response?.answers || []);

    return {
      id: participant.id,

      participant_code: participant.participant_code || "",
      name: participant.name || "",
      phone: formatBDPhone(participant.phone),
      email: participant.email || "",
      gender: participant.gender || "",
      date_of_birth: participant.date_of_birth || "",
      age: participant.age || "",

      cohort_name: participant.cohort_name || "",
      cohort_code: participant.cohort_code || "",
      form_title: participant.form_title || "",

      registration_status: participant.registration_status || "",
      selection_status: participant.selection_status || "",
      enrollment_status: participant.enrollment_status || "",
      graduation_status: participant.graduation_status || "",
      project_status: participant.project_status || "",

      submitted_at: formatTimestamp(participant.submitted_at),
      created_at: formatTimestamp(participant.created_at),
      updated_at: formatTimestamp(participant.updated_at),

      ...formAnswers,
    };
  });

  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
    .filter((key) => key !== "id")
    .map((key) => ({
      key,
      label: key.replaceAll("_", " "),
    }));

  return {
    rows,
    columns,
  };
};