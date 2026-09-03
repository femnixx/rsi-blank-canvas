import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Navbar — dark navy header with logo (left), role-based navigation (center),
 * and login/logout (right).
 */
export default function Navbar() {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const location = useLocation();

  const navLinkClass = "text-sm font-medium transition-colors focus:outline-none";
  const navLinkActive = "text-brand-blue";
  const navLinkInactive = "text-zinc-300 hover:text-white";

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-brand-navy-gradient px-6 py-3 text-white shadow-sm">
      {/* Logo - left */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold tracking-tight text-brand-navy">
          RSI
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">
          Blank Canvas
        </span>
      </div>

      {/* Navigation - center */}
      <nav className="flex items-center gap-6">
        <Link
          to="/workshops"
          className={`${navLinkClass} ${location.pathname === "/workshops" || location.pathname.startsWith("/workshops/") ? navLinkActive : navLinkInactive}`}
        >
          Workshops
        </Link>
        {isAuthenticated && !isAdmin && (
          <Link
            to="/dashboard"
            className={`${navLinkClass} ${location.pathname === "/dashboard" ? navLinkActive : navLinkInactive}`}
          >
            Dashboard
          </Link>
        )}
        {isAuthenticated && isAdmin && (
          <Link
            to="/admin/create-workshop"
            className={`${navLinkClass} ${location.pathname.startsWith("/admin/") ? navLinkActive : navLinkInactive}`}
          >
            Admin
          </Link>
        )}
      </nav>

      {/* Actions - right */}
      <div className="flex items-center">
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-navy transition hover:bg-zinc-50 active:bg-zinc-100"
            aria-label="Logout"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className={`rounded-lg bg-brand-blue px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sky-600`}
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
