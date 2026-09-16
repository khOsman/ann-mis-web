// Shared field-rendering/validation for any dynamic form_fields-driven form
// — extracted from PublicForm.jsx so the public registration page and any
// internal equivalent (e.g. AddParticipant.jsx's manual entry) render and
// validate every field type identically, rather than two implementations
// that can quietly drift apart.

export const hasContent = (value) => {
  if (!value) return false;

  const textOnly = String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, "")
    .replace(/\s/g, "")
    .trim();

  return textOnly.length > 0;
};

export const getLocalizedValue = (enValue, bnValue, fallbackValue = "", language = "en") => {
  const hasEn = hasContent(enValue);
  const hasBn = hasContent(bnValue);

  if (hasEn && !hasBn) return enValue;
  if (!hasEn && hasBn) return bnValue;
  if (!hasEn && !hasBn) return fallbackValue || "";

  return language === "bn" ? bnValue : enValue;
};

export const calculateAge = (dateString) => {
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

export const isFieldVisible = (field, answers) => {
  const condition = field.conditional_logic;

  if (!condition || !condition.source_field_id) return true;

  const matchValues = condition.match_values || [];

  if (matchValues.length === 0) return false;

  const sourceValue = answers[condition.source_field_id];

  if (Array.isArray(sourceValue)) {
    return sourceValue.some((value) => matchValues.includes(value));
  }

  return matchValues.includes(sourceValue);
};

const getValidationMessage = (field, fallbackEn, fallbackBn, language) => {
  const validation = field.validation || {};

  return language === "bn"
    ? validation.error_message_bn || validation.error_message_en || fallbackBn
    : validation.error_message_en || validation.error_message_bn || fallbackEn;
};

export const validateField = (field, value, language = "en") => {
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
        `বয়স কমপক্ষে ${validation.min_age} বছর হতে হবে।`,
        language
      );
    }

    if (validation.max_age && age > Number(validation.max_age)) {
      return getValidationMessage(
        field,
        `Age must not exceed ${validation.max_age} years.`,
        `বয়স ${validation.max_age} বছরের বেশি হতে পারবে না।`,
        language
      );
    }
  }

  if (field.field_type === "phone" && validation.pattern) {
    const regex = new RegExp(validation.pattern);

    if (!regex.test(value)) {
      return getValidationMessage(
        field,
        "Please enter a valid mobile number.",
        "সঠিক মোবাইল নম্বর লিখুন।",
        language
      );
    }
  }

  return "";
};

export default function DynamicFormFields({
  fields,
  answers,
  errors,
  language = "en",
  onAnswerChange,
  onCheckboxChange,
}) {
  const getLabel = (field) =>
    getLocalizedValue(field.label_en, field.label_bn, field.label, language);

  const getPlaceholder = (field) =>
    getLocalizedValue(field.placeholder_en, field.placeholder_bn, field.placeholder, language);

  const getSectionDescription = (field) =>
    getLocalizedValue(field.description_en, field.description_bn, "", language);

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
            onChange={(e) => onAnswerChange(field.id, e.target.value)}
            className={`${inputClass} min-h-28`}
          />
        )}

        {field.field_type === "dropdown" && (
          <select
            value={answers[field.id] || ""}
            onChange={(e) => onAnswerChange(field.id, e.target.value)}
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
                  onChange={() => onAnswerChange(field.id, option)}
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
                    onCheckboxChange(field.id, option, e.target.checked)
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
            onChange={(e) => onAnswerChange(field.id, e.target.value)}
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

  return (
    <>
      {fields.filter((field) => isFieldVisible(field, answers)).map(renderField)}
    </>
  );
}
