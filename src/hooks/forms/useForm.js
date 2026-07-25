import { useLiveDocument } from "../../realtime/useLive";
import { formDocRef } from "../../services/formService";

export const useForm = (formId) => {
  const { data, loading, error } = useLiveDocument(
    formId ? `forms:${formId}` : null,
    () => formDocRef(formId),
    [formId]
  );

  return { data, loading, error };
};
