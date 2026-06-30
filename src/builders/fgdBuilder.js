import { createFGD } from "../entities";
import { FGD_STATUS } from "../constants/fgd";

export const buildFGD = ({
  id,
  cohort,
  sequenceNo,
  participantLimit,
  participantCount,
  createdByEmail,
  createdByName,
  timestamp,
}) => {
  const fgdCode = `${cohort.cohort_code}-FGD-${String(sequenceNo).padStart(
    3,
    "0"
  )}`;

  return createFGD({
    id,

    cohort_id: cohort.id,
    cohort_name: cohort.cohort_name,
    cohort_code: cohort.cohort_code,

    sequence_no: sequenceNo,
    fgd_code: fgdCode,
    fgd_name: `FGD ${String(sequenceNo).padStart(2, "0")}`,

    participant_limit: participantLimit,
    total_participants: participantCount,

    total_present: 0,
    total_absent: 0,
    total_pending_feedback: participantCount,

    committee_members: [],

    status: FGD_STATUS.DRAFT,

    created_at: timestamp,
    created_by_email: createdByEmail,
    created_by_name: createdByName,

    updated_at: timestamp,
    updated_by_email: createdByEmail,
    updated_by_name: createdByName,
  });
};