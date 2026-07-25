import { useLiveCollection, useLiveDocument } from "../../realtime/useLive";
import { championDocRef, championsQuery } from "../../services/championsService";

const mapChampionDoc = (doc) => ({ id: doc.id, ...doc.data() });

export const useChampions = (championId = null) => {
  // Both hooks are always called (rules-of-hooks), but only one is ever
  // actually subscribed — the other gets a null cacheKey and stays idle.
  const listResult = useLiveCollection(
    championId ? null : "champions_pool:all",
    championsQuery,
    mapChampionDoc,
    [championId]
  );

  const docResult = useLiveDocument(
    championId ? `champions_pool:${championId}` : null,
    () => championDocRef(championId),
    [championId]
  );

  const active = championId ? docResult : listResult;

  return {
    data: active.data,
    loading: active.loading,
    error: active.error,
    refresh: () => {}, // kept as a no-op for backward compatibility; data is always live now
  };
};
