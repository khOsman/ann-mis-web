import { useCallback, useEffect, useState } from "react";
import {
  archiveCohort,
  getActiveCohorts,
} from "../../services/cohortService";

export const useCohorts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cohorts = await getActiveCohorts();
      setData(cohorts);
      return cohorts;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = async ({ cohortId, updatedByEmail, updatedByName }) => {
    await archiveCohort({
      cohortId,
      updatedByEmail,
      updatedByName,
    });

    await refresh();
  };

  return {
    data,
    loading,
    error,
    refresh,

    create: null,
    update: null,
    remove,
    getById: null,
  };
};