import { useMemo } from "react";
import { useLiveCollection } from "../../realtime/useLive";
import { pendingFGDChangeRequestsQuery } from "../../services/championPortalService";

const mapRequestDoc = (doc) => ({ ...doc.data(), id: doc.id });

export const useFGDChangeRequests = () => {
  const { data, loading, error } = useLiveCollection(
    "fgd_change_requests:pending",
    pendingFGDChangeRequestsQuery,
    mapRequestDoc,
    []
  );

  const sorted = useMemo(
    () =>
      [...data].sort(
        (a, b) => (b.requested_at?.seconds || 0) - (a.requested_at?.seconds || 0)
      ),
    [data]
  );

  return { data: sorted, loading, error };
};
