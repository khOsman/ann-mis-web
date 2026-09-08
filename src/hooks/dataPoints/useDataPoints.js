import { useLiveCollection } from "../../realtime/useLive";
import { dataPointsQuery } from "../../services/dataPointService";

const mapDataPointDoc = (doc) => ({ ...doc.data(), id: doc.id });

export const useDataPoints = () => {
  const { data, loading, error } = useLiveCollection(
    "dataPoints:all",
    dataPointsQuery,
    mapDataPointDoc,
    []
  );

  return { data, loading, error };
};
