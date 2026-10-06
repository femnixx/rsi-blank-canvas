import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { isAdmin, user } = useAuth();

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="border-b border-brand-border bg-brand-glass backdrop-blur-glass">
        <div className="px-6 py-3 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cmmi-l2-bg px-3 py-1 text-xs font-medium text-cmmi-l2">
            CMMI Level 2 Managed
          </span>
          <span className="text-xs text-brand-muted">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-48px)] items-center justify-center p-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Welcome, {user?.email?.split("@")[0] || "User"}
          </h1>
          <p className="mt-3 text-brand-muted">
            FILKOM UB Integrated Portal — Workshop Management & Student Operations
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {isAdmin ? (
              <>
                <Link to="/workshops" className="btn-primary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Manage Workshops
                </Link>
                <Link to="/admin/create-workshop" className="btn-secondary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Create New Workshop
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className="btn-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Go to My Dashboard
              </Link>
            )}
            <Link to="/workshops" className="btn-secondary">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Browse All Workshops
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
