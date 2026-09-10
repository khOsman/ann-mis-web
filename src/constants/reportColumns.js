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
  { key: "institution", label: "Institution", filter: textFilter },
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

// total_enrolled/total_graduated/total_fgds/total_selected below are
// freshly counted by getCohortJourneyDataset() (reportDatasets.js), not
// read off the cohort doc — several of the equivalent stored counters are
// confirmed dead (always 0, never written). total_projects is omitted
// entirely rather than shown as a permanently-misleading zero, since no
// real `projects` collection exists yet.
const cohortColumns = [
  { key: "cohort_code", label: "Cohort Code", filter: textFilter },
  { key: "cohort_name", label: "Cohort Name", filter: textFilter },
  { key: "district", label: "District", filter: textFilter },
  { key: "area", label: "Area", filter: textFilter },
  { key: "center", label: "Center", filter: textFilter },
  {
    key: "status",
    label: "Status",
    filter: optionFilter(["Draft", "Active", "Closed", "Archived"]),
  },
  { key: "registration_open_date", label: "Registration Open", filter: dateFilter },
  { key: "registration_close_date", label: "Registration Close", filter: dateFilter },
  { key: "selection_start_date", label: "Selection Start", filter: dateFilter },
  { key: "selection_end_date", label: "Selection End", filter: dateFilter },
  { key: "enrollment_start_date", label: "Enrollment Start", filter: dateFilter },
  { key: "enrollment_end_date", label: "Enrollment End", filter: dateFilter },
  { key: "class_start_date", label: "Class Start", filter: dateFilter },
  { key: "class_end_date", label: "Class End", filter: dateFilter },
  { key: "pitch_day_date", label: "Pitch Day", filter: dateFilter },
  { key: "graduation_date", label: "Graduation Date", filter: dateFilter },
  { key: "total_registrations", label: "Registrations", filter: numberFilter },
  { key: "total_fgds", label: "FGDs", filter: numberFilter },
  { key: "total_selected", label: "Selected", filter: numberFilter },
  { key: "total_enrolled", label: "Enrolled", filter: numberFilter },
  { key: "total_graduated", label: "Graduated", filter: numberFilter },
  { key: "created_at", label: "Created At", filter: dateFilter },
  { key: "updated_at", label: "Updated At", filter: dateFilter },
];

// present_count/absent_count/pending_count/total_participants/
// avg_evaluation_score below are freshly counted by getFGDReportDataset()
// from the participants assigned to each FGD — the equivalent fields on
// the FGD doc itself (total_present/total_absent/total_pending_feedback)
// are confirmed dead (never written; attendance actually lives on the
// participant doc).
const fgdColumns = [
  { key: "fgd_code", label: "FGD Code", filter: textFilter },
  { key: "fgd_name", label: "FGD Name", filter: textFilter },
  { key: "cohort_name", label: "Cohort", filter: textFilter },
  { key: "cohort_code", label: "Cohort Code", filter: textFilter },
  { key: "sequence_no", label: "Sequence No.", filter: numberFilter },
  { key: "session_date", label: "Session Date", filter: dateFilter },
  { key: "session_start_time", label: "Start Time", filter: textFilter },
  { key: "session_end_time", label: "End Time", filter: textFilter },
  { key: "venue", label: "Venue", filter: textFilter },
  {
    key: "status",
    label: "Status",
    filter: optionFilter(["Draft", "Active", "Completed"]),
  },
  { key: "participant_limit", label: "Participant Limit", filter: numberFilter },
  { key: "total_participants", label: "Participants", filter: numberFilter },
  { key: "present_count", label: "Present", filter: numberFilter },
  { key: "absent_count", label: "Absent", filter: numberFilter },
  { key: "pending_count", label: "Pending Attendance", filter: numberFilter },
  { key: "avg_evaluation_score", label: "Avg. Evaluation Score", filter: numberFilter },
  { key: "committee_members", label: "Committee Members", filter: textFilter },
  { key: "created_at", label: "Created At", filter: dateFilter },
  { key: "updated_at", label: "Updated At", filter: dateFilter },
];

// evaluations_submitted/evaluations_draft/avg_computed_score below are
// freshly counted by getChampionsActivityDataset() from
// participant_evaluations grouped by champion_id — total_evaluated_
// participants on the champion doc itself is confirmed dead (always 0).
// There is no "attendance marked by this champion" column — the
// attendance write has no actor field anywhere in the system today.
const championColumns = [
  { key: "champion_code", label: "Champion Code", filter: textFilter },
  { key: "name", label: "Name", filter: textFilter },
  { key: "email", label: "Email", filter: textFilter },
  { key: "phone", label: "Phone", filter: textFilter },
  { key: "roles", label: "Roles", filter: textFilter },
  { key: "institution", label: "Institution", filter: textFilter },
  {
    key: "registration_status",
    label: "Registration Status",
    filter: optionFilter(["Pending", "Approved", "Rejected"]),
  },
  {
    key: "account_status",
    label: "Account Status",
    filter: optionFilter(["Not Created", "Invitation Sent", "Password Set", "Active"]),
  },
  {
    key: "member_status",
    label: "Member Status",
    filter: optionFilter(["Inactive", "Active", "Suspended"]),
  },
  { key: "assigned_fgd_count", label: "Assigned FGD Count", filter: numberFilter },
  { key: "assigned_fgds", label: "Assigned FGDs", filter: textFilter },
  { key: "evaluations_submitted", label: "Evaluations Submitted", filter: numberFilter },
  { key: "evaluations_draft", label: "Evaluations Draft", filter: numberFilter },
  { key: "avg_computed_score", label: "Avg. Computed Score", filter: numberFilter },
  { key: "joined_at", label: "Joined At", filter: dateFilter },
  { key: "last_login_at", label: "Last Login", filter: dateFilter },
  { key: "created_at", label: "Created At", filter: dateFilter },
];

export const REPORT_SOURCES = {
  participant_master: {
    label: "Participant Master Report",
    collection: "participants",
    type: "dataset",
    supportsCustomDataPoints: true,
    defaultColumns: [
      "participant_code",
      "name",
      "phone",
      "email",
      "gender",
      "date_of_birth",
      "age",
      "institution",
      "cohort_name",
      "registration_status",
      "selection_status",
      "enrollment_status",
      "graduation_status",
      "fgd_code",
      "fgd_session_date",
      "assigned_champions",
      "submitted_at",
    ],
    columns: participantColumns,
  },

  participants: {
    label: "Participants",
    collection: "participants",
    type: "fixed",
    supportsCustomDataPoints: true,
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
    supportsCustomDataPoints: true,
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

  cohorts: {
    label: "Cohort Journey Report",
    collection: "cohorts",
    type: "dataset",
    defaultColumns: [
      "cohort_code",
      "cohort_name",
      "status",
      "total_registrations",
      "total_fgds",
      "total_selected",
      "total_enrolled",
      "total_graduated",
    ],
    columns: cohortColumns,
  },

  fgds: {
    label: "FGD Report",
    collection: "fgds",
    type: "dataset",
    defaultColumns: [
      "fgd_code",
      "fgd_name",
      "cohort_name",
      "session_date",
      "status",
      "total_participants",
      "present_count",
      "absent_count",
      "avg_evaluation_score",
    ],
    columns: fgdColumns,
  },

  champions: {
    label: "Champions Activity Report",
    collection: "champions_pool",
    type: "dataset",
    adminOnly: true,
    defaultColumns: [
      "champion_code",
      "name",
      "roles",
      "registration_status",
      "member_status",
      "assigned_fgd_count",
      "evaluations_submitted",
      "avg_computed_score",
    ],
    columns: championColumns,
  },
};