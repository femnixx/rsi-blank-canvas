import { useAuth } from "../context/AuthContext.jsx";

/**
 * Navbar with simple logo (left) and logout button (right).
 * Only renders logout when authenticated; hidden otherwise but layout preserved.
 */
export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
      {/* Logo - left */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold tracking-tight text-white">
          RSI
        </div>
        <span className="text-sm font-semibold tracking-tight text-zinc-900">Blank Canvas</span>
        {isAuthenticated && user?.email && (
          <span className="ml-2 hidden text-xs text-zinc-500 sm:inline">· {user.email}</span>
        )}
      </div>

      {/* Logout - right */}
      <div className="flex items-center">
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100"
            aria-label="Logout"
          >
            Logout
          </button>
        ) : (
          <span className="text-sm text-zinc-400">Not signed in</span>
        )}
      </div>
    </nav>
  );
}
