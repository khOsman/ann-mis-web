import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { USER_STATUSES } from "../constants/roles";

export default function ProtectedRoute({
  children,
  permission,
  adminOnly = false,
}) {
  const { authLoading, appUser, isAdmin, isSuperAdmin, hasPermission } =
    useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ann-bg)]">
        <p className="text-[var(--ann-purple)] font-medium">
          Checking access...
        </p>
      </div>
    );
  }

  if (!appUser) {
    return <Navigate to="/" replace />;
  }

  if (appUser.status === USER_STATUSES.PENDING) {
    return <Navigate to="/account-pending" replace />;
  }

  if (appUser.status !== USER_STATUSES.ACTIVE) {
    return <Navigate to="/account-inactive" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/access-denied" replace />;
  }

  if (permission && !isSuperAdmin && !hasPermission(permission)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}