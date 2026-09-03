import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Navbar — dark navy gradient header with logo (left), role-based navigation (center),
 * and login/logout (right). Collapses to hamburger menu on mobile.
 */
export default function Navbar() {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = "block px-4 py-2 text-sm font-medium transition-colors";
  const navLinkActive = "text-brand-blue bg-zinc-50";
  const navLinkInactive = "text-zinc-300 hover:text-white hover:bg-zinc-800";

  const getNavLinkClass = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/")
      ? navLinkClass + " " + navLinkActive
      : navLinkClass + " " + navLinkInactive;

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200 bg-brand-navy-gradient px-4 py-3 shadow-sm text-white sm:px-6">
      {/* Logo - left */}
      <Link to="/" className="flex items-center gap-2.5" onClick={closeMenu}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold tracking-tight text-brand-navy shadow">
          RSI
        </div>
        <span className="text-sm font-semibold tracking-tight text-white hidden xs:inline">
          Blank Canvas
        </span>
      </Link>

      {/* Desktop Navigation - center (md and up) */}
      <nav className="hidden md:flex items-center gap-2">
        <Link
          to="/workshops"
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            location.pathname === "/workshops" || location.pathname.startsWith("/workshops/")
              ? "text-brand-blue"
              : "text-zinc-300 hover:text-white"
          }`}
        >
          Workshops
        </Link>
        {isAuthenticated && !isAdmin && (
          <Link
            to="/dashboard"
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              location.pathname === "/dashboard"
                ? "text-brand-blue"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            Dashboard
          </Link>
        )}
        {isAuthenticated && isAdmin && (
          <Link
            to="/admin/create-workshop"
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              location.pathname.startsWith("/admin/")
                ? "text-brand-blue"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            Admin
          </Link>
        )}
      </nav>

      {/* Actions - right */}
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <span className="hidden xs:inline text-xs text-zinc-300">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="hidden sm:inline-block rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-navy transition hover:bg-zinc-50"
              aria-label="Logout"
            >
              Logout
            </button>
            <button
              onClick={logout}
              className="sm:hidden rounded-lg bg-white p-2 text-brand-navy"
              aria-label="Logout"
            >
              <span>🚪</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="rounded-lg bg-brand-blue px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sky-600"
          >
            Login
          </Link>
        )}

        {/* Mobile hamburger menu */}
        {!isAuthenticated && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden rounded-lg p-2 text-zinc-300 hover:text-white"
            aria-label="Menu"
          >
            <span className="text-xl">{menuOpen ? "✕" : "☰"}</span>
          </button>
        )}
      </div>

      {/* Mobile menu dropdown */}
      {!isAuthenticated && menuOpen && (
        <div className="absolute top-full left-0 right-0 z-40 md:hidden">
          <div className="flex flex-col gap-1 bg-brand-navy-gradient p-2 shadow-lg">
            <Link
              to="/workshops"
              onClick={closeMenu}
              className={getNavLinkClass("/workshops")}
            >
              Workshops
            </Link>
            <Link
              to="/login"
              onClick={closeMenu}
              className={getNavLinkClass("/login")}
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={closeMenu}
              className={getNavLinkClass("/register")}
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
