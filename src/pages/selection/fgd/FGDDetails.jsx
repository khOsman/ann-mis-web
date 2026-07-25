import { useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAlert } from "../../../context/AlertContext";
import { useFGD } from "../../../hooks";
import { updateFGDSchedule } from "../../../services/fgdService";
import ParticipantEvaluationModal from "../../../components/selection/ParticipantEvaluationModal";


export default function FGDDetails() {
  const { fgdId } = useParams();
  const { showAlert } = useAlert();
  const [evaluationTarget, setEvaluationTarget] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const { fgd, participants, loading, error, refresh } = useFGD(fgdId);

  const startEditSchedule = () => {
    setScheduleForm({
      session_date: fgd.session_date || "",
      session_start_time: fgd.session_start_time || "",
      session_end_time: fgd.session_end_time || "",
      venue: fgd.venue || "",
      meet_link: fgd.meet_link || "",
    });
    setEditingSchedule(true);
  };

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    setScheduleForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);

    try {
      await updateFGDSchedule(fgdId, scheduleForm);
      showAlert("success", "FGD schedule updated successfully.");
      setEditingSchedule(false);
      await refresh();
    } catch (err) {
      showAlert("error", err.message || "Failed to update schedule.");
    } finally {
      setSavingSchedule(false);
    }
  };

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

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Schedule
            </h3>

            {!editingSchedule && (
              <button
                type="button"
                onClick={startEditSchedule}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
              >
                Edit Schedule
              </button>
            )}
          </div>

          {editingSchedule ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="session_date"
                  value={scheduleForm.session_date}
                  onChange={handleScheduleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="session_start_time"
                    value={scheduleForm.session_start_time}
                    onChange={handleScheduleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="session_end_time"
                    value={scheduleForm.session_end_time}
                    onChange={handleScheduleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Venue
                </label>
                <input
                  type="text"
                  name="venue"
                  value={scheduleForm.venue}
                  onChange={handleScheduleChange}
                  placeholder="Physical venue (optional)"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Google Meet Link
                </label>
                <input
                  type="text"
                  name="meet_link"
                  value={scheduleForm.meet_link}
                  onChange={handleScheduleChange}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(false)}
                  className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingSchedule}
                  onClick={handleSaveSchedule}
                  className="bg-[var(--ann-pink)] text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {savingSchedule ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 text-sm">
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-semibold">{fgd.session_date || "Not set"}</p>
              </div>

              <div>
                <p className="text-gray-500">Time</p>
                <p className="font-semibold">
                  {fgd.session_start_time && fgd.session_end_time
                    ? `${fgd.session_start_time} - ${fgd.session_end_time}`
                    : "Not set"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Venue</p>
                <p className="font-semibold">{fgd.venue || "-"}</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-gray-500">Google Meet Link</p>
                {fgd.meet_link ? (
                  <a
                    href={fgd.meet_link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[var(--ann-pink)] hover:underline break-all"
                  >
                    {fgd.meet_link}
                  </a>
                ) : (
                  <p className="font-semibold">Not set</p>
                )}
              </div>
            </div>
          )}
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
            Selection Committee Members
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Assign committee members from the{" "}
            <span className="font-semibold">Champions → Selection Committee</span>{" "}
            page.
          </p>

          {fgd.committee_members?.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {fgd.committee_members.map((member) => (
                <div
                  key={member.champion_id}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm"
                >
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-4">
              No committee members assigned yet.
            </p>
          )}
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
