import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  fetchWorkshop,
  registerParticipant,
  fetchMaterials,
  registerParticipantByNim,
  fetchMaterialsByNim,
  markAttendanceByNim,
} from "../lib/api.js";
import WorkshopRegistrationModal from "../components/WorkshopRegistrationModal.jsx";

export default function WorkshopDetail() {
  const { id } = useParams();
  const { token, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationChecking, setRegistrationChecking] = useState(false);

  const [materials, setMaterials] = useState(null);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [publicNim, setPublicNim] = useState("");
  const [publicNimLoading, setPublicNimLoading] = useState(false);
  const [publicNimMessage, setPublicNimMessage] = useState(null);
  const [publicNimError, setPublicNimError] = useState("");

  useEffect(() => {
    loadWorkshop();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated) {
      checkRegistration();
    }
  }, [isAuthenticated, id, workshop]);

  async function loadWorkshop() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchWorkshop(id);
      setWorkshop(data.workshop);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function checkRegistration() {
    setRegistrationChecking(true);
    try {
      const data = await fetchMaterials(id, token);
      setIsRegistered(data.verified);
    } catch (err) {
      setIsRegistered(false);
    } finally {
      setRegistrationChecking(false);
    }
  }

  async function loadMaterials() {
    setMaterialsLoading(true);
    setMaterialsError("");
    setMaterials(null);
    try {
      const data = await fetchMaterials(id, token);
      setMaterials(data);
    } catch (err) {
      setMaterialsError(err.message);
    } finally {
      setMaterialsLoading(false);
    }
  }

  async function handlePublicRegister() {
    setPublicNimError("");
    setPublicNimMessage(null);
    if (!publicNim.trim()) {
      setPublicNimError("NIM is required.");
      return;
    }
    setPublicNimLoading(true);
    try {
      const data = await registerParticipantByNim(id, publicNim.trim());
      setPublicNimMessage({ type: "success", text: data.message || "Registration confirmed." });
      setPublicNim("");
    } catch (err) {
      setPublicNimError(err.message);
    } finally {
      setPublicNimLoading(false);
    }
  }

  async function handlePublicAttendance() {
    setPublicNimError("");
    setPublicNimMessage(null);
    if (!publicNim.trim()) {
      setPublicNimError("NIM is required.");
      return;
    }
    setPublicNimLoading(true);
    try {
      const data = await markAttendanceByNim(id, publicNim.trim());
      setPublicNimMessage({ type: "success", text: data.message || "Attendance recorded." });
      setPublicNim("");
    } catch (err) {
      setPublicNimError(err.message);
    } finally {
      setPublicNimLoading(false);
    }
  }

  async function handlePublicMaterials() {
    setPublicNimError("");
    setPublicNimMessage(null);
    setMaterialsError("");
    setMaterials(null);
    if (!publicNim.trim()) {
      setPublicNimError("NIM is required.");
      return;
    }
    setMaterialsLoading(true);
    try {
      const data = await fetchMaterialsByNim(id, publicNim.trim());
      setMaterials(data);
    } catch (err) {
      setMaterialsError(err.message);
    } finally {
      setMaterialsLoading(false);
    }
  }

  const handleRegistered = () => {
    checkRegistration();
    loadMaterials();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-6">
        <p className="text-sm text-brand-muted">Loading workshop…</p>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-6">
        <p className="text-sm text-brand-muted">{error || "Workshop not found."}</p>
      </div>
    );
  }

  const eventDate = workshop.event_date ? new Date(workshop.event_date) : null;
  const formattedDate = eventDate
    ? eventDate.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "TBD";

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="border-b border-brand-border bg-brand-glass backdrop-blur-glass">
        <div className="px-6 py-3">
          <span className="text-sm text-brand-muted">BCC Integrated Information System</span>
        </div>
      </div>

      <div className="p-6">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => navigate("/workshops")}
            className="mb-4 flex items-center gap-1 text-sm text-brand-muted hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to workshops
          </button>

          <div className="card-accent mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{workshop.title}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-brand-muted">
                  {workshop.speaker_name && <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {workshop.speaker_name}
                  </span>}
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {formattedDate}
                  </span>
                  {workshop.location && <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    {workshop.location}
                  </span>}
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/workshops/${workshop.id}/attendance`)}
                    className="btn-secondary text-xs"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    Manage Attendance
                  </button>
                  <button
                    onClick={() => navigate(`/admin/create-workshop/${workshop.id}/edit`)}
                    className="btn-ghost text-xs"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit
                  </button>
                </div>
              )}
            </div>
            {workshop.description && (
              <p className="mt-3 text-sm text-brand-muted">{workshop.description}</p>
            )}
          </div>

          {!isAuthenticated && (
            <div className="mb-8 glass-card !p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/20">
                  <svg className="h-4 w-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Student Access</h2>
                  <p className="text-xs text-brand-muted">Enter your NIM to register, mark attendance, or access materials.</p>
                </div>
              </div>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={publicNim}
                  onChange={(e) => setPublicNim(e.target.value)}
                  placeholder="Enter your NIM"
                  className="input-dark flex-1"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handlePublicRegister}
                    disabled={publicNimLoading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {publicNimLoading ? "Submitting…" : "Register"}
                  </button>
                  <button
                    onClick={handlePublicAttendance}
                    disabled={publicNimLoading}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Mark Attendance
                  </button>
                  <button
                    onClick={handlePublicMaterials}
                    disabled={publicNimLoading}
                    className="btn-ghost disabled:opacity-50"
                  >
                    View Materials
                  </button>
                </div>
              </div>

              {publicNimError && (
                <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20" role="alert">
                  {publicNimError}
                </div>
              )}
              {publicNimMessage && publicNimMessage.type === "success" && (
                <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400 border border-emerald-500/20" role="status">
                  {publicNimMessage.text}
                </div>
              )}
            </div>
          )}

          {isAuthenticated && (
            <div className="mb-8">
              {!isRegistered ? (
                <button
                  onClick={() => setModalOpen(true)}
                  className="btn-primary"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Register for this Workshop
                </button>
              ) : (
                <button
                  onClick={loadMaterials}
                  className="btn-primary"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  View Course Materials
                </button>
              )}
            </div>
          )}

          {materials && (
            <div className="mb-8 glass-card !p-6">
              <h2 className="section-heading text-lg mb-4">Course Materials</h2>

              {materials.verified ? (
                <div className="mb-4">
                  <span className="verified-badge">✓ Verified Student Access Granted</span>
                </div>
              ) : (
                <div className="mb-4 text-sm text-brand-muted">
                  Materials not available — registration not verified.
                </div>
              )}

              {materials.verified && materials.materials.length === 0 ? (
                <p className="text-sm text-brand-muted">No materials have been uploaded yet.</p>
              ) : (
                materials.verified && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {materials.materials.map((m) => (
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
                        <div className="min-w-0 flex-1">
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

          {materialsError && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20" role="alert">
              {materialsError}
            </div>
          )}

          <WorkshopRegistrationModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            workshop={workshop}
            token={token}
            onRegistered={handleRegistered}
          />
        </div>
      </div>
    </div>
  );
}
