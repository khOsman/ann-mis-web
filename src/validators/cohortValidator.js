export const validateCreateCohort = (form) => {
  if (
    form.registration_start_date &&
    form.registration_end_date &&
    new Date(form.registration_start_date) > new Date(form.registration_end_date)
  ) {
    return {
      valid: false,
      type: "warning",
      message:
        "Registration Start Date cannot be later than Registration End Date.",
    };
  }

  return {
    valid: true,
    type: null,
    message: "",
  };
};