import { useNavigate, useParams } from "react-router-dom";
import ChampionLayout from "../../../layouts/ChampionLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAuth } from "../../../context/AuthContext";
import { useFGD, usePhoneCallsByFGD } from "../../../hooks";
import PhoneCallSheet from "../../../components/phoneCalls/PhoneCallSheet";
import { FGD_STATUS } from "../../../constants/fgd";
import { CALLER_TYPE } from "../../../constants/phoneCall";
import { ROUTES } from "../../../constants/routes";
import { canChampionCall, isNamedCaller } from "../../../services/phoneCallService";

// The call sheet for one FGD, for a committee member named as a caller. The
// call log is only requested once they are confirmed as named, because the
// database refuses it to anyone else.
export default function ChampionFGDPhoneCalls() {
  const { fgdId } = useParams();
  const navigate = useNavigate();
  const { appUser } = useAuth();

  const uid = appUser?.id;
  const { fgd, participants, loading } = useFGD(fgdId);
  const named = Boolean(fgd) && isNamedCaller(fgd, uid);
  const { data: calls } = usePhoneCallsByFGD(named ? fgdId : null);

  const back = (
    <button
      onClick={() => navigate(ROUTES.championPhoneCalls)}
      className="text-sm font-semibold text-[var(--ann-pink)]"
    >
      ← Back to Phone Calls
    </button>
  );

  if (loading) {
    return (
      <ChampionLayout title="Phone Calls" subtitle="Loading FGD...">
        <PageContainer className="py-6 space-y-4">{back}<p className="text-gray-500">Loading...</p></PageContainer>
      </ChampionLayout>
    );
  }

  if (!fgd || !named) {
    return (
      <ChampionLayout title="Phone Calls" subtitle={fgd?.fgd_code || "FGD"}>
        <PageContainer className="py-6 space-y-4">
          {back}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600">
            You have not been asked to make calls for this FGD.
          </div>
        </PageContainer>
      </ChampionLayout>
    );
  }

  return (
    <ChampionLayout title="Phone Calls" subtitle={`${fgd.fgd_code} · ${fgd.cohort_name || ""}`}>
      <PageContainer className="py-6 lg:py-8 space-y-6">
        {back}

        <PhoneCallSheet
          fgd={fgd}
          participants={participants}
          calls={calls}
          canCall={canChampionCall({ fgd, uid })}
          caller={{
            uid,
            name: appUser?.name || appUser?.email || "",
            email: appUser?.email || "",
            type: CALLER_TYPE.CHAMPION,
          }}
          lockedReason={
            fgd.status === FGD_STATUS.COMPLETED
              ? "This FGD is completed, so calls can no longer be logged. The history stays here."
              : ""
          }
        />
      </PageContainer>
    </ChampionLayout>
  );
}
