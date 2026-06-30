import {
  REGISTRATION_STATUS,
  SELECTION_STATUS,
  ENROLLMENT_STATUS,
  GRADUATION_STATUS,
  PROJECT_STATUS,
} from "../constants/status";
import { createParticipant } from "../entities";

const clean = (value) => String(value || "").trim();

const getValue = (row, keys) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
};

const normalizeSelectionStatus = (value) => {
  const text = clean(value).toLowerCase();

  if (text.includes("selected")) return SELECTION_STATUS.SELECTED;
  if (text.includes("rejected")) return SELECTION_STATUS.REJECTED;
  if (text.includes("wait")) return SELECTION_STATUS.WAITLISTED;

  return SELECTION_STATUS.PENDING;
};

const normalizeEnrollmentStatus = (value) => {
  const text = clean(value).toLowerCase();

  if (
    text.includes("paid") ||
    text.includes("enrolled") ||
    text.includes("completed")
  ) {
    return ENROLLMENT_STATUS.ENROLLED;
  }

  if (text.includes("cancel")) {
    return ENROLLMENT_STATUS.CANCELLED;
  }

  return ENROLLMENT_STATUS.PENDING;
};

const normalizeGraduationStatus = (value) => {
  const text = clean(value).toLowerCase();

  if (text.includes("graduated") || text.includes("yes")) {
    return GRADUATION_STATUS.GRADUATED;
  }

  if (text.includes("dropped") || text.includes("dropout")) {
    return GRADUATION_STATUS.DROPPED;
  }

  return GRADUATION_STATUS.PENDING;
};

const normalizeProjectStatus = (projectName) => {
  return clean(projectName) ? PROJECT_STATUS.COMPLETED : PROJECT_STATUS.PENDING;
};

const generateParticipantCode = ({ cohort, rowIndex }) => {
  const cohortCode = clean(cohort.cohort_code || "COHORT").toUpperCase();
  const sequence = String(rowIndex + 1).padStart(4, "0");

  return `ANN-${cohortCode}-${sequence}`;
};

export const buildParticipantFromFactSheet = ({
  row,
  cohort,
  importedAt,
  rowIndex = 0,
}) => {
  const name = clean(getValue(row, ["Name", "name"]));
  const email = clean(getValue(row, ["Email", "email", "E-mail", "Email Address"]));
  const projectName = clean(getValue(row, ["Project", "project"]));

  return createParticipant({
    participant_code: clean(getValue(row, ["ID", "Participant Code"])) ||
      generateParticipantCode({ cohort, rowIndex }),

    name,
    email,
    date_of_birth: clean(getValue(row, ["Date of Birth", "DOB"])),
    age: clean(getValue(row, ["Age", "Age "])),
    gender: clean(getValue(row, ["Gender"])),
    phone: clean(getValue(row, ["Mobile Number", "Phone", "Contact Number"])),
    institution: clean(getValue(row, ["Institution"])),

    cohort_id: cohort.id,
    cohort_name: cohort.cohort_name,
    cohort_code: cohort.cohort_code,

    registration_status: REGISTRATION_STATUS.REGISTERED,
    selection_status: normalizeSelectionStatus(getValue(row, ["Selection"])),
    enrollment_status: normalizeEnrollmentStatus(
      getValue(row, ["Payment Status"])
    ),
    graduation_status: normalizeGraduationStatus(getValue(row, ["Graduation"])),

    payment_status: clean(getValue(row, ["Payment Status"])),
    attendance: clean(getValue(row, ["Attendance"])),
    batch_name: clean(getValue(row, ["Batch"])),

    pre_assessment_status: clean(getValue(row, ["Pre-Assessment Status"])),
    pre_assessment_score: clean(getValue(row, ["Pre-Assessment Score"])),

    post_assessment_status: clean(getValue(row, ["Post Assessment Status"])),
    post_assessment_score: clean(getValue(row, ["Post Assessment Score"])),

    project_status: normalizeProjectStatus(projectName),
    project_name: projectName,
    project_description: clean(getValue(row, ["Description"])),
    project_pillar: clean(getValue(row, ["Pillar", "pillar"])),

    import_source: "Fact Sheet",
    imported_at: importedAt,
    submitted_at: importedAt,
  });
};