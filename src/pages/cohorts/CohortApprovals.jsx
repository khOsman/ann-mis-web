import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { ROUTES } from "../../constants/routes";
import { useCohorts } from "../../hooks";
import CohortApprovalBadge from "../../components/cohorts/CohortApprovalBadge";
import CohortApprovalActions from "../../components/cohorts/CohortApprovalActions";
import {
  COHORT_APPROVAL_STATUS,
  getCohortApprovalStatus,
} from "../../constants/cohortApproval";

const formatTimestamp = (value) => {
  if (!value?.toDate) return "-";

  return value.toDate().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const millis = (value) => value?.toMillis?.() ?? 0;

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "decided", label: "Decided" },
];

const DECIDED_STATUSES = [
  COHORT_APPROVAL_STATUS.APPROVED,
  COHORT_APPROVAL_STATUS.CHANGES_REQUESTED,
  COHORT_APPROVAL_STATUS.REJECTED,
];

// The Programme Head's inbox: requests waiting for a decision, and the ones
// already decided. Cohorts from before the approval workflow have no
// approval_status and no decision on record, so they are left out of
// "Decided".
export default function CohortApprovals() {
  const navigate = useNavigate();
  const { data: cohorts, loading } = useCohorts();
  const [tab, setTab] = useState("pending");

  const { pending, decided } = useMemo(() => {
    const pendingList = cohorts
      .filter((c) => getCohortApprovalStatus(c) === COHORT_APPROVAL_STATUS.PENDING)
      .sort((a, b) => millis(a.approval_requested_at) - millis(b.approval_requested_at));

    const decidedList = cohorts
      .filter(
        (c) =>
          c.approval_decided_at && DECIDED_STATUSES.includes(getCohortApprovalStatus(c))
      )
      .sort((a, b) => millis(b.approval_decided_at) - millis(a.approval_decided_at));

    return { pending: pendingList, decided: decidedList };
  }, [cohorts]);

  const list = tab === "pending" ? pending : decided;

  return (
    <AdminLayout
      title="Cohort Approvals"
      subtitle="Review cohorts submitted for approval"
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <div className="flex gap-2">
          {TABS.map(({ key, label }) => {
            const count = key === "pending" ? pending.length : decided.length;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                  tab === key
                    ? "bg-[var(--ann-pink)] text-white border-[var(--ann-pink)]"
                    : "bg-white text-gray-700 border-gray-300 hover:border-[var(--ann-pink)]"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : list.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
            {tab === "pending"
              ? "No cohorts are waiting for approval."
              : "No decisions have been made yet."}
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((cohort) => (
              <div
                key={cohort.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                      {cohort.cohort_name}{" "}
                      <span className="text-gray-400 font-semibold">
                        ({cohort.cohort_code})
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {[cohort.district, cohort.division].filter(Boolean).join(", ") || "-"}
                      {cohort.cohort_year ? ` · ${cohort.cohort_year}` : ""}
                    </p>
                  </div>

                  <CohortApprovalBadge cohort={cohort} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Registration</p>
                    <p className="font-semibold">
                      {cohort.registration_start_date || "-"} to{" "}
                      {cohort.registration_end_date || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Selection target</p>
                    <p className="font-semibold">{cohort.selection_target || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Graduation target</p>
                    <p className="font-semibold">{cohort.graduation_target || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">
                      {tab === "pending" ? "Requested by" : "Decided by"}
                    </p>
                    <p className="font-semibold">
                      {tab === "pending"
                        ? cohort.approval_requested_by_name ||
                          cohort.approval_requested_by_email ||
                          "-"
                        : cohort.approval_decided_by_name ||
                          cohort.approval_decided_by_email ||
                          "-"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTimestamp(
                        tab === "pending"
                          ? cohort.approval_requested_at
                          : cohort.approval_decided_at
                      )}
                    </p>
                  </div>
                </div>

                {tab === "decided" && cohort.approval_remarks && (
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Remarks
                    </p>
                    <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                      {cohort.approval_remarks}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/admin/cohorts/${cohort.id}`, {
                        state: { from: ROUTES.cohortApprovals, fromLabel: "Approvals" },
                      })
                    }
                    className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
                  >
                    View Cohort
                  </button>

                  {tab === "pending" && <CohortApprovalActions cohort={cohort} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
