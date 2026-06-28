import {
  REGISTRATION_STATUS,
  SELECTION_STATUS,
  ENROLLMENT_STATUS,
  GRADUATION_STATUS,
  PROJECT_STATUS,
} from "../constants/status";

export const createParticipantEntity = (overrides = {}) => ({
  id: "",

  participant_code: "",

  name: "",
  phone: "",
  email: "",
  gender: "",
  date_of_birth: "",
  age: "",

  cohort_id: "",
  cohort_name: "",
  cohort_code: "",

  form_id: "",
  form_title: "",
  response_id: "",

  registration_status: REGISTRATION_STATUS.REGISTERED,
  selection_status: SELECTION_STATUS.PENDING,
  enrollment_status: ENROLLMENT_STATUS.PENDING,
  graduation_status: GRADUATION_STATUS.PENDING,
  project_status: PROJECT_STATUS.PENDING,

  submitted_at: null,
  created_at: null,
  updated_at: null,

  ...overrides,
});