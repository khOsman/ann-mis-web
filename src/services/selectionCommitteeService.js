import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";
import { apiClient } from "./apiClient";

export const getSelectionCommitteeMember = async (memberId) => {
  const snapshot = await getDoc(
    doc(db, COLLECTIONS.SELECTION_COMMITTEE_MEMBERS, memberId)
  );

  if (!snapshot.exists()) {
    throw new Error("Committee member not found.");
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

export const getSelectionCommitteeMembers = async () => {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.SELECTION_COMMITTEE_MEMBERS),
      orderBy("created_at", "desc")
    )
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const registerSelectionCommitteeMemberRequest = async ({
  email,
  profile,
}) => {
  return apiClient.post("/api/selection-committee/register", {
    email,
    ...profile,
  });
};

export const approveSelectionCommitteeMember = async ({ memberId }) => {
  return apiClient.post(
    `/api/selection-committee/${memberId}/approve`,
    {},
    { authenticated: true }
  );
};

export const rejectSelectionCommitteeMember = async ({
  memberId,
  rejectionReason,
}) => {
  return apiClient.post(
    `/api/selection-committee/${memberId}/reject`,
    { rejectionReason },
    { authenticated: true }
  );
};

export const createSelectionCommitteeAccount = async ({ memberId }) => {
  return apiClient.post(
    `/api/selection-committee/${memberId}/create-account`,
    {},
    { authenticated: true }
  );
};
