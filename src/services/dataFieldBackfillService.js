import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";

// Re-derives mapped system fields (e.g. institution) from a form's already
// stored responses, for participants who registered before that field was
// mapped in Form Builder — fills only currently-blank fields, never
// overwrites a value that's already set.
export const backfillMappedFieldsForForm = async (formId) => {
  const fieldsSnap = await getDocs(
    query(collection(db, COLLECTIONS.FORM_FIELDS), where("form_id", "==", formId))
  );

  const mappedFieldsByFieldId = new Map();

  fieldsSnap.docs.forEach((item) => {
    const data = item.data();
    if (data.mapped_participant_field) {
      mappedFieldsByFieldId.set(item.id, data.mapped_participant_field);
    }
  });

  if (mappedFieldsByFieldId.size === 0) {
    return { updatedCount: 0, fieldsBackfilled: [] };
  }

  const responsesSnap = await getDocs(
    query(collection(db, COLLECTIONS.FORM_RESPONSES), where("form_id", "==", formId))
  );

  let updatedCount = 0;
  const fieldsBackfilled = new Set();

  for (const responseDoc of responsesSnap.docs) {
    const response = responseDoc.data();
    if (!response.participant_id) continue;

    const participantRef = doc(db, COLLECTIONS.PARTICIPANTS, response.participant_id);
    const participantSnap = await getDoc(participantRef);
    if (!participantSnap.exists()) continue;

    const participant = participantSnap.data();
    const updates = {};

    (response.answers || []).forEach((answer) => {
      const participantField = mappedFieldsByFieldId.get(answer.field_id);
      if (!participantField) return;

      const currentValue = participant[participantField];
      const hasCurrentValue =
        currentValue !== undefined && currentValue !== null && currentValue !== "";
      const answerValue = answer.value;
      const hasAnswerValue =
        answerValue !== undefined && answerValue !== null && answerValue !== "";

      if (!hasCurrentValue && hasAnswerValue) {
        updates[participantField] = answerValue;
        fieldsBackfilled.add(participantField);
      }
    });

    if (Object.keys(updates).length > 0) {
      await updateDoc(participantRef, {
        ...updates,
        updated_at: serverTimestamp(),
      });
      updatedCount += 1;
    }
  }

  return { updatedCount, fieldsBackfilled: [...fieldsBackfilled] };
};
