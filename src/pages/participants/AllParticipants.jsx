import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCohorts, useParticipants } from "../../hooks";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import { COHORT_STATUS } from "../../constants/status";
import { ROUTES } from "../../constants/routes";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { formatBDPhone } from "../../utils/phone";
import { openImpersonationTab } from "../../services/impersonationService";

const TABLE_COLUMN_COUNT = 13;
const PAGE_SIZE = 50;

export default function AllParticipants() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useAuth();
  const { showAlert } = useAlert();
  const [impersonatingId, setImpersonatingId] = useState(null);

  const handleLoginAs = async (participant) => {
    setImpersonatingId(participant.id);

    try {
      await openImpersonationTab({ targetType: "participant", targetId: participant.id });
    } catch (error) {
      showAlert("error", error.message || "Failed to start impersonation session.");
    } finally {
      setImpersonatingId(null);
    }
  };

  const { data: participants, loading } = useParticipants();
  const { data: allCohorts } = useCohorts();
  const cohorts = useMemo(
    () => allCohorts.filter((cohort) => cohort.status === COHORT_STATUS.ACTIVE),
    [allCohorts]
  );

  const [search, setSearch] = useState("");
  const [cohortFilter, setCohortFilter] = useState("");
  const [page, setPage] = useState(1);

  const filteredParticipants = useMemo(() => {
    const keyword = search.toLowerCase();

    return participants.filter((participant) => {
      if (cohortFilter && participant.cohort_id !== cohortFilter) {
        return false;
      }

      return (
        participant.participant_code?.toLowerCase().includes(keyword) ||
        participant.name?.toLowerCase().includes(keyword) ||
        participant.gender?.toLowerCase().includes(keyword) ||
        participant.email?.toLowerCase().includes(keyword) ||
        participant.phone?.toLowerCase().includes(keyword) ||
        participant.cohort_name?.toLowerCase().includes(keyword) ||
        participant.cohort_code?.toLowerCase().includes(keyword)
      );
    });
  }, [participants, search, cohortFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, cohortFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredParticipants.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const paginatedParticipants = filteredParticipants.slice(
    pageStart,
    pageStart + PAGE_SIZE
  );

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

  const StatusBadge = ({ value }) => (
    <span className="px-3 py-1 rounded-full bg-pink-50 text-[var(--ann-pink)] text-xs font-semibold whitespace-nowrap">
      {value || "-"}
    </span>
  );

  return (
    <AdminLayout
      title="Participants"
      subtitle="View and manage ANN participants"
    >
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                Participant List
              </h3>
              <p className="text-sm text-gray-500">
                Registered participants from public registration forms.
              </p>
            </div>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.bulkImportParticipants)}
                className="bg-[var(--ann-pink)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 self-start"
              >
                Bulk Import Participants
              </button>
            )}
          </div>

          <div className="mb-5 flex flex-col md:flex-row gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search participant code, name, gender, email, phone, cohort..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
            />

            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="md:w-64 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
            >
              <option value="">All Active Cohorts</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.cohort_name} ({cohort.cohort_code})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full min-w-[1400px] text-sm">
              <thead className="bg-[#F9FAFB] text-gray-500">
                <tr>
                  <th className="text-left p-4">No.</th>
                  <th className="text-left p-4">Participant Code</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Gender</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Cohort</th>
                  <th className="text-left p-4">Registration</th>
                  <th className="text-left p-4">Selection</th>
                  <th className="text-left p-4">Enrollment</th>
                  <th className="text-left p-4">Graduation</th>
                  <th className="text-left p-4">Submitted At</th>
                  <th className="text-left p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={TABLE_COLUMN_COUNT}
                      className="p-6 text-center text-gray-500"
                    >
                      Loading participants...
                    </td>
                  </tr>
                ) : filteredParticipants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={TABLE_COLUMN_COUNT}
                      className="p-6 text-center text-gray-500"
                    >
                      No participant found.
                    </td>
                  </tr>
                ) : (
                  paginatedParticipants.map((participant, index) => (
                    <tr
                      key={participant.id}
                      className="border-t border-gray-100"
                    >
                      <td className="p-4 text-gray-500">{pageStart + index + 1}</td>

                      <td className="p-4">
                        <span className="font-mono text-xs font-bold text-[var(--ann-purple)]">
                          {participant.participant_code || "-"}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-[var(--ann-text-dark)]">
                        {participant.name || "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        {participant.gender || "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        {participant.email || "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        {formatBDPhone(participant.phone) || "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        <div>{participant.cohort_name || "-"}</div>
                        <div className="text-xs text-gray-400">
                          {participant.cohort_code || "-"}
                        </div>
                      </td>

                      <td className="p-4">
                        <StatusBadge value={participant.registration_status} />
                      </td>

                      <td className="p-4">
                        <StatusBadge value={participant.selection_status} />
                      </td>

                      <td className="p-4">
                        <StatusBadge value={participant.enrollment_status} />
                      </td>

                      <td className="p-4">
                        <StatusBadge value={participant.graduation_status} />
                      </td>

                      <td className="p-4 text-gray-600">
                        {formatDate(participant.submitted_at)}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              navigate(`/admin/participants/${participant.id}`, {
                                state: {
                                  from: "/admin/participants",
                                  fromLabel: "Participants",
                                },
                              })
                            }
                            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold"
                          >
                            View Profile
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleLoginAs(participant)}
                              disabled={impersonatingId === participant.id}
                              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold disabled:opacity-50"
                            >
                              {impersonatingId === participant.id ? "Starting..." : "Login as"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredParticipants.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
              <p className="text-sm text-gray-500">
                Showing {pageStart + 1}–
                {Math.min(pageStart + PAGE_SIZE, filteredParticipants.length)} of{" "}
                {filteredParticipants.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-700"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-500 px-2">
                  Page {safePage} of {pageCount}
                </span>

                <button
                  type="button"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </AdminLayout>
  );
}
