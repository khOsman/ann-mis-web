import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import { db } from "../../firebase";

export default function PublicForm() {
  const { slug } = useParams();

  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formMeta, setFormMeta] = useState(null);
  const [fields, setFields] = useState([]);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});

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
          return;
        }

        const formDoc = formSnapshot.docs[0];
        const formData = { id: formDoc.id, ...formDoc.data() };

        if (formData.is_deleted === true || formData.status !== "Published") {
          setFormMeta(null);
          return;
        }

        setFormMeta(formData);

        const fieldsQuery = query(
          collection(db, "form_fields"),
          where("form_id", "==", formDoc.id)
        );

        const fieldsSnapshot = await getDocs(fieldsQuery);

        const fieldData = fieldsSnapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
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

  const hasContent = (value) => {
    if (!value) return false;

    const textOnly = String(value)
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, "")
      .replace(/\s/g, "")
      .trim();

    return textOnly.length > 0;
  };

  const getLocalizedValue = (enValue, bnValue, fallbackValue = "") => {
    const hasEn = hasContent(enValue);
    const hasBn = hasContent(bnValue);

    if (hasEn && !hasBn) return enValue;
    if (!hasEn && hasBn) return bnValue;
    if (!hasEn && !hasBn) return fallbackValue || "";

    return language === "bn" ? bnValue : enValue;
  };

  const getFormDescription = () => {
    if (!formMeta) return "";
    return getLocalizedValue(formMeta.description_en, formMeta.description_bn);
  };

  const getLabel = (field) => {
    return getLocalizedValue(field.label_en, field.label_bn, field.label);
  };

  const getPlaceholder = (field) => {
    return getLocalizedValue(
      field.placeholder_en,
      field.placeholder_bn,
      field.placeholder
    );
  };

  const getSectionDescription = (field) => {
    return getLocalizedValue(field.description_en, field.description_bn);
  };

  const getValidationMessage = (field, fallbackEn, fallbackBn) => {
    const validation = field.validation || {};

    return language === "bn"
      ? validation.error_message_bn || validation.error_message_en || fallbackBn
      : validation.error_message_en || validation.error_message_bn || fallbackEn;
  };

  const calculateAge = (dateString) => {
    if (!dateString) return null;

    const today = new Date();
    const birthDate = new Date(dateString);

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const validateField = (field, value) => {
    if (field.field_type === "section") return "";

    if (field.required && !hasContent(value)) {
      return language === "bn" ? "এই তথ্যটি আবশ্যক।" : "This field is required.";
    }

    if (!hasContent(value)) return "";

    const validation = field.validation || {};

    if (field.field_type === "date") {
      const age = calculateAge(value);

      if (validation.min_age && age < Number(validation.min_age)) {
        return getValidationMessage(
          field,
          `Age must be at least ${validation.min_age} years.`,
          `বয়স কমপক্ষে ${validation.min_age} বছর হতে হবে।`
        );
      }

      if (validation.max_age && age > Number(validation.max_age)) {
        return getValidationMessage(
          field,
          `Age must not exceed ${validation.max_age} years.`,
          `বয়স ${validation.max_age} বছরের বেশি হতে পারবে না।`
        );
      }
    }

    if (field.field_type === "phone" && validation.pattern) {
      const regex = new RegExp(validation.pattern);

      if (!regex.test(value)) {
        return getValidationMessage(
          field,
          "Please enter a valid mobile number.",
          "সঠিক মোবাইল নম্বর লিখুন।"
        );
      }
    }

    return "";
  };

  const handleAnswerChange = (fieldId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [fieldId]: "",
    }));
  };

  const handleCheckboxChange = (fieldId, option, checked) => {
    const currentValues = answers[fieldId] || [];

    const nextValues = checked
      ? [...currentValues, option]
      : currentValues.filter((item) => item !== option);

    handleAnswerChange(fieldId, nextValues);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};

    fields.forEach((field) => {
      const error = validateField(field, answers[field.id]);

      if (error) {
        nextErrors[field.id] = error;
      }
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);

    try {
      const responseAnswers = fields
        .filter((field) => field.field_type !== "section")
        .map((field) => ({
          field_id: field.id,
          field_label_en: field.label_en || field.label || "",
          field_label_bn: field.label_bn || "",
          field_type: field.field_type,
          value: answers[field.id] || "",
        }));

      await addDoc(collection(db, "form_responses"), {
        form_id: formMeta.id,
        form_title: formMeta.form_title,
        public_slug: formMeta.public_slug,

        cohort_id: formMeta.cohort_id,
        cohort_name: formMeta.cohort_name,
        cohort_code: formMeta.cohort_code,

        answers: responseAnswers,

        submitted_at: serverTimestamp(),
      });

      await updateDoc(doc(db, "forms", formMeta.id), {
        total_responses: increment(1),
        updated_at: serverTimestamp(),
      });
      await updateDoc(doc(db, "cohorts", formMeta.cohort_id), {
        total_registrations: increment(1),
        updated_at: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit form:", error);
      alert(
        language === "bn"
          ? "ফর্ম জমা দেওয়া যায়নি। আবার চেষ্টা করুন।"
          : "Failed to submit form. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const label = getLabel(field);
    const placeholder = getPlaceholder(field);

    const inputClass = `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none ${
      errors[field.id]
        ? "border-red-400 focus:border-red-500"
        : "border-gray-300 focus:border-[#FF008C]"
    }`;

    if (field.field_type === "section") {
      const sectionDescription = getSectionDescription(field);

      return (
        <div
          key={field.id}
          className="bg-[#2B2368] text-white rounded-2xl p-6 my-8"
        >
          {hasContent(label) && <h2 className="text-2xl font-bold">{label}</h2>}

          {hasContent(sectionDescription) && (
            <div
              className="public-rich-text public-rich-text-dark mt-3 text-purple-100 leading-7"
              dangerouslySetInnerHTML={{ __html: sectionDescription }}
            />
          )}
        </div>
      );
    }

    return (
      <div key={field.id}>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {field.required && <span className="text-[#FF008C]"> *</span>}
        </label>

        {field.field_type === "textarea" && (
          <textarea
            placeholder={placeholder}
            value={answers[field.id] || ""}
            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
            className={`${inputClass} min-h-28`}
          />
        )}

        {field.field_type === "dropdown" && (
          <select
            value={answers[field.id] || ""}
            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
            className={inputClass}
          >
            <option value="">
              {language === "bn" ? "নির্বাচন করুন" : "Select option"}
            </option>
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
                  checked={answers[field.id] === option}
                  onChange={() => handleAnswerChange(field.id, option)}
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
                <input
                  type="checkbox"
                  checked={(answers[field.id] || []).includes(option)}
                  onChange={(e) =>
                    handleCheckboxChange(field.id, option, e.target.checked)
                  }
                />
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
            value={answers[field.id] || ""}
            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
            className={inputClass}
          />
        )}

        {errors[field.id] && (
          <p className="text-red-600 text-xs font-semibold mt-2">
            {errors[field.id]}
          </p>
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
          <h1 className="text-2xl font-bold text-[#2B2368]">
            Form unavailable
          </h1>
          <p className="text-gray-600 mt-2">
            This form is not published, closed, deleted, or does not exist.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md text-center shadow-xl">
          <h1 className="text-2xl font-bold text-[#2B2368]">
            {language === "bn" ? "ধন্যবাদ!" : "Thank you!"}
          </h1>
          <p className="text-gray-600 mt-3">
            {language === "bn"
              ? "আপনার রেজিস্ট্রেশন সফলভাবে জমা হয়েছে।"
              : "Your registration has been submitted successfully."}
          </p>
        </div>
      </div>
    );
  }

  const description = getFormDescription();

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-200">
        <img
          src={formMeta.banner_url || "/default-form-banner.png"}
          alt="Form banner"
          className="w-full h-auto max-h-[420px] object-contain bg-white"
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

          {hasContent(description) && (
            <div
              className="public-rich-text mt-5 rounded-2xl bg-pink-50/50 border border-pink-100 p-5 text-sm leading-7 text-gray-700"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}

          {Object.keys(errors).length > 0 && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {language === "bn"
                ? "অনুগ্রহ করে ভুল তথ্যগুলো ঠিক করুন।"
                : "Please fix the highlighted fields."}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {fields.length === 0 ? (
              <p className="text-gray-500">No fields found for this form.</p>
            ) : (
              fields.map((field) => renderField(field))
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#FF008C] text-white py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {submitting
                ? language === "bn"
                  ? "জমা হচ্ছে..."
                  : "Submitting..."
                : language === "bn"
                ? "জমা দিন"
                : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}