import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { ROUTES } from "../../constants/routes";
import { useCohort, useForms, useFormFields, useFGDsByCohort } from "../../hooks";
import { submitPublicRegistration } from "../../services/publicRegistrationService";
import DynamicFormFields, {
  isFieldVisible,
  validateField,
  getLocalizedValue,
} from "../../components/forms/DynamicFormFields";

export default function AddParticipant() {
  const { id: cohortId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const { data: cohort, loading: loadingCohort } = useCohort(cohortId);
  const { data: allForms, loading: loadingForms } = useForms();
  const { data: fgds } = useFGDsByCohort(cohortId);

  // Prefer the cohort's currently Published form (the live public link),
  // but still fall back to its most recent form of any other status —
  // registration commonly gets Closed to the public while staff keep
  // entering a backlog of paper registrations for days afterward, and
  // that shouldn't leave manual entry with nothing to submit against.
  // useForms() already orders by created_at desc, so [0] is the newest.
  const form = useMemo(() => {
    const cohortForms = allForms.filter((f) => f.cohort_id === cohortId);
    return cohortForms.find((f) => f.status === "Published") || cohortForms[0];
  }, [allForms, cohortId]);

  const { data: fields, loading: loadingFields } = useFormFields(form?.id || null);

  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleAnswerChange = (fieldId, value) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: "" }));
  };

  const handleCheckboxChange = (fieldId, option, checked) => {
    const currentValues = answers[fieldId] || [];
    const nextValues = checked
      ? [...currentValues, option]
      : currentValues.filter((item) => item !== option);
    handleAnswerChange(fieldId, nextValues);
  };

  const resetForm = () => {
    setAnswers({});
    setErrors({});
  };

  const visibleFields = fields.filter((field) => isFieldVisible(field, answers));

  // Validates and, if clean, opens the review modal instead of submitting
  // straight away — the actual write happens only from handleConfirmSubmit
  // once the admin/Youth Coordinator has reviewed the entered answers.
  const handleReview = (e) => {
    e.preventDefault();
    if (!form) return;

    const nextErrors = {};
    visibleFields.forEach((field) => {
      const error = validateField(field, answers[field.id], "en");
      if (error) nextErrors[field.id] = error;
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);

    try {
      await submitPublicRegistration({ formMeta: form, fields, answers });

      const name =
        fields
          .map((f) => answers[f.id])
          .find((v) => typeof v === "string" && v.trim()) || "Participant";

      setLastSaved({ name });
      resetForm();
      setShowPreview(false);
      showAlert("success", "Participant added successfully.");
    } catch (error) {
      console.error("Failed to add participant:", error);
      showAlert("error", error.message || "Failed to add participant.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCohort || !cohort) {
    return (
      <AdminLayout title="Add Participant" subtitle="Loading cohort...">
        <PageContainer className="py-6">
          <p className="text-gray-500">Loading...</p>
        </PageContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Add Participant"
      subtitle={`${cohort.cohort_name} (${cohort.cohort_code})`}
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <button
          onClick={() => navigate(`/admin/cohorts/${cohortId}`)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to Cohort
        </button>

        {lastSaved && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <p className="font-semibold text-green-700">
              {lastSaved.name} was added to this cohort.
            </p>
            {fgds.length > 0 && (
              <p className="text-sm text-green-700 mt-1">
                This cohort already has FGDs. Go to{" "}
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      ROUTES.selectionReassignCohort.replace(":cohortId", cohortId)
                    )
                  }
                  className="underline font-semibold"
                >
                  Reassign / Assign Participants → Unassigned
                </button>{" "}
                to place them into a non-completed FGD.
              </p>
            )}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6 sm:p-8">
          {loadingForms || loadingFields ? (
            <p className="text-gray-500">Loading form...</p>
          ) : !form ? (
            <p className="text-gray-500">
              No registration form has been created for this cohort yet.
            </p>
          ) : (
            <form onSubmit={handleReview} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ann-text-dark)]">
                  {form.form_title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Fill this in exactly as the participant would on the public
                  registration form.
                </p>
              </div>

              {fields.length === 0 ? (
                <p className="text-gray-500">This form has no questions.</p>
              ) : (
                <DynamicFormFields
                  fields={fields}
                  answers={answers}
                  errors={errors}
                  language="en"
                  onAnswerChange={handleAnswerChange}
                  onCheckboxChange={handleCheckboxChange}
                />
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[var(--ann-pink)] text-white py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              >
                Review & Save Participant
              </button>
            </form>
          )}
        </div>
      </PageContainer>

      {showPreview && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Review before saving
            </h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Double-check this participant's answers. Nothing is saved
              until you confirm.
            </p>

            <div className="space-y-3">
              {visibleFields
                .filter((field) => field.field_type !== "section")
                .map((field) => {
                  const label = getLocalizedValue(
                    field.label_en,
                    field.label_bn,
                    field.label,
                    "en"
                  );
                  const value = answers[field.id];
                  const displayValue = Array.isArray(value)
                    ? value.join(", ")
                    : value || "";

                  return (
                    <div
                      key={field.id}
                      className="flex justify-between gap-4 border-b border-gray-100 pb-2"
                    >
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className="text-sm font-semibold text-[var(--ann-text-dark)] text-right">
                        {displayValue || "—"}
                      </span>
                    </div>
                  );
                })}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-gray-400 disabled:opacity-50"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
