import { useMemo, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { REPORT_SOURCES } from "../../constants/reportColumns";
import { getReportData } from "../../services/reportService";
import { useAlert } from "../../context/AlertContext";

const FILTER_OPERATORS = [
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does Not Contain" },
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "starts_with", label: "Starts With" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
];

export default function CustomReportBuilder() {
  const { showAlert } = useAlert();

  const [sourceKey, setSourceKey] = useState("participants");
  const [columnSearch, setColumnSearch] = useState("");
  const [availableColumns, setAvailableColumns] = useState(
    REPORT_SOURCES.participants.columns
  );
  const [selectedColumns, setSelectedColumns] = useState(
    REPORT_SOURCES.participants.defaultColumns
  );
  const [rows, setRows] = useState([]);
  const [advancedFilters, setAdvancedFilters] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedColumnObjects = useMemo(() => {
    return selectedColumns
      .map((key) => availableColumns.find((column) => column.key === key))
      .filter(Boolean);
  }, [availableColumns, selectedColumns]);

  const filteredAvailableColumns = useMemo(() => {
    const keyword = columnSearch.toLowerCase().trim();

    if (!keyword) return availableColumns;

    return availableColumns.filter((column) =>
      column.label.toLowerCase().includes(keyword)
    );
  }, [availableColumns, columnSearch]);

  const applyFilter = (row, filter) => {
    if (!filter.field || !filter.operator) return true;

    const filterValue = filter.value;

    if (
      filterValue === "" ||
      filterValue === null ||
      filterValue === undefined
    ) {
      return true;
    }

    const rowValue = row[filter.field];
    const rowText = String(rowValue || "").toLowerCase();
    const filterText = String(filterValue || "").toLowerCase();

    const rowNumber = Number(rowValue);
    const filterNumber = Number(filterValue);

    switch (filter.operator) {
      case "equals":
        return rowText === filterText;

      case "not_equals":
        return rowText !== filterText;

      case "contains":
        return rowText.includes(filterText);

      case "not_contains":
        return !rowText.includes(filterText);

      case "starts_with":
        return rowText.startsWith(filterText);

      case "greater_than":
        return !Number.isNaN(rowNumber) && rowNumber > filterNumber;

      case "less_than":
        return !Number.isNaN(rowNumber) && rowNumber < filterNumber;

      default:
        return true;
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      advancedFilters.every((filter) => applyFilter(row, filter))
    );
  }, [rows, advancedFilters]);

  const handleSourceChange = (value) => {
    const source = REPORT_SOURCES[value];

    setSourceKey(value);
    setRows([]);
    setColumnSearch("");
    setAdvancedFilters([]);
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

  const handleSelectAllColumns = () => {
    setSelectedColumns(availableColumns.map((column) => column.key));
  };

  const handleClearAllColumns = () => {
    setSelectedColumns([]);
  };

  const handleAddFilter = () => {
    setAdvancedFilters((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        field: "",
        operator: "contains",
        value: "",
      },
    ]);
  };

  const handleUpdateFilter = (id, key, value) => {
    setAdvancedFilters((prev) =>
      prev.map((filter) =>
        filter.id === id
          ? {
              ...filter,
              [key]: value,
            }
          : filter
      )
    );
  };

  const handleRemoveFilter = (id) => {
    setAdvancedFilters((prev) => prev.filter((filter) => filter.id !== id));
  };

  const handleClearFilters = () => {
    setAdvancedFilters([]);
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

      const fallbackColumns = REPORT_SOURCES[sourceKey].defaultColumns.filter(
        (key) => result.columns.some((column) => column.key === key)
      );

      setSelectedColumns(
        validSelected.length > 0 ? validSelected : fallbackColumns
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
      subtitle="Build dynamic reports with selected columns and advanced filters"
    >
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-5">
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

            <div className="lg:col-span-2 flex flex-col sm:flex-row sm:items-end sm:justify-end gap-3">
              <div className="text-sm text-gray-500 sm:text-right">
                <p>
                  <span className="font-semibold text-[var(--ann-text-dark)]">
                    {filteredRows.length}
                  </span>{" "}
                  record(s) in preview
                </p>
                <p>
                  <span className="font-semibold text-[var(--ann-text-dark)]">
                    {selectedColumns.length}
                  </span>{" "}
                  selected column(s)
                </p>
              </div>

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

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <aside className="xl:col-span-4 2xl:col-span-3 xl:sticky xl:top-6 space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                    Advanced Filters
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Add conditions to narrow down report data.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  type="button"
                  onClick={handleAddFilter}
                  className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90"
                >
                  + Add Filter
                </button>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold hover:border-red-400 hover:text-red-500"
                >
                  Clear
                </button>
              </div>

              {advancedFilters.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <p className="text-sm text-gray-500">
                    No filters added. The report will show all matching records.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {advancedFilters.map((filter, index) => (
                    <div
                      key={filter.id}
                      className="border border-gray-200 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-[var(--ann-text-dark)]">
                          Filter {index + 1}
                        </p>

                        <button
                          type="button"
                          onClick={() => handleRemoveFilter(filter.id)}
                          className="text-xs font-semibold text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Field
                        </label>
                        <select
                          value={filter.field}
                          onChange={(e) =>
                            handleUpdateFilter(
                              filter.id,
                              "field",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                        >
                          <option value="">Select field</option>
                          {availableColumns.map((column) => (
                            <option key={column.key} value={column.key}>
                              {column.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Operator
                        </label>
                        <select
                          value={filter.operator}
                          onChange={(e) =>
                            handleUpdateFilter(
                              filter.id,
                              "operator",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                        >
                          {FILTER_OPERATORS.map((operator) => (
                            <option
                              key={operator.value}
                              value={operator.value}
                            >
                              {operator.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Value
                        </label>
                        <input
                          value={filter.value}
                          onChange={(e) =>
                            handleUpdateFilter(
                              filter.id,
                              "value",
                              e.target.value
                            )
                          }
                          placeholder="Enter value"
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                    Columns
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedColumns.length} of {availableColumns.length}{" "}
                    selected.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleSelectAllColumns}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={handleClearAllColumns}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold hover:border-red-400 hover:text-red-500"
                >
                  Clear All
                </button>
              </div>

              <div className="mt-4">
                <input
                  value={columnSearch}
                  onChange={(e) => setColumnSearch(e.target.value)}
                  placeholder="Search columns..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>

              <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredAvailableColumns.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No matching column found.
                  </p>
                ) : (
                  filteredAvailableColumns.map((column) => (
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
                  ))
                )}
              </div>
            </div>
          </aside>

          <section className="xl:col-span-8 2xl:col-span-9">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                    Report Preview
                  </h3>
                  <p className="text-sm text-gray-500">
                    {filteredRows.length} record(s) found after applying
                    filters.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-400 cursor-not-allowed"
                  >
                    Export CSV
                  </button>

                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-400 cursor-not-allowed"
                  >
                    Export XLSX
                  </button>
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
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={selectedColumnObjects.length || 1}
                          className="p-8 text-center text-gray-500"
                        >
                          Run report to view data.
                        </td>
                      </tr>
                    ) : selectedColumnObjects.length === 0 ? (
                      <tr>
                        <td className="p-8 text-center text-gray-500">
                          Please select at least one column.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr key={row.id} className="border-t border-gray-100">
                          {selectedColumnObjects.map((column) => (
                            <td
                              key={column.key}
                              className="p-4 text-gray-700 whitespace-nowrap"
                            >
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
          </section>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}