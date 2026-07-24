import { useCallback, useEffect, useState } from "react";
import { getChampion, getChampions } from "../../services/championsService";

export const useChampions = (championId = null) => {
  const [data, setData] = useState(championId ? null : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = championId
        ? await getChampion(championId)
        : await getChampions();

      setData(result);

      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [championId]);

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
