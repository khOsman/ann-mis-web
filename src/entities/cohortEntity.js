export const createCohortEntity = (overrides = {}) => ({
  cohort_name: "",
  cohort_code: "",

  district: "",
  area: "",
  center: "",

  registration_form_id: "",

  start_date: "",
  end_date: "",

  registration_open_date: "",
  registration_close_date: "",

  selection_start_date: "",
  selection_end_date: "",

  enrollment_start_date: "",
  enrollment_end_date: "",

  class_start_date: "",
  class_end_date: "",

  pitch_day_date: "",
  graduation_date: "",

  status: "Draft",

  total_registrations: 0,
  total_selected: 0,
  total_enrolled: 0,
  total_graduated: 0,
  total_dropouts: 0,

  created_by: "",
  updated_by: "",

  created_at: null,
  updated_at: null,

  ...overrides,
});