import { useMemo } from "react";
import { useLiveCollection, useLiveDocument } from "../../realtime/useLive";
import { fgdDocRef, participantsByFGDQuery } from "../../services/fgdService";

const mapParticipantDoc = (doc) => ({ id: doc.id, ...doc.data() });

export const useFGD = (fgdId) => {
  const fgdResult = useLiveDocument(
    fgdId ? `fgds:${fgdId}` : null,
    () => fgdDocRef(fgdId),
    [fgdId]
  );

  const participantsResult = useLiveCollection(
    fgdId ? `participants:fgd:${fgdId}` : null,
    () => participantsByFGDQuery(fgdId),
    mapParticipantDoc,
    [fgdId]
  );

  // No orderBy in the query itself (see fgdService.js) — sorted client-side.
  const sortedParticipants = useMemo(
    () =>
      [...participantsResult.data].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      ),
    [participantsResult.data]
  );

  return {
    fgd: fgdResult.data,
    participants: sortedParticipants,
    loading: fgdResult.loading || participantsResult.loading,
    error: fgdResult.error || participantsResult.error,
    refresh: () => {}, // kept as a no-op for backward compatibility; data is always live now
  };
};
