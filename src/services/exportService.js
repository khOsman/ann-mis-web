import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const formatRows = (rows, columns) => {
  return rows.map((row) => {
    const formatted = {};

    columns.forEach((column) => {
      formatted[column.label] = row[column.key] ?? "";
    });

    return formatted;
  });
};

const generateFileName = (sourceLabel = "Report") => {
  const now = new Date();

  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(":", "-");

  return `${sourceLabel.replaceAll(" ", "_")}_${date}_${time}`;
};

export const exportCSV = ({ rows, columns, sourceLabel }) => {
  const data = formatRows(rows, columns);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  saveAs(blob, `${generateFileName(sourceLabel)}.csv`);
};

export const exportExcel = ({ rows, columns, sourceLabel }) => {
  const data = formatRows(rows, columns);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  XLSX.writeFile(workbook, `${generateFileName(sourceLabel)}.xlsx`);
};

// jsPDF's built-in fonts only cover Latin (WinAnsi) glyphs — Bengali text
// would render as blank space, not garbage, so questions without an
// English label fall back to a placeholder instead of silently dropping
// content the reader can't tell is missing.
export const exportFormFieldsPDF = ({ formTitle, cohortName, cohortCode, fields }) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;

  doc.setFontSize(16);
  doc.text(formTitle || "Registration Form", margin, margin);

  doc.setFontSize(10);
  doc.setTextColor(110);
  const subtitle = [cohortName, cohortCode && `(${cohortCode})`]
    .filter(Boolean)
    .join(" ");
  doc.text(subtitle, margin, margin + 18);
  doc.setTextColor(0);

  const rows = fields.map((field, index) => {
    const label =
      field.label_en?.trim() ||
      field.label?.trim() ||
      "(Bengali-only question — see Form Builder for exact text)";
    const options = (field.options || []).length
      ? field.options.join(", ")
      : "-";

    return [String(index + 1), label, field.field_type || "-", options];
  });

  autoTable(doc, {
    startY: margin + 34,
    margin: { left: margin, right: margin },
    head: [["#", "Question", "Type", "Options"]],
    body: rows,
    styles: { fontSize: 9, cellPadding: 6, valign: "top" },
    headStyles: { fillColor: [214, 51, 108] },
    columnStyles: {
      0: { cellWidth: 24 },
      2: { cellWidth: 55 },
    },
  });

  const fileBase = (cohortCode || cohortName || formTitle || "Registration_Form")
    .toString()
    .replaceAll(" ", "_");

  doc.save(`${fileBase}_Registration_Form.pdf`);
};