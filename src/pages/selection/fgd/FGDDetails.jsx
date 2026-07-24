import { useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useFGD } from "../../../hooks";
import ParticipantEvaluationModal from "../../../components/selection/ParticipantEvaluationModal";


export default function FGDDetails() {
  const { fgdId } = useParams();
  const [evaluationTarget, setEvaluationTarget] = useState(null);

  const { fgd, participants, loading, error, refresh } = useFGD(fgdId);

  if (loading) {
    return (
      <AdminLayout
        title="FGD Details"
        subtitle="Loading FGD information"
      >
        <PageContainer className="py-6 lg:py-8">
          <p className="text-gray-500">Loading FGD...</p>
        </PageContainer>
      </AdminLayout>
    );
  }

  if (error || !fgd) {
    return (
      <AdminLayout title="FGD Details" subtitle="Unable to load FGD">
        <PageContainer className="py-6 lg:py-8">
          <p className="text-red-500">
            {error?.message || "FGD not found."}
          </p>
        </PageContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={fgd.fgd_code || "FGD Details"}
      subtitle={`${fgd.cohort_name || "-"} • ${fgd.total_participants || 0} participants`}
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
            FGD Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 text-sm">
            <div>
              <p className="text-gray-500">FGD Code</p>
              <p className="font-semibold">{fgd.fgd_code || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">FGD Name</p>
              <p className="font-semibold">{fgd.fgd_name || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-semibold">{fgd.status || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">Cohort</p>
              <p className="font-semibold">{fgd.cohort_name || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">Participant Limit</p>
              <p className="font-semibold">{fgd.participant_limit || 0}</p>
            </div>

            <div>
              <p className="text-gray-500">Total Participants</p>
              <p className="font-semibold">{fgd.total_participants || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Participants</p>
            <h3 className="text-2xl font-bold">{participants.length}</h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Present</p>
            <h3 className="text-2xl font-bold">{fgd.total_present || 0}</h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Absent</p>
            <h3 className="text-2xl font-bold">{fgd.total_absent || 0}</h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Pending Feedback</p>
            <h3 className="text-2xl font-bold">
              {fgd.total_pending_feedback || 0}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
            Participants
          </h3>

          <div className="overflow-x-auto mt-5">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-[#F9FAFB] text-gray-500">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Institution</th>
                  <th className="text-left p-4">Attendance</th>
                  <th className="text-left p-4">Score</th>
                  <th className="text-left p-4">Feedback</th>
                  <th className="text-left p-4">Selection</th>
                  <th className="text-left p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-500">
                      No participants found for this FGD.
                    </td>
                  </tr>
                ) : (
                  participants.map((participant) => (
                    <tr
                      key={participant.id}
                      className="border-t border-gray-100"
                    >
                      <td className="p-4 font-semibold">
                        {participant.name || "-"}
                      </td>
                      <td className="p-4">0{participant.phone || "-"}</td>
                      <td className="p-4">
                        {participant.institution || "-"}
                      </td>
                      <td className="p-4">
                        {participant.fgd_attendance_status || "Pending"}
                      </td>
                      <td className="p-4">{participant.fgd_score || "-"}</td>
                      <td className="p-4">
                        {participant.fgd_feedback || "-"}
                      </td>
                      <td className="p-4">
                        {participant.selection_status || "-"}
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => setEvaluationTarget(participant)}
                          className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90"
                        >
                          Evaluate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageContainer>
      <ParticipantEvaluationModal
        open={!!evaluationTarget}
        participant={evaluationTarget}
        onClose={() => setEvaluationTarget(null)}
        onSaved={refresh}
      />
    </AdminLayout>
  );
}