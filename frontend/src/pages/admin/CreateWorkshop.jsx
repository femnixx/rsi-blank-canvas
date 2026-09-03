import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchWorkshop, createWorkshop, updateWorkshop } from "../../lib/api.js";

/**
 * Admin CreateWorkshop page — create or edit a workshop.
 * Restricted to admin role (via AdminRoute in App.jsx).
 * Layout: light neutral background, navy header card, blue CTA button.
 */
export default function CreateWorkshop() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    speaker_name: "",
    event_date: "",
    location: "",
  });
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      loadWorkshop();
    }

    async function loadWorkshop() {
      try {
        const data = await fetchWorkshop(id);
        const w = data.workshop;
        setFormData({
          title: w.title,
          description: w.description || "",
          speaker_name: w.speaker_name || "",
          event_date: w.event_date ? w.event_date.slice(0, 16) : "",
          location: w.location || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.event_date) {
      setError("Title and event date are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateWorkshop(id, formData, token);
      } else {
        await createWorkshop(formData, token);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-brand-bg px-6">
        <p className="text-sm text-zinc-500">Loading workshop…</p>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-brand-bg px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-brand-navy">
            {isEdit ? "Edit Workshop" : "Create New Workshop Session"}
          </h1>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-zinc-600 hover:text-brand-navy"
          >
            ← Back
          </button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-brand-navy-gradient p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Session" : "New Workshop Session"}
          </h2>
          <p className="text-sm text-zinc-300">
            {isEdit ? "Update workshop details" : "Fill in the workshop details below to publish"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium text-zinc-700">
            Workshop Title *
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Introduction to React"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-zinc-700">
            Description
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What will participants learn?"
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-zinc-700">
            Speaker Name
            <input
              type="text"
              name="speaker_name"
              value={formData.speaker_name}
              onChange={handleChange}
              placeholder="e.g. Dr. Jane Smith"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-zinc-700">
            Date & Time *
            <input
              type="datetime-local"
              name="event_date"
              required
              value={formData.event_date}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-zinc-700">
            Location
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Room 203, Main Building"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            {submitting ? (isEdit ? "Saving…" : "Publishing…") : isEdit ? "Save Changes" : "Publish Workshop"}
          </button>
        </form>
      </div>
    </main>
  );
}
