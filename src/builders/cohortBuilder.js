export const buildCreateCohortPayload = (form, user) => ({
  cohort_code: form.cohort_code.trim().toUpperCase(),
  cohort_name: form.cohort_name.trim(),
  division: form.division,
  district: form.district,
  cohort_year: form.cohort_year.trim(),

  registration_start_date: form.registration_start_date,
  registration_end_date: form.registration_end_date,

  selection_target: Number(form.selection_target || 0),
  graduation_target: Number(form.graduation_target || 0),

  status: form.status,

  created_by_email: user?.email || "",
  created_by_name: user?.displayName || "",

  updated_by_email: user?.email || "",
  updated_by_name: user?.displayName || "",
});

export const buildUpdateCohortPayload = (form, user) => ({
  cohort_code: form.cohort_code.trim().toUpperCase(),
  cohort_name: form.cohort_name.trim(),
  division: form.division,
  district: form.district,
  cohort_year: form.cohort_year.trim(),

  registration_start_date: form.registration_start_date,
  registration_end_date: form.registration_end_date,

  selection_target: Number(form.selection_target || 0),
  graduation_target: Number(form.graduation_target || 0),

  status: form.status,

  updated_by_email: user?.email || "",
  updated_by_name: user?.displayName || "",
});