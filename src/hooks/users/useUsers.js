import { useCallback, useEffect, useState } from "react";
import { getUsers, updateUser } from "../../services/userService";

export const useUsers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const users = await getUsers();
      setData(users);
      return users;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = async (userId, updates) => {
    await updateUser(userId, updates);
    await refresh();
  };

  return {
    data,
    loading,
    error,
    refresh,

    create: null,
    update,
    remove: null,
    getById: null,
  };
};