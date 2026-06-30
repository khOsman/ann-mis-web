import {
  collection,
  doc,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";
import { buildParticipantFromFactSheet } from "../builders";

export const importParticipantsForCohort = async ({ rows, cohort }) => {
  if (!cohort?.id) {
    throw new Error("Cohort is required for participant import.");
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No participant rows found.");
  }

  const batch = writeBatch(db);
  const importedAt = serverTimestamp();

  rows.forEach((row,index) => {
    const participantRef = doc(collection(db, COLLECTIONS.PARTICIPANTS));

    const participant = buildParticipantFromFactSheet({
        row,
        cohort,
        importedAt,
        rowIndex: index,
        });

    batch.set(participantRef, {
      ...participant,
      id: participantRef.id,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  });

  const cohortRef = doc(db, COLLECTIONS.COHORTS, cohort.id);

  batch.update(cohortRef, {
    total_registrations: increment(rows.length),
    updated_at: serverTimestamp(),
  });

  await batch.commit();

  return {
    importedParticipants: rows.length,
  };
};