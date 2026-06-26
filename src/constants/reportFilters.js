export const FIELD_TYPES = {
  TEXT: "text",
  NUMBER: "number",
  DATE: "date",
  OPTION: "option",
};

export const FILTER_OPERATORS_BY_TYPE = {
  text: [
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does Not Contain" },
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "starts_with", label: "Starts With" },
    { value: "is_empty", label: "Is Empty" },
    { value: "is_not_empty", label: "Is Not Empty" },
  ],

  number: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "greater_or_equal", label: "Greater Or Equal" },
    { value: "less_or_equal", label: "Less Or Equal" },
    { value: "between", label: "Between" },
    { value: "is_empty", label: "Is Empty" },
    { value: "is_not_empty", label: "Is Not Empty" },
  ],

  date: [
    { value: "equals", label: "Equals" },
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
    { value: "between", label: "Between" },
    { value: "is_empty", label: "Is Empty" },
    { value: "is_not_empty", label: "Is Not Empty" },
  ],

  option: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "is_empty", label: "Is Empty" },
    { value: "is_not_empty", label: "Is Not Empty" },
  ],
};

export const FIELD_TYPE_OVERRIDES = {
  age: FIELD_TYPES.NUMBER,
  participant_sequence: FIELD_TYPES.NUMBER,

  submitted_at: FIELD_TYPES.DATE,
  created_at: FIELD_TYPES.DATE,
  updated_at: FIELD_TYPES.DATE,
  date_of_birth: FIELD_TYPES.DATE,

  gender: FIELD_TYPES.OPTION,
  registration_status: FIELD_TYPES.OPTION,
  selection_status: FIELD_TYPES.OPTION,
  enrollment_status: FIELD_TYPES.OPTION,
  graduation_status: FIELD_TYPES.OPTION,
  project_status: FIELD_TYPES.OPTION,
};

export const FIELD_OPTIONS = {
  gender: ["Female", "Male", "Other"],

  registration_status: ["Registered", "Pending"],
  selection_status: ["Pending", "Selected", "Not Selected"],
  enrollment_status: ["Pending", "Enrolled", "Not Enrolled"],
  graduation_status: ["Pending", "Graduated", "Not Graduated"],
  project_status: ["Pending", "Completed", "Not Completed"],
};

export const getFieldType = (fieldKey) => {
  return FIELD_TYPE_OVERRIDES[fieldKey] || FIELD_TYPES.TEXT;
};

export const getOperatorsByField = (fieldKey) => {
  const type = getFieldType(fieldKey);
  return FILTER_OPERATORS_BY_TYPE[type] || FILTER_OPERATORS_BY_TYPE.text;
};

export const getOptionsByField = (fieldKey) => {
  return FIELD_OPTIONS[fieldKey] || [];
};