import { useLiveCollection } from "../../realtime/useLive";
import { dataPointsByDatabaseQuery } from "../../services/dataPointService";

const mapDataPointDoc = (doc) => ({ ...doc.data(), id: doc.id });

export const useDataPointsByDatabase = (databaseId) => {
  const { data, loading, error } = useLiveCollection(
    databaseId ? `dataPoints:database:${databaseId}` : null,
    () => dataPointsByDatabaseQuery(databaseId),
    mapDataPointDoc,
    [databaseId]
  );

  return { data, loading, error };
};
