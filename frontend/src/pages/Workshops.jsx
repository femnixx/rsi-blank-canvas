import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchWorkshops, deleteWorkshop } from "../lib/api.js";
import WorkshopCard from "../components/WorkshopCard.jsx";
import WorkshopRegistrationModal from "../components/WorkshopRegistrationModal.jsx";

/**
 * Workshops page — public catalog of all workshops.
 * Authenticated students can register; admins can create/edit/delete.
 * Brand design: light neutral bg, navy headers, orange category pills,
 * blue Register/View Details CTA buttons.
 */
export default function Workshops() {
  const { isAuthenticated, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Registration modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  useEffect(() => {
    loadWorkshops();
  }, []);

  async function loadWorkshops() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchWorkshops();
      setWorkshops(data.workshops);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this workshop? All registrations and materials will be removed.")) return;
    setDeletingId(id);
    try {
      await deleteWorkshop(id, token);
      setWorkshops((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const openRegisterModal = (workshop) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setSelectedWorkshop(workshop);
    setModalOpen(true);
  };

  const closeRegisterModal = () => {
    setModalOpen(false);
    setSelectedWorkshop(null);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-brand-bg px-6">
        <p className="text-sm text-zinc-500">Checking authentication…</p>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-brand-bg px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Section header — Dark Navy with Orange/Coral category pill */}
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-brand-navy">Workshops</h1>
              <span className="category-pill">BCC Events</span>
            </div>
            <p className="section-subheading">Upcoming events organized by BCC</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate("/admin/create-workshop")}
              className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
            >
              + New Workshop
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {loading || workshops === null ? (
          <div className="py-12 text-center">
            <p className="text-sm text-zinc-500">Loading workshops…</p>
          </div>
        ) : workshops.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-zinc-500">No workshops available yet.</p>
            {isAdmin && (
              <button
                onClick={() => navigate("/admin/create-workshop")}
                className="mt-3 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
              >
                Create the first workshop
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workshops.map((w) => (
              <div key={w.id} className="relative group">
                <WorkshopCard
                  workshop={w}
                  onRegister={openRegisterModal}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {modalOpen && selectedWorkshop && (
        <WorkshopRegistrationModal
          isOpen={modalOpen}
          onClose={closeRegisterModal}
          workshop={selectedWorkshop}
          token={token}
          onRegistered={loadWorkshops}
        />
      )}
    </main>
  );
}
