import { useEffect, useRef, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { db } from "../../firebase";
import { submitPublicRegistration } from "../../services/publicRegistrationService";
import { isEmailRegistered, normalizeEmail } from "../../services/emailLockService";
import { useAlert } from "../../context/AlertContext";
import RegistrationSuccess from "../../components/forms/RegistrationSuccess";
import DynamicFormFields, {
  hasContent,
  getLocalizedValue,
  isFieldVisible,
  validateField,
} from "../../components/forms/DynamicFormFields";

export default function PublicForm() {
  const { slug } = useParams();
  const { showAlert } = useAlert();

  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [participantCode, setParticipantCode] = useState("");
  const emailCheckCache = useRef(new Map());
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
        const formData = { ...formDoc.data(), id: formDoc.id };

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
          .map((item) => ({ ...item.data(), id: item.id }))
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

  const getFormDescription = () => {
    if (!formMeta) return "";
    return getLocalizedValue(formMeta.description_en, formMeta.description_bn, "", language);
  };

  // A field hidden by conditional logic shouldn't submit a stale answer
  // from before it was hidden (e.g. the visitor picked an answer, then
  // changed an earlier answer so this question no longer applies).
  useEffect(() => {
    setAnswers((prev) => {
      let changed = false;
      const next = { ...prev };

      fields.forEach((field) => {
        if (
          field.conditional_logic &&
          !isFieldVisible(field, prev) &&
          next[field.id] !== undefined
        ) {
          delete next[field.id];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, fields]);

  const duplicateEmailMessage = () =>
    language === "bn"
      ? "এই ইমেইল ঠিকানা দিয়ে ইতোমধ্যে রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য ইমেইল ঠিকানা ব্যবহার করুন।"
      : "This email address has already been used to register. Please use a different email address.";

  // Early feedback: as soon as the visitor leaves the email box, look the
  // address up (one document read by ID — see isEmailRegistered) so a
  // duplicate is flagged before they fill in the rest. Results are
  // remembered per address so re-focusing the box costs nothing. Submitting
  // still re-checks inside the registration transaction, which is what
  // actually guarantees uniqueness.
  const handleFieldBlur = async (field, value) => {
    const emailField = findEmailField();

    if (!emailField || field.id !== emailField.id || !formMeta) return;

    const email = normalizeEmail(value);

    if (!/^\S+@\S+\.\S+$/.test(email)) return;

    let registered = emailCheckCache.current.get(email);

    if (registered === undefined) {
      registered = await isEmailRegistered(formMeta.cohort_id, email);
      emailCheckCache.current.set(email, registered);
    }

    if (registered) {
      setErrors((prev) => ({ ...prev, [field.id]: duplicateEmailMessage() }));
    }
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

  // The question the registrant typed their email into — mapped to the
  // Email data point if the admin did that, otherwise an email-type question,
  // otherwise one whose label mentions email. Used to show the "already
  // registered" message right under it.
  const findEmailField = () =>
    fields.find((field) => field.mapped_participant_field === "email") ||
    fields.find((field) => field.field_type === "email") ||
    fields.find((field) =>
      /e-?mail|ইমেইল|ই-মেইল/i.test(`${field.label_en || ""} ${field.label_bn || ""}`)
    );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};

    fields.filter((field) => isFieldVisible(field, answers)).forEach((field) => {
      const error = validateField(field, answers[field.id], language);

      if (error) {
        nextErrors[field.id] = error;
      }
    });

    // Already looked up and found registered while filling the form — no
    // need to start the transaction just to be told the same thing.
    const emailField = findEmailField();
    const typedEmail = emailField ? normalizeEmail(answers[emailField.id]) : "";

    if (typedEmail && emailCheckCache.current.get(typedEmail) === true) {
      nextErrors[emailField.id] = duplicateEmailMessage();
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitPublicRegistration({
        formMeta,
        fields,
        answers,
      });

      setParticipantCode(result?.participantCode || "");
      setSubmitted(true);
      window.scrollTo({ top: 0 });
    } catch (error) {
      if (error?.code === "duplicate-email") {
        const message = duplicateEmailMessage();
        const emailField = findEmailField();

        if (emailField) {
          setErrors({ [emailField.id]: message });
        }

        showAlert("error", message);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      console.error("Failed to submit form:", error);
      showAlert(
        "error",
        language === "bn"
          ? "ফর্ম জমা দেওয়া যায়নি। আবার চেষ্টা করুন।"
          : "Failed to submit form. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
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
      <RegistrationSuccess
        language={language}
        formTitle={formMeta.form_title}
        cohortName={formMeta.cohort_name}
        cohortCode={formMeta.cohort_code}
        participantCode={participantCode}
      />
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
              <DynamicFormFields
                fields={fields}
                answers={answers}
                errors={errors}
                language={language}
                onAnswerChange={handleAnswerChange}
                onCheckboxChange={handleCheckboxChange}
                onFieldBlur={handleFieldBlur}
              />
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