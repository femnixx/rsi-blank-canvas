import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  fetchWorkshop,
  registerParticipant,
  fetchMaterials,
} from "../lib/api.js";
import WorkshopRegistrationModal from "../components/WorkshopRegistrationModal.jsx";

/**
 * WorkshopDetail page — public view of a single workshop.
 * Features:
 *   - Dark Navy summary banner
 *   - Register button (authenticated students only, opens confirmation modal)
 *   - View Course Materials button (registered students only)
 *   - Materials section with "Verified Student Access Granted" badge
 *   - Admin edit/delete controls
 */
export default function WorkshopDetail() {
  const { id } = useParams();
  const { token, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationChecking, setRegistrationChecking] = useState(false);

  // Materials
  const [materials, setMaterials] = useState(null);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState("");

  // Registration modal
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadWorkshop();
  }, [id]);

  // Check registration status when auth state changes
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
      if (err.message.includes("403") || err.message.includes("not a registered")) {
        setIsRegistered(false);
      } else {
        setIsRegistered(false);
      }
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
        {/* Back button */}
        <div className="mb-4">
          <button
            onClick={() => navigate("/workshops")}
            className="text-sm text-zinc-600 hover:text-brand-navy"
          >
            ← Back to workshops
          </button>
        </div>

        {/* Dark Navy banner */}
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
              <button
                onClick={() => navigate(`/admin/create-workshop/${workshop.id}/edit`)}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-brand-navy transition hover:bg-zinc-100"
              >
                Edit Workshop
              </button>
            )}
          </div>
          {workshop.description && (
            <p className="mt-3 text-sm text-zinc-200">{workshop.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="mb-8 flex gap-3">
          {isAuthenticated && !isRegistered ? (
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-lg bg-brand-blue px-6 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
            >
              Register for this Workshop
            </button>
          ) : isAuthenticated && isRegistered ? (
            <button
              onClick={loadMaterials}
              className="rounded-lg bg-brand-blue px-6 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
            >
              View Course Materials
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="rounded-lg bg-brand-blue px-6 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
            >
              Login to Register
            </button>
          )}
        </div>

        {/* Materials Section */}
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
          </section>
        )}

        {materialsError && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {materialsError}
          </div>
        )}

        {/* Registration Modal */}
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
