import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { markAttendance, fetchWorkshop } from "../../lib/api.js";

export default function AttendanceFormPage() {
  const { workshopId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [workshop, setWorkshop] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!workshopId) return;
    async function load() {
      setLoading(true); setError("");
      try {
        const data = await fetchWorkshop(workshopId);
        setWorkshop(data.workshop || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workshopId]);

  const ongoing = workshop && workshop.status === "ONGOING";

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setStatus("");
    if (!ongoing) { setError("SESSION_NOT_ONGOING: Workshop is not currently ongoing."); return; }
    if (!user?.nim) { setError("INVALID_NIM: No NIM available."); return; }
    setSubmitting(true);
    try {
      await markAttendance(workshopId, user.nim);
      setStatus("Attendance recorded — status PRESENT (isVerified: false)");
    } catch (err) {
      const upper = (err.message || "").toUpperCase();
      if (upper.includes("ALREADY_RECORDED") || upper.includes("ALREADY")) {
        setStatus("Attendance already recorded (idempotent — no duplicate created).");
      } else if (upper.includes("NOT_REGISTERED")) {
        setError("NOT_REGISTERED: You are not registered for this workshop.");
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6 text-brand-muted">Loading attendance form…</div>;
  if (!workshop) return <div className="p-6 text-brand-muted">Workshop not found.</div>;

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-heading">Mark Attendance</h1>
          <p className="section-subheading">{workshop.title}</p>
        </div>
      </div>

      {!ongoing && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20" role="alert">
          SESSION_NOT_ONGOING: This workshop is not currently ongoing. Attendance cannot be recorded.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
          {error}
        </div>
      )}
      {status && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400 border border-emerald-500/20" role="status">
          {status}
        </div>
      )}

      <div className="max-w-lg card-accent p-6">
        <div className="mb-4">
          <label className="text-xs font-medium text-brand-muted block mb-1">NIM (locked)</label>
          <input
            value={user?.nim || ""}
            readOnly
            className="input-dark rounded-lg px-3 py-2 text-sm text-white bg-zinc-800/50"
          />
        </div>
        <div className="mb-4 text-sm text-brand-muted">
          <span className="block">Workshop: {workshop.title}</span>
          <span className="block">Date: {workshop.event_date ? new Date(workshop.event_date).toLocaleDateString("en-US") : "TBD"}</span>
          <span className="block">Location: {workshop.location || "TBD"}</span>
          <span className={`block mt-1 ${ongoing ? "text-emerald-400" : "text-red-400"}`}>Session: {ongoing ? "ONGOING" : workshop.status}</span>
        </div>
        <button onClick={handleSubmit} disabled={submitting || !ongoing || !user?.nim} className="btn-primary disabled:opacity-50 w-full">
          {submitting ? "Recording…" : "Record Attendance"}
        </button>
        <p className="mt-3 text-xs text-brand-muted">Result: status PRESENT, isVerified false (US-SP-06 / UC-SP-04).</p>
      </div>
    </div>
  );
}
