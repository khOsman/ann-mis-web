import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useAlert } from "../../context/AlertContext";
import { updateFGDParticipant } from "../../services/fgdService";
import { FGD_ATTENDANCE_STATUS } from "../../constants/fgd";
import { formatBDPhone } from "../../utils/phone";

export default function ParticipantEvaluationModal({
  open,
  participant,
  onClose,
  onSaved,
}) {
  const { showAlert } = useAlert();

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fgd_attendance_status: FGD_ATTENDANCE_STATUS.PENDING,
    fgd_score: "",
    selection_recommendation: "",
    fgd_feedback: "",
    selection_committee_notes: "",
  });

  useEffect(() => {
    if (!participant) return;

    setForm({
      fgd_attendance_status:
        participant.fgd_attendance_status ||
        FGD_ATTENDANCE_STATUS.PENDING,

      fgd_score: participant.fgd_score || "",

      selection_recommendation:
        participant.selection_recommendation || "",

      fgd_feedback: participant.fgd_feedback || "",

      selection_committee_notes:
        participant.selection_committee_notes || "",
    });
  }, [participant]);

  if (!open || !participant) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const user = auth.currentUser;

      const updatedSelectionStatus = form.selection_recommendation || participant.selection_status;

      await updateFGDParticipant(participant.id, {
        ...form,
        // Update participant journey
        selection_status: updatedSelectionStatus,

        // Audit information
        fgd_evaluated_by: user?.displayName || user?.email || "",
        fgd_evaluated_at: new Date(),
      });

      showAlert("success", "Participant evaluation saved.");

      onSaved?.();
      onClose();
    } catch (error) {
      console.error(error);
      showAlert("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start md:items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4 md:my-8 max-h-[95vh] flex flex-col">

        {/* Header */}

        <div className="sticky top-0 bg-white border-b px-5 sm:px-6 py-4 rounded-t-2xl flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--ann-text-dark)]">
              Participant Evaluation
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {participant.participant_code}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Body */}

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">

          {/* Participant Info */}

          <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-2 gap-4">

            <div>
              <p className="text-xs text-gray-500">Participant Name</p>
              <p className="font-semibold text-lg">
                {participant.name}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Institution</p>
              <p className="font-semibold">
                {participant.institution || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-semibold">
                {formatBDPhone(participant.phone) || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Participant Code</p>
              <p className="font-semibold">
                {participant.participant_code}
              </p>
            </div>

          </div>

          {/* Attendance */}

          <div>
            <label className="block text-sm font-semibold mb-2">
              Attendance
            </label>

            <select
              name="fgd_attendance_status"
              value={form.fgd_attendance_status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
            >
              <option value="Pending">Pending</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          {/* Score */}

          <div>
            <label className="block text-sm font-semibold mb-2">
              FGD Score (0 - 10)
            </label>

            <input
              type="number"
              step="0.5"
              min="0"
              max="10"
              name="fgd_score"
              value={form.fgd_score}
              onChange={handleChange}
              placeholder="Enter score"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
            />
          </div>

          {/* Recommendation */}

          <div>
            <label className="block text-sm font-semibold mb-2">
              Recommendation
            </label>

            <select
              name="selection_recommendation"
              value={form.selection_recommendation}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
            >
              <option value="">Select Recommendation</option>
              <option value="Selected">Selected</option>
              <option value="Waitlisted">Waitlisted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Feedback */}

          <div>
            <label className="block text-sm font-semibold mb-2">
              Participant Feedback
            </label>

            <textarea
              rows={4}
              name="fgd_feedback"
              value={form.fgd_feedback}
              onChange={handleChange}
              placeholder="Provide feedback..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-[var(--ann-pink)]"
            />
          </div>

          {/* Committee Notes */}

          <div>
            <label className="block text-sm font-semibold mb-2">
              Committee Notes
            </label>

            <textarea
              rows={4}
              name="selection_committee_notes"
              value={form.selection_committee_notes}
              onChange={handleChange}
              placeholder="Internal committee notes..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-[var(--ann-pink)]"
            />
          </div>

        </div>

        {/* Footer */}

        <div className="sticky bottom-0 bg-white border-t rounded-b-2xl px-5 sm:px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">

          <button
            onClick={onClose}
            className="border border-gray-300 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[var(--ann-pink)] text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Evaluation"}
          </button>

        </div>

      </div>
    </div>
  );
}