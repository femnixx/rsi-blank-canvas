import { useState } from "react";
import { registerParticipant } from "../lib/api.js";

/**
 * WorkshopRegistrationModal — simple confirmation modal for workshop registration.
 * Since students register while authenticated, their NIM/email come from the JWT.
 * Handles 409 Conflict (already registered) and network errors.
 * @param {{ isOpen: boolean, onClose: () => void, workshop, token: string, onRegistered?: () => void }} props
 */
export default function WorkshopRegistrationModal({
  isOpen,
  onClose,
  workshop,
  token,
  onRegistered,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success" | "conflict" | "error", message: string }

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl sm:max-w-lg sm:p-6">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-base font-semibold text-brand-navy sm:text-lg">Confirm Registration</h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-zinc-600">
          Register for &ldquo;{workshop?.title}&rdquo;? This will enroll your account in this workshop.
        </p>

        {status && (
          <div
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              status.type === "success"
                ? "bg-green-50 text-green-800"
                : status.type === "conflict"
                ? "bg-orange-50 text-brand-orange"
                : "bg-red-50 text-red-700"
            }`}
            role="alert"
          >
            {status.message}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
          <button
            onClick={handleClose}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            {submitting ? "Registering…" : "Confirm & Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
