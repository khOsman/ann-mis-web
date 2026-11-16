import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAuth } from "../../../context/AuthContext";
import {
  useCohort,
  useFGDsByCohort,
  useParticipantsByCohort,
  usePhoneCallsByCohort,
} from "../../../hooks";
import CallerAssignmentModal from "../../../components/phoneCalls/CallerAssignmentModal";
import { ROUTES } from "../../../constants/routes";
import { CALL_STATUS } from "../../../constants/phoneCall";
import {
  callersOf,
  canStaffView,
  countStatuses,
  summarizeCalls,
} from "../../../services/phoneCallService";

export default function CohortPhoneCalls() {
  const { cohortId } = useParams();
  const navigate = useNavigate();
  const { appUser, isAdmin, hasPermission } = useAuth();

  const { data: cohort, loading: loadingCohort } = useCohort(cohortId);
  const { data: fgds, loading: loadingFgds } = useFGDsByCohort(cohortId);
  const { data: participants, loading: loadingParticipants } = useParticipantsByCohort(cohortId);
  const { data: calls } = usePhoneCallsByCohort(cohortId);

  const [assignTarget, setAssignTarget] = useState(null);

  const uid = appUser?.id;
  const hasPhonePermission = hasPermission("phoneCall");

  // A caller-type user (Youth Coordinator) only sees FGDs they are named on
  // or that have nobody named; admins and read-only roles see them all.
  const visibleFgds = useMemo(
    () => fgds.filter((fgd) => canStaffView({ fgd, uid, isAdmin, hasPhonePermission })),
    [fgds, uid, isAdmin, hasPhonePermission]
  );

  const rows = useMemo(() => {
    const summaryByFgd = new Map();

    calls.forEach((call) => {
      if (!summaryByFgd.has(call.fgd_id)) summaryByFgd.set(call.fgd_id, []);
      summaryByFgd.get(call.fgd_id).push(call);
    });

    return visibleFgds.map((fgd) => {
      const inFgd = participants.filter((participant) => participant.fgd_id === fgd.id);
      const summary = summarizeCalls(summaryByFgd.get(fgd.id) || []);

      return { fgd, counts: countStatuses(inFgd, summary) };
    });
  }, [visibleFgds, participants, calls]);

  const loading = loadingCohort || loadingFgds || loadingParticipants;

  return (
    <AdminLayout title="Phone Calls" subtitle={cohort?.cohort_name || "Cohort FGDs"}>
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <button
          onClick={() => navigate(ROUTES.selectionPhoneCalls)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to Cohorts
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              {cohort?.cohort_name || "Cohort"}{" "}
              <span className="text-gray-400 font-semibold">({cohort?.cohort_code || "-"})</span>
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Progress of the confirmation calls in each FGD. Open an FGD to log
              calls{isAdmin ? ", or assign who makes them" : ""}.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading FGDs...</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No FGDs are available to you for this cohort.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-5 py-4">FGD</th>
                    <th className="text-left px-5 py-4">Date</th>
                    <th className="text-center px-5 py-4">Participants</th>
                    <th className="text-center px-5 py-4">Confirmed</th>
                    <th className="text-center px-5 py-4">Declined</th>
                    <th className="text-center px-5 py-4">Not reachable</th>
                    <th className="text-center px-5 py-4">Reschedule</th>
                    <th className="text-center px-5 py-4">Pending</th>
                    <th className="text-left px-5 py-4">Callers</th>
                    <th className="text-center px-5 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map(({ fgd, counts }) => (
                    <tr key={fgd.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold">{fgd.fgd_code}</p>
                        <p className="text-xs text-gray-500">{fgd.fgd_name}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{fgd.session_date || "Not set"}</td>
                      <td className="px-5 py-4 text-center font-semibold">{counts.total}</td>
                      <td className="px-5 py-4 text-center text-green-700 font-semibold">
                        {counts[CALL_STATUS.CONFIRMED]}
                      </td>
                      <td className="px-5 py-4 text-center text-red-700 font-semibold">
                        {counts[CALL_STATUS.DECLINED]}
                      </td>
                      <td className="px-5 py-4 text-center text-amber-700 font-semibold">
                        {counts[CALL_STATUS.NOT_REACHABLE]}
                      </td>
                      <td className="px-5 py-4 text-center text-blue-700 font-semibold">
                        {counts[CALL_STATUS.RESCHEDULE]}
                      </td>
                      <td className="px-5 py-4 text-center text-gray-600 font-semibold">
                        {counts[CALL_STATUS.PENDING]}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {callersOf(fgd).length === 0
                          ? "Anyone (admin side)"
                          : callersOf(fgd)
                              .map((caller) => caller.name)
                              .join(", ")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2 items-center">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                ROUTES.selectionPhoneCallsFGD
                                  .replace(":cohortId", cohortId)
                                  .replace(":fgdId", fgd.id)
                              )
                            }
                            className="px-3 py-2 rounded-lg bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90"
                          >
                            Open
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setAssignTarget(fgd)}
                              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
                            >
                              Assign callers
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageContainer>

      {assignTarget && (
        <CallerAssignmentModal fgd={assignTarget} onClose={() => setAssignTarget(null)} />
      )}
    </AdminLayout>
  );
}
