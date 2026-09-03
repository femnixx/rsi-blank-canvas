import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  fetchWorkshops,
  fetchMyWorkshops,
  registerParticipant,
  fetchMaterials,
} from "../../lib/api.js";

/**
 * Student dashboard — tabbed view of all workshops and enrolled workshops.
 * Uses brand design: navy welcome banner, orange "Enrolled" badges,
 * blue "View Course Materials" buttons, blue verified access badge.
 */
export default function MyWorkshops() {
  const { user, token, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [allWorkshops, setAllWorkshops] = useState(null);
  const [enrolledWorkshops, setEnrolledWorkshops] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registeringId, setRegisteringId] = useState(null);

  // Materials modal state
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
      await registerParticipant(workshopId, token);
      loadEnrolledWorkshops();
    } catch (err) {
      if (err.message.includes("409") || err.message.includes("already registered")) {
        // Already registered — silently refresh
        loadEnrolledWorkshops();
      } else {
        setError(err.message);
      }
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
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-brand-bg px-6">
        <p className="text-sm text-zinc-500">Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-brand-bg px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Dark Navy Welcome Banner */}
        <div className="mb-8 rounded-xl border border-zinc-200 bg-brand-navy-gradient p-6 text-white shadow-sm">
          <h1 className="text-2xl font-bold">Welcome, {user?.email}</h1>
          {user?.nim && (
            <p className="mt-1 text-sm text-zinc-300">NIM: {user.nim}</p>
          )}
          {user?.role && (
            <p className="mt-1 text-xs text-zinc-400">Role: {user.role}</p>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {/* Tab Bar — Orange/Coral underline for active tab */}
        <div className="mb-6 overflow-x-auto border-b border-zinc-200">
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

        {/* All Workshops Tab */}
        {activeTab === "all" && (
          <div>
            {loading || allWorkshops === null ? (
              <p className="text-sm text-zinc-500">Loading workshops…</p>
            ) : allWorkshops.length === 0 ? (
              <p className="text-sm text-zinc-500">No workshops available yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allWorkshops.map((w) => {
                  const isRegistered = enrolledWorkshops?.some((e) => e.id === w.id);
                  return (
                    <div
                      key={w.id}
                      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-brand-navy">{w.title}</h3>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-brand-blue">
                          {w.registration_count} registered
                        </span>
                      </div>
                      <p className="mb-2 line-clamp-2 text-sm text-zinc-600">
                        {w.description || "No description provided."}
                      </p>
                      {w.speaker_name && (
                        <p className="mb-1 text-sm text-zinc-700">Speaker: {w.speaker_name}</p>
                      )}
                      <p className="mb-3 text-sm text-zinc-700">
                        📅{" "}
                        {w.event_date
                          ? new Date(w.event_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "TBD"}
                      </p>
                      <div className="flex gap-2">
                        {!isRegistered ? (
                          <button
                            onClick={() => handleRegister(w.id)}
                            disabled={registeringId === w.id}
                            className="rounded-lg bg-brand-blue px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-50"
                          >
                            {registeringId === w.id ? "Registering…" : "Register"}
                          </button>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-brand-orange">
                            Enrolled
                          </span>
                        )}
                        <button
                          onClick={() => openMaterials(w.id)}
                          className="rounded-lg border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-navy transition hover:bg-zinc-50"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Enrolled Workshops Tab */}
        {activeTab === "enrolled" && (
          <div>
            {loading ? (
              <p className="text-sm text-zinc-500">Loading your workshops…</p>
            ) : !enrolledWorkshops || enrolledWorkshops.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-500">
                  You haven't enrolled in any workshops yet.
                </p>
                <button
                  onClick={() => setActiveTab("all")}
                  className="mt-3 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                >
                  Browse All Workshops
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {enrolledWorkshops.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-brand-navy">{w.title}</h3>
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-brand-orange">
                        Enrolled
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-zinc-600">
                      {w.description || "No description provided."}
                    </p>
                    {w.speaker_name && (
                      <p className="mb-1 text-sm text-zinc-700">Speaker: {w.speaker_name}</p>
                    )}
                    <p className="mb-1 text-sm text-zinc-700">
                      📅{" "}
                      {w.event_date
                        ? new Date(w.event_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "TBD"}
                      • 📍 {w.location}
                    </p>
                    {w.attended ? (
                      <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Attended {w.attended_at ? new Date(w.attended_at).toLocaleDateString() : ""}
                      </div>
                    ) : (
                      <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                        Not yet attended
                      </div>
                    )}
                    <button
                      onClick={() => openMaterials(w.id)}
                      className="w-full rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                    >
                      View Course Materials
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Materials Modal */}
      {materialsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl sm:max-w-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-navy">Course Materials</h2>
              <button
                onClick={closeMaterials}
                className="text-zinc-400 hover:text-zinc-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {materialsLoading && (
              <p className="text-sm text-zinc-500">Loading materials…</p>
            )}

            {materialsError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {materialsError}
              </div>
            )}

            {materialsData && (
              <div>
                {materialsData.verified ? (
                  <div className="mb-4 inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-brand-blue">
                    ✓ Verified Student Access Granted
                  </div>
                ) : (
                  <div className="mb-4 text-sm text-zinc-600">
                    Materials not available — registration not verified.
                  </div>
                )}

                {materialsData.verified && materialsData.materials.length === 0 ? (
                  <p className="text-sm text-zinc-500">No materials uploaded yet.</p>
                ) : (
                  materialsData.verified && (
                    <div className="grid gap-3">
                      {materialsData.materials.map((m) => (
                        <a
                          key={m.id}
                          href={m.file_url}
                          download
                          className="group flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 transition hover:border-brand-blue hover:bg-white"
                        >
                          <span className="text-lg">📎</span>
                          <div className="flex-1">
                            <span className="font-medium text-brand-navy group-hover:text-brand-blue">
                              {m.title}
                            </span>
                            <span className="block text-xs text-zinc-50">
                              Uploaded {new Date(m.uploaded_at).toLocaleDateString("en-US")}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-400">Download</span>
                        </a>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            <button
              onClick={closeMaterials}
              className="mt-4 w-full rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
