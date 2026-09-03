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
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-brand-bg px-6">
        <p className="text-sm text-zinc-500">Loading workshop…</p>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-brand-bg px-6">
        <p className="text-sm text-zinc-500">{error || "Workshop not found."}</p>
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
    <main className="min-h-[calc(100vh-56px)] bg-brand-bg px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4">
          <button
            onClick={() => navigate("/workshops")}
            className="text-sm text-zinc-600 hover:text-brand-navy"
          >
            ← Back to workshops
          </button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-brand-navy-gradient p-6 text-white shadow-sm mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{workshop.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
                {workshop.speaker_name && <span>Speaker: {workshop.speaker_name}</span>}
                <span>📅 {formattedDate}</span>
                {workshop.location && <span>📍 {workshop.location}</span>}
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin/workshops/${workshop.id}/attendance`)}
                  className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
                >
                  Manage Attendance
                </button>
                <button
                  onClick={() => navigate(`/admin/create-workshop/${workshop.id}/edit`)}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-brand-navy transition hover:bg-zinc-100"
                >
                  Edit Workshop
                </button>
              </div>
            )}
          </div>
          {workshop.description && (
            <p className="mt-3 text-sm text-zinc-200">{workshop.description}</p>
          )}
        </div>

        {!isAuthenticated && (
          <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-navy mb-2">Student Access</h2>
            <p className="mb-4 text-sm text-zinc-600">Enter your NIM to register, mark attendance, or access materials.</p>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={publicNim}
                onChange={(e) => setPublicNim(e.target.value)}
                placeholder="Enter your NIM"
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex gap-2">
                <button
                  onClick={handlePublicRegister}
                  disabled={publicNimLoading}
                  className="w-full rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-50 sm:w-auto"
                >
                  {publicNimLoading ? "Submitting…" : "Register"}
                </button>
                <button
                  onClick={handlePublicAttendance}
                  disabled={publicNimLoading}
                  className="w-full rounded-lg bg-brand-orange px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50 sm:w-auto"
                >
                  {publicNimLoading ? "Submitting…" : "Mark Attendance"}
                </button>
                <button
                  onClick={handlePublicMaterials}
                  disabled={publicNimLoading}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-brand-navy transition hover:bg-zinc-50 disabled:opacity-50 sm:w-auto"
                >
                  View Materials
                </button>
              </div>
            </div>

            {publicNimError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {publicNimError}
              </div>
            )}
            {publicNimMessage && publicNimMessage.type === "success" && (
              <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
                {publicNimMessage.text}
              </div>
            )}
          </div>
        )}

        {isAuthenticated && (
          <div className="mb-8 flex gap-3">
            {!isRegistered ? (
              <button
                onClick={() => setModalOpen(true)}
                className="rounded-lg bg-brand-blue px-6 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
              >
                Register for this Workshop
              </button>
            ) : (
              <button
                onClick={loadMaterials}
                className="rounded-lg bg-brand-blue px-6 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
              >
                View Course Materials
              </button>
            )}
          </div>
        )}

        {materials && (
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm mb-8">
            <h2 className="section-heading text-lg mb-4">Course Materials</h2>

            {materials.verified ? (
              <div className="mb-4">
                <span className="verified-badge">✓ Verified Student Access Granted</span>
              </div>
            ) : (
              <div className="mb-4 text-sm text-zinc-600">
                Materials not available — registration not verified.
              </div>
            )}

            {materials.verified && materials.materials.length === 0 ? (
              <p className="text-sm text-zinc-500">No materials have been uploaded yet.</p>
            ) : (
              materials.verified && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {materials.materials.map((m) => (
                    <a
                      key={m.id}
                      href={m.file_url}
                      download
                      className="group flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 transition hover:border-brand-blue hover:bg-white"
                    >
                      <div className="flex-shrink-0 rounded-lg bg-white p-2">
                        <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V11.25m8.625-9.75h2.25c.621 0 1.125.504 1.125 1.125v2.25m-13.5 0h13.5m-13.5 0L9 15m3.75-6v6" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1 overflow-x-auto">
                        <span className="block whitespace-nowrap font-medium text-brand-navy group-hover:text-brand-blue" title={m.title}>
                          {m.title}
                        </span>
                        <span className="block text-xs text-zinc-500">
                          Uploaded {new Date(m.uploaded_at).toLocaleDateString("en-US")}
                        </span>
                      </div>
                      <span className="flex-shrink-0 text-xs text-zinc-400">Download</span>
                    </a>
                  ))}
                </div>
              )
            )}
          </section>
        )}

        {materialsError && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
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
    </main>
  );
}
