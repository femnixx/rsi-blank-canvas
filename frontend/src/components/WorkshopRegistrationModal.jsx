import { useEffect, useState } from "react";
import { processRegistration, requestRegistrationPrefill } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function WorkshopRegistrationModal({
  isOpen,
  onClose,
  workshop,
  token,
  onRegistered,
}) {
  const { user } = useAuth();
  const [nim, setNim] = useState("");
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!isOpen || !workshop) return;
    const n = user?.nim || nim;
    if (n) setNim(n);
    requestRegistrationPrefill(workshop.workshop_id || workshop.id, n || "")
      .then((d) => { setProfile(d.profile); setHistory(d.history || []); })
      .catch(() => {});
  }, [isOpen, workshop, user?.nim]);

  const handleClose = () => { setStatus(null); onClose(); };

  const handleSubmit = async () => {
    setStatus(null);
    setSubmitting(true);
    try {
      const res = await processRegistration(workshop.workshop_id || workshop.id, nim);
      setStatus({ type: "success", message: res.message || "Registration confirmed" });
      if (onRegistered) onRegistered();
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("DUPLICATE")) setStatus({ type: "conflict", code: "DUPLICATE", message: "You are already registered for this workshop (DUPLICATE)." });
      else if (msg.includes("INVALID_NIM")) setStatus({ type: "error", code: "INVALID_NIM", message: "Invalid NIM (INVALID_NIM)." });
      else setStatus({ type: "error", message: msg });
      if (onRegistered) onRegistered();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card backdrop-blur-glass p-5 shadow-xl sm:max-w-lg sm:p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg">Workshop Registration</h2>
            <p className="text-xs text-brand-muted mt-0.5">NIM validated, duplicates blocked (BR-2/BR-3)</p>
          </div>
          <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-muted hover:bg-white/10" aria-label="Close">✕</button>
        </div>

        <div className="glass-card !p-4 mb-4 space-y-2">
          <label className="block text-xs text-brand-muted">NIM (identity)</label>
          <input value={nim} onChange={(e)=>setNim(e.target.value)} readOnly={!!profile} className="w-full rounded-lg border border-brand-border bg-white/5 px-3 py-2 text-sm text-white" />
          {profile && (
            <div className="text-xs text-brand-muted">
              <div>Full name (locked): {profile.fullName}</div>
              <div>Email (locked): {profile.email}</div>
              <div>Study program (locked): {profile.studyProgram}</div>
            </div>
          )}
          <div className="text-xs text-brand-muted">Registration history: {history.length} record(s)</div>
        </div>

        {status && (
          <div className={`mb-4 rounded-xl px-3 py-2 text-sm ${status.type === "success" ? "bg-emerald-500/10 text-emerald-400" : status.type === "conflict" ? "bg-orange-500/10 text-orange-400" : "bg-red-500/10 text-red-400"}`} role="alert">
            {status.message}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
          <button onClick={handleClose} className="w-full btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !nim} className="w-full btn-primary disabled:opacity-50">
            {submitting ? "Registering…" : "Confirm & Register"}
          </button>
        </div>
      </div>
    </div>
  );
}