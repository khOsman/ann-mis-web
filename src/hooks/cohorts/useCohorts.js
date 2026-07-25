import { useMemo } from "react";
import { useLiveCollection } from "../../realtime/useLive";
import { archiveCohort, cohortsQuery } from "../../services/cohortService";

const mapCohortDoc = (doc) => ({ id: doc.id, ...doc.data() });

export const useCohorts = () => {
  const {
    data: allCohorts,
    loading,
    error,
  } = useLiveCollection("cohorts:all", cohortsQuery, mapCohortDoc, []);

  const data = useMemo(
    () => allCohorts.filter((item) => item.is_deleted !== true),
    [allCohorts]
  );

  const remove = async ({ cohortId, updatedByEmail, updatedByName }) => {
    await archiveCohort({ cohortId, updatedByEmail, updatedByName });
    // No manual refresh needed — the live listener updates `data` automatically.
  };

  return {
    data,
    loading,
    error,
    refresh: () => {}, // kept as a no-op for backward compatibility; data is always live now

    create: null,
    update: null,
    remove,
    getById: null,
  };
};
