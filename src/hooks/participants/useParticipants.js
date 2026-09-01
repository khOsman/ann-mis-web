import { useLiveCollection } from "../../realtime/useLive";
import { participantsQuery } from "../../services/participantService";

const mapParticipantDoc = (doc) => ({ ...doc.data(), id: doc.id });

export const useParticipants = () => {
  const { data, loading, error } = useLiveCollection(
    "participants:all",
    participantsQuery,
    mapParticipantDoc,
    []
  );

  return {
    data,
    loading,
    error,
    refresh: () => {}, // kept as a no-op for backward compatibility; data is always live now

    create: null,
    update: null,
    remove: null,
    getById: null,
  };
};
