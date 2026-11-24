import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAuth } from "../../../context/AuthContext";
import { useFGD, usePhoneCallsByFGD } from "../../../hooks";
import PhoneCallSheet from "../../../components/phoneCalls/PhoneCallSheet";
import CallerAssignmentModal from "../../../components/phoneCalls/CallerAssignmentModal";
import { FGD_STATUS } from "../../../constants/fgd";
import { CALLER_TYPE } from "../../../constants/phoneCall";
import { ROUTES } from "../../../constants/routes";
import { callersOf, canStaffCall, canStaffView } from "../../../services/phoneCallService";

export default function FGDPhoneCalls() {
  const { cohortId, fgdId } = useParams();
  const navigate = useNavigate();
  const { appUser, isAdmin, hasPermission } = useAuth();

  const { fgd, participants, loading } = useFGD(fgdId);
  const { data: calls } = usePhoneCallsByFGD(fgdId);

  const [assigning, setAssigning] = useState(false);

  const uid = appUser?.id;
  const hasPhonePermission = hasPermission("phoneCall");

  const back = (
    <button
      onClick={() => navigate(ROUTES.selectionPhoneCallsCohort.replace(":cohortId", cohortId))}
      className="text-sm font-semibold text-[var(--ann-pink)]"
    >
      ← Back to FGDs
    </button>
  );

  if (loading) {
    return (
      <AdminLayout title="Phone Calls" subtitle="Loading FGD...">
        <PageContainer className="py-6 space-y-4">{back}<p className="text-gray-500">Loading...</p></PageContainer>
      </AdminLayout>
    );
  }

  if (!fgd) {
    return (
      <AdminLayout title="Phone Calls" subtitle="FGD not found">
        <PageContainer className="py-6 space-y-4">
          {back}
          <p className="text-gray-500">This FGD no longer exists.</p>
        </PageContainer>
      </AdminLayout>
    );
  }

  if (!canStaffView({ fgd, uid, isAdmin, hasPhonePermission })) {
    return (
      <AdminLayout title="Phone Calls" subtitle={fgd.fgd_code}>
        <PageContainer className="py-6 space-y-4">
          {back}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600">
            You are not assigned as a caller for this FGD.
          </div>
        </PageContainer>
      </AdminLayout>
    );
  }

  const canCall = canStaffCall({ fgd, uid, isAdmin, hasPhonePermission });

  let lockedReason = "";

  if (fgd.status === FGD_STATUS.COMPLETED) {
    lockedReason = "This FGD is completed, so calls can no longer be logged. The history stays here.";
  } else if (!canCall) {
    lockedReason =
      callersOf(fgd).length > 0 && hasPhonePermission
        ? "Only the named callers can log calls for this FGD."
        : "You can view this sheet, but you do not have permission to log calls.";
  }

  return (
    <AdminLayout title="Phone Calls" subtitle={`${fgd.fgd_code} · ${fgd.cohort_name || ""}`}>
      <PageContainer className="py-6 lg:py-8 space-y-6">
        {back}

        <PhoneCallSheet
          fgd={fgd}
          participants={participants}
          calls={calls}
          canCall={canCall}
          caller={{
            uid,
            name: appUser?.name || appUser?.email || "",
            email: appUser?.email || "",
            type: CALLER_TYPE.STAFF,
          }}
          lockedReason={lockedReason}
          headerActions={
            isAdmin && fgd.status !== FGD_STATUS.COMPLETED ? (
              <button
                type="button"
                onClick={() => setAssigning(true)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
              >
                Assign callers
              </button>
            ) : null
          }
        />
      </PageContainer>

      {assigning && <CallerAssignmentModal fgd={fgd} onClose={() => setAssigning(false)} />}
    </AdminLayout>
  );
}
