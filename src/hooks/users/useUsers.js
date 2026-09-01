import { useLiveCollection } from "../../realtime/useLive";
import { updateUser, usersQuery } from "../../services/userService";

const mapUserDoc = (doc) => ({ ...doc.data(), id: doc.id });

export const useUsers = () => {
  const { data, loading, error } = useLiveCollection(
    "users:all",
    usersQuery,
    mapUserDoc,
    []
  );

  const update = async (userId, updates) => {
    await updateUser(userId, updates);
    // No manual refresh needed — the live listener updates `data` automatically.
  };

  return {
    data,
    loading,
    error,
    refresh: () => {}, // kept as a no-op for backward compatibility; data is always live now

    create: null,
    update,
    remove: null,
    getById: null,
  };
};
