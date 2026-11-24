import { useLiveCollection } from "../../realtime/useLive";
import { anyEvaluationInFgdQuery } from "../../services/evaluationService";
import { CURRENT_RUBRIC_VERSION, RUBRIC_VERSION } from "../../constants/evaluation";

const mapDoc = (doc) => ({ ...doc.data(), id: doc.id });

// Which rubric an FGD is scored on. The server locks the version onto the FGD
// (fgd.rubric_version) when the first evaluation is saved. Until then an FGD
// that already holds evaluations is a pre-update one (v1) and an empty FGD
// uses the current rubric. `version` is null while that is still being worked
// out, so a form never renders the wrong criteria.
export const useFgdRubricVersion = (fgd) => {
  const locked = fgd?.rubric_version || "";
  const needsLookup = Boolean(fgd?.id) && !locked;

  const { data, loading } = useLiveCollection(
    needsLookup ? `evaluations:any:${fgd.id}` : null,
    () => anyEvaluationInFgdQuery(fgd.id),
    mapDoc,
    [fgd?.id, needsLookup]
  );

  if (!fgd) return { version: null, loading: true };
  if (locked) return { version: locked, loading: false };
  if (loading) return { version: null, loading: true };

  return {
    version: data.length > 0 ? RUBRIC_VERSION.V1 : CURRENT_RUBRIC_VERSION,
    loading: false,
  };
};
