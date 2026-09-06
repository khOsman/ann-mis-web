import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";
import { REQUIRED_EVALUATIONS, deriveSelectionStatus } from "../constants/evaluation";
import { SELECTION_STATUS } from "../constants/status";

export const participantEvaluationsQuery = (participantId) =>
  query(
    collection(db, COLLECTIONS.PARTICIPANT_EVALUATIONS),
    where("participant_id", "==", participantId)
  );

// Every evaluation a single champion has submitted within one FGD — used to
// show that champion their own completion checkmark per participant,
// without revealing whether other evaluators have submitted theirs.
export const myFgdEvaluationsQuery = (championId, fgdId) =>
  query(
    collection(db, COLLECTIONS.PARTICIPANT_EVALUATIONS),
    where("champion_id", "==", championId),
    where("fgd_id", "==", fgdId)
  );

// Super-admin-only (Firestore rules enforce this — see participant_evaluations
// in firestore.rules). Deletes one evaluator's evaluation, then recomputes
// the participant's evaluation_count/average_evaluation_score/selection_status
// from whatever evaluations remain, mirroring the backend's submit-evaluation
// recompute exactly but in reverse. Dropping below REQUIRED_EVALUATIONS (down
// to zero, if every evaluation is cleared) resets selection_status back to
// Pending so the FGD can be re-evaluated from scratch.
export const removeEvaluation = async ({ evaluationId, participantId, cohortId }) => {
  await deleteDoc(doc(db, COLLECTIONS.PARTICIPANT_EVALUATIONS, evaluationId));

  const remainingSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.PARTICIPANT_EVALUATIONS),
      where("participant_id", "==", participantId)
    )
  );

  const scores = remainingSnap.docs.map((item) => item.data().computed_score);
  const evaluationCount = scores.length;
  const averageScore =
    evaluationCount > 0
      ? scores.reduce((sum, value) => sum + value, 0) / evaluationCount
      : null;

  const participantUpdates = {
    evaluation_count: evaluationCount,
    average_evaluation_score: averageScore,
    selection_status:
      evaluationCount >= REQUIRED_EVALUATIONS
        ? deriveSelectionStatus(averageScore)
        : SELECTION_STATUS.PENDING,
    updated_at: serverTimestamp(),
  };

  await updateDoc(doc(db, COLLECTIONS.PARTICIPANTS, participantId), participantUpdates);

  // total_selected has no Firestore trigger keeping it in sync — recomputed
  // from a count query since selection_status can move in either direction
  // (including backward out of Selected) as evaluations are removed.
  if (cohortId) {
    const selectedSnap = await getDocs(
      query(
        collection(db, COLLECTIONS.PARTICIPANTS),
        where("cohort_id", "==", cohortId),
        where("selection_status", "==", SELECTION_STATUS.SELECTED)
      )
    );

    await updateDoc(doc(db, COLLECTIONS.COHORTS, cohortId), {
      total_selected: selectedSnap.size,
      updated_at: serverTimestamp(),
    });
  }

  return participantUpdates;
};
