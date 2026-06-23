import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { db } from "../../firebase";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { FIELD_TYPES } from "../../constants/fieldTypes";

export default function FormBuilder() {
  const { id } = useParams();
  const { showAlert } = useAlert();

  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [saving, setSaving] = useState(false);

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId),
    [fields, selectedFieldId]
  );

  const fetchFields = async () => {
    const q = query(collection(db, "form_fields"), where("form_id", "==", id));
    const snapshot = await getDocs(q);

    const data = snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    setFields(data);
  };

  useEffect(() => {
    fetchFields();
  }, [id]);

  const handleAddField = async (fieldType) => {
    setSaving(true);

    try {
      const docRef = await addDoc(collection(db, "form_fields"), {
        form_id: id,

        label: fieldType.defaultLabel,
        label_en: fieldType.defaultLabel,
        label_bn: "",

        field_type: fieldType.type,

        placeholder: fieldType.placeholder || "",
        placeholder_en: fieldType.placeholder || "",
        placeholder_bn: "",

        required: true,
        options: fieldType.defaultOptions || [],

        order: fields.length + 1,

        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      showAlert("success", `${fieldType.label} field added.`);
      await fetchFields();
      setSelectedFieldId(docRef.id);
    } catch (error) {
      console.error("Failed to add field:", error);
      showAlert("error", error.message || "Failed to add field.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateField = async (fieldId, updates) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );

    await updateDoc(doc(db, "form_fields", fieldId), {
      ...updates,
      updated_at: serverTimestamp(),
    });
  };

  const handleDeleteField = async (fieldId) => {
    try {
      await deleteDoc(doc(db, "form_fields", fieldId));
      showAlert("success", "Field removed successfully.");
      setSelectedFieldId(null);
      fetchFields();
    } catch (error) {
      console.error("Failed to delete field:", error);
      showAlert("error", error.message || "Failed to delete field.");
    }
  };

  const renderFieldPreview = (field) => {
    const baseClass =
      "w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-sm";

    const previewLabel = field.label_bn
      ? `${field.label_en || field.label} / ${field.label_bn}`
      : field.label_en || field.label;

    const previewPlaceholder = field.placeholder_bn
      ? `${field.placeholder_en || field.placeholder || ""} / ${field.placeholder_bn}`
      : field.placeholder_en || field.placeholder || "";

    if (field.field_type === "textarea") {
      return (
        <textarea
          disabled
          placeholder={previewPlaceholder}
          className={`${baseClass} min-h-24`}
        />
      );
    }

    if (field.field_type === "dropdown") {
      return (
        <select disabled className={baseClass}>
          <option>{previewLabel}</option>
          {(field.options || []).map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (field.field_type === "radio") {
      return (
        <div className="space-y-2">
          {(field.options || []).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input type="radio" disabled />
              {option}
            </label>
          ))}
        </div>
      );
    }

    if (field.field_type === "checkbox") {
      return (
        <div className="space-y-2">
          {(field.options || []).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled />
              {option}
            </label>
          ))}
        </div>
      );
    }

    return (
      <input
        disabled
        type={field.field_type === "phone" ? "text" : field.field_type}
        placeholder={previewPlaceholder}
        className={baseClass}
      />
    );
  };

  return (
    <AdminLayout title="Form Builder" subtitle="Build registration form fields">
      <PageContainer className="py-6 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <aside className="xl:col-span-3 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Field Toolbox
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Click a field type to add it.
            </p>

            <div className="grid grid-cols-1 gap-3 mt-5">
              {FIELD_TYPES.map((fieldType) => {
                const Icon = fieldType.icon;

                return (
                  <button
                    key={fieldType.type}
                    type="button"
                    disabled={saving}
                    onClick={() => handleAddField(fieldType)}
                    className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-left hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] transition disabled:opacity-50"
                  >
                    <Icon size={18} />
                    <span className="font-semibold text-sm">
                      {fieldType.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="xl:col-span-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Form Canvas
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Live preview of your registration form.
            </p>

            <div className="mt-6 space-y-4">
              {fields.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-500">
                  No fields added yet. Start from the toolbox.
                </div>
              ) : (
                fields.map((field, index) => (
                  <div
                    key={field.id}
                    onClick={() => setSelectedFieldId(field.id)}
                    className={`border rounded-2xl p-4 cursor-pointer transition ${
                      selectedFieldId === field.id
                        ? "border-[var(--ann-pink)] bg-pink-50/30"
                        : "border-gray-200 hover:border-[var(--ann-pink)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <label className="font-semibold text-gray-800">
                        {index + 1}. {field.label_en || field.label}
                        {field.label_bn && (
                          <span className="text-gray-500">
                            {" "}
                            / {field.label_bn}
                          </span>
                        )}
                        {field.required && (
                          <span className="text-[var(--ann-pink)]"> *</span>
                        )}
                      </label>

                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                        {field.field_type}
                      </span>
                    </div>

                    {renderFieldPreview(field)}
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="xl:col-span-3 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Field Settings
            </h3>

            {!selectedField ? (
              <p className="text-sm text-gray-500 mt-4">
                Select a field from the canvas to edit its settings.
              </p>
            ) : (
              <div className="space-y-4 mt-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Label English
                  </label>
                  <input
                    value={selectedField.label_en || selectedField.label || ""}
                    onChange={(e) =>
                      handleUpdateField(selectedField.id, {
                        label: e.target.value,
                        label_en: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Label Bangla
                  </label>
                  <input
                    value={selectedField.label_bn || ""}
                    onChange={(e) =>
                      handleUpdateField(selectedField.id, {
                        label_bn: e.target.value,
                      })
                    }
                    placeholder="পূর্ণ নাম"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Placeholder English
                  </label>
                  <input
                    value={
                      selectedField.placeholder_en ||
                      selectedField.placeholder ||
                      ""
                    }
                    onChange={(e) =>
                      handleUpdateField(selectedField.id, {
                        placeholder: e.target.value,
                        placeholder_en: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Placeholder Bangla
                  </label>
                  <input
                    value={selectedField.placeholder_bn || ""}
                    onChange={(e) =>
                      handleUpdateField(selectedField.id, {
                        placeholder_bn: e.target.value,
                      })
                    }
                    placeholder="আপনার উত্তর লিখুন"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!selectedField.required}
                    onChange={(e) =>
                      handleUpdateField(selectedField.id, {
                        required: e.target.checked,
                      })
                    }
                  />
                  Required field
                </label>

                {["dropdown", "radio", "checkbox"].includes(
                  selectedField.field_type
                ) && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Options
                    </label>
                    <textarea
                      value={(selectedField.options || []).join("\n")}
                      onChange={(e) =>
                        handleUpdateField(selectedField.id, {
                          options: e.target.value
                            .split("\n")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        })
                      }
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm min-h-28 focus:outline-none focus:border-[var(--ann-pink)]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Add one option per line. Bangla option support will be added next.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteField(selectedField.id)}
                  className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Delete Field
                </button>
              </div>
            )}
          </aside>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}