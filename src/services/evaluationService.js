import { collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";

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
