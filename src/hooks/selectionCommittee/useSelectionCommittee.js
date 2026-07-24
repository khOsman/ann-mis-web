import { useCallback, useEffect, useState } from "react";
import {
  getSelectionCommitteeMember,
  getSelectionCommitteeMembers,
} from "../../services/selectionCommitteeService";

export const useSelectionCommittee = (memberId = null) => {
  const [data, setData] = useState(memberId ? null : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = memberId
        ? await getSelectionCommitteeMember(memberId)
        : await getSelectionCommitteeMembers();

      setData(result);

      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
  };
};