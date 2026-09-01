import { useLiveCollection } from "../../realtime/useLive";
import { fgdsByCohortQuery } from "../../services/fgdService";

const mapFgdDoc = (doc) => ({ ...doc.data(), id: doc.id });

export const useFGDsByCohort = (cohortId) => {
  const { data, loading, error } = useLiveCollection(
    cohortId ? `fgds:cohort:${cohortId}` : null,
    () => fgdsByCohortQuery(cohortId),
    mapFgdDoc,
    [cohortId]
  );

  return { data, loading, error };
};
