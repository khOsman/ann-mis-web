import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";

import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";
import {
  ACCOUNT_STATUS,
  MEMBER_STATUS,
  REGISTRATION_STATUS,
} from "../constants/selectionCommittee";
import { createSelectionCommittee } from "../entities";

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

const generateCommitteeCode = async () => {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.SELECTION_COMMITTEE_MEMBERS),
      orderBy("committee_code", "desc")
    )
  );

  const lastCommittee = snapshot.docs[0]?.data();

  let nextNumber = 1;

  if (lastCommittee?.committee_code) {
    const match = lastCommittee.committee_code.match(/(\d+)$/);

    if (match) {
      nextNumber = Number(match[1]) + 1;
    }
  }

  return `ANN-SC-${String(nextNumber).padStart(4, "0")}`;
};

export const createSelectionCommitteeMember = async ({ memberId, data }) => {
  const committeeCode = await generateCommitteeCode();

  const committee = createSelectionCommittee({
    id: memberId,
    firebase_uid: "",

    committee_code: committeeCode,

    ...data,

    joined_at: null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await setDoc(
    doc(db, COLLECTIONS.SELECTION_COMMITTEE_MEMBERS, memberId),
    committee
  );

  return committee;
};

export const registerSelectionCommitteeMemberRequest = async ({
  email,
  profile,
}) => {
  const memberRef = doc(
    collection(db, COLLECTIONS.SELECTION_COMMITTEE_MEMBERS)
  );

  return createSelectionCommitteeMember({
    memberId: memberRef.id,
    data: {
      ...profile,
      email,

      registration_status: REGISTRATION_STATUS.PENDING,
      account_status: ACCOUNT_STATUS.NOT_CREATED,
      member_status: MEMBER_STATUS.INACTIVE,
    },
  });
};

export const approveSelectionCommitteeMember = async ({
  memberId,
  approvedBy = "",
}) => {
  await updateDoc(doc(db, COLLECTIONS.SELECTION_COMMITTEE_MEMBERS, memberId), {
    registration_status: REGISTRATION_STATUS.APPROVED,
    approved_by: approvedBy,
    approved_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
};

export const rejectSelectionCommitteeMember = async ({
  memberId,
  rejectedBy = "",
  rejectionReason = "",
}) => {
  await updateDoc(doc(db, COLLECTIONS.SELECTION_COMMITTEE_MEMBERS, memberId), {
    registration_status: REGISTRATION_STATUS.REJECTED,
    rejected_by: rejectedBy,
    rejected_at: serverTimestamp(),
    rejection_reason: rejectionReason,
    updated_at: serverTimestamp(),
  });
};

export const createSelectionCommitteeAccount = async ({ memberId }) => {
  await updateDoc(
    doc(db, COLLECTIONS.SELECTION_COMMITTEE_MEMBERS, memberId),
    {
      account_status: ACCOUNT_STATUS.INVITATION_SENT,
      invitation_sent_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    }
  );
};