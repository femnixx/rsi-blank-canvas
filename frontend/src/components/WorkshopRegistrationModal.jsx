import { useState } from "react";
import { registerParticipant } from "../lib/api.js";

export default function WorkshopRegistrationModal({
  isOpen,
  onClose,
  workshop,
  token,
  onRegistered,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const handleClose = () => {
    setStatus(null);
    onClose();
  };

  const handleSubmit = async () => {
    setStatus(null);
    setSubmitting(true);
    try {
      await registerParticipant(workshop.id, token);
      setStatus({ type: "success", message: `Successfully registered for "${workshop.title}"!` });
      if (onRegistered) onRegistered();
    } catch (err) {
      if (err.message.includes("409") || err.message.includes("already registered")) {
        setStatus({
          type: "conflict",
          message: `You are already registered for "${workshop.title}".`,
        });
        if (onRegistered) onRegistered();
      } else {
        setStatus({ type: "error", message: err.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card backdrop-blur-glass p-5 shadow-xl sm:max-w-lg sm:p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg">Confirm Registration</h2>
            <p className="text-xs text-brand-muted mt-0.5">Enroll your account in this workshop cohort</p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-brand-muted transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="glass-card !p-4 mb-4">
          <p className="text-sm text-brand-muted">
            Register for <span className="text-white font-medium">"{workshop?.title}"</span>? This will enroll your account in this workshop cohort.
          </p>
        </div>

        {status && (
          <div
            className={`mb-4 rounded-xl px-3 py-2 text-sm ${
              status.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : status.type === "conflict"
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
            role="alert"
          >
            {status.message}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
          <button
            onClick={handleClose}
            className="w-full btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full btn-primary disabled:opacity-50"
          >
            {submitting ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Registering…</>
            ) : (
              "Confirm & Register"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
