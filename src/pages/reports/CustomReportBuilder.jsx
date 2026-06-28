import { useMemo, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import {
  FILTER_TYPES,
  REPORT_SOURCES,
  textFilter,
} from "../../constants/reportColumns";
import { getReportData } from "../../services/reportService";
import { useAlert } from "../../context/AlertContext";
import { exportCSV, exportExcel } from "../../services/exportService";

const OPERATOR_MAP = {
  [FILTER_TYPES.TEXT]: [
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does Not Contain" },
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "starts_with", label: "Starts With" },
    { value: "ends_with", label: "Ends With" },
    { value: "is_empty", label: "Is Empty" },
    { value: "is_not_empty", label: "Is Not Empty" },
  ],

  [FILTER_TYPES.NUMBER]: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "greater_than", label: "Greater Than" },
    { value: "greater_or_equal", label: "Greater or Equal" },
    { value: "less_than", label: "Less Than" },
    { value: "less_or_equal", label: "Less or Equal" },
    { value: "between", label: "Between" },
    { value: "is_empty", label: "Is Empty" },
    { value: "is_not_empty", label: "Is Not Empty" },
  ],

  [FILTER_TYPES.DATE]: [
    { value: "equals", label: "On" },
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
    { value: "between", label: "Between" },
    { value: "is_empty", label: "Is Empty" },
    { value: "is_not_empty", label: "Is Not Empty" },
  ],

  [FILTER_TYPES.OPTION]: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "is_empty", label: "Is Empty" },
    { value: "is_not_empty", label: "Is Not Empty" },
  ],
};

const valueIsEmpty = (value) => {
  return value === "" || value === null || value === undefined;
};

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
};

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

  const sourceLabel = REPORT_SOURCES[sourceKey]?.label || "Report";

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

  const getColumnByKey = (fieldKey) => {
    return availableColumns.find((column) => column.key === fieldKey);
  };

  const getFieldType = (fieldKey) => {
    return getColumnByKey(fieldKey)?.filter?.type || FILTER_TYPES.TEXT;
  };

  const getFieldOptions = (fieldKey) => {
    return getColumnByKey(fieldKey)?.filter?.options || [];
  };

  const getOperators = (fieldKey) => {
    const fieldType = getFieldType(fieldKey);
    return OPERATOR_MAP[fieldType] || OPERATOR_MAP[FILTER_TYPES.TEXT];
  };

  const applyFilter = (row, filter) => {
    if (!filter.field || !filter.operator) return true;

    const rowValue = row[filter.field];

    if (filter.operator === "is_empty") {
      return valueIsEmpty(rowValue);
    }

    if (filter.operator === "is_not_empty") {
      return !valueIsEmpty(rowValue);
    }

    if (valueIsEmpty(filter.value)) {
      return true;
    }

    const fieldType = getFieldType(filter.field);

    if (fieldType === FILTER_TYPES.NUMBER) {
      const rowNumber = Number(rowValue);
      const filterNumber = Number(filter.value);
      const filterNumberTo = Number(filter.valueTo);

      switch (filter.operator) {
        case "equals":
          return rowNumber === filterNumber;
        case "not_equals":
          return rowNumber !== filterNumber;
        case "greater_than":
          return rowNumber > filterNumber;
        case "greater_or_equal":
          return rowNumber >= filterNumber;
        case "less_than":
          return rowNumber < filterNumber;
        case "less_or_equal":
          return rowNumber <= filterNumber;
        case "between":
          return rowNumber >= filterNumber && rowNumber <= filterNumberTo;
        default:
          return true;
      }
    }

    if (fieldType === FILTER_TYPES.DATE) {
      const rowDate = parseDate(rowValue);
      const filterDate = parseDate(filter.value);
      const filterDateTo = parseDate(filter.valueTo);

      if (!rowDate || !filterDate) return false;

      switch (filter.operator) {
        case "equals":
          return rowDate.toDateString() === filterDate.toDateString();
        case "before":
          return rowDate < filterDate;
        case "after":
          return rowDate > filterDate;
        case "between":
          return filterDateTo
            ? rowDate >= filterDate && rowDate <= filterDateTo
            : true;
        default:
          return true;
      }
    }

    const rowText = String(rowValue || "").toLowerCase();
    const filterText = String(filter.value || "").toLowerCase();

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
      case "ends_with":
        return rowText.endsWith(filterText);
      default:
        return true;
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (advancedFilters.length === 0) return true;

      return advancedFilters.reduce((result, filter, index) => {
        const currentMatch = applyFilter(row, filter);

        if (index === 0) return currentMatch;

        if (filter.logic === "OR") {
          return result || currentMatch;
        }

        return result && currentMatch;
      }, true);
    });
  }, [rows, advancedFilters, availableColumns]);

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
        logic: "AND",
        field: "",
        operator: "contains",
        value: "",
        valueTo: "",
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

  const handleFieldChange = (filterId, fieldKey) => {
    const operators = getOperators(fieldKey);
    const defaultOperator = operators[0]?.value || "contains";

    setAdvancedFilters((prev) =>
      prev.map((filter) =>
        filter.id === filterId
          ? {
              ...filter,
              field: fieldKey,
              operator: defaultOperator,
              value: "",
              valueTo: "",
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

      const columnsWithFilter = result.columns.map((column) => ({
        ...column,
        filter: column.filter || textFilter,
      }));

      setRows(result.rows);
      setAvailableColumns(columnsWithFilter);

      const validSelected = selectedColumns.filter((key) =>
        columnsWithFilter.some((column) => column.key === key)
      );

      const fallbackColumns = REPORT_SOURCES[sourceKey].defaultColumns.filter(
        (key) => columnsWithFilter.some((column) => column.key === key)
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

  const handleExportCSV = () => {
    exportCSV({
      rows: filteredRows,
      columns: selectedColumnObjects,
      sourceLabel,
    });
  };

  const handleExportExcel = () => {
    exportExcel({
      rows: filteredRows,
      columns: selectedColumnObjects,
      sourceLabel,
    });
  };

  const renderFilterValueInput = (filter) => {
    const fieldType = getFieldType(filter.field);
    const options = getFieldOptions(filter.field);

    if (filter.operator === "is_empty" || filter.operator === "is_not_empty") {
      return (
        <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-500">
          No value required
        </div>
      );
    }

    if (filter.operator === "between") {
      const inputType =
        fieldType === FILTER_TYPES.DATE
          ? "date"
          : fieldType === FILTER_TYPES.NUMBER
          ? "number"
          : "text";

      return (
        <div className="grid grid-cols-2 gap-2">
          <input
            type={inputType}
            value={filter.value}
            onChange={(e) =>
              handleUpdateFilter(filter.id, "value", e.target.value)
            }
            placeholder="From"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
          />

          <input
            type={inputType}
            value={filter.valueTo}
            onChange={(e) =>
              handleUpdateFilter(filter.id, "valueTo", e.target.value)
            }
            placeholder="To"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
          />
        </div>
      );
    }

    if (fieldType === FILTER_TYPES.OPTION) {
      return (
        <select
          value={filter.value}
          onChange={(e) =>
            handleUpdateFilter(filter.id, "value", e.target.value)
          }
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
        >
          <option value="">Select value</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={fieldType === FILTER_TYPES.NUMBER ? "number" : fieldType === FILTER_TYPES.DATE ? "date" : "text"}
        value={filter.value}
        onChange={(e) =>
          handleUpdateFilter(filter.id, "value", e.target.value)
        }
        placeholder="Enter value"
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
      />
    );
  };

  return (
  <AdminLayout
    title="Custom Report Builder"
    subtitle="Build dynamic reports with selected columns and advanced filters"
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                Advanced Filters
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Use AND / OR conditions to narrow down report data.
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

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Match
                      </label>

                      {index === 0 ? (
                        <input
                          value="First Condition"
                          disabled
                          className="w-full border border-gray-200 bg-gray-100 rounded-xl px-3 py-2 text-sm text-gray-400"
                        />
                      ) : (
                        <select
                          value={filter.logic || "AND"}
                          onChange={(e) =>
                            handleUpdateFilter(
                              filter.id,
                              "logic",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      )}
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
                        {getOperators(filter.field).map((operator) => (
                          <option key={operator.value} value={operator.value}>
                            {operator.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Value
                      </label>
                      {renderFilterValueInput(filter)}
                    </div>
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
                {selectedColumns.length} of {availableColumns.length} selected.
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
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Report Preview
            </h3>
            <p className="text-sm text-gray-500">
              {filteredRows.length} record(s) found after applying filters.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={
                filteredRows.length === 0 ||
                selectedColumnObjects.length === 0
              }
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={
                filteredRows.length === 0 ||
                selectedColumnObjects.length === 0
              }
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
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
    </PageContainer>
  </AdminLayout>
);
}