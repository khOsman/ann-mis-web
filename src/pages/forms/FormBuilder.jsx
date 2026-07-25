import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { GripVertical, Trash2 } from "lucide-react";
import { db } from "../../firebase";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { FIELD_TYPES } from "../../constants/fieldTypes";
import RichTextEditor from "../../components/common/RichTextEditor";
import { isSlugAvailable } from "../../services/formService";
import { useForm as useFormDoc, useFormFields } from "../../hooks";

function SortableField({ field, index, selectedFieldId, setSelectedFieldId, renderFieldPreview }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: field.id });
    

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => setSelectedFieldId(field.id)}
      className={`border rounded-2xl p-4 cursor-pointer transition bg-white ${
        selectedFieldId === field.id
          ? "border-[var(--ann-pink)] bg-pink-50/30"
          : "border-gray-200 hover:border-[var(--ann-pink)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 text-gray-400 hover:text-[var(--ann-pink)] cursor-grab"
          >
            <GripVertical size={18} />
          </button>

          <label className="font-semibold text-gray-800">
            {index + 1}. {field.label_en || field.label}
            {field.label_bn && <span className="text-gray-500"> / {field.label_bn}</span>}
            {field.required && <span className="text-[var(--ann-pink)]"> *</span>}
          </label>
        </div>

        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
          {field.field_type}
        </span>
      </div>

      {renderFieldPreview(field)}
    </div>
  );
}

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const { data: formMeta } = useFormDoc(id);
  const { data: liveFields } = useFormFields(id);

  // Local mirror of the live fields, kept in sync via the effect below.
  // Kept local (rather than rendering `liveFields` directly) so drag reorder
  // and text-input edits can update instantly without waiting on a Firestore
  // round-trip + listener echo — the live data reconciles it moments later.
  const [fields, setFields] = useState([]);

  useEffect(() => {
    setFields(liveFields);
  }, [liveFields]);

  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId),
    [fields, selectedFieldId]
  );

  const handleAddField = async (fieldType) => {
    setSaving(true);

    try {
      const docRef = await addDoc(collection(db, "form_fields"), {
        form_id: id,
        label: fieldType.defaultLabel,
        label_en: fieldType.defaultLabel,
        label_bn: "",
        description_en: fieldType.defaultDescription || "",
        description_bn: "",
        field_type: fieldType.type,
        placeholder: fieldType.placeholder || "",
        placeholder_en: fieldType.placeholder || "",
        placeholder_bn: "",
        required: true,
        validation: {
          min_age: "",
          max_age: "",
          min_value: "",
          max_value: "",
          min_length: "",
          max_length: "",
          pattern: "",
          error_message_en: "",
          error_message_bn: "",
        },
        options: fieldType.defaultOptions || [],
        order: fields.length + 1,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      showAlert("success", `${fieldType.label} field added.`);
      // No manual refetch — the live listener picks up the new field
      // automatically, briefly rendering "Select a field..." until it does.
      setSelectedFieldId(docRef.id);
    } catch (error) {
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
      // No manual refetch needed — the live listener updates `fields` automatically.
    } catch (error) {
      showAlert("error", error.message || "Failed to delete field.");
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((field) => field.id === active.id);
    const newIndex = fields.findIndex((field) => field.id === over.id);

    const reorderedFields = arrayMove(fields, oldIndex, newIndex).map(
      (field, index) => ({
        ...field,
        order: index + 1,
      })
    );

    setFields(reorderedFields);

    try {
      await Promise.all(
        reorderedFields.map((field) =>
          updateDoc(doc(db, "form_fields", field.id), {
            order: field.order,
            updated_at: serverTimestamp(),
          })
        )
      );

      showAlert("success", "Field order updated.");
    } catch (error) {
      showAlert("error", error.message || "Failed to update field order.");
      setFields(liveFields); // roll back the optimistic reorder to the live truth
    }
  };

  const renderFieldPreview = (field) => {
    const baseClass =
      "w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-sm";

    const previewPlaceholder = field.placeholder_bn
      ? `${field.placeholder_en || field.placeholder || ""} / ${field.placeholder_bn}`
      : field.placeholder_en || field.placeholder || "";

    if (field.field_type === "section") {
      return (
        <div className="bg-[var(--ann-purple)] text-white rounded-2xl p-5">
          <h3 className="text-xl font-bold">
            {field.label_bn
              ? `${field.label_en || field.label} / ${field.label_bn}`
              : field.label_en || field.label}
          </h3>

          {(field.description_en || field.description_bn) && (
            <p className="text-sm text-purple-100 mt-2 leading-6">
              {field.description_bn
                ? `${field.description_en || ""} / ${field.description_bn}`
                : field.description_en}
            </p>
          )}
        </div>
      );
    }


    if (field.field_type === "textarea") {
      return <textarea disabled placeholder={previewPlaceholder} className={`${baseClass} min-h-24`} />;
    }

    if (field.field_type === "dropdown") {
      return (
        <select disabled className={baseClass}>
          <option>{field.label_bn ? `${field.label_en || field.label} / ${field.label_bn}` : field.label_en || field.label}</option>
          {(field.options || []).map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (field.field_type === "radio" || field.field_type === "checkbox") {
      return (
        <div className="space-y-2">
          {(field.options || []).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input type={field.field_type} disabled />
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

    const handleUpdateFormStatus = async (nextStatus) => {
    if (nextStatus === "Published") {
        const slugAvailable = await isSlugAvailable(formMeta.public_slug, formMeta.id);

        if (!slugAvailable) {
          showAlert("warning", "This public slug is already used by another form.");
          return;
        }
        
        if (!formMeta?.public_slug) {
        showAlert("warning", "Public slug is required before publishing.");
        return;
        }

        if (fields.length === 0) {
        showAlert("warning", "Please add at least one field before publishing.");
        return;
        }
    }

    try {
        await updateDoc(doc(db, "forms", id), {
        status: nextStatus,
        updated_at: serverTimestamp(),
        });

        showAlert("success", `Form status updated to ${nextStatus}.`);
    } catch (error) {
        showAlert("error", error.message || "Failed to update form status.");
    }
    };

    // Was called by the Description editors below but never defined —
    // editing a form's description in the Builder threw a ReferenceError.
    // Matches the sibling handlers' pattern (direct write, live doc reflects it).
    const handleUpdateForm = async (updates) => {
      try {
        await updateDoc(doc(db, "forms", id), {
          ...updates,
          updated_at: serverTimestamp(),
        });
      } catch (error) {
        showAlert("error", error.message || "Failed to update form.");
      }
    };

    const handleUseDefaultBanner = async () => {
  try {
    await updateDoc(doc(db, "forms", id), {
      banner_type: "default",
      banner_url: "/default-form-banner.png",
      banner_file_name: "",
      updated_at: serverTimestamp(),
    });

    showAlert("success", "Default banner applied.");
  } catch (error) {
    showAlert("error", error.message || "Failed to update banner.");
  }
};

const handleBannerUrlChange = async (url) => {
  try {
    await updateDoc(doc(db, "forms", id), {
      banner_type: "custom",
      banner_url: url,
      banner_file_name: "",
      updated_at: serverTimestamp(),
    });

    showAlert("success", "Custom banner URL saved.");
  } catch (error) {
    showAlert("error", error.message || "Failed to save banner URL.");
  }
};

const handleCopyLink = async () => {
  try {
    await navigator.clipboard.writeText(
      `${window.location.origin}/form/${formMeta.public_slug}`
    );

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  } catch (error) {
    showAlert("error", "Failed to copy link.");
  }
};

  return (
    <AdminLayout title="Form Builder" subtitle="Build registration form fields">
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
            {formMeta?.form_title || "Untitled Form"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
            Status:{" "}
            <span className="font-semibold text-[var(--ann-pink)]">
                {formMeta?.status || "Draft"}
            </span>
            </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/admin/forms/${id}/edit`)}
          className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
        >
          Edit Form Info
        </button>

        {formMeta?.status === "Published" && (
  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
    <p className="text-sm font-semibold text-green-700">
      Public form is live
    </p>

    <div className="flex flex-col sm:flex-row gap-3 mt-3">
      <input
        readOnly
        value={`${window.location.origin}/form/${formMeta.public_slug}`}
        className="flex-1 border border-green-200 rounded-xl px-4 py-2 text-sm bg-white"
      />

      <button
        type="button"
        onClick={handleCopyLink}
        className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            copied
            ? "bg-green-500 text-white"
            : "border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
        }`}
        >
        {copied ? "✓ Copied" : "Copy Link"}
    </button>

      <button
        type="button"
        onClick={() =>
          window.open(`/form/${formMeta.public_slug}`, "_blank")
        }
        className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold"
      >
        Open
      </button>
    </div>
  </div>
)}

        <div className="flex flex-wrap gap-3">
            <button
            type="button"
            onClick={() => handleUpdateFormStatus("Published")}
            className="bg-[var(--ann-pink)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
            >
            Publish
            </button>

            <button
            type="button"
            onClick={() => handleUpdateFormStatus("Closed")}
            className=" border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
            >
            Close
            </button>

            <button
            type="button"
            onClick={() => handleUpdateFormStatus("Draft")}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
            >
            Move to Draft
            </button>
        </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-5">
        {/* Banner */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                Form Banner
            </h3>
            <p className="text-sm text-gray-500 mt-1">
                This banner will appear on the public registration form.
            </p>

            <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                <img
                src={formMeta?.banner_url || "/default-form-banner.png"}
                alt="Form banner"
                className="w-full h-44 object-cover"
                />
            </div>
            </div>

            <div className="w-full lg:w-80">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Custom Banner URL
            </label>

            <input
                defaultValue={
                formMeta?.banner_type === "custom" ? formMeta?.banner_url : ""
                }
                placeholder="Paste image URL here"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                onBlur={(e) => {
                if (e.target.value.trim()) {
                    handleBannerUrlChange(e.target.value.trim());
                }
                }}
            />

            <button
                type="button"
                onClick={handleUseDefaultBanner}
                className="mt-3 w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
            >
                Use Default Banner
            </button>

            <p className="text-xs text-gray-500 mt-2">
                Upload support will be added later with Firebase Storage.
            </p>
            </div></div>
        </div>
        {/* Description */}
        {formMeta && (<div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-5 grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description English
              </label>

              <RichTextEditor
                value={formMeta.description_en || ""}
                onChange={(value) =>
                  handleUpdateForm({
                    description_en: value,
                  })
                }
              />
            </div>

           <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description Bangla
              </label>

              <RichTextEditor
                value={formMeta.description_bn || ""}
                onChange={(value) =>
                  handleUpdateForm({
                    description_bn: value,
                  })
                }
              />
            </div>
          </div>)}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <aside className="xl:col-span-3 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">Field Toolbox</h3>
            <p className="text-sm text-gray-500 mt-1">Click a field type to add it.</p>

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
                    <span className="font-semibold text-sm">{fieldType.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          

          <section className="xl:col-span-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">Form Canvas</h3>
            <p className="text-sm text-gray-500 mt-1">
              Drag fields to reorder. Click a field to edit settings.
            </p>

            

            <div className="mt-6 space-y-4">
              {fields.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-500">
                  No fields added yet. Start from the toolbox.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={fields.map((field) => field.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <SortableField
                          key={field.id}
                          field={field}
                          index={index}
                          selectedFieldId={selectedFieldId}
                          setSelectedFieldId={setSelectedFieldId}
                          renderFieldPreview={renderFieldPreview}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </section>

          <aside className="xl:col-span-3 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">Field Settings</h3>

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

                {selectedField.field_type !== "section" && (
                  <>
                
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Placeholder English
                      </label>
                      <input
                        value={selectedField.placeholder_en || selectedField.placeholder || ""}
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
                 </>
                )}

                {selectedField.field_type === "date" && (
                  <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
                    <h4 className="font-bold text-[var(--ann-text-dark)]">
                      Age Validation
                    </h4>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Minimum Age
                      </label>
                      <input
                        type="number"
                        value={selectedField.validation?.min_age || ""}
                        onChange={(e) =>
                          handleUpdateField(selectedField.id, {
                            validation: {
                              ...(selectedField.validation || {}),
                              min_age: e.target.value,
                            },
                          })
                        }
                        placeholder="18"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Maximum Age
                      </label>
                      <input
                        type="number"
                        value={selectedField.validation?.max_age || ""}
                        onChange={(e) =>
                          handleUpdateField(selectedField.id, {
                            validation: {
                              ...(selectedField.validation || {}),
                              max_age: e.target.value,
                            },
                          })
                        }
                        placeholder="35"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Error Message English
                      </label>
                      <input
                        value={selectedField.validation?.error_message_en || ""}
                        onChange={(e) =>
                          handleUpdateField(selectedField.id, {
                            validation: {
                              ...(selectedField.validation || {}),
                              error_message_en: e.target.value,
                            },
                          })
                        }
                        placeholder="Age must be between 18 and 35 years."
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Error Message Bangla
                      </label>
                      <input
                        value={selectedField.validation?.error_message_bn || ""}
                        onChange={(e) =>
                          handleUpdateField(selectedField.id, {
                            validation: {
                              ...(selectedField.validation || {}),
                              error_message_bn: e.target.value,
                            },
                          })
                        }
                        placeholder="বয়স ১৮ থেকে ৩৫ বছরের মধ্যে হতে হবে।"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
                      />
                    </div>
                  </div>
                )}

                {selectedField.field_type === "phone" && (
                <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
                  <h4 className="font-bold text-[var(--ann-text-dark)]">
                    Mobile Number Validation
                  </h4>

                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={
                        selectedField.validation?.pattern === "^01[0-9]{9}$"
                      }
                      onChange={(e) =>
                        handleUpdateField(selectedField.id, {
                          validation: {
                            ...(selectedField.validation || {}),
                            pattern: e.target.checked ? "^01[0-9]{9}$" : "",
                            error_message_en: e.target.checked
                              ? "Please enter a valid 11-digit Bangladeshi mobile number."
                              : "",
                            error_message_bn: e.target.checked
                              ? "সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন।"
                              : "",
                          },
                        })
                      }
                    />
                    Require valid Bangladeshi mobile number
                  </label>
                </div>
              )}


                {["dropdown", "radio", "checkbox"].includes(selectedField.field_type) && (
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
                      Add one option per line.
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