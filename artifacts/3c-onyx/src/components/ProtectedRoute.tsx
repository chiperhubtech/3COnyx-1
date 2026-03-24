/**
 * ProtectedRoute — Blocks unauthenticated access.
 * Redirects to /landing if not logged in.
 * Redirects to / if logged in but role doesn't match.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import type { AuthUser } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AuthUser["role"];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/landing");
      return;
    }
    if (requiredRole && user.role !== requiredRole && user.role !== "Admin") {
      navigate("/");
    }
  }, [user, loading, requiredRole, navigate]);

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#050508", flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "2px solid rgba(201,162,39,0.2)",
          borderTop: "2px solid #C9A227",
          animation: "slow-spin 0.8s linear infinite",
        }} />
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em" }}>AUTHENTICATING</p>
      </div>
    );
  }

  if (!user) return null;
  if (requiredRole && user.role !== requiredRole && user.role !== "Admin") return null;

  return <>{children}</>;
}

/**
 * PublicRoute — Only for logged-out users.
 * Redirects authenticated users to the dashboard.
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && user) navigate("/");
  }, [user, loading, navigate]);

  if (loading) return null;
  if (user) return null;

  return <>{children}</>;
}
