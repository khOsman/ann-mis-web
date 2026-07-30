import { CheckCircle2, Circle, XCircle } from "lucide-react";
import ParticipantLayout from "../../../layouts/ParticipantLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAuth } from "../../../context/AuthContext";
import { useParticipant } from "../../../hooks";
import { formatBDPhone } from "../../../utils/phone";

const NEGATIVE_STATUSES = ["Rejected", "Cancelled", "Dropped"];
const POSITIVE_STATUSES = ["Selected", "Enrolled", "Graduated", "Completed"];

const stepVisual = (status) => {
  if (!status || status === "Pending") {
    return { Icon: Circle, className: "text-gray-300", cardClass: "bg-gray-50 border-gray-200" };
  }

  if (NEGATIVE_STATUSES.includes(status)) {
    return { Icon: XCircle, className: "text-red-500", cardClass: "bg-red-50 border-red-100" };
  }

  if (POSITIVE_STATUSES.includes(status) || status === "In Progress") {
    return {
      Icon: CheckCircle2,
      className: "text-[var(--ann-pink)]",
      cardClass: "bg-pink-50 border-pink-100",
    };
  }

  return { Icon: Circle, className: "text-gray-300", cardClass: "bg-gray-50 border-gray-200" };
};

export default function ParticipantDashboard() {
  const { appUser } = useAuth();
  const { data: participant, loading } = useParticipant(appUser?.id);

  const journeySteps = [
    ["Registered", participant?.registration_status || "Registered"],
    ["Selected", participant?.selection_status],
    ["Enrolled", participant?.enrollment_status],
    ["Graduated", participant?.graduation_status],
    ["Project", participant?.project_status],
  ];

  return (
    <ParticipantLayout
      title={`Welcome, ${participant?.name || appUser?.name || "Changemaker"}`}
      subtitle="Your journey with Amra Notun Network"
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-500">
            Loading your profile...
          </div>
        ) : !participant ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-500">
            We couldn't find your participant record.
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
                <div>
                  <p className="text-gray-500">Participant Code</p>
                  <p className="font-semibold mt-1">{participant.participant_code || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cohort</p>
                  <p className="font-semibold mt-1">
                    {participant.cohort_name || "-"}
                    {participant.cohort_code ? ` (${participant.cohort_code})` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Institution</p>
                  <p className="font-semibold mt-1">{participant.institution || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-semibold mt-1">
                    {formatBDPhone(participant.phone) || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">Your Journey</h3>
              <p className="text-sm text-gray-500 mt-1">
                Track your progress through the Amra Notun Changemakers' Programme.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-5">
                {journeySteps.map(([label, status]) => {
                  const { Icon, className, cardClass } = stepVisual(status);

                  return (
                    <div
                      key={label}
                      className={`border rounded-2xl p-4 text-center ${cardClass}`}
                    >
                      <Icon className={`mx-auto ${className}`} size={28} />
                      <p className="text-xs text-gray-500 mt-2">{label}</p>
                      <p className="font-bold text-[var(--ann-purple)] mt-1">
                        {status || "Pending"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </PageContainer>
    </ParticipantLayout>
  );
}
