import { useMemo } from "react";
import { useLiveCollection } from "../../realtime/useLive";
import { formFieldsQuery } from "../../services/formService";

const mapFieldDoc = (doc) => ({ id: doc.id, ...doc.data() });

export const useFormFields = (formId) => {
  const { data, loading, error } = useLiveCollection(
    formId ? `form_fields:form:${formId}` : null,
    () => formFieldsQuery(formId),
    mapFieldDoc,
    [formId]
  );

  const sorted = useMemo(
    () => [...data].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [data]
  );

  return { data: sorted, loading, error };
};
