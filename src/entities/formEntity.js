export const createFormEntity = (overrides = {}) => ({
  id: "",

  form_title: "",
  form_description: "",
  public_slug: "",

  cohort_id: "",
  cohort_name: "",
  cohort_code: "",

  status: "Draft",
  is_public: false,
  is_deleted: false,

  total_responses: 0,

  created_by: "",
  updated_by: "",

  created_at: null,
  updated_at: null,

  ...overrides,
});