import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { AUTH_PATH, dashboardPathByRole } from "@/lib/routes";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: UserRole[];
  allowUnverified?: boolean;
}

export default function ProtectedRoute({ children, allowedRoles, allowUnverified = false }: ProtectedRouteProps) {
  const { user, isLoggedIn } = useAuth();
  const location = useLocation();

  if (!user && isLoggedIn) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isLoggedIn || !user) {
    return <Navigate to={`${AUTH_PATH}?mode=signin&redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (!allowUnverified && user.role !== "tourist" && !user.isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={dashboardPathByRole[user.role]} replace />;
  }

  return children;
}
