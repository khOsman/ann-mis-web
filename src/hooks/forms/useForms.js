import { useMemo } from "react";
import { useLiveCollection } from "../../realtime/useLive";
import { formsQuery } from "../../services/formService";

const mapFormDoc = (doc) => ({ id: doc.id, ...doc.data() });

export const useForms = () => {
  const { data: allForms, loading, error } = useLiveCollection(
    "forms:all",
    formsQuery,
    mapFormDoc,
    []
  );

  const data = useMemo(
    () => allForms.filter((item) => item.is_deleted !== true),
    [allForms]
  );

  return { data, loading, error };
};
