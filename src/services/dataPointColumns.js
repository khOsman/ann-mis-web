import {
  textFilter,
  numberFilter,
  dateFilter,
  optionFilter,
} from "../constants/reportColumns";

// The 6 system data points (Name/Email/Phone/Gender/Date of Birth/
// Institution) already have dedicated columns wired into
// reportColumns.js/reportDatasets.js, reading straight off the matching
// top-level participant field — only custom (admin-created) data points
// need to be injected here, reading from participant.custom_data instead.
const fieldTypeToFilter = (fieldType, options) => {
  switch (fieldType) {
    case "number":
      return numberFilter;
    case "date":
      return dateFilter;
    case "dropdown":
    case "radio":
    case "checkbox":
      return optionFilter(options || []);
    default:
      return textFilter;
  }
};

export const getCustomDataPointColumns = (dataPoints) =>
  dataPoints
    .filter((dataPoint) => !dataPoint.is_system)
    .map((dataPoint) => ({
      key: dataPoint.key,
      label: dataPoint.label_en,
      filter: fieldTypeToFilter(dataPoint.field_type, dataPoint.options),
    }));

// Reads a record's (participant or form_response doc — both carry
// custom_data) custom data points into flat top-level keys, matching the
// column `key`s above — every downstream consumer (filtering, table
// render, CSV/Excel export) does a plain `row[column.key]` lookup with no
// nested-path support, so this has to land flat, not nested.
export const flattenCustomDataPoints = (record, dataPoints) => {
  const flat = {};

  dataPoints
    .filter((dataPoint) => !dataPoint.is_system)
    .forEach((dataPoint) => {
      const value = record.custom_data?.[dataPoint.key];
      flat[dataPoint.key] = Array.isArray(value) ? value.join(", ") : value || "";
    });

  return flat;
};
