import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ChampionLayout from "../../../layouts/ChampionLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAuth } from "../../../context/AuthContext";
import { useAlert } from "../../../context/AlertContext";
import { useChampions, useParticipantsByFGD } from "../../../hooks";
import {
  requestFGDChange,
  markAttendance,
  submitEvaluation,
} from "../../../services/championPortalService";
import {
  FEEDBACK_OPTIONS,
  RECOMMENDATION_OPTIONS,
  ATTENDANCE_OPTIONS,
  RUBRIC_CRITERIA,
  RUBRIC_MAX_TOTAL,
} from "../../../constants/evaluation";
import { ensureHttpUrl } from "../../../utils/url";
import { formatTimeRangeBDT } from "../../../utils/time";
import { ROUTES } from "../../../constants/routes";

const EMPTY_RUBRIC_SCORES = Object.fromEntries(
  RUBRIC_CRITERIA.map((criterion) => [criterion.key, ""])
);

function EvaluationModal({ target, onClose, onSaved }) {
  const { showAlert } = useAlert();
  const [form, setForm] = useState({
    rubric_scores: EMPTY_RUBRIC_SCORES,
    feedback_option: "",
    recommendation_option: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setForm({
      rubric_scores: EMPTY_RUBRIC_SCORES,
      feedback_option: "",
      recommendation_option: "",
      notes: "",
    });
  }, [target]);

  if (!target) return null;

  const { participant } = target;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRubricChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      rubric_scores: { ...prev.rubric_scores, [key]: value },
    }));
  };

  const rubricTotal = RUBRIC_CRITERIA.reduce(
    (sum, criterion) => sum + (Number(form.rubric_scores[criterion.key]) || 0),
    0
  );

  const handleSubmit = async () => {
    if (!form.feedback_option || !form.recommendation_option) {
      showAlert("error", "Please select both feedback and recommendation.");
      return;
    }

    for (const criterion of RUBRIC_CRITERIA) {
      const raw = form.rubric_scores[criterion.key];
      const value = Number(raw);

      if (raw === "" || Number.isNaN(value) || value < 0 || value > criterion.maxScore) {
        showAlert(
          "error",
          `${criterion.label} must be a number between 0 and ${criterion.maxScore}.`
        );
        return;
      }
    }

    setSaving(true);

    try {
      await submitEvaluation({
        participantId: participant.id,
        rubric_scores: form.rubric_scores,
        feedback_option: form.feedback_option,
        recommendation_option: form.recommendation_option,
        notes: form.notes,
      });

      showAlert("success", "Evaluation submitted.");
      onSaved?.();
      onClose();
    } catch (err) {
      showAlert("error", err.message || "Failed to submit evaluation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-start md:items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-4 md:my-8 max-h-[95vh] flex flex-col">
        <div className="sticky top-0 bg-white border-b px-5 sm:px-6 py-4 rounded-t-2xl flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--ann-text-dark)]">
              Evaluate Participant
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {participant.name} • {participant.participant_code}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-xl font-bold">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-3">Selection Rubric</label>
            <div className="space-y-3">
              {RUBRIC_CRITERIA.map((criterion) => (
                <div
                  key={criterion.key}
                  className="flex items-start justify-between gap-3 border border-gray-200 rounded-xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{criterion.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{criterion.description}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={criterion.maxScore}
                      value={form.rubric_scores[criterion.key]}
                      onChange={(e) => handleRubricChange(criterion.key, e.target.value)}
                      placeholder="0"
                      className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:border-[var(--ann-pink)]"
                    />
                    <span className="text-sm text-gray-500">/ {criterion.maxScore}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-1 mt-3 text-sm font-semibold">
              <span>Total:</span>
              <span className="text-[var(--ann-pink)]">{rubricTotal}</span>
              <span className="text-gray-500">/ {RUBRIC_MAX_TOTAL}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Feedback</label>
            <select
              name="feedback_option"
              value={form.feedback_option}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
            >
              <option value="">Select feedback...</option>
              {Object.entries(FEEDBACK_OPTIONS).map(([key, opt]) => (
                <option key={key} value={key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Recommendation</label>
            <select
              name="recommendation_option"
              value={form.recommendation_option}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
            >
              <option value="">Select recommendation...</option>
              {Object.entries(RECOMMENDATION_OPTIONS).map(([key, opt]) => (
                <option key={key} value={key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Notes (optional)</label>
            <textarea
              rows={3}
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Your notes on this participant..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-[var(--ann-pink)]"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t rounded-b-2xl px-5 sm:px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="border border-gray-300 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[var(--ann-pink)] text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit Evaluation"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChampionFGDDetail() {
  const { fgdId } = useParams();
  const { appUser } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [changeReason, setChangeReason] = useState("");
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [submittingChangeRequest, setSubmittingChangeRequest] = useState(false);
  const [evaluationTarget, setEvaluationTarget] = useState(null);

  const { data: champion, loading: loadingChampion } = useChampions(appUser?.id);
  const { data: participants, loading: loadingParticipants } = useParticipantsByFGD(fgdId);

  const fgd = (champion?.assigned_fgds || []).find((item) => item.fgd_id === fgdId);

  useEffect(() => {
    if (!loadingChampion && champion && !fgd) {
      showAlert("error", "You are not assigned to that FGD.");
      navigate(ROUTES.championFGDs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingChampion, champion, fgd]);

  const submitChangeRequest = async () => {
    if (!changeReason.trim()) {
      showAlert("error", "Please provide a reason for the change request.");
      return;
    }

    setSubmittingChangeRequest(true);

    try {
      await requestFGDChange({ fgdId, reason: changeReason.trim() });
      showAlert("success", "Change request submitted to admin.");
      setShowChangeModal(false);
      setChangeReason("");
    } catch (err) {
      showAlert("error", err.message || "Failed to submit request.");
    } finally {
      setSubmittingChangeRequest(false);
    }
  };

  const handleAttendanceChange = async (participantId, status) => {
    try {
      await markAttendance({ participantId, status });
      // No manual local update needed — the live listener reflects it in ~1s.
      showAlert("success", "Attendance updated.");
    } catch (err) {
      showAlert("error", err.message || "Failed to update attendance.");
    }
  };

  if (loadingChampion || !fgd) {
    return (
      <ChampionLayout title="FGD Details" subtitle="Loading...">
        <PageContainer className="py-6 lg:py-8">
          <p className="text-gray-500">Loading FGD...</p>
        </PageContainer>
      </ChampionLayout>
    );
  }

  return (
    <ChampionLayout title={fgd.fgd_code} subtitle={fgd.cohort_name || "-"}>
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate(ROUTES.championFGDs)}
          className="text-sm font-semibold text-gray-500 hover:text-[var(--ann-pink)]"
        >
          ← Back to FGDs
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                {fgd.fgd_code} — {fgd.fgd_name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{fgd.cohort_name}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowChangeModal(true)}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] self-start"
            >
              Request Change
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 px-6 py-5 text-sm">
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-semibold">{fgd.session_date || "Not set"}</p>
            </div>
            <div>
              <p className="text-gray-500">Time</p>
              <p className="font-semibold">
                {formatTimeRangeBDT(fgd.session_start_time, fgd.session_end_time) ||
                  "Not set"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Venue</p>
              <p className="font-semibold">{fgd.venue || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Google Meet</p>
              {fgd.meet_link ? (
                <a
                  href={ensureHttpUrl(fgd.meet_link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--ann-pink)] hover:underline break-all"
                >
                  Join Meet
                </a>
              ) : (
                <p className="font-semibold">Not set</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">Participants</h3>

          <div className="overflow-x-auto mt-5">
            {loadingParticipants ? (
              <p className="text-gray-500 text-sm">Loading participants...</p>
            ) : participants.length === 0 ? (
              <p className="text-gray-500 text-sm">No participants found for this FGD.</p>
            ) : (
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-[#F9FAFB] text-gray-500">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Institution</th>
                    <th className="text-left p-3">Attendance</th>
                    <th className="text-left p-3">Evaluations</th>
                    <th className="text-left p-3">Selection</th>
                    <th className="text-left p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant) => (
                    <tr key={participant.id} className="border-t border-gray-100">
                      <td className="p-3 font-semibold">{participant.name || "-"}</td>
                      <td className="p-3">{participant.institution || "-"}</td>
                      <td className="p-3">
                        <select
                          value={participant.fgd_attendance_status || "Pending"}
                          onChange={(e) =>
                            handleAttendanceChange(participant.id, e.target.value)
                          }
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--ann-pink)]"
                        >
                          {ATTENDANCE_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">{participant.evaluation_count || 0} / 3</td>
                      <td className="p-3">{participant.selection_status || "-"}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                ROUTES.championParticipantProfile
                                  .replace(":fgdId", fgdId)
                                  .replace(":participantId", participant.id)
                              )
                            }
                            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
                          >
                            View Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => setEvaluationTarget({ participant })}
                            className="px-3 py-1.5 rounded-lg bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90"
                          >
                            Evaluate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </PageContainer>

      {showChangeModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Request Change for {fgd.fgd_code}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              This sends a request to the admin team to review — your assignment
              won't change until they act on it.
            </p>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason
              </label>
              <textarea
                rows={4}
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Explain why you need a different FGD assignment..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-[var(--ann-pink)]"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowChangeModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingChangeRequest}
                onClick={submitChangeRequest}
                className="px-5 py-2.5 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {submittingChangeRequest ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      <EvaluationModal
        target={evaluationTarget}
        onClose={() => setEvaluationTarget(null)}
      />
    </ChampionLayout>
  );
}
