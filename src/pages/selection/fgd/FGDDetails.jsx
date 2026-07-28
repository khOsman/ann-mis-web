import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAlert } from "../../../context/AlertContext";
import { useAuth } from "../../../context/AuthContext";
import { useChampions, useFGD, useParticipantEvaluations } from "../../../hooks";
import {
  updateFGDSchedule,
  updateFGDStatus,
  syncFGDStatusIfEnded,
} from "../../../services/fgdService";
import {
  assignChampionToFGD,
  unassignChampionFromFGD,
} from "../../../services/championsService";
import { CHAMPION_ROLES, MEMBER_STATUS } from "../../../constants/champions";
import { FGD_STATUS_OPTIONS } from "../../../constants/fgd";
import { FEEDBACK_OPTIONS, REQUIRED_EVALUATIONS } from "../../../constants/evaluation";
import ParticipantEvaluationModal from "../../../components/selection/ParticipantEvaluationModal";
import { ensureHttpUrl } from "../../../utils/url";
import { formatTimeRangeBDT } from "../../../utils/time";
import { formatBDPhone } from "../../../utils/phone";


// Its own component so each row can hold its own live subscription to that
// participant's evaluations — hooks can't be called inside a .map() loop.
function ParticipantRow({ participant, isViewer, onEvaluate }) {
  const navigate = useNavigate();
  const { data: evaluations, loading: loadingEvaluations } =
    useParticipantEvaluations(participant.id);

  return (
    <tr className="border-t border-gray-100">
      <td className="p-4 font-semibold">{participant.name || "-"}</td>
      <td className="p-4">{formatBDPhone(participant.phone) || "-"}</td>
      <td className="p-4">{participant.institution || "-"}</td>
      <td className="p-4">{participant.fgd_attendance_status || "Pending"}</td>

      <td className="p-4">
        {participant.average_evaluation_score != null ? (
          <>
            <span className="font-semibold">
              {Number(participant.average_evaluation_score).toFixed(1)}
            </span>
            <span className="text-xs text-gray-400 ml-1">
              ({participant.evaluation_count || 0}/{REQUIRED_EVALUATIONS})
            </span>
          </>
        ) : (
          "-"
        )}
      </td>

      <td className="p-4 min-w-[220px]">
        {loadingEvaluations ? (
          <span className="text-xs text-gray-400">Loading...</span>
        ) : evaluations.length === 0 ? (
          "-"
        ) : (
          <div className="space-y-1.5">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="text-xs">
                <span className="font-semibold text-gray-700">
                  {evaluation.evaluator_name || "SC member"}:
                </span>{" "}
                <span className="text-gray-600">
                  {FEEDBACK_OPTIONS[evaluation.feedback_option]?.label ||
                    evaluation.feedback_option ||
                    "-"}
                </span>
                {evaluation.notes && (
                  <span className="text-gray-400"> — {evaluation.notes}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </td>

      <td className="p-4">{participant.selection_status || "-"}</td>

      <td className="p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/admin/participants/${participant.id}`)}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
          >
            View Profile
          </button>

          {!isViewer && (
            <button
              type="button"
              onClick={() => onEvaluate(participant)}
              className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90"
            >
              Evaluate
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function FGDDetails() {
  const { fgdId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { isViewer } = useAuth();
  const [evaluationTarget, setEvaluationTarget] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [committeeSearch, setCommitteeSearch] = useState("");
  const [selectedChampionIds, setSelectedChampionIds] = useState([]);
  const [assigningMembers, setAssigningMembers] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const { fgd, participants, loading, error } = useFGD(fgdId);

  // Present/Absent/Pending Feedback were previously read from fgd.total_present
  // etc. — fields nothing in the app ever actually writes, so they always
  // showed 0. Deriving them from the already-loaded participants array (like
  // the Participants card already does) means they can't go stale.
  const attendanceStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let pendingFeedback = 0;

    participants.forEach((participant) => {
      if (participant.fgd_attendance_status === "Present") present += 1;
      if (participant.fgd_attendance_status === "Absent") absent += 1;
      if ((participant.evaluation_count || 0) < REQUIRED_EVALUATIONS) {
        pendingFeedback += 1;
      }
    });

    return { present, absent, pendingFeedback };
  }, [participants]);

  // Opportunistic reconciliation — no scheduled job flips a passed FGD to
  // Completed on its own, so check whenever this page loads/updates.
  useEffect(() => {
    if (!fgd) return;

    syncFGDStatusIfEnded(fgd).catch((err) =>
      console.error(`Failed to sync status for ${fgd.id}:`, err)
    );
  }, [fgd]);

  const handleStatusChange = async (e) => {
    const nextStatus = e.target.value;
    setSavingStatus(true);

    try {
      await updateFGDStatus(fgdId, nextStatus);
      showAlert("success", `Status updated to ${nextStatus}.`);
      // No manual refetch needed — the live listener updates the FGD doc automatically.
    } catch (err) {
      showAlert("error", err.message || "Failed to update status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const { data: allChampions, loading: loadingCommittee } = useChampions();
  const activeCommittee = useMemo(
    () =>
      allChampions.filter(
        (champion) =>
          champion.role === CHAMPION_ROLES.SELECTION_COMMITTEE &&
          champion.member_status === MEMBER_STATUS.ACTIVE
      ),
    [allChampions]
  );

  const assignedChampionIds = useMemo(
    () => new Set((fgd?.committee_members || []).map((member) => member.champion_id)),
    [fgd]
  );

  const assignableCommittee = useMemo(() => {
    const keyword = committeeSearch.trim().toLowerCase();

    return activeCommittee.filter((champion) => {
      if (assignedChampionIds.has(champion.id)) return false;
      if (!keyword) return true;
      return champion.name?.toLowerCase().includes(keyword);
    });
  }, [activeCommittee, assignedChampionIds, committeeSearch]);

  const toggleSelected = (championId) => {
    setSelectedChampionIds((prev) =>
      prev.includes(championId)
        ? prev.filter((id) => id !== championId)
        : [...prev, championId]
    );
  };

  const handleAssignSelected = async () => {
    if (selectedChampionIds.length === 0) {
      showAlert("error", "Select at least one committee member to assign.");
      return;
    }

    setAssigningMembers(true);

    try {
      const results = await Promise.allSettled(
        selectedChampionIds.map((championId) =>
          assignChampionToFGD({ championId, fgdId })
        )
      );

      const failed = results.filter((result) => result.status === "rejected");

      if (failed.length > 0) {
        showAlert(
          "error",
          `${failed.length} of ${selectedChampionIds.length} assignment(s) failed.`
        );
      } else {
        showAlert(
          "success",
          `${selectedChampionIds.length} committee member(s) assigned. Notification emails sent.`
        );
      }

      setSelectedChampionIds([]);
      // No manual refetch needed — both live listeners (FGD, Champions) pick up the change.
    } finally {
      setAssigningMembers(false);
    }
  };

  const handleRemoveMember = async (championId) => {
    try {
      await unassignChampionFromFGD({ championId, fgdId });
      showAlert("success", "Committee member removed from this FGD.");
      // No manual refetch needed — the live listener updates the FGD doc automatically.
    } catch (err) {
      showAlert("error", err.message || "Failed to remove committee member.");
    }
  };

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
      // No manual refetch needed — the live listener updates the FGD doc automatically.
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
        <PageContainer className="py-6 lg:py-8 space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-[var(--ann-pink)]"
          >
            ← Back
          </button>
          <p className="text-gray-500">Loading FGD...</p>
        </PageContainer>
      </AdminLayout>
    );
  }

  if (error || !fgd) {
    return (
      <AdminLayout title="FGD Details" subtitle="Unable to load FGD">
        <PageContainer className="py-6 lg:py-8 space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-[var(--ann-pink)]"
          >
            ← Back
          </button>
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
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back
        </button>

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
              <select
                value={fgd.status || ""}
                disabled={savingStatus || isViewer}
                onChange={handleStatusChange}
                className="mt-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-[var(--ann-pink)] disabled:opacity-50"
              >
                {FGD_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
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

            {!editingSchedule && !isViewer && (
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
                  {formatTimeRangeBDT(fgd.session_start_time, fgd.session_end_time) ||
                    "Not set"}
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
                    href={ensureHttpUrl(fgd.meet_link)}
                    target="_blank"
                    rel="noopener noreferrer"
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
            <h3 className="text-2xl font-bold">{attendanceStats.present}</h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Absent</p>
            <h3 className="text-2xl font-bold">{attendanceStats.absent}</h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Pending Feedback</p>
            <h3 className="text-2xl font-bold">
              {attendanceStats.pendingFeedback}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
            Selection Committee Members
          </h3>

          {fgd.committee_members?.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {fgd.committee_members.map((member) => (
                <div
                  key={member.champion_id}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm flex items-center gap-3"
                >
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  {!isViewer && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.champion_id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-4">
              No committee members assigned yet.
            </p>
          )}

          {!isViewer && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-700">
              Assign Active Committee Members
            </h4>

            <input
              type="text"
              value={committeeSearch}
              onChange={(e) => setCommitteeSearch(e.target.value)}
              placeholder="Search by name..."
              className="mt-3 w-full max-w-sm border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
            />

            {loadingCommittee ? (
              <p className="text-sm text-gray-500 mt-4">
                Loading active committee members...
              </p>
            ) : assignableCommittee.length === 0 ? (
              <p className="text-sm text-gray-500 mt-4">
                No matching active committee members available.
              </p>
            ) : (
              <div className="mt-4 max-h-64 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
                {assignableCommittee.map((champion) => (
                  <label
                    key={champion.id}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedChampionIds.includes(champion.id)}
                      onChange={() => toggleSelected(champion.id)}
                      className="accent-[var(--ann-pink)]"
                    />
                    <div>
                      <p className="font-semibold">{champion.name}</p>
                      <p className="text-xs text-gray-500">
                        {champion.champion_code} • {champion.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <button
              type="button"
              disabled={assigningMembers || selectedChampionIds.length === 0}
              onClick={handleAssignSelected}
              className="mt-4 bg-[var(--ann-pink)] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50"
            >
              {assigningMembers
                ? "Assigning..."
                : `Assign Selected${
                    selectedChampionIds.length > 0
                      ? ` (${selectedChampionIds.length})`
                      : ""
                  }`}
            </button>
          </div>
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
                    <ParticipantRow
                      key={participant.id}
                      participant={participant}
                      isViewer={isViewer}
                      onEvaluate={setEvaluationTarget}
                    />
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
      />
    </AdminLayout>
  );
}
