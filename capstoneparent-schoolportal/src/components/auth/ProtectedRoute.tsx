import { Navigate, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import {
  getAuthUser,
  getDefaultRouteForRole,
  hasAllowedRole,
  type UserRole,
} from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const authUser = getAuthUser();

  if (!authUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!hasAllowedRole(authUser, allowedRoles)) {
    return <Navigate to={getDefaultRouteForRole(authUser.role)} replace />;
  }

  return children;
};
