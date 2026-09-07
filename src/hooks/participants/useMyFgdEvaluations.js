import { useMemo } from "react";
import { useLiveCollection } from "../../realtime/useLive";
import { myFgdEvaluationsQuery } from "../../services/evaluationService";

const mapEvaluationDoc = (doc) => ({ ...doc.data(), id: doc.id });

// The signed-in champion's own evaluations (draft or submitted) within one
// FGD — used to pre-fill the evaluation modal when reopening a participant,
// and to show a completion checkmark only for genuinely Submitted ones
// (a saved-but-incomplete draft shouldn't look "done"). A doc with no
// status field predates the draft feature and was always a full submission.
export const useMyFgdEvaluations = (championId, fgdId) => {
  const { data, loading, error } = useLiveCollection(
    championId && fgdId ? `participant_evaluations:mine:${championId}:${fgdId}` : null,
    () => myFgdEvaluationsQuery(championId, fgdId),
    mapEvaluationDoc,
    [championId, fgdId]
  );

  const byParticipantId = useMemo(() => {
    const map = new Map();
    data.forEach((evaluation) => map.set(evaluation.participant_id, evaluation));
    return map;
  }, [data]);

  const evaluatedParticipantIds = useMemo(
    () =>
      new Set(
        data
          .filter((evaluation) => (evaluation.status || "Submitted") === "Submitted")
          .map((evaluation) => evaluation.participant_id)
      ),
    [data]
  );

  return { evaluations: data, byParticipantId, evaluatedParticipantIds, loading, error };
};
