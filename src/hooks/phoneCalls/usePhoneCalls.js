import { useLiveCollection } from "../../realtime/useLive";
import {
  fgdsByCallerQuery,
  phoneCallsByCohortQuery,
  phoneCallsByFgdQuery,
} from "../../services/phoneCallService";

const mapDoc = (doc) => ({ ...doc.data(), id: doc.id });

// Live call log for one FGD.
export const usePhoneCallsByFGD = (fgdId) =>
  useLiveCollection(
    fgdId ? `phone_calls:fgd:${fgdId}` : null,
    () => phoneCallsByFgdQuery(fgdId),
    mapDoc,
    [fgdId]
  );

// Live call log for a whole cohort (used for the per-FGD progress counts).
export const usePhoneCallsByCohort = (cohortId) =>
  useLiveCollection(
    cohortId ? `phone_calls:cohort:${cohortId}` : null,
    () => phoneCallsByCohortQuery(cohortId),
    mapDoc,
    [cohortId]
  );

// FGDs a person has been named as a phone caller for.
export const useFGDsByCaller = (uid) =>
  useLiveCollection(
    uid ? `fgds:caller:${uid}` : null,
    () => fgdsByCallerQuery(uid),
    mapDoc,
    [uid]
  );
