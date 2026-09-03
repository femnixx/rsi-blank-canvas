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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl sm:max-w-md">
        <h2 className="text-lg font-semibold text-brand-navy">Confirm Registration</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Register for "{workshop?.title}"? This will enroll your account ({/* NIM comes from your profile */})
          in this workshop.
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

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            {submitting ? "Registering…" : "Confirm & Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
