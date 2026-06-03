import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "./AuthContext";

// Gate a route behind authentication. While the initial token check runs we
// render nothing (brief), then either show the children or bounce to /login,
// remembering where the user was headed so login can send them back.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, checking } = useAuth();
  const location = useLocation();

  if (checking) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
