import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  permission,
  adminOnly = false,
}) {
  const { authLoading, appUser, isActive, isAdmin, isSuperAdmin, hasPermission } =
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

  if (!appUser || !isActive) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // if (permission && !isSuperAdmin && !hasPermission(permission)) {
  //   return <Navigate to="/admin" replace />;
  // }
  if (permission && !isSuperAdmin && !hasPermission(permission)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}