import { useLiveCollection } from "../../realtime/useLive";
import { databasesQuery } from "../../services/databaseService";

const mapDatabaseDoc = (doc) => ({ ...doc.data(), id: doc.id });

export const useDatabases = () => {
  const { data, loading, error } = useLiveCollection(
    "databases:all",
    databasesQuery,
    mapDatabaseDoc,
    []
  );

  return { data, loading, error };
};
