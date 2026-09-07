import { useMemo } from "react";
import { useLiveCollection } from "../../realtime/useLive";
import { participantEvaluationsQuery } from "../../services/evaluationService";

const mapEvaluationDoc = (doc) => ({ ...doc.data(), id: doc.id });

// Admin-facing — an in-progress SC draft isn't a real evaluation yet, so it's
// excluded here rather than at every call site. A doc with no status field
// predates the draft feature and was always a full submission.
export const useParticipantEvaluations = (participantId) => {
  const { data, loading, error } = useLiveCollection(
    participantId ? `participant_evaluations:participant:${participantId}` : null,
    () => participantEvaluationsQuery(participantId),
    mapEvaluationDoc,
    [participantId]
  );

  const sorted = useMemo(
    () =>
      data
        .filter((evaluation) => (evaluation.status || "Submitted") === "Submitted")
        .sort((a, b) => (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0)),
    [data]
  );

  return { data: sorted, loading, error };
};
