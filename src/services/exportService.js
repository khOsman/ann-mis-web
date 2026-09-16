import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import notoSansBengaliUrl from "../assets/NotoSansBengali-Regular.ttf";

// jsPDF draws text as vector glyphs with a direct one-codepoint-to-one-glyph
// mapping and no script shaping — fine for Latin, but Bengali is a complex
// script (vowel signs that visually precede their consonant, conjunct
// consonant clusters) that jsPDF cannot lay out correctly no matter which
// font is embedded. certificateService.js hit the same class of jsPDF
// rendering limitation and solved it the same way this does: render real
// DOM/text (using the browser's own, correctly-shaping text engine) and
// rasterize it with html2canvas instead of asking jsPDF to draw the text
// itself. A bundled @font-face guarantees Bengali glyphs are available even
// if the admin's own OS has no Bengali font installed.
let bengaliFontFaceReady = null;
const ensureBengaliFontFace = () => {
  if (!bengaliFontFaceReady) {
    const fontFace = new FontFace("ExportBengali", `url(${notoSansBengaliUrl})`);
    bengaliFontFaceReady = fontFace.load().then((loaded) => {
      document.fonts.add(loaded);
    });
  }

  return bengaliFontFaceReady;
};

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

const fieldLabel = (field, index) =>
  [field.label_bn?.trim(), field.label_en?.trim()].filter(Boolean).join(" / ") ||
  field.label?.trim() ||
  `Question ${index + 1}`;

const buildFormFieldsTable = ({ formTitle, cohortName, cohortCode, fields }) => {
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed; left:-9999px; top:0; width:750px; background:#fff; " +
    "font-family:'ExportBengali','Noto Sans',Arial,sans-serif; padding:24px; color:#111;";

  const title = document.createElement("h2");
  title.style.cssText = "font-size:20px; margin:0 0 4px; font-weight:700;";
  title.textContent = formTitle || "Registration Form";
  container.appendChild(title);

  const subtitle = document.createElement("p");
  subtitle.style.cssText = "font-size:13px; color:#6b7280; margin:0 0 16px;";
  subtitle.textContent = [cohortName, cohortCode && `(${cohortCode})`].filter(Boolean).join(" ");
  container.appendChild(subtitle);

  const table = document.createElement("table");
  table.style.cssText = "width:100%; border-collapse:collapse; font-size:13px;";

  const headRow = document.createElement("tr");
  ["#", "Question", "Type", "Options"].forEach((label, i) => {
    const th = document.createElement("th");
    th.textContent = label;
    th.style.cssText = `padding:8px; text-align:left; background:#D6336C; color:#fff; ${
      i === 0 ? "width:32px;" : i === 2 ? "width:70px;" : ""
    }`;
    headRow.appendChild(th);
  });
  const thead = document.createElement("thead");
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  fields.forEach((field, index) => {
    const row = document.createElement("tr");
    row.style.borderBottom = "1px solid #eee";

    [
      String(index + 1),
      fieldLabel(field, index),
      field.field_type || "-",
      (field.options || []).length ? field.options.join(", ") : "-",
    ].forEach((text) => {
      const td = document.createElement("td");
      td.style.cssText = "padding:8px; vertical-align:top;";
      td.textContent = text;
      row.appendChild(td);
    });

    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  document.body.appendChild(container);
  return container;
};

export const exportFormFieldsPDF = async ({ formTitle, cohortName, cohortCode, fields }) => {
  await ensureBengaliFontFace();
  const element = buildFormFieldsTable({ formTitle, cohortName, cohortCode, fields });

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - margin * 2;
    const usableHeightPt = pageHeight - margin * 2;
    const pageHeightPx = (usableHeightPt * canvas.width) / usableWidth;

    let renderedPx = 0;
    let firstPage = true;

    while (renderedPx < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      sliceCanvas
        .getContext("2d")
        .drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      if (!firstPage) doc.addPage();
      const sliceHeightPt = (sliceHeightPx * usableWidth) / canvas.width;
      doc.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, margin, usableWidth, sliceHeightPt);

      renderedPx += sliceHeightPx;
      firstPage = false;
    }

    const fileBase = (cohortCode || cohortName || formTitle || "Registration_Form")
      .toString()
      .replaceAll(" ", "_");

    doc.save(`${fileBase}_Registration_Form.pdf`);
  } finally {
    element.remove();
  }
};

// Blank, fillable spreadsheet matching a cohort's real registration
// questions — for manual/offline data collection by someone outside the
// MIS. Headers reproduce the exact "<বাংলা> / <English>" bilingual format
// splitBilingualLabel (googleFormImportService.js) already parses on
// import, and "Cohort" matches METADATA_HEADERS there, so the filled file
// can be fed straight into the existing Bulk Import page — every row
// pre-filled with this cohort's code matches back to it via
// findCohortByCode instead of creating a duplicate cohort.
const TEMPLATE_BLANK_ROWS = 50;

const templateHeaderFor = (field) => {
  const bn = field.label_bn?.trim();
  const en = field.label_en?.trim();

  if (bn && en) return `${bn} / ${en}`;
  return bn || en || field.label?.trim() || "Question";
};

export const exportRegistrationTemplateXLSX = ({ cohortCode, formTitle, fields }) => {
  const headers = ["Cohort", ...fields.map(templateHeaderFor)];
  const blankRow = () => [cohortCode || "", ...fields.map(() => "")];

  const aoa = [headers, ...Array.from({ length: TEMPLATE_BLANK_ROWS }, blankRow)];

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

  const fileBase = (cohortCode || formTitle || "Registration_Template")
    .toString()
    .replaceAll(" ", "_");

  XLSX.writeFile(workbook, `${fileBase}_Data_Collection_Template.xlsx`);
};