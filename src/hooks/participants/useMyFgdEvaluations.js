import { useMemo } from "react";
import { useLiveCollection } from "../../realtime/useLive";
import { myFgdEvaluationsQuery } from "../../services/evaluationService";

const mapEvaluationDoc = (doc) => ({ ...doc.data(), id: doc.id });

// The set of participant IDs the signed-in champion has already evaluated
// within one FGD — used to show their own completion checkmark per
// participant without revealing whether other evaluators have submitted.
export const useMyFgdEvaluations = (championId, fgdId) => {
  const { data, loading, error } = useLiveCollection(
    championId && fgdId ? `participant_evaluations:mine:${championId}:${fgdId}` : null,
    () => myFgdEvaluationsQuery(championId, fgdId),
    mapEvaluationDoc,
    [championId, fgdId]
  );

  const evaluatedParticipantIds = useMemo(
    () => new Set(data.map((evaluation) => evaluation.participant_id)),
    [data]
  );

  return { evaluatedParticipantIds, loading, error };
};
