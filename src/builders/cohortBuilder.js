import { COHORT_STATUS } from "../constants/status";
import { COHORT_APPROVAL_STATUS } from "../constants/cohortApproval";

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

  // A new cohort always starts as a Draft awaiting submission; it becomes
  // Active only when the Programme Head approves it.
  status: COHORT_STATUS.DRAFT,
  approval_status: COHORT_APPROVAL_STATUS.NOT_SUBMITTED,
  approval_history: [],

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