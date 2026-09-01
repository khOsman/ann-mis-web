import {
  REGISTRATION_STATUS,
  SELECTION_STATUS,
  ENROLLMENT_STATUS,
  GRADUATION_STATUS,
  PROJECT_STATUS,
} from "../constants/status";

export const createParticipantEntity = (overrides = {}) => ({
  // Participant Identity
  participant_code: "",

  name: "",
  phone: "",
  email: "",
  gender: "",
  date_of_birth: "",
  age: "",
  institution: "",

  // Cohort Information
  cohort_id: "",
  cohort_name: "",
  cohort_code: "",

  // Form Information
  form_id: "",
  form_title: "",
  response_id: "",

  // Journey Status
  registration_status: REGISTRATION_STATUS.REGISTERED,
  selection_status: SELECTION_STATUS.PENDING,
  enrollment_status: ENROLLMENT_STATUS.PENDING,
  graduation_status: GRADUATION_STATUS.PENDING,
  project_status: PROJECT_STATUS.PENDING,

  // FGD / Selection
  fgd_id: "",
  fgd_code: "",
  fgd_name: "",

  fgd_attendance_status: "Pending",
  fgd_score: null,

  fgd_feedback: "",

  selection_recommendation: "", // Selected, Waitlisted, Rejected

  selection_committee_notes: "",

  fgd_evaluated_by: "",
  fgd_evaluated_at: null,

  // Training Information
  payment_status: "",
  attendance_count: 0,
  batch_name: "",

  // Assessment
  pre_assessment_status: "",
  pre_assessment_score: "",

  post_assessment_status: "",
  post_assessment_score: "",

  // Project
  project_name: "",
  project_description: "",
  project_pillar: "",

  // Audit / Import
  import_source: "",
  imported_at: null,

  submitted_at: null,
  created_at: null,
  updated_at: null,

  ...overrides,
});