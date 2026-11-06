import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchWorkshops, fetchMyWorkshops, processRegistration, fetchMaterials } from "../../lib/api.js";

export default function MyWorkshops() {
  const { user, token, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [allWorkshops, setAllWorkshops] = useState(null);
  const [enrolledWorkshops, setEnrolledWorkshops] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registeringId, setRegisteringId] = useState(null);

  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [materialsData, setMaterialsData] = useState(null);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      loadAllWorkshops();
      loadEnrolledWorkshops();
    }
  }, [isAuthenticated]);

  async function loadAllWorkshops() {
    try {
      const data = await fetchWorkshops();
      setAllWorkshops(data.workshops);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadEnrolledWorkshops() {
    try {
      const data = await fetchMyWorkshops(token);
      setEnrolledWorkshops(data.workshops);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(workshopId) {
    setRegisteringId(workshopId);
    try {
      await processRegistration(workshopId, user?.nim);
      loadEnrolledWorkshops();
    } catch (err) {
      if ((err.message || "").includes("DUPLICATE") || err.message.includes("409")) loadEnrolledWorkshops();
      else setError(err.message);
    } finally {
      setRegisteringId(null);
    }
  }

  async function openMaterials(workshopId) {
    setMaterialsOpen(true);
    setMaterialsLoading(true);
    setMaterialsError("");
    setMaterialsData(null);
    try {
      const data = await fetchMaterials(workshopId, token);
      setMaterialsData(data);
    } catch (err) {
      setMaterialsError(err.message);
    } finally {
      setMaterialsLoading(false);
    }
  }

  const closeMaterials = () => setMaterialsOpen(false);

  function getWorkshopById(id) {
    return allWorkshops?.find((w) => w.id === id) || enrolledWorkshops?.find((w) => w.id === id);
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-6">
        <p className="text-sm text-brand-muted">Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="border-b border-brand-border bg-brand-glass backdrop-blur-glass">
        <div className="px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-brand-muted">Student Dashboard</span>
          <span className="text-xs text-brand-muted">BCC Integrated Portal</span>
        </div>
      </div>

      <div className="p-6">
        <div className="card-accent mb-8 !bg-gradient-to-r !from-brand-navy !to-brand-slate">
          <h1 className="text-2xl font-bold text-white">Welcome, {user?.email?.split("@")[0] || "Student"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-brand-muted">
            {user?.nim && <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              NIM: {user.nim}
            </span>}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/20 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
              <span className="h-1 w-1 rounded-full bg-brand-blue" /> Active Student
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20" role="alert">
            {error}
          </div>
        )}

        <div className="mb-6 overflow-x-auto border-b border-brand-border">
          <div className="flex min-w-max items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === "all" ? "tab-active" : "tab-inactive"
              }`}
            >
              All Workshops
            </button>
            <button
              onClick={() => setActiveTab("enrolled")}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === "enrolled" ? "tab-active" : "tab-inactive"
              }`}
            >
              My Enrolled Workshops
            </button>
          </div>
        </div>

        {activeTab === "all" && (
          <div>
            {loading || allWorkshops === null ? (
              <p className="text-sm text-brand-muted">Loading workshops…</p>
            ) : allWorkshops.length === 0 ? (
              <p className="text-sm text-brand-muted">No workshops available yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allWorkshops.map((w) => {
                  const isRegistered = enrolledWorkshops?.some((e) => e.id === w.id);
                  return (
                    <div key={w.id} className="card-accent">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="text-base font-semibold text-white">{w.title}</h3>
                        <span className="inline-flex items-center rounded-full bg-brand-blue/20 px-2 py-0.5 text-xs font-medium text-brand-blue">
                          {w.registration_count} registered
                        </span>
                      </div>
                      <p className="mb-2 line-clamp-2 text-sm text-brand-muted">
                        {w.description || "No description provided."}
                      </p>
                      {w.speaker_name && (
                        <p className="mb-1 text-sm text-brand-muted">Speaker: {w.speaker_name}</p>
                      )}
                      <p className="mb-3 text-sm text-brand-muted">
                        {w.event_date
                          ? new Date(w.event_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "TBD"}
                      </p>
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 border-t border-brand-border">
                        {!isRegistered ? (
                          <button
                            onClick={() => handleRegister(w.id)}
                            disabled={registeringId === w.id}
                            className="btn-primary disabled:opacity-50"
                          >
                            {registeringId === w.id ? "Registering…" : "Register"}
                          </button>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-brand-blue/20 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
                            Enrolled
                          </span>
                        )}
                        <Link to={`/workshops/${w.id}`} className="btn-ghost">
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "enrolled" && (
          <div>
            {loading ? (
              <p className="text-sm text-brand-muted">Loading your workshops…</p>
            ) : !enrolledWorkshops || enrolledWorkshops.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-brand-muted">
                  You haven't enrolled in any workshops yet.
                </p>
                <button
                  onClick={() => setActiveTab("all")}
                  className="mt-3 btn-primary"
                >
                  Browse All Workshops
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {enrolledWorkshops.map((w) => (
                  <div key={w.id} className="card-accent">
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="text-base font-semibold text-white">{w.title}</h3>
                      <span className="inline-flex items-center rounded-full bg-brand-blue/20 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
                        Enrolled
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-brand-muted">
                      {w.description || "No description provided."}
                    </p>
                    {w.speaker_name && (
                      <p className="mb-1 text-sm text-brand-muted">Speaker: {w.speaker_name}</p>
                    )}
                    <p className="mb-1 text-sm text-brand-muted">
                      {w.event_date
                        ? new Date(w.event_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "TBD"}
                      {w.location && <span> · 📍 {w.location}</span>}
                    </p>
                    {w.attended ? (
                      <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span>Attended {w.attended_at ? new Date(w.attended_at).toLocaleDateString() : ""}</span>
                      </div>
                    ) : (
                      <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-zinc-500/20 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                        Not yet attended
                      </div>
                    )}
                    <button
                      onClick={() => openMaterials(w.id)}
                      className="w-full btn-primary"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      View Course Materials
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {materialsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-brand-border bg-brand-card backdrop-blur-glass p-4 shadow-xl sm:max-w-2xl md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white sm:text-lg">Course Materials</h2>
              <button
                onClick={closeMaterials}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-muted transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {materialsLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
                <p className="ml-3 text-sm text-brand-muted">Loading materials…</p>
              </div>
            )}

            {materialsError && (
              <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20" role="alert">
                {materialsError}
              </div>
            )}

            {materialsData && (
              <div>
                {materialsData.verified ? (
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-blue/20 px-3 py-1.5 text-xs font-medium text-brand-blue">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Verified Student Access Granted
                  </div>
                ) : (
                  <div className="mb-4 rounded-lg bg-zinc-500/10 px-3 py-2 text-sm text-brand-muted">
                    Materials not available — registration not verified.
                  </div>
                )}

                {materialsData.verified && materialsData.materials.length === 0 ? (
                  <div className="py-8 text-center">
                    <svg className="mx-auto h-10 w-10 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V11.25m8.625-9.75h2.25c.621 0 1.125.504 1.125 1.125v2.25m-13.5 0h13.5m-13.5 0L9 15m3.75-6v6" />
                    </svg>
                    <p className="mt-2 text-sm text-brand-muted">No materials uploaded yet.</p>
                  </div>
                ) : (
                  materialsData.verified && (
                    <div className="grid gap-2 sm:gap-3">
                      {materialsData.materials.map((m) => (
                        <a
                          key={m.id}
                          href={m.file_url}
                          download
                          className="group flex items-start gap-3 rounded-xl border border-brand-border bg-white/5 p-3 text-sm text-brand-muted transition hover:border-brand-blue hover:bg-white/10"
                        >
                          <div className="flex-shrink-0 rounded-lg bg-white/5 p-2">
                            <svg className="h-5 w-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V11.25m8.625-9.75h2.25c.621 0 1.125.504 1.125 1.125v2.25m-13.5 0h13.5m-13.5 0L9 15m3.75-6v6" />
                            </svg>
                          </div>
                           <div className="min-w-0 flex-1 overflow-x-auto">
                              <span className="block truncate font-medium text-white group-hover:text-brand-blue" title={m.title}>
                                {m.title}
                              </span>
                              <span className="block text-xs text-brand-muted">
                                Uploaded {new Date(m.uploaded_at).toLocaleDateString("en-US")}
                              </span>
                            </div>
                          <span className="flex-shrink-0 text-xs text-brand-muted">Download</span>
                        </a>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            <button
              onClick={closeMaterials}
              className="mt-4 w-full btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
