import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";
import { apiClient } from "./apiClient";

export const getPendingFGDChangeRequests = async () => {
  const q = query(
    collection(db, COLLECTIONS.FGD_CHANGE_REQUESTS),
    where("status", "==", "Pending")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (b.requested_at?.seconds || 0) - (a.requested_at?.seconds || 0));
};

export const requestFGDChange = async ({ fgdId, reason }) => {
  return apiClient.post(
    `/api/me/fgds/${fgdId}/request-change`,
    { reason },
    { authenticated: true }
  );
};

export const markAttendance = async ({ participantId, status }) => {
  return apiClient.post(
    `/api/me/participants/${participantId}/attendance`,
    { status },
    { authenticated: true }
  );
};

export const submitEvaluation = async ({
  participantId,
  fgd_score,
  feedback_option,
  recommendation_option,
  notes,
}) => {
  return apiClient.post(
    `/api/me/participants/${participantId}/evaluate`,
    { fgd_score, feedback_option, recommendation_option, notes },
    { authenticated: true }
  );
};

export const resolveFGDChangeRequest = async ({ requestId, status }) => {
  return apiClient.post(
    `/api/champions/fgd-change-requests/${requestId}/resolve`,
    { status },
    { authenticated: true }
  );
};
