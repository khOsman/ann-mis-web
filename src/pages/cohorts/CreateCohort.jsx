import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import {
  DIVISIONS,
  DISTRICTS_BY_DIVISION,
} from "../../constants/locations";

export default function CreateCohort() {
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
    status: "Draft",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (
      form.registration_start_date &&
      form.registration_end_date &&
      new Date(form.registration_start_date) > new Date(form.registration_end_date)
    ) {
      showAlert(
        "warning",
        "Registration Start Date cannot be later than Registration End Date."
      );
      setSaving(false);
      return;
    }

    try {
      const user = auth.currentUser;

      await addDoc(collection(db, "cohorts"), {
        cohort_code: form.cohort_code.trim().toUpperCase(),
        cohort_name: form.cohort_name.trim(),
        division: form.division,
        district: form.district,
        cohort_year: form.cohort_year.trim(),
        registration_start_date: form.registration_start_date,
        registration_end_date: form.registration_end_date,
        selection_target: Number(form.selection_target),
        graduation_target: Number(form.graduation_target),
        status: form.status,

        current_participant_sequence: 0,
        total_registrations: 0,
        total_selected: 0,
        total_enrolled: 0,
        total_graduated: 0,
        total_projects: 0,

        is_deleted: false,

        created_at: serverTimestamp(),
        created_by_email: user?.email || "",
        created_by_name: user?.displayName || "",

        updated_at: serverTimestamp(),
        updated_by_email: user?.email || "",
        updated_by_name: user?.displayName || "",
      });

      showAlert("success", "Cohort created successfully.");
      resetForm();
    } catch (error) {
      console.error("Cohort creation failed:", error);
      showAlert("error", error.message || "Failed to create cohort.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Create Cohort" subtitle="Create a new ANN cohort">
      <PageContainer className="py-6 lg:py-8">
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
              >
                <option>Draft</option>
                <option>Active</option>
                <option>Closed</option>
                <option>Archived</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-[var(--ann-pink)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Create Cohort"}
              </button>
            </div>
          </form>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}