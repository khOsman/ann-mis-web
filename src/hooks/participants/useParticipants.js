import { useCallback, useEffect, useState } from "react";
import { getParticipants } from "../../services/participantService";

export const useParticipants = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const participants = await getParticipants();
      setData(participants);
      return participants;
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

  return {
    data,
    loading,
    error,
    refresh,

    create: null,
    update: null,
    remove: null,
    getById: null,
  };
};