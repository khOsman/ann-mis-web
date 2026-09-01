import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { getParticipantMasterDataset } from "./reportDatasets";
import { REPORT_SOURCES } from "../constants/reportColumns";

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

const flattenFormResponse = (response) => {
  const base = {
    id: response.id,
    participant_code: response.participant_code || "",
    search_name: response.search_name || "",
    search_phone: response.search_phone || "",
    search_email: response.search_email || "",
    cohort_name: response.cohort_name || "",
    cohort_code: response.cohort_code || "",
    form_title: response.form_title || "",
    submitted_at: formatTimestamp(response.submitted_at),
  };

  const dynamicAnswers = {};

  (response.answers || []).forEach((answer) => {
    const key =
      answer.field_label_en ||
      answer.field_label_bn ||
      answer.field_id;

    dynamicAnswers[key] = Array.isArray(answer.value)
      ? answer.value.join(", ")
      : answer.value || "";
  });

  return {
    ...base,
    ...dynamicAnswers,
  };
};

const normalizeParticipant = (participant) => {
  return {
    ...participant,
    submitted_at: formatTimestamp(participant.submitted_at),
    created_at: formatTimestamp(participant.created_at),
    updated_at: formatTimestamp(participant.updated_at),
  };
};

export const getReportData = async (sourceKey) => {
  
   if (sourceKey === "participant_master") {
    return await getParticipantMasterDataset();
   }
  
    const source = REPORT_SOURCES[sourceKey];

  if (!source) {
    throw new Error("Invalid report source.");
  }


  const q = query(
    collection(db, source.collection),
    orderBy("submitted_at", "desc")
  );

  const snapshot = await getDocs(q);

  const rawData = snapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
  }));

  if (sourceKey === "form_responses") {
    const rows = rawData.map(flattenFormResponse);

    const dynamicColumns = Array.from(
      new Set(rows.flatMap((row) => Object.keys(row)))
    )
      .filter((key) => key !== "id")
      .map((key) => ({
        key,
        label: key.replaceAll("_", " "),
      }));

    return {
      rows,
      columns: dynamicColumns,
    };
  }

  return {
    rows: rawData.map(normalizeParticipant),
    columns: source.columns,
  };
};