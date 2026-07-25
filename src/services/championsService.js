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

export const getChampion = async (championId) => {
  const snapshot = await getDoc(doc(db, COLLECTIONS.CHAMPIONS_POOL, championId));

  if (!snapshot.exists()) {
    throw new Error("Champion not found.");
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

export const getChampions = async () => {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.CHAMPIONS_POOL), orderBy("created_at", "desc"))
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const registerChampionRequest = async ({ email, profile }) => {
  return apiClient.post("/api/champions/register", {
    email,
    ...profile,
  });
};

export const approveChampion = async ({ championId, role }) => {
  return apiClient.post(
    `/api/champions/${championId}/approve`,
    { role },
    { authenticated: true }
  );
};

export const rejectChampion = async ({ championId, rejectionReason }) => {
  return apiClient.post(
    `/api/champions/${championId}/reject`,
    { rejectionReason },
    { authenticated: true }
  );
};

export const createChampionAccount = async ({ championId }) => {
  return apiClient.post(
    `/api/champions/${championId}/create-account`,
    {},
    { authenticated: true }
  );
};

export const activateChampionAccount = async ({ championId, token, password }) => {
  return apiClient.post(`/api/champions/${championId}/activate`, {
    token,
    password,
  });
};

export const activateChampionMember = async ({ championId }) => {
  return apiClient.post(
    `/api/champions/${championId}/activate-member`,
    {},
    { authenticated: true }
  );
};

export const updateChampion = async ({ championId, updates }) => {
  return apiClient.patch(`/api/champions/${championId}`, updates, {
    authenticated: true,
  });
};

export const assignChampionToFGD = async ({ championId, fgdId }) => {
  return apiClient.post(
    `/api/champions/${championId}/assign-fgd`,
    { fgdId },
    { authenticated: true }
  );
};

export const unassignChampionFromFGD = async ({ championId, fgdId }) => {
  return apiClient.post(
    `/api/champions/${championId}/unassign-fgd`,
    { fgdId },
    { authenticated: true }
  );
};
