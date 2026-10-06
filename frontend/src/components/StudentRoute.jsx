import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function StudentRoute({ children }) {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
          <p className="text-sm text-brand-muted">Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/" replace />;
  return children;
}
