import { collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";

export const participantEvaluationsQuery = (participantId) =>
  query(
    collection(db, COLLECTIONS.PARTICIPANT_EVALUATIONS),
    where("participant_id", "==", participantId)
  );
