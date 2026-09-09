import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { formatBDPhone } from "../utils/phone";
import { getDataPoints } from "./dataPointService";
import { flattenCustomDataPoints } from "./dataPointColumns";
import {
  SELECTION_STATUS,
  ENROLLMENT_STATUS,
  GRADUATION_STATUS,
} from "../constants/status";
import { FGD_ATTENDANCE_STATUS } from "../constants/fgd";
import { getChampionRoles } from "../constants/champions";

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
  const [participantSnapshot, responseSnapshot, fgdSnapshot, dataPoints] = await Promise.all([
    getDocs(collection(db, "participants")),
    getDocs(collection(db, "form_responses")),
    getDocs(collection(db, "fgds")),
    getDataPoints(),
  ]);

  const responsesById = {};

  responseSnapshot.docs.forEach((item) => {
    responsesById[item.id] = {
      ...item.data(),
      id: item.id,
    };
  });

  // Master report = participant + their form answers (already joined
  // above) + their FGD's own schedule/status + the champions assigned to
  // that FGD — a participant only ever has one FGD, so this is a plain
  // by-id lookup, not a group-by like the FGD/Champion report sources use.
  const fgdsById = {};

  fgdSnapshot.docs.forEach((item) => {
    fgdsById[item.id] = { ...item.data(), id: item.id };
  });

  const rows = participantSnapshot.docs.map((item) => {
    const participant = {
      ...item.data(),
      id: item.id,
    };

    const response = responsesById[participant.response_id];
    const formAnswers = flattenAnswers(response?.answers || []);
    const fgd = participant.fgd_id ? fgdsById[participant.fgd_id] : null;

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

      fgd_code: participant.fgd_code || "",
      fgd_attendance_status: participant.fgd_attendance_status || "",
      fgd_session_date: fgd?.session_date || "",
      fgd_session_start_time: fgd?.session_start_time || "",
      fgd_session_end_time: fgd?.session_end_time || "",
      fgd_venue: fgd?.venue || "",
      fgd_status: fgd?.status || "",
      assigned_champions: (fgd?.committee_members || [])
        .map((member) => member.name)
        .filter(Boolean)
        .join(", "),

      submitted_at: formatTimestamp(participant.submitted_at),
      created_at: formatTimestamp(participant.created_at),
      updated_at: formatTimestamp(participant.updated_at),

      ...formAnswers,
      ...flattenCustomDataPoints(participant, dataPoints),
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

// Groups a flat array of docs by a field into a Map<value, array>. Shared
// by the three dataset builders below — each needs to join a parent
// collection (cohorts/fgds/champions) against a child collection
// (participants/fgds/participant_evaluations) by a foreign key.
const groupBy = (items, field) => {
  const map = new Map();

  items.forEach((item) => {
    const key = item[field];
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });

  return map;
};

const deriveColumnsFromRows = (rows) =>
  Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
    .filter((key) => key !== "id")
    .map((key) => ({ key, label: key.replaceAll("_", " ") }));

// Cohort Journey report — most of the stage-by-stage counts a cohort doc
// itself carries (total_enrolled/total_graduated) are confirmed dead
// (never written anywhere), so this recomputes them fresh from the
// participants actually in that cohort, the same way CohortJourney.jsx's
// on-screen funnel already does client-side. total_registrations/
// total_fgds/total_selected ARE kept in sync elsewhere, but are still
// recomputed here too so every count in one report row comes from the
// same fresh snapshot rather than mixing live and stored sources.
export const getCohortJourneyDataset = async () => {
  const [cohortSnapshot, participantSnapshot, fgdSnapshot] = await Promise.all([
    getDocs(collection(db, "cohorts")),
    getDocs(collection(db, "participants")),
    getDocs(collection(db, "fgds")),
  ]);

  const cohorts = cohortSnapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
  const participants = participantSnapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
  }));
  const fgds = fgdSnapshot.docs.map((item) => ({ ...item.data(), id: item.id }));

  const participantsByCohort = groupBy(participants, "cohort_id");
  const fgdsByCohort = groupBy(fgds, "cohort_id");

  const rows = cohorts.map((cohort) => {
    const cohortParticipants = participantsByCohort.get(cohort.id) || [];
    const cohortFgds = fgdsByCohort.get(cohort.id) || [];

    return {
      id: cohort.id,

      cohort_code: cohort.cohort_code || "",
      cohort_name: cohort.cohort_name || "",
      district: cohort.district || "",
      area: cohort.area || "",
      center: cohort.center || "",
      status: cohort.status || "",

      registration_open_date: cohort.registration_open_date || "",
      registration_close_date: cohort.registration_close_date || "",
      selection_start_date: cohort.selection_start_date || "",
      selection_end_date: cohort.selection_end_date || "",
      enrollment_start_date: cohort.enrollment_start_date || "",
      enrollment_end_date: cohort.enrollment_end_date || "",
      class_start_date: cohort.class_start_date || "",
      class_end_date: cohort.class_end_date || "",
      pitch_day_date: cohort.pitch_day_date || "",
      graduation_date: cohort.graduation_date || "",

      total_registrations: cohortParticipants.length,
      total_fgds: cohortFgds.length,
      total_selected: cohortParticipants.filter(
        (p) => p.selection_status === SELECTION_STATUS.SELECTED
      ).length,
      total_enrolled: cohortParticipants.filter(
        (p) => p.enrollment_status === ENROLLMENT_STATUS.ENROLLED
      ).length,
      total_graduated: cohortParticipants.filter(
        (p) => p.graduation_status === GRADUATION_STATUS.GRADUATED
      ).length,

      created_at: formatTimestamp(cohort.created_at),
      updated_at: formatTimestamp(cohort.updated_at),
    };
  });

  return { rows, columns: deriveColumnsFromRows(rows) };
};

// FGD report — total_present/total_absent/total_pending_feedback on the
// FGD doc are confirmed dead (never written; attendance actually lives on
// participant.fgd_attendance_status), and no FGD doc stores an evaluation
// average at all, so both are computed here from the participants
// actually assigned to each FGD.
export const getFGDReportDataset = async () => {
  const [fgdSnapshot, participantSnapshot] = await Promise.all([
    getDocs(collection(db, "fgds")),
    getDocs(collection(db, "participants")),
  ]);

  const fgds = fgdSnapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
  const participants = participantSnapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
  }));

  const participantsByFgd = groupBy(participants, "fgd_id");

  const rows = fgds.map((fgd) => {
    const fgdParticipants = participantsByFgd.get(fgd.id) || [];

    const scored = fgdParticipants.filter(
      (p) => typeof p.average_evaluation_score === "number"
    );
    const avgScore =
      scored.length > 0
        ? scored.reduce((sum, p) => sum + p.average_evaluation_score, 0) / scored.length
        : null;

    return {
      id: fgd.id,

      fgd_code: fgd.fgd_code || "",
      fgd_name: fgd.fgd_name || "",
      cohort_name: fgd.cohort_name || "",
      cohort_code: fgd.cohort_code || "",
      sequence_no: fgd.sequence_no || 0,
      session_date: fgd.session_date || "",
      session_start_time: fgd.session_start_time || "",
      session_end_time: fgd.session_end_time || "",
      venue: fgd.venue || "",
      status: fgd.status || "",
      participant_limit: fgd.participant_limit || 0,

      total_participants: fgdParticipants.length,
      present_count: fgdParticipants.filter(
        (p) => p.fgd_attendance_status === FGD_ATTENDANCE_STATUS.PRESENT
      ).length,
      absent_count: fgdParticipants.filter(
        (p) => p.fgd_attendance_status === FGD_ATTENDANCE_STATUS.ABSENT
      ).length,
      pending_count: fgdParticipants.filter(
        (p) =>
          (p.fgd_attendance_status || FGD_ATTENDANCE_STATUS.PENDING) ===
          FGD_ATTENDANCE_STATUS.PENDING
      ).length,
      avg_evaluation_score: avgScore !== null ? Number(avgScore.toFixed(1)) : "",

      committee_members: (fgd.committee_members || [])
        .map((member) => member.name)
        .filter(Boolean)
        .join(", "),

      created_at: formatTimestamp(fgd.created_at),
      updated_at: formatTimestamp(fgd.updated_at),
    };
  });

  return { rows, columns: deriveColumnsFromRows(rows) };
};

// Champions Activity report — total_evaluated_participants on the
// champion doc is confirmed dead (always 0, never written), so
// evaluation counts are computed here from participant_evaluations
// grouped by champion_id. There is no "attendance marked by this
// champion" column: the attendance-write endpoint records no actor field
// anywhere in the system, so that activity isn't attributable at all
// from existing data.
export const getChampionsActivityDataset = async () => {
  const [championSnapshot, evaluationSnapshot] = await Promise.all([
    getDocs(collection(db, "champions_pool")),
    getDocs(collection(db, "participant_evaluations")),
  ]);

  const champions = championSnapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
  const evaluations = evaluationSnapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
  }));

  const evaluationsByChampion = groupBy(evaluations, "champion_id");

  const rows = champions.map((champion) => {
    const championEvaluations = evaluationsByChampion.get(champion.id) || [];
    const submitted = championEvaluations.filter(
      (evaluation) => (evaluation.status || "Submitted") === "Submitted"
    );
    const draft = championEvaluations.filter(
      (evaluation) => evaluation.status === "Draft"
    );
    const scored = submitted.filter((e) => typeof e.computed_score === "number");
    const avgScore =
      scored.length > 0
        ? scored.reduce((sum, e) => sum + e.computed_score, 0) / scored.length
        : null;

    return {
      id: champion.id,

      champion_code: champion.champion_code || "",
      name: champion.name || "",
      email: champion.email || "",
      phone: formatBDPhone(champion.phone),
      roles: getChampionRoles(champion).join(", "),
      institution: champion.institution || "",
      registration_status: champion.registration_status || "",
      account_status: champion.account_status || "",
      member_status: champion.member_status || "",

      assigned_fgd_count: champion.assigned_fgd_count || 0,
      assigned_fgds: (champion.assigned_fgds || [])
        .map((fgd) => fgd.fgd_code)
        .filter(Boolean)
        .join(", "),

      evaluations_submitted: submitted.length,
      evaluations_draft: draft.length,
      avg_computed_score: avgScore !== null ? Number(avgScore.toFixed(1)) : "",

      joined_at: formatTimestamp(champion.joined_at),
      last_login_at: formatTimestamp(champion.last_login_at),
      created_at: formatTimestamp(champion.created_at),
    };
  });

  return { rows, columns: deriveColumnsFromRows(rows) };
};