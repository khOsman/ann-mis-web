import { useLiveDocument } from "../../realtime/useLive";
import { userDocRef } from "../../services/userService";

export const useUser = (userId) => {
  const { data, loading, error } = useLiveDocument(
    userId ? `users:${userId}` : null,
    () => userDocRef(userId),
    [userId]
  );

  return { data, loading, error };
};
