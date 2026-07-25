import { useLiveDocument } from "../../realtime/useLive";
import { cohortDocRef } from "../../services/cohortService";

export const useCohort = (cohortId) => {
  const { data, loading, error } = useLiveDocument(
    cohortId ? `cohorts:${cohortId}` : null,
    () => cohortDocRef(cohortId),
    [cohortId]
  );

  return {
    data,
    loading,
    error,
    refresh: () => {}, // kept as a no-op for backward compatibility; data is always live now
  };
};
