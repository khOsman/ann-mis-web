import { useEffect, useState } from "react";
import ChampionLayout from "../../../layouts/ChampionLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAuth } from "../../../context/AuthContext";
import { useAlert } from "../../../context/AlertContext";
import { getChampion } from "../../../services/championsService";
import { updateMyProfile } from "../../../services/championPortalService";
import { GENDER_OPTIONS, EDUCATION_LEVEL_OPTIONS } from "../../../constants/champions";

const PERSONAL_FIELDS = [
  ["name", "Full Name", "text"],
  ["phone", "Phone", "text"],
  ["date_of_birth", "Date of Birth", "date"],
];

const EDUCATION_FIELDS = [
  ["education_institution", "Institution / University Name", "text"],
  ["field_of_study", "Field of Study", "text"],
  ["graduation_year", "Graduation Year", "number"],
];

const PROFESSIONAL_FIELDS = [
  ["current_organization", "Current Organization", "text"],
  ["designation", "Designation / Job Title", "text"],
  ["years_of_experience", "Years of Experience", "number"],
  ["linkedin_url", "LinkedIn URL", "text"],
];

const EMPTY_FORM = {
  name: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  address: "",
  photo_url: "",
  education_level: "",
  education_institution: "",
  field_of_study: "",
  graduation_year: "",
  current_organization: "",
  designation: "",
  years_of_experience: "",
  linkedin_url: "",
};

export default function ChampionMyProfile() {
  const { appUser } = useAuth();
  const { showAlert } = useAlert();

  const [champion, setChampion] = useState(appUser);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    if (!appUser?.id) return;

    setLoading(true);

    try {
      const data = await getChampion(appUser.id);
      setChampion(data);
    } catch (err) {
      showAlert("error", err.message || "Failed to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser?.id]);

  const startEditing = () => {
    setForm({
      name: champion?.name || "",
      phone: champion?.phone || "",
      date_of_birth: champion?.date_of_birth || "",
      gender: champion?.gender || "",
      address: champion?.address || "",
      photo_url: champion?.photo_url || "",
      education_level: champion?.education_level || "",
      education_institution: champion?.education_institution || "",
      field_of_study: champion?.field_of_study || "",
      graduation_year: champion?.graduation_year || "",
      current_organization: champion?.current_organization || "",
      designation: champion?.designation || "",
      years_of_experience: champion?.years_of_experience || "",
      linkedin_url: champion?.linkedin_url || "",
    });
    setEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await updateMyProfile(form);
      showAlert("success", "Profile updated successfully.");
      setEditing(false);
      await refresh();
    } catch (err) {
      showAlert("error", err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = ([name, label, type]) => (
    <div key={name}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
      />
    </div>
  );

  return (
    <ChampionLayout title="My Profile" subtitle="Personal, educational and professional information">
      <PageContainer className="py-6 lg:py-8 space-y-6">
        {loading ? (
          <p className="text-gray-500">Loading your profile...</p>
        ) : (
          <>
            <div className="flex justify-end">
              {!editing && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="font-bold text-lg text-[var(--ann-text-dark)]">
                  Account Information
                </h3>
              </div>
              <div className="grid md:grid-cols-3 gap-6 p-6">
                <Info label="Champion Code" value={champion?.champion_code} />
                <Info label="Email" value={champion?.email} />
                <Info
                  label="Role"
                  value={champion?.role ? champion.role.replace(/_/g, " ") : "-"}
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="font-bold text-lg text-[var(--ann-text-dark)]">
                  Personal Information
                </h3>
              </div>

              {editing ? (
                <div className="grid md:grid-cols-2 gap-6 p-6">
                  {PERSONAL_FIELDS.map(renderField)}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                    >
                      <option value="">Select gender...</option>
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Photo URL (optional)
                    </label>
                    <input
                      type="text"
                      name="photo_url"
                      value={form.photo_url}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      rows={3}
                      value={form.address}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-[var(--ann-pink)]"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6 p-6">
                  <Info label="Full Name" value={champion?.name} />
                  <Info label="Phone" value={champion?.phone} />
                  <Info label="Date of Birth" value={champion?.date_of_birth} />
                  <Info label="Gender" value={champion?.gender} />
                  <Info label="Address" value={champion?.address} />
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="font-bold text-lg text-[var(--ann-text-dark)]">
                  Educational Information
                </h3>
              </div>

              {editing ? (
                <div className="grid md:grid-cols-2 gap-6 p-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Highest Education Level
                    </label>
                    <select
                      name="education_level"
                      value={form.education_level}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                    >
                      <option value="">Select level...</option>
                      {EDUCATION_LEVEL_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {EDUCATION_FIELDS.map(renderField)}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6 p-6">
                  <Info label="Highest Education Level" value={champion?.education_level} />
                  <Info
                    label="Institution / University"
                    value={champion?.education_institution}
                  />
                  <Info label="Field of Study" value={champion?.field_of_study} />
                  <Info label="Graduation Year" value={champion?.graduation_year} />
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="font-bold text-lg text-[var(--ann-text-dark)]">
                  Professional Information
                </h3>
              </div>

              {editing ? (
                <div className="grid md:grid-cols-2 gap-6 p-6">
                  {PROFESSIONAL_FIELDS.map(renderField)}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6 p-6">
                  <Info label="Current Organization" value={champion?.current_organization} />
                  <Info label="Designation" value={champion?.designation} />
                  <Info label="Years of Experience" value={champion?.years_of_experience} />
                  <Info label="LinkedIn" value={champion?.linkedin_url} />
                </div>
              )}
            </div>

            {editing && (
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl font-semibold hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="bg-[var(--ann-pink)] text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </>
        )}
      </PageContainer>
    </ChampionLayout>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="font-semibold mt-1">{value || "-"}</p>
    </div>
  );
}
