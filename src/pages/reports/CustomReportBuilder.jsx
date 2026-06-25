import { useMemo, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { REPORT_SOURCES } from "../../constants/reportColumns";
import { getReportData } from "../../services/reportService";
import { useAlert } from "../../context/AlertContext";

export default function CustomReportBuilder() {
  const { showAlert } = useAlert();

  const [sourceKey, setSourceKey] = useState("participants");
  const [availableColumns, setAvailableColumns] = useState(
    REPORT_SOURCES.participants.columns
  );
  const [selectedColumns, setSelectedColumns] = useState(
    REPORT_SOURCES.participants.defaultColumns
  );
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedColumnObjects = useMemo(() => {
    return availableColumns.filter((column) =>
      selectedColumns.includes(column.key)
    );
  }, [availableColumns, selectedColumns]);

  const handleSourceChange = (value) => {
    setSourceKey(value);
    setRows([]);

    const source = REPORT_SOURCES[value];
    setAvailableColumns(source.columns);
    setSelectedColumns(source.defaultColumns);
  };

  const toggleColumn = (key) => {
    setSelectedColumns((prev) =>
      prev.includes(key)
        ? prev.filter((item) => item !== key)
        : [...prev, key]
    );
  };

  const handleRunReport = async () => {
    setLoading(true);

    try {
      const result = await getReportData(sourceKey);

      setRows(result.rows);
      setAvailableColumns(result.columns);

      const validSelected = selectedColumns.filter((key) =>
        result.columns.some((column) => column.key === key)
      );

      setSelectedColumns(
        validSelected.length > 0
          ? validSelected
          : REPORT_SOURCES[sourceKey].defaultColumns
      );
    } catch (error) {
      showAlert("error", error.message || "Failed to run report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Custom Report Builder"
      subtitle="Build dynamic reports with selected columns"
    >
      <PageContainer className="py-6 lg:py-8 space-y-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Report Source
              </label>
              <select
                value={sourceKey}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
              >
                {Object.entries(REPORT_SOURCES).map(([key, source]) => (
                  <option key={key} value={key}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2 flex items-end justify-end">
              <button
                onClick={handleRunReport}
                disabled={loading}
                className="bg-[var(--ann-pink)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Running..." : "Run Report"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
            Columns
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Select the fields you want to include in the report.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            {availableColumns.map((column) => (
              <label
                key={column.key}
                className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl px-4 py-3 text-sm"
              >
                <span className="font-medium text-gray-700">
                  {column.label}
                </span>
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(column.key)}
                  onChange={() => toggleColumn(column.key)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                Report Result
              </h3>
              <p className="text-sm text-gray-500">
                {rows.length} record(s) found.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-[#F9FAFB] text-gray-500">
                <tr>
                  {selectedColumnObjects.map((column) => (
                    <th key={column.key} className="text-left p-4">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={selectedColumnObjects.length || 1}
                      className="p-6 text-center text-gray-500"
                    >
                      Run report to view data.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100">
                      {selectedColumnObjects.map((column) => (
                        <td key={column.key} className="p-4 text-gray-700">
                          {row[column.key] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}