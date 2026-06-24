import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebase";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";

export default function ParticipantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState(null);
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const fetchParticipant = async () => {
      try {
        const participantSnap = await getDoc(doc(db, "participants", id));

        if (!participantSnap.exists()) {
          showAlert("error", "Participant not found.");
          navigate("/admin/participants");
          return;
        }

        const participantData = {
          id: participantSnap.id,
          ...participantSnap.data(),
        };

        setParticipant(participantData);

        if (participantData.response_id) {
          const responseSnap = await getDoc(
            doc(db, "form_responses", participantData.response_id)
          );

          if (responseSnap.exists()) {
            setResponse({
              id: responseSnap.id,
              ...responseSnap.data(),
            });
          }
        }
      } catch (error) {
        console.error("Failed to load participant:", error);
        showAlert("error", error.message || "Failed to load participant.");
      } finally {
        setLoading(false);
      }
    };

    fetchParticipant();
  }, [id]);

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

            <p className="text-sm text-gray-500 mt-1">
              {participant.registration_status || "Registered"}
            </p>

            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-semibold text-gray-800">
                  {participant.email || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-semibold text-gray-800">
                  {participant.phone || "-"}
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
      </PageContainer>
    </AdminLayout>
  );
}