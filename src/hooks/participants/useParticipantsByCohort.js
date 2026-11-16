import { useLiveCollection } from "../../realtime/useLive";
import { participantsByCohortQuery } from "../../services/participantService";

const mapParticipantDoc = (doc) => ({ ...doc.data(), id: doc.id });

// Live list of every participant in one cohort.
export const useParticipantsByCohort = (cohortId) =>
  useLiveCollection(
    cohortId ? `participants:cohort:${cohortId}` : null,
    () => participantsByCohortQuery(cohortId),
    mapParticipantDoc,
    [cohortId]
  );
