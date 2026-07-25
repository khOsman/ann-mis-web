import { useLiveDocument } from "../../realtime/useLive";
import { participantDocRef } from "../../services/participantService";

export const useParticipant = (participantId) => {
  const { data, loading, error } = useLiveDocument(
    participantId ? `participants:${participantId}` : null,
    () => participantDocRef(participantId),
    [participantId]
  );

  return { data, loading, error };
};
