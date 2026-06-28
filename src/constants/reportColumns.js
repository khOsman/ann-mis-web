import { GENDER_OPTIONS, GENDERS } from "./genders";

export const FILTER_TYPES = {
  TEXT: "text",
  NUMBER: "number",
  DATE: "date",
  OPTION: "option",
};

export const textFilter = {
  type: FILTER_TYPES.TEXT,
};


export const numberFilter = {
  type: FILTER_TYPES.NUMBER,
};

export const dateFilter = {
  type: FILTER_TYPES.DATE,
};

export const optionFilter = (options = []) => ({
  type: FILTER_TYPES.OPTION,
  options,
});

const STATUS_OPTIONS = ["Pending", "Registered", "Selected", "Enrolled", "Graduated"];

const participantColumns = [
  { key: "participant_code", label: "Participant Code", filter: textFilter },
  { key: "name", label: "Name", filter: textFilter },
  { key: "phone", label: "Phone", filter: textFilter },
  { key: "email", label: "Email", filter: textFilter },
  {
    key: "gender",
    label: "Gender",
    filter: optionFilter(GENDER_OPTIONS),
  },
  { key: "date_of_birth", label: "Date of Birth", filter: dateFilter },
  { key: "age", label: "Age", filter: numberFilter },
  { key: "cohort_name", label: "Cohort", filter: textFilter },
  { key: "cohort_code", label: "Cohort Code", filter: textFilter },
  {
    key: "registration_status",
    label: "Registration Status",
    filter: optionFilter(["Pending", "Registered"]),
  },
  {
    key: "selection_status",
    label: "Selection Status",
    filter: optionFilter(["Pending", "Selected", "Not Selected"]),
  },
  {
    key: "enrollment_status",
    label: "Enrollment Status",
    filter: optionFilter(["Pending", "Enrolled", "Not Enrolled"]),
  },
  {
    key: "graduation_status",
    label: "Graduation Status",
    filter: optionFilter(["Pending", "Graduated", "Not Graduated"]),
  },
  {
    key: "project_status",
    label: "Project Status",
    filter: optionFilter(["Pending", "Completed", "Not Completed"]),
  },
  { key: "submitted_at", label: "Submitted At", filter: dateFilter },
  { key: "created_at", label: "Created At", filter: dateFilter },
  { key: "updated_at", label: "Updated At", filter: dateFilter },
];

const formResponseColumns = [
  { key: "participant_code", label: "Participant Code", filter: textFilter },
  { key: "search_name", label: "Name", filter: textFilter },
  { key: "search_phone", label: "Phone", filter: textFilter },
  { key: "search_email", label: "Email", filter: textFilter },
  { key: "cohort_name", label: "Cohort", filter: textFilter },
  { key: "cohort_code", label: "Cohort Code", filter: textFilter },
  { key: "form_title", label: "Form", filter: textFilter },
  { key: "submitted_at", label: "Submitted At", filter: dateFilter },
];

export const REPORT_SOURCES = {
  participant_master: {
    label: "Participant Master Report",
    collection: "participants",
    type: "dataset",
    defaultColumns: [
      "participant_code",
      "name",
      "phone",
      "email",
      "gender",
      "date_of_birth",
      "age",
      "cohort_name",
      "registration_status",
      "selection_status",
      "enrollment_status",
      "graduation_status",
      "submitted_at",
    ],
    columns: participantColumns,
  },

  participants: {
    label: "Participants",
    collection: "participants",
    type: "fixed",
    defaultColumns: [
      "participant_code",
      "name",
      "phone",
      "email",
      "gender",
      "date_of_birth",
      "age",
      "cohort_name",
      "registration_status",
      "selection_status",
      "enrollment_status",
      "graduation_status",
      "submitted_at",
    ],
    columns: participantColumns,
  },

  form_responses: {
    label: "Form Responses",
    collection: "form_responses",
    type: "dynamic",
    defaultColumns: [
      "participant_code",
      "search_name",
      "search_phone",
      "search_email",
      "cohort_name",
      "form_title",
      "submitted_at",
    ],
    columns: formResponseColumns,
  },
};