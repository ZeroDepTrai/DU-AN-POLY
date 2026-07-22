import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("admin" | "customer_support")[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
