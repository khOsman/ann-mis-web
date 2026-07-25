import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { ROUTES } from "../../constants/routes";
import {
  parseWorkbookFile,
  buildImportPreview,
  runImport,
} from "../../services/googleFormImportService";
import { formatBDPhone } from "../../utils/phone";

export default function BulkImportParticipants() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState(null); // { fieldDefs, groups }
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setPreview(null);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      showAlert("warning", "Please select a CSV or XLSX file first.");
      return;
    }

    setAnalyzing(true);

    try {
      const { headers, rows } = await parseWorkbookFile(file);
      const previewResult = await buildImportPreview({ headers, rows });

      if (previewResult.groups.length === 0) {
        showAlert(
          "error",
          "No rows with a Cohort value were found. Make sure the file has a 'Cohort' column."
        );
        return;
      }

      setPreview(previewResult);
    } catch (error) {
      console.error("Failed to analyze file:", error);
      showAlert("error", error.message || "Failed to analyze the file.");
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleRowDecision = (cohortValue, rowIndex) => {
    setPreview((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        groups: prev.groups.map((group) => {
          if (group.cohortValue !== cohortValue) return group;

          return {
            ...group,
            rows: group.rows.map((row) =>
              row.rowIndex === rowIndex
                ? { ...row, decision: row.decision === "import" ? "skip" : "import" }
                : row
            ),
          };
        }),
      };
    });
  };

  const totalToImport = preview
    ? preview.groups.reduce(
        (sum, group) => sum + group.rows.filter((r) => r.decision === "import").length,
        0
      )
    : 0;

  const handleConfirm = async () => {
    if (!preview) return;

    setImporting(true);

    try {
      const summary = await runImport(preview);
      setResult(summary);
      setPreview(null);
      setFile(null);
      showAlert("success", `Imported ${summary.totalImported} participant(s).`);
    } catch (error) {
      console.error("Bulk import failed:", error);
      showAlert("error", error.message || "Failed to import participants.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminLayout
      title="Bulk Import Participants"
      subtitle="Import legacy Google Form registrations (super admin only)"
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <button
          onClick={() => navigate(ROUTES.participants)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to Participants
        </button>

        {!preview && !result && (
          <div className="bg-white rounded-2xl border p-6">
            <h3 className="text-lg font-bold mb-2">Upload Google Form Export</h3>
            <p className="text-sm text-gray-500 mb-5">
              Upload the CSV or XLSX export of the Google Form used for past
              registrations. The file must include a "Cohort" column — every
              other column becomes a dynamic form field, and each row becomes a
              participant. A cohort that doesn't exist yet will be created
              automatically.
            </p>

            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="border border-gray-300 rounded-xl px-4 py-3 text-sm"
              />

              <button
                type="button"
                disabled={analyzing || !file}
                onClick={handleAnalyze}
                className="bg-[var(--ann-pink)] text-white px-5 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {analyzing ? "Analyzing..." : "Analyze File"}
              </button>
            </div>

            {file && (
              <p className="text-xs text-gray-500 mt-3">Selected file: {file.name}</p>
            )}
          </div>
        )}

        {preview && (
          <>
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="text-lg font-bold mb-2">Preview</h3>
              <p className="text-sm text-gray-500">
                {preview.fieldDefs.length} question column(s) detected — each
                will become a form field. Duplicate rows (email already
                registered in that cohort) are flagged and default to skipped;
                toggle to import anyway.
              </p>
            </div>

            {preview.groups.map((group) => (
              <div
                key={group.cohortValue}
                className="bg-white rounded-2xl border overflow-hidden"
              >
                <div className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-[var(--ann-text-dark)]">
                      {group.cohortValue}
                      {group.cohortCode !== group.cohortValue && (
                        <span className="text-gray-400 font-normal">
                          {" "}
                          → {group.cohortCode}
                        </span>
                      )}{" "}
                      <span
                        className={`ml-2 text-xs font-semibold px-2 py-1 rounded-full ${
                          group.cohortExists
                            ? "bg-purple-50 text-[var(--ann-purple)]"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {group.cohortExists ? "Existing cohort" : "New cohort"}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {group.rows.length} row(s) •{" "}
                      {group.rows.filter((r) => r.decision === "import").length} will be
                      imported
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full min-w-[880px] text-sm">
                    <thead className="bg-[#F9FAFB] text-gray-500 sticky top-0">
                      <tr>
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Phone</th>
                        <th className="text-left p-3">Gender</th>
                        <th className="text-left p-3">Institution</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-center p-3">Import?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={`border-t border-gray-100 ${
                            row.isDuplicate ? "bg-yellow-50" : ""
                          }`}
                        >
                          <td className="p-3 font-semibold">{row.name || "-"}</td>
                          <td className="p-3">{row.email || "-"}</td>
                          <td className="p-3">{formatBDPhone(row.phone) || "-"}</td>
                          <td className="p-3">{row.gender || "-"}</td>
                          <td className="p-3">{row.institution || "-"}</td>
                          <td className="p-3">
                            {row.isDuplicate ? (
                              <span className="text-xs font-semibold text-yellow-700">
                                Duplicate email
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">New</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.decision === "import"}
                              onChange={() => toggleRowDecision(group.cohortValue, row.rowIndex)}
                              className="accent-[var(--ann-pink)]"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing || totalToImport === 0}
                onClick={handleConfirm}
                className="bg-[var(--ann-pink)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {importing
                  ? "Importing..."
                  : `Confirm Import (${totalToImport} row${totalToImport === 1 ? "" : "s"})`}
              </button>
            </div>
          </>
        )}

        {result && (
          <div className="bg-white rounded-2xl border p-6">
            <h3 className="text-lg font-bold mb-4">Import Complete</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Participants imported</p>
                <p className="text-2xl font-bold text-[var(--ann-text-dark)]">
                  {result.totalImported}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Rows skipped</p>
                <p className="text-2xl font-bold text-[var(--ann-text-dark)]">
                  {result.totalSkipped}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Cohorts created</p>
                <p className="font-semibold">
                  {result.cohortsCreated.length > 0
                    ? result.cohortsCreated.join(", ")
                    : "None"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Cohorts reused</p>
                <p className="font-semibold">
                  {result.cohortsReused.length > 0
                    ? result.cohortsReused.join(", ")
                    : "None"}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => navigate(ROUTES.participants)}
                className="bg-[var(--ann-pink)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90"
              >
                View Participants
              </button>
            </div>
          </div>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
