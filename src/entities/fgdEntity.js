import { FGD_STATUS } from "../constants/fgd";

export const createFgdEntity = (overrides = {}) => ({
  id: "",

  // Cohort
  cohort_id: "",
  cohort_name: "",
  cohort_code: "",

  // Identity
  sequence_no: 0,
  fgd_code: "",
  fgd_name: "",

  // Capacity
  participant_limit: 0,
  total_participants: 0,

  // Session
  session_date: "",
  session_start_time: "",
  session_end_time: "",
  venue: "",

  // Committee
  committee_members: [],

  // Statistics
  total_present: 0,
  total_absent: 0,
  total_pending_feedback: 0,

  // Status
  status: FGD_STATUS.DRAFT,

  // Audit
  created_at: null,
  created_by_email: "",
  created_by_name: "",

  updated_at: null,
  updated_by_email: "",
  updated_by_name: "",

  ...overrides,
});