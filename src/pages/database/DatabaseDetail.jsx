import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { useDatabases, useDataPointsByDatabase } from "../../hooks";
import { FIELD_TYPES } from "../../constants/fieldTypes";
import { createDataPoint, deleteDataPoint } from "../../services/dataPointService";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const DATA_POINT_FIELD_TYPES = FIELD_TYPES.filter((type) => type.type !== "section");

const slugifyKey = (label) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export default function DatabaseDetail() {
  const { databaseId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { isViewer } = useAuth();

  const { data: databases } = useDatabases();
  const database = databases.find((item) => item.id === databaseId);

  const { data: dataPoints, loading } = useDataPointsByDatabase(databaseId);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [labelEn, setLabelEn] = useState("");
  const [labelBn, setLabelBn] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [optionsText, setOptionsText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const resetForm = () => {
    setLabelEn("");
    setLabelBn("");
    setFieldType("text");
    setOptionsText("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!labelEn.trim()) {
      showAlert("warning", "Data point label is required.");
      return;
    }

    const key = slugifyKey(labelEn);
    if (dataPoints.some((item) => item.key === key)) {
      showAlert("warning", "A data point with a similar name already exists in this database.");
      return;
    }

    const needsOptions = ["dropdown", "radio", "checkbox"].includes(fieldType);
    const options = needsOptions
      ? optionsText
          .split(",")
          .map((option) => option.trim())
          .filter(Boolean)
      : [];

    setCreating(true);

    try {
      await createDataPoint({
        databaseId,
        key,
        label_en: labelEn.trim(),
        label_bn: labelBn.trim(),
        field_type: fieldType,
        options,
      });

      showAlert("success", "Data point created successfully.");
      resetForm();
      setShowCreateForm(false);
    } catch (error) {
      showAlert("error", error.message || "Failed to create data point.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);

    try {
      await deleteDataPoint(target);
      showAlert("success", "Data point deleted successfully.");
    } catch (error) {
      showAlert("error", error.message || "Failed to delete data point.");
    }
  };

  return (
    <AdminLayout
      title={database?.name || "Database"}
      subtitle="Data points defined in this database"
    >
      <PageContainer className="py-6 lg:py-8">
        <button
          onClick={() => navigate("/admin/database")}
          className="text-sm font-semibold text-[var(--ann-pink)] mb-5 inline-block"
        >
          ← Back to Databases
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                {database?.name || "Database"}
              </h3>
              <p className="text-sm text-gray-500">
                {database?.description || "Data points in this database."}
              </p>
            </div>

            {!isViewer && (
              <button
                onClick={() => setShowCreateForm((prev) => !prev)}
                className="bg-[var(--ann-pink)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
              >
                {showCreateForm ? "Cancel" : "+ Add Data Point"}
              </button>
            )}
          </div>

          {showCreateForm && (
            <form
              onSubmit={handleCreate}
              className="mb-6 border border-gray-200 rounded-2xl p-5 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Label (English)
                </label>
                <input
                  value={labelEn}
                  onChange={(e) => setLabelEn(e.target.value)}
                  placeholder="e.g. Preferred Language"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Label (Bangla, optional)
                </label>
                <input
                  value={labelBn}
                  onChange={(e) => setLabelBn(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Field Type
                </label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                >
                  {DATA_POINT_FIELD_TYPES.map((type) => (
                    <option key={type.type} value={type.type}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {["dropdown", "radio", "checkbox"].includes(fieldType) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Options (comma-separated)
                  </label>
                  <input
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="Option 1, Option 2"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-[var(--ann-pink)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Data Point"}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-[#F9FAFB] text-gray-500">
                <tr>
                  <th className="text-left p-4">Label</th>
                  <th className="text-left p-4">Key</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500">
                      Loading data points...
                    </td>
                  </tr>
                ) : dataPoints.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500">
                      No data point found.
                    </td>
                  </tr>
                ) : (
                  dataPoints.map((dataPoint) => (
                    <tr key={dataPoint.id} className="border-t border-gray-100">
                      <td className="p-4 font-semibold text-[var(--ann-text-dark)]">
                        <div>{dataPoint.label_en}</div>
                        {dataPoint.is_system && (
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-lg">
                            System
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-gray-600">
                        <code className="bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg text-xs">
                          {dataPoint.key}
                        </code>
                      </td>

                      <td className="p-4 text-gray-600">{dataPoint.field_type}</td>

                      <td className="p-4">
                        {!isViewer && !dataPoint.is_system && (
                          <button
                            onClick={() => setDeleteTarget(dataPoint)}
                            className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageContainer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Data Point?"
        message="This can only be deleted once no form field is mapped to it."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
