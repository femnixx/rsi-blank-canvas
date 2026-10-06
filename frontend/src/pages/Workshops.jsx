import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchWorkshops, deleteWorkshop } from "../lib/api.js";
import WorkshopCard from "../components/WorkshopCard.jsx";
import WorkshopRegistrationModal from "../components/WorkshopRegistrationModal.jsx";

export default function Workshops() {
  const { isAuthenticated, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

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
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-6">
        <p className="text-sm text-brand-muted">Checking authentication…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="border-b border-brand-border bg-brand-glass backdrop-blur-glass">
        <div className="px-6 py-3">
          <span className="text-sm text-brand-muted">BCC Integrated Information System</span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="section-heading">Workshops</h1>
              <span className="category-pill">BCC Events</span>
            </div>
            <p className="section-subheading mt-1">Upcoming events organized by BCC</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate("/admin/create-workshop")}
              className="btn-primary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              + New Workshop
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20" role="alert">
            {error}
          </div>
        )}

        {loading || workshops === null ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
            <p className="text-sm text-brand-muted">Loading workshops…</p>
          </div>
        ) : workshops.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-brand-muted">No workshops available yet.</p>
            {isAdmin && (
              <button
                onClick={() => navigate("/admin/create-workshop")}
                className="mt-3 btn-primary"
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

      {modalOpen && selectedWorkshop && (
        <WorkshopRegistrationModal
          isOpen={modalOpen}
          onClose={closeRegisterModal}
          workshop={selectedWorkshop}
          token={token}
          onRegistered={loadWorkshops}
        />
      )}
    </div>
  );
}
