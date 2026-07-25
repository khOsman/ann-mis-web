import { useMemo } from "react";
import { useLiveCollection } from "../../realtime/useLive";
import { participantEvaluationsQuery } from "../../services/evaluationService";

const mapEvaluationDoc = (doc) => ({ id: doc.id, ...doc.data() });

export const useParticipantEvaluations = (participantId) => {
  const { data, loading, error } = useLiveCollection(
    participantId ? `participant_evaluations:participant:${participantId}` : null,
    () => participantEvaluationsQuery(participantId),
    mapEvaluationDoc,
    [participantId]
  );

  const sorted = useMemo(
    () =>
      [...data].sort(
        (a, b) => (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0)
      ),
    [data]
  );

  return { data: sorted, loading, error };
};
