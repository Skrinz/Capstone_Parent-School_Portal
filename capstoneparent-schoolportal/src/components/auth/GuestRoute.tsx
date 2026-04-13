import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuthStore } from "../../lib/store/authStore";

interface GuestRouteProps {
  children: ReactElement;
}

/**
 * A route wrapper that only allows unauthenticated users.
 * Authenticated users are redirected to the homepage.
 */
export const GuestRoute = ({ children }: GuestRouteProps) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/homepage" replace />;
  }

  return children;
};
