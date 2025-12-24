import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role-based access - role is verified from database, not client state
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // For admin routes, redirect to home instead of pending
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/pending" replace />;
  }

  // If role hasn't loaded yet but we have a user, wait for role
  if (allowedRoles && !userRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Ověřování oprávnění...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
