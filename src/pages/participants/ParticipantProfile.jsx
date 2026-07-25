import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFormResponseById } from "../../services/registrationService";
import { useParticipant, useParticipantEvaluations } from "../../hooks";
import {
  FEEDBACK_OPTIONS,
  RECOMMENDATION_OPTIONS,
  REQUIRED_EVALUATIONS,
} from "../../constants/evaluation";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";
import { formatBDPhone } from "../../utils/phone";

export default function ParticipantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const { data: participant, loading } = useParticipant(id);
  const { data: evaluations, loading: loadingEvaluations } =
    useParticipantEvaluations(id);
  const [response, setResponse] = useState(null);

  // The submitted application response is immutable historical data — a
  // one-time fetch, unlike the participant doc itself (which live-updates
  // e.g. when evaluated from FGDDetails.jsx while this profile stays open).
  useEffect(() => {
    if (!participant?.response_id) return;

    getFormResponseById(participant.response_id)
      .then((data) => {
        if (data) setResponse(data);
      })
      .catch((error) => {
        console.error("Failed to load application response:", error);
      });
  }, [participant?.response_id]);

  useEffect(() => {
    if (!loading && !participant) {
      showAlert("error", "Participant not found.");
      navigate("/admin/participants");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, participant]);

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "-";

    return timestamp.toDate().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const journeySteps = [
    ["Registered", participant?.registration_status],
    ["Selected", participant?.selection_status],
    ["Enrolled", participant?.enrollment_status],
    ["Graduated", participant?.graduation_status],
    ["Project", participant?.project_status],
  ];

  if (loading) {
    return (
      <AdminLayout title="Participant Profile" subtitle="Loading participant">
        <PageContainer className="py-6">
          <p className="text-gray-500">Loading participant...</p>
        </PageContainer>
      </AdminLayout>
    );
  }

  if (!participant) return null;

  return (
    <AdminLayout
      title="Participant Profile"
      subtitle="View participant details and journey"
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <button
          onClick={() => navigate("/admin/participants")}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to Participants
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-pink-50 text-[var(--ann-pink)] flex items-center justify-center text-3xl font-extrabold">
              {(participant.name || "?").charAt(0).toUpperCase()}
            </div>

            <h2 className="text-2xl font-extrabold text-[var(--ann-text-dark)] mt-5">
              {participant.name || "-"}
            </h2>

            <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-pink-50 text-[var(--ann-pink)] text-xs font-semibold">
                    {participant.registration_status || "Registered"}
                </span>

                <span className="font-mono text-xs text-gray-500">
                    {participant.participant_code}
                </span>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              
              <div>
                <p className="text-gray-500">Participant Code</p>

                <p className="font-mono font-bold text-[var(--ann-purple)]">
                    {participant.participant_code || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Gender</p>
                <p className="font-semibold text-gray-800">
                  {participant.gender || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Date of Birth</p>
                <p className="font-semibold text-gray-800">
                  {participant.date_of_birth || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Age</p>
                <p className="font-semibold text-gray-800">
                  {participant.age || "-"}
                </p>
              </div>
              
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-semibold text-gray-800">
                  {participant.email || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-semibold text-gray-800">
                  {formatBDPhone(participant.phone) || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Cohort</p>
                <p className="font-semibold text-gray-800">
                  {participant.cohort_name || "-"} ({participant.cohort_code || "-"})
                </p>
              </div>

              <div>
                <p className="text-gray-500">Submitted At</p>
                <p className="font-semibold text-gray-800">
                  {formatDate(participant.submitted_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Participant Journey
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-5">
              {journeySteps.map(([label, status]) => (
                <div
                  key={label}
                  className="border border-gray-200 rounded-2xl p-4 bg-gray-50"
                >
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-bold text-[var(--ann-purple)] mt-1">
                    {status || "Pending"}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                Application Details
              </h3>

              <div className="mt-4 border border-gray-100 rounded-2xl overflow-hidden">
                {response?.answers?.length > 0 ? (
                  response.answers.map((answer) => (
                    <div
                      key={answer.field_id}
                      className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-semibold text-gray-700">
                        {answer.field_label_en || answer.field_label_bn || "-"}
                      </div>

                      <div className="md:col-span-2 text-gray-600">
                        {Array.isArray(answer.value)
                          ? answer.value.join(", ")
                          : answer.value || "-"}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-5 text-gray-500">
                    No application response found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                Selection Committee Evaluations
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Every committee member's individual evaluation of this participant.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-full bg-purple-50 text-[var(--ann-purple)] text-xs font-semibold whitespace-nowrap">
                {participant.evaluation_count || 0} / {REQUIRED_EVALUATIONS} evaluated
              </span>
              {participant.average_evaluation_score != null && (
                <span className="px-3 py-1.5 rounded-full bg-pink-50 text-[var(--ann-pink)] text-xs font-semibold whitespace-nowrap">
                  Avg. {Number(participant.average_evaluation_score).toFixed(1)} / 10
                </span>
              )}
            </div>
          </div>

          {loadingEvaluations ? (
            <p className="text-sm text-gray-500">Loading evaluations...</p>
          ) : evaluations.length === 0 ? (
            <p className="text-sm text-gray-500">
              No selection committee member has evaluated this participant yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left p-3">Evaluator</th>
                    <th className="text-center p-3">FGD Score</th>
                    <th className="text-left p-3">Feedback</th>
                    <th className="text-left p-3">Recommendation</th>
                    <th className="text-center p-3">Computed Score</th>
                    <th className="text-left p-3">Notes</th>
                    <th className="text-left p-3">Evaluated At</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((evaluation) => (
                    <tr key={evaluation.id} className="border-t border-gray-100">
                      <td className="p-3 font-semibold text-gray-800">
                        {evaluation.evaluator_name || "-"}
                      </td>
                      <td className="p-3 text-center">
                        {evaluation.fgd_score ?? "-"}
                      </td>
                      <td className="p-3">
                        {FEEDBACK_OPTIONS[evaluation.feedback_option]?.label ||
                          evaluation.feedback_option ||
                          "-"}
                      </td>
                      <td className="p-3">
                        {RECOMMENDATION_OPTIONS[evaluation.recommendation_option]
                          ?.label ||
                          evaluation.recommendation_option ||
                          "-"}
                      </td>
                      <td className="p-3 text-center font-semibold text-[var(--ann-purple)]">
                        {evaluation.computed_score != null
                          ? Number(evaluation.computed_score).toFixed(1)
                          : "-"}
                      </td>
                      <td className="p-3 text-gray-600 max-w-[220px]">
                        {evaluation.notes || "-"}
                      </td>
                      <td className="p-3 text-gray-500 whitespace-nowrap">
                        {formatDate(evaluation.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageContainer>
    </AdminLayout>
  );
}