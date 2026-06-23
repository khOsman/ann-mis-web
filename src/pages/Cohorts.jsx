import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import AdminLayout from "../layouts/AdminLayout";
import PageContainer from "../layouts/PageContainer";

export default function Cohorts() {
  const [form, setForm] = useState({
    cohort_name: "",
    city: "",
    cohort_year: "",
    registration_start_date: "",
    registration_end_date: "",
    selection_target: "",
    graduation_target: "",
    status: "Draft",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    await addDoc(collection(db, "cohorts"), {
      ...form,
      selection_target: Number(form.selection_target),
      graduation_target: Number(form.graduation_target),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    setForm({
      cohort_name: "",
      city: "",
      cohort_year: "",
      registration_start_date: "",
      registration_end_date: "",
      selection_target: "",
      graduation_target: "",
      status: "Draft",
    });

    setSaving(false);
    alert("Cohort created successfully.");
  };

  return (
    <AdminLayout title="Cohorts" subtitle="Create and manage ANN cohorts">
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-3xl">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
            Create New Cohort
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            {[
              ["cohort_name", "Cohort Name", "Jessore-25"],
              ["city", "City", "Jessore"],
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