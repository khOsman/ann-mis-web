import { useAuth } from "../context/AuthContext";

export default function usePermission(permissionKey) {
  const { appUser, hasPermission, isSuperAdmin } = useAuth();

  if (!appUser) return false;

  if (isSuperAdmin) return true;

  return hasPermission(permissionKey);
}