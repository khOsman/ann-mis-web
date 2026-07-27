import { useState } from "react";
import annLogo from "../../assets/ann-logo.png";
import { registerChampionRequest } from "../../services/championsService";
import { useAlert } from "../../context/AlertContext";
import { GENDER_OPTIONS } from "../../constants/champions";

export default function ChampionRegistration() {
  const { showAlert } = useAlert();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    institution: "",
    address: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await registerChampionRequest({
        email: form.email.trim().toLowerCase(),
        profile: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          date_of_birth: form.date_of_birth,
          gender: form.gender,
          institution: form.institution.trim(),
          address: form.address.trim(),
        },
      });

      showAlert("success", "Registration submitted successfully. Please wait for approval.");

      setForm({
        name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        gender: "",
        institution: "",
        address: "",
      });
    } catch (error) {
      console.error("Champion registration failed:", error);
      showAlert("error", error.message || "Failed to register.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ann-bg)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
        <div className="lg:col-span-5 bg-[var(--ann-purple)] text-white p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <img src={annLogo} alt="ANN Logo" className="w-40 h-40 object-contain rounded-2xl p-2" />

            <h1 className="text-3xl sm:text-4xl font-extrabold mt-8 leading-tight">
              Join the Amra Notun Network Champions Pool
            </h1>

            <p className="text-purple-100 mt-4 leading-7">
              Register once to be considered as a Selection Committee member,
              Facilitator, Co-Facilitator, Mentor, or Youth Content Network (YCN)
              contributor for Amra Notun Network.
            </p>
          </div>

          <div className="mt-10 bg-white/10 rounded-2xl p-5 border border-white/10">
            <p className="text-sm font-semibold text-pink-100">
              Registration Process
            </p>
            <p className="text-sm text-purple-100 mt-2 leading-6">
              Submit your information once. The ANN team will review your profile,
              assign you a role, and activate your access after approval.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 p-6 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-bold text-[var(--ann-pink)] uppercase tracking-wide">
              ANN MIS
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--ann-text-dark)] mt-2">
              Champions Pool Registration
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Please provide accurate information for verification and onboarding.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              ["name", "Full Name", "text"],
              ["email", "Email Address", "email"],
              ["phone", "Mobile Number", "text"],
              ["date_of_birth", "Date of Birth", "date"],
              ["institution", "Institution", "text"],
            ].map(([name, label, type]) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {label}
                </label>
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
              >
                <option value="" disabled>
                  Select gender
                </option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                rows={4}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)] resize-none"
              />
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-[var(--ann-pink)] text-white px-7 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Submitting..." : "Submit Registration"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
