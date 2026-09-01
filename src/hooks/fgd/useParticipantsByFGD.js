import { useMemo } from "react";
import { useLiveCollection } from "../../realtime/useLive";
import { participantsByFGDQuery } from "../../services/fgdService";

const mapParticipantDoc = (doc) => ({ ...doc.data(), id: doc.id });

export const useParticipantsByFGD = (fgdId) => {
  const { data, loading, error } = useLiveCollection(
    fgdId ? `participants:fgd:${fgdId}` : null,
    () => participantsByFGDQuery(fgdId),
    mapParticipantDoc,
    [fgdId]
  );

  // No orderBy in the query itself (see fgdService.js) — sorted client-side.
  const sorted = useMemo(
    () => [...data].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [data]
  );

  return { data: sorted, loading, error };
};
