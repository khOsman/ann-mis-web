import { useCallback, useEffect, useState } from "react";
import {
  getFGDById,
  getParticipantsByFGD,
} from "../../services/fgdService";

export const useFGD = (fgdId) => {
  const [fgd, setFGD] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!fgdId) return;

    setLoading(true);
    setError(null);

    try {
      const [fgdData, participantData] = await Promise.all([
        getFGDById(fgdId),
        getParticipantsByFGD(fgdId),
      ]);

      setFGD(fgdData);
      setParticipants(participantData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fgdId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    fgd,
    participants,
    loading,
    error,
    refresh,
  };
};