import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { ROUTES } from "../../constants/routes";
import {
  DIVISIONS,
  DISTRICTS_BY_DIVISION,
} from "../../constants/locations";
import { createCohortRecord } from "../../services/cohortService";
import { submitCohortForApproval } from "../../services/cohortApprovalService";
import { validateCreateCohort } from "../../validators";
import { buildCreateCohortPayload } from "../../builders";

export default function CreateCohort() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const initialFormState = {
    cohort_code: "",
    cohort_name: "",
    division: "",
    district: "",
    cohort_year: "",
    registration_start_date: "",
    registration_end_date: "",
    selection_target: "",
    graduation_target: "",
  };

  const [form, setForm] = useState(initialFormState);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "division") {
      setForm((prev) => ({
        ...prev,
        division: value,
        district: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialFormState);
  };

  const validateForm = () => {
    const validation = validateCreateCohort(form);

    if (!validation.valid) {
      showAlert(validation.type, validation.message);
      return false;
    }

    return true;
  };

 

  // submitNow = true: create the cohort and send it straight to the
  // Programme Head. Otherwise it is saved as a draft the requester can still
  // edit, then submit later from the cohort's page.
  const saveCohort = async (submitNow) => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      const user = auth.currentUser;

      const cohortId = await createCohortRecord(
        buildCreateCohortPayload(form, user)
      );

      if (submitNow) {
        try {
          await submitCohortForApproval({ cohortId, user });
          showAlert("success", "Cohort created and submitted for approval.");
        } catch (submitError) {
          console.error("Cohort created but submission failed:", submitError);
          showAlert(
            "warning",
            "Cohort saved as a draft, but it could not be submitted. Open the cohort and use Submit for Approval."
          );
        }
      } else {
        showAlert("success", "Cohort saved as a draft. Submit it for approval when ready.");
      }

      resetForm();
    } catch (error) {
      console.error("Cohort creation failed:", error);
      showAlert("error", error.message || "Failed to create cohort.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveCohort(false);
  };

  return (
    <AdminLayout title="Create Cohort" subtitle="Create a new ANN cohort">
      <PageContainer className="py-6 lg:py-8 space-y-4">
        <button
          onClick={() => navigate(ROUTES.cohorts)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to Cohorts
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-4xl">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
            Cohort Information
          </h3>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6"
          >
            {[
              ["cohort_code", "Cohort Code", "JS25"],
              ["cohort_name", "Cohort Name", "Jessore-25"],
            ].map(([name, label, placeholder]) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {label}
                </label>
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Division
              </label>
              <select
                name="division"
                value={form.division}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
              >
                <option value="">Select Division</option>
                {DIVISIONS.map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                District
              </label>
              <select
                name="district"
                value={form.district}
                onChange={handleChange}
                required
                disabled={!form.division}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)] disabled:bg-gray-100"
              >
                <option value="">Select District</option>
                {(DISTRICTS_BY_DIVISION[form.division] || []).map(
                  (district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  )
                )}
              </select>
            </div>

            {[
              ["cohort_year", "Cohort Year", "25"],
              ["selection_target", "Selection Target", "50"],
              ["graduation_target", "Graduation Target", "50"],
            ].map(([name, label, placeholder]) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {label}
                </label>
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Registration Start Date
              </label>
              <input
                type="date"
                name="registration_start_date"
                value={form.registration_start_date}
                onChange={handleChange}
                max={form.registration_end_date || undefined}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Registration End Date
              </label>
              <input
                type="date"
                name="registration_end_date"
                value={form.registration_end_date}
                onChange={handleChange}
                min={form.registration_start_date || undefined}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
              />
            </div>

            <div className="md:col-span-2 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              A new cohort starts as a draft. It becomes Active, and its
              registration form can be published, only after the Programme
              Head approves it.
            </div>

            <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save as Draft"}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => saveCohort(true)}
                className="bg-[var(--ann-pink)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save & Submit for Approval"}
              </button>
            </div>
          </form>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}