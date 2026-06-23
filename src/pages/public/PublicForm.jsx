import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import { db } from "../../firebase";

export default function PublicForm() {
  const { slug } = useParams();

  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [formMeta, setFormMeta] = useState(null);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    const fetchPublicForm = async () => {
      try {
        const formQuery = query(
          collection(db, "forms"),
          where("public_slug", "==", slug)
        );

        const formSnapshot = await getDocs(formQuery);

        if (formSnapshot.empty) {
          setFormMeta(null);
          setLoading(false);
          return;
        }

        const formDoc = formSnapshot.docs[0];
        const formData = {
          id: formDoc.id,
          ...formDoc.data(),
        };

        if (formData.is_deleted === true || formData.status !== "Published") {
          setFormMeta(null);
          setLoading(false);
          return;
        }

        setFormMeta(formData);

        const fieldsQuery = query(
          collection(db, "form_fields"),
          where("form_id", "==", formDoc.id)
        );

        const fieldsSnapshot = await getDocs(fieldsQuery);

        const fieldData = fieldsSnapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        setFields(fieldData);
      } catch (error) {
        console.error("Failed to load public form:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicForm();
  }, [slug]);

  const getLabel = (field) => {
    if (language === "bn") {
      return field.label_bn || field.label_en || field.label || "";
    }

    return field.label_en || field.label || "";
  };

  const getPlaceholder = (field) => {
    if (language === "bn") {
      return field.placeholder_bn || field.placeholder_en || field.placeholder || "";
    }

    return field.placeholder_en || field.placeholder || "";
  };

  const renderField = (field) => {
    const label = getLabel(field);
    const placeholder = getPlaceholder(field);

    const inputClass =
      "w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF008C]";

    return (
      <div key={field.id}>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {field.required && <span className="text-[#FF008C]"> *</span>}
        </label>

        {field.field_type === "textarea" && (
          <textarea
            placeholder={placeholder}
            required={field.required}
            className={`${inputClass} min-h-28`}
          />
        )}

        {field.field_type === "dropdown" && (
          <select required={field.required} className={inputClass}>
            <option value="">{language === "bn" ? "নির্বাচন করুন" : "Select option"}</option>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}

        {field.field_type === "radio" && (
          <div className="space-y-2">
            {(field.options || []).map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={field.id}
                  required={field.required}
                />
                {option}
              </label>
            ))}
          </div>
        )}

        {field.field_type === "checkbox" && (
          <div className="space-y-2">
            {(field.options || []).map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input type="checkbox" />
                {option}
              </label>
            ))}
          </div>
        )}

        {!["textarea", "dropdown", "radio", "checkbox"].includes(
          field.field_type
        ) && (
          <input
            type={field.field_type === "phone" ? "text" : field.field_type}
            placeholder={placeholder}
            required={field.required}
            className={inputClass}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <p className="text-[#2B2368] font-semibold">Loading form...</p>
      </div>
    );
  }

  if (!formMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#2B2368]">Form unavailable</h1>
          <p className="text-gray-600 mt-2">
            This form is not published, closed, deleted, or does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-200">
        <img
          src={formMeta.banner_url || "/default-form-banner.png"}
          alt="Form banner"
          className="w-full h-52 object-cover"
        />

        <div className="p-6 sm:p-8">
          <div className="flex justify-end mb-4">
            <div className="flex border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-4 py-2 text-sm font-semibold ${
                  language === "en"
                    ? "bg-[#FF008C] text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("bn")}
                className={`px-4 py-2 text-sm font-semibold ${
                  language === "bn"
                    ? "bg-[#FF008C] text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-[#2B2368]">
            {formMeta.form_title}
          </h1>

          <p className="text-gray-500 mt-2">
            {formMeta.cohort_name} ({formMeta.cohort_code})
          </p>

          <form className="mt-8 space-y-6">
            {fields.length === 0 ? (
              <p className="text-gray-500">No fields found for this form.</p>
            ) : (
              fields.map((field) => renderField(field))
            )}

            <button
              type="button"
              className="w-full bg-[#FF008C] text-white py-3 rounded-xl font-semibold hover:opacity-90"
            >
              {language === "bn" ? "জমা দিন" : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}