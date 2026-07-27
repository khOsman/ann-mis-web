import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../../firebase";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import {
  DIVISIONS,
  DISTRICTS_BY_DIVISION,
} from "../../constants/locations";
import { ROUTES } from "../../constants/routes";
import {
  COHORT_STATUS,
  COHORT_STATUS_OPTIONS,
} from "../../constants/status";
import { updateCohortRecord } from "../../services/cohortService";
import { useCohort } from "../../hooks";
import { validateCreateCohort } from "../../validators";
import { buildUpdateCohortPayload } from "../../builders";

export default function EditCohort() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const { data: cohort, loading, error } = useCohort(id);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    cohort_code: "",
    cohort_name: "",
    division: "",
    district: "",
    cohort_year: "",
    registration_start_date: "",
    registration_end_date: "",
    selection_target: "",
    graduation_target: "",
    status: COHORT_STATUS.DRAFT,
  });

  useEffect(() => {
    if (!loading && !cohort) {
      showAlert("error", "Cohort not found.");
      navigate(ROUTES.cohorts);
    }
  }, [loading, cohort, navigate, showAlert]);

  useEffect(() => {
    if (error) {
      console.error("Failed to load cohort:", error);
      showAlert("error", error.message || "Failed to load cohort.");
    }
  }, [error, showAlert]);

  useEffect(() => {
    if (!cohort) return;

    setForm({
      cohort_code: cohort.cohort_code || "",
      cohort_name: cohort.cohort_name || "",
      division: cohort.division || "",
      district: cohort.district || "",
      cohort_year: cohort.cohort_year || "",
      registration_start_date: cohort.registration_start_date || "",
      registration_end_date: cohort.registration_end_date || "",
      selection_target: cohort.selection_target || "",
      graduation_target: cohort.graduation_target || "",
      status: cohort.status || COHORT_STATUS.DRAFT,
    });
  }, [cohort]);

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

  const validateForm = () => {
    const validation = validateCreateCohort(form);

    if (!validation.valid) {
      showAlert(validation.type, validation.message);
      return false;
    }

    return true;
  };

  

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "-";
    return timestamp.toDate().toLocaleString("en-GB");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const user = auth.currentUser;
      await updateCohortRecord(id, buildUpdateCohortPayload(form, user));

      showAlert("success", "Cohort updated successfully.");
      navigate(ROUTES.cohorts);
    } catch (error) {
      console.error("Failed to update cohort:", error);
      showAlert("error", error.message || "Failed to update cohort.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !cohort) {
    return (
      <AdminLayout title="Edit Cohort" subtitle="Loading cohort information">
        <PageContainer className="py-6 lg:py-8 space-y-4">
          <button
            onClick={() => navigate(ROUTES.cohorts)}
            className="text-sm font-semibold text-[var(--ann-pink)]"
          >
            ← Back to Cohorts
          </button>
          <p className="text-gray-500">Loading cohort...</p>
        </PageContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Edit Cohort"
      subtitle="Update cohort information and settings"
    >
      <PageContainer className="py-6 lg:py-8 space-y-4">
        <button
          onClick={() => navigate(ROUTES.cohorts)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to Cohorts
        </button>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Cohort Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cohort Code
                </label>
                <input
                  name="cohort_code"
                  value={form.cohort_code}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cohort Name
                </label>
                <input
                  name="cohort_name"
                  value={form.cohort_name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>

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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cohort Year
                </label>
                <input
                  name="cohort_year"
                  value={form.cohort_year}
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
                  {COHORT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Registration Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
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
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Targets
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Selection Target
                </label>
                <input
                  name="selection_target"
                  value={form.selection_target}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Graduation Target
                </label>
                <input
                  name="graduation_target"
                  value={form.graduation_target}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Audit Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 text-sm">
              <div>
                <p className="text-gray-500">Created By</p>
                <p className="font-semibold text-gray-800">
                  {cohort.created_by_name || cohort.created_by_email || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Created At</p>
                <p className="font-semibold text-gray-800">
                  {formatDate(cohort.created_at)}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Last Updated By</p>
                <p className="font-semibold text-gray-800">
                  {cohort.updated_by_name || cohort.updated_by_email || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Last Updated At</p>
                <p className="font-semibold text-gray-800">
                  {formatDate(cohort.updated_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.cohorts)}
              className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="bg-[var(--ann-pink)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Cohort"}
            </button>
          </div>
        </form>
      </PageContainer>
    </AdminLayout>
  );
}