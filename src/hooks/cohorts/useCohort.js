import { useCallback, useEffect, useState } from "react";
import { getCohortById } from "../../services/cohortService";

export const useCohort = (cohortId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!cohortId) return;

    setLoading(true);
    setError(null);

    try {
      const cohort = await getCohortById(cohortId);
      setData(cohort);
      return cohort;
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [cohortId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
  };
};