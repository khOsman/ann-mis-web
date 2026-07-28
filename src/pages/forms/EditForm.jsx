import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { auth } from "../../firebase";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import RichTextEditor from "../../components/common/RichTextEditor";
import { useAlert } from "../../context/AlertContext";
import { ROUTES } from "../../constants/routes";
import { useCohorts, useForm as useFormDoc } from "../../hooks";
import {
  isSlugAvailable,
  normalizeSlug,
  updateFormRecord,
} from "../../services/formService";

export default function EditForm() {
  const { id } = useParams();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const location = useLocation();

  // AllForms.jsx and FormBuilder.jsx both link here — each passes where it
  // came from via navigation state so "Back" returns there instead of
  // always landing on All Forms.
  const backTo = location.state?.from || ROUTES.forms;
  const backLabel = location.state?.fromLabel || "Forms";

  const { data: allCohorts } = useCohorts();
  const cohorts = useMemo(
    () => allCohorts.filter((item) => item.status === "Active"),
    [allCohorts]
  );

  const { data: formDoc, loading } = useFormDoc(id);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    form_title: "",
    description_en: "",
    description_bn: "",
    cohort_id: "",
    form_type: "registration",
    status: "Draft",
    public_slug: "",
    banner_type: "default",
    banner_url: "/default-form-banner.png",
    banner_file_name: "",
  });

  // Seed the editable draft once when the doc first loads (or when
  // navigating to a different form) — not on every subsequent live update,
  // so in-progress edits aren't clobbered by someone else's write.
  useEffect(() => {
    if (!formDoc) return;

    setForm({
      form_title: formDoc.form_title || "",
      description_en: formDoc.description_en || "",
      description_bn: formDoc.description_bn || "",
      cohort_id: formDoc.cohort_id || "",
      form_type: formDoc.form_type || "registration",
      status: formDoc.status || "Draft",
      public_slug: formDoc.public_slug || "",
      banner_type: formDoc.banner_type || "default",
      banner_url: formDoc.banner_url || "/default-form-banner.png",
      banner_file_name: formDoc.banner_file_name || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formDoc?.id]);

  useEffect(() => {
    if (!loading && !formDoc) {
      showAlert("error", "Form not found.");
      navigate("/admin/forms");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, formDoc]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "public_slug") {
      setForm((prev) => ({
        ...prev,
        public_slug: value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setForm((prev) => ({
      ...prev,
      banner_type: "custom",
      banner_url: previewUrl,
      banner_file_name: file.name,
    }));
  };

  const handleUseDefaultBanner = () => {
    setForm((prev) => ({
      ...prev,
      banner_type: "default",
      banner_url: "/default-form-banner.png",
      banner_file_name: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const selectedCohort = cohorts.find(
        (cohort) => cohort.id === form.cohort_id
      );

      const user = auth.currentUser;
      const normalizedSlug = normalizeSlug(form.public_slug);

      const slugAvailable = await isSlugAvailable(normalizedSlug, id);

      if (!slugAvailable) {
        showAlert(
          "warning",
          "This public slug is already used by another form. Please choose another one."
        );
        setSaving(false);
        return;
      }

      await updateFormRecord(id, {
        form_title: form.form_title.trim(),
        cohort_id: form.cohort_id,
        cohort_name: selectedCohort?.cohort_name || "",
        cohort_code: selectedCohort?.cohort_code || "",
        description_en: form.description_en.trim(),
        description_bn: form.description_bn.trim(),
        form_type: form.form_type,
        status: form.status,
        public_slug: normalizedSlug,
        banner_type: form.banner_type,
        banner_url:
          form.banner_type === "default"
            ? "/default-form-banner.png"
            : form.banner_url,
        banner_file_name: form.banner_file_name,

        updated_by_email: user?.email || "",
        updated_by_name: user?.displayName || "",
      });

      showAlert("success", "Form information updated successfully.");
      navigate(`/admin/forms/${id}/builder`);
    } catch (error) {
      console.error("Form update failed:", error);
      showAlert("error", error.message || "Failed to update form.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Form" subtitle="Update registration form metadata">
        <PageContainer className="py-6 lg:py-8 space-y-4">
          <button
            onClick={() => navigate(backTo)}
            className="text-sm font-semibold text-[var(--ann-pink)]"
          >
            ← Back to {backLabel}
          </button>
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">
            Loading form...
          </div>
        </PageContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Form" subtitle="Update registration form metadata">
      <PageContainer className="py-6 lg:py-8 space-y-4">
        <button
          onClick={() => navigate(backTo)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to {backLabel}
        </button>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Form Banner
            </h3>

            <div className="mt-5 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={form.banner_url}
                alt="Form banner preview"
                className="w-full h-48 object-cover"
              />
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                type="button"
                onClick={handleUseDefaultBanner}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
              >
                Use Default Banner
              </button>

              <label className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold cursor-pointer hover:opacity-90">
                Upload Custom Banner
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
              </label>
            </div>

            {form.banner_file_name && (
              <p className="text-sm text-gray-500 mt-2">
                Selected: {form.banner_file_name}
              </p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Form Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Form Title
                </label>
                <input
                  name="form_title"
                  value={form.form_title}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description English
                </label>
                <RichTextEditor
                  value={form.description_en}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, description_en: value }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description Bangla
                </label>
                <RichTextEditor
                  value={form.description_bn}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, description_bn: value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cohort
                </label>
                <select
                  name="cohort_id"
                  value={form.cohort_id}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                >
                  <option value="">Select Cohort</option>
                  {cohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.cohort_name} ({cohort.cohort_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Form Type
                </label>
                <select
                  name="form_type"
                  value={form.form_type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                >
                  <option value="registration">Registration</option>
                </select>
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
                  <option>Published</option>
                  <option>Closed</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Public Slug
                </label>
                <input
                  name="public_slug"
                  value={form.public_slug}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Public URL: /form/{form.public_slug || "your-form-slug"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/admin/forms/${id}/builder`)}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[var(--ann-pink)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </PageContainer>
    </AdminLayout>
  );
}
