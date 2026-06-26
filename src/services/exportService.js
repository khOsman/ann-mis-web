import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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