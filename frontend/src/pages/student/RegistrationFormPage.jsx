import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { requestRegistrationPrefill, processRegistration } from "../../lib/api.js";

export default function RegistrationFormPage() {
  const { workshopId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [workshop, setWorkshop] = useState(null);
  const [profile, setProfile] = useState(null);
  const [locked, setLocked] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", study_program: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!workshopId || !user?.nim) return;
    async function load() {
      setLoading(true); setError("");
      try {
        const data = await requestRegistrationPrefill(workshopId, user.nim);
        setWorkshop(data.workshop || null);
        setProfile(data.profile || null);
        setLocked(!!data.locked);
        if (data.profile) {
          setForm({
            full_name: data.profile.full_name || "",
            email: data.profile.email || "",
            study_program: data.profile.study_program || "",
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workshopId, user?.nim]);

  const blocked = workshop && workshop.status !== "OPEN";

  function handleChange(field) {
    if (locked) return () => {};
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  function deterministicError(msg) {
    const upper = (msg || "").toUpperCase();
    if (upper.includes("DUPLICATE") || upper.includes("409")) return "DUPLICATE_REGISTRATION: You are already registered for this workshop.";
    if (upper.includes("QUOTA") || upper.includes("FULL")) return "QUOTA_FULL: Workshop quota is full.";
    if (upper.includes("INVALID NIM") || upper.includes("INVALID_NIM")) return "INVALID_NIM: Invalid student NIM.";
    if (upper.includes("SESSION NOT ONGOING") || upper.includes("SESSION_NOT_ONGOING")) return "SESSION_NOT_ONGOING: Registration session is not ongoing.";
    return msg;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setConfirmation(null);
    if (blocked) { setError("SESSION_NOT_ONGOING: Workshop is not open for registration."); return; }
    setSubmitting(true);
    try {
      await processRegistration(workshopId, user.nim, {
        fullName: form.full_name,
        email: form.email,
        studyProgram: form.study_program,
      });
      setConfirmation("UC-SP-11: Registration confirmed successfully.");
    } catch (err) {
      setError(deterministicError(err.message));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6 text-brand-muted">Loading registration form…</div>;
  if (!workshop) return <div className="p-6 text-brand-muted">Workshop not found.</div>;

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-heading">Workshop Registration</h1>
          <p className="section-subheading">{workshop.title}</p>
        </div>
        <Link to={`/workshops/${workshopId}`} className="btn-ghost">Back to Details</Link>
      </div>

      {blocked && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20" role="alert">
          Registration blocked — workshop status is not OPEN.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20" role="alert">
          {error}
        </div>
      )}

      {confirmation && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400 border border-emerald-500/20" role="status">
          {confirmation}
        </div>
      )}

      <div className="max-w-2xl">
        <div className="card-accent p-6">
          <div className="mb-4 grid gap-2 sm:grid-cols-3 text-sm text-brand-muted">
            <div>
              <span className="block text-white font-medium">Date</span>
              {workshop.event_date ? new Date(workshop.event_date).toLocaleDateString("en-US") : "TBD"}
            </div>
            <div>
              <span className="block text-white font-medium">Location</span>
              {workshop.location || "TBD"}
            </div>
            <div>
              <span className="block text-white font-medium">Status</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${workshop.status === "OPEN" ? "bg-brand-blue/20 text-brand-blue" : "bg-red-500/20 text-red-400"}`}>
                {workshop.status}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Student Identity</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {renderField("full_name", "Full Name")}
                {renderField("email", "Email")}
                {renderField("study_program", "Study Program")}
              </div>
              {locked && (
                <p className="mt-2 text-xs text-brand-muted">Identity fields are locked and pre-filled from your profile (Fig. 13).</p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || blocked}
              className="btn-primary disabled:opacity-50 w-full"
            >
              {submitting ? "Submitting…" : "Register for Workshop"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  function renderField(name, label) {
    const disabled = locked;
    return (
      <div key={name} className="flex flex-col gap-1">
        <label className="text-xs font-medium text-brand-muted">{label}</label>
        <input
          name={name}
          value={form[name] || ""}
          onChange={handleChange(name)}
          disabled={disabled}
          className="input-dark rounded-lg px-3 py-2 text-sm text-white placeholder-brand-muted/50 disabled:bg-zinc-800/50 disabled:text-zinc-400 disabled:cursor-not-allowed"
        />
      </div>
    );
  }
}
