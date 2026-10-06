import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const adminNavItems = [
  { path: "/", label: "Overview & CMMI Upgrade", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { path: "/admin/registration", label: "Workshop Registration (NIM-Sync)", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { path: "/admin/attendance", label: "Live Attendance & Rosters", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { path: "/admin/schedules", label: "Schedules & Repository", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { path: "/admin/participants", label: "Central Participant DB", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { path: "/admin/audit", label: "System Audit Logs", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
];

const studentNavItems = [
  { path: "/", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { path: "/workshops", label: "Browse Workshops", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { path: "/dashboard", label: "My Enrolled", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
];

export default function Sidebar() {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 flex items-center justify-between border-b border-brand-border bg-brand-glass px-4 py-3 backdrop-blur-glass">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue text-sm font-bold text-white">
            RSI
          </div>
          <span className="text-sm font-semibold text-white">Blank Canvas</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-brand-muted hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-72 border-r border-brand-border bg-brand-navy p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <MobileNavContent
              navItems={navItems}
              isActive={isActive}
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
              user={user}
              logout={logout}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-brand-border bg-brand-glass backdrop-blur-glass">
        <SidebarContent
          navItems={navItems}
          isActive={isActive}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          user={user}
          logout={logout}
        />
      </aside>
    </>
  );
}

function SidebarContent({ navItems, isActive, isAdmin, isAuthenticated, user, logout }) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue text-sm font-bold text-white shadow-lg shadow-blue-500/30">
          RSI
        </div>
        <div>
          <div className="text-sm font-semibold text-white tracking-tight">Blank Canvas</div>
          <div className="text-[10px] text-brand-muted uppercase tracking-wider">v2.4</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {isAdmin && (
          <div>
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
              Workshop Management
            </div>
            <nav className="space-y-0.5">
              {adminNavItems.slice(0, 5).map((item) => (
                <SidebarLink key={item.path} item={item} isActive={isActive} />
              ))}
            </nav>
          </div>
        )}

        <div>
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
            {isAdmin ? "Academic Operations" : "My Learning"}
          </div>
          <nav className="space-y-0.5">
            {isAdmin ? (
              adminNavItems.slice(5).map((item) => (
                <SidebarLink key={item.path} item={item} isActive={isActive} />
              ))
            ) : (
              studentNavItems.map((item) => (
                <SidebarLink key={item.path} item={item} isActive={isActive} />
              ))
            )}
          </nav>
        </div>
      </div>

      {isAdmin && (
        <div className="border-t border-brand-border p-3">
          <div className="glass-card !p-3">
            <div className="text-[10px] uppercase tracking-wider text-brand-muted mb-1">Process Maturity</div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-brand-border overflow-hidden">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-cmmi-l2 to-brand-blue" />
              </div>
              <span className="text-xs font-medium text-white">CMMI L2</span>
            </div>
            <div className="text-[10px] text-brand-muted mt-1">Managed Quality Standard</div>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="border-t border-brand-border p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-white truncate">{user?.email}</div>
              <div className="text-[10px] text-brand-muted">{isAdmin ? "Admin" : "Student"}</div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-brand-muted transition hover:text-white hover:bg-white/5"
              title="Logout"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function MobileNavContent({ navItems, isActive, isAdmin, isAuthenticated, user, logout, onNavigate }) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-2 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue text-sm font-bold text-white">
          RSI
        </div>
        <span className="text-sm font-semibold text-white">Blank Canvas</span>
      </div>

      <nav className="mt-4 space-y-0.5">
        {isAdmin
          ? adminNavItems.map((item) => (
              <SidebarLink key={item.path} item={item} isActive={isActive} />
            ))
          : studentNavItems.map((item) => (
              <SidebarLink key={item.path} item={item} isActive={isActive} />
            ))}
      </nav>

      {isAuthenticated && (
        <div className="mt-auto pt-4 border-t border-brand-border">
          <button
            onClick={() => { logout(); onNavigate(); }}
            className="w-full rounded-lg border border-brand-border px-4 py-2 text-sm text-white hover:bg-white/5 transition"
          >
            Logout
          </button>
        </div>
      )}
    </>
  );
}

function SidebarLink({ item, isActive }) {
  const active = isActive(item.path);
  return (
    <Link
      to={item.path}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-brand-blue/15 text-brand-blue"
          : "text-brand-muted hover:bg-white/5 hover:text-white"
      }`}
    >
      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
      </svg>
      <span className="truncate">{item.label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-blue" />}
    </Link>
  );
}
