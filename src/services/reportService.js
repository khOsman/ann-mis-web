import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { getParticipantMasterDataset } from "./reportDatasets";
import { REPORT_SOURCES } from "../constants/reportColumns";
import { getDataPoints } from "./dataPointService";
import { flattenCustomDataPoints } from "./dataPointColumns";

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

  // Custom (admin-created, non-system) data points aren't part of the
  // static column/row shape above — both form_responses and participants
  // docs carry a custom_data map (populated at registration time when a
  // form field is mapped to one), flattened here into the same flat
  // top-level keys the column pickers expose.
  const dataPoints = await getDataPoints();

  if (sourceKey === "form_responses") {
    const rows = rawData.map((response) => ({
      ...flattenFormResponse(response),
      ...flattenCustomDataPoints(response, dataPoints),
    }));

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
    rows: rawData.map((participant) => ({
      ...normalizeParticipant(participant),
      ...flattenCustomDataPoints(participant, dataPoints),
    })),
    columns: source.columns,
  };
};