import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ChampionLayout from "../../../layouts/ChampionLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAuth } from "../../../context/AuthContext";
import { useAlert } from "../../../context/AlertContext";
import { useChampions, useParticipant } from "../../../hooks";
import { getFormResponseById } from "../../../services/registrationService";
import { formatBDPhone } from "../../../utils/phone";
import { ROUTES } from "../../../constants/routes";

const formatDate = (timestamp) => {
  if (!timestamp?.toDate) return "-";
  return timestamp.toDate().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ChampionParticipantProfile() {
  const { fgdId, participantId } = useParams();
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const { showAlert } = useAlert();

  const { data: champion, loading: loadingChampion } = useChampions(appUser?.id);
  const { data: participant, loading: loadingParticipant } = useParticipant(participantId);
  const [response, setResponse] = useState(null);

  const isAssignedToFgd = (champion?.assigned_fgd_ids || []).includes(fgdId);

  useEffect(() => {
    if (!loadingChampion && champion && !isAssignedToFgd) {
      showAlert("error", "You are not assigned to that FGD.");
      navigate(ROUTES.championFGDs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingChampion, champion, isAssignedToFgd]);

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

  const loading = loadingChampion || loadingParticipant;

  if (loading || !isAssignedToFgd) {
    return (
      <ChampionLayout title="Participant Profile" subtitle="Loading...">
        <PageContainer className="py-6 lg:py-8">
          <p className="text-gray-500">Loading...</p>
        </PageContainer>
      </ChampionLayout>
    );
  }

  if (!participant) {
    return (
      <ChampionLayout title="Participant Profile" subtitle="Not found">
        <PageContainer className="py-6 lg:py-8">
          <p className="text-gray-500">Participant not found.</p>
        </PageContainer>
      </ChampionLayout>
    );
  }

  return (
    <ChampionLayout title={participant.name || "Participant"} subtitle={participant.participant_code}>
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate(ROUTES.championFGDDetail.replace(":fgdId", fgdId))}
          className="text-sm font-semibold text-gray-500 hover:text-[var(--ann-pink)]"
        >
          ← Back to FGD
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">Participant Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-semibold">{participant.name || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Participant Code</p>
              <p className="font-semibold">{participant.participant_code || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Institution</p>
              <p className="font-semibold">{participant.institution || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-semibold">{formatBDPhone(participant.phone) || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-semibold">{participant.email || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Gender</p>
              <p className="font-semibold">{participant.gender || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Date of Birth</p>
              <p className="font-semibold">{participant.date_of_birth || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Age</p>
              <p className="font-semibold">{participant.age || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Cohort</p>
              <p className="font-semibold">
                {participant.cohort_name || "-"} ({participant.cohort_code || "-"})
              </p>
            </div>
            <div>
              <p className="text-gray-500">Registered On</p>
              <p className="font-semibold">{formatDate(participant.submitted_at)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">Application Details</h3>
          <p className="text-sm text-gray-500 mt-1">Their original registration form answers.</p>

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
                    {Array.isArray(answer.value) ? answer.value.join(", ") : answer.value || "-"}
                  </div>
                </div>
              ))
            ) : (
              <p className="p-5 text-gray-500">No application response found.</p>
            )}
          </div>
        </div>
      </PageContainer>
    </ChampionLayout>
  );
}
