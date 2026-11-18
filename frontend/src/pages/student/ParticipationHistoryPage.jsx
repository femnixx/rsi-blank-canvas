import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchParticipationHistory } from "../../lib/api.js";

export default function ParticipationHistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user?.nim) return;
    async function load() {
      setLoading(true); setError("");
      try {
        const data = await fetchParticipationHistory(user.nim);
        setProfile(data.profile || null);
        setHistory(data.history || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.nim]);

  if (loading) return <div className="p-6 text-brand-muted">Loading participation history…</div>;

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="section-heading">Participation History</h1>
        <p className="section-subheading">Derived attendance view per registered workshop (US-SP-07 / UC-SP-13)</p>
      </div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
          {error}
        </div>
      )}
      {!history || history.length === 0 ? (
        <div className="py-8 text-center"><p className="text-sm text-brand-muted">No participation records found.</p></div>
      ) : (
        <div className="rounded-2xl border border-brand-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-brand-muted">
                <th className="px-4 py-2 text-left">Workshop</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Checked In</th>
                <th className="px-4 py-2 text-left">Verified</th>
                <th className="px-4 py-2 text-left">Verified By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {history.map((h) => {
                const reg = h.registration || {};
                const att = h.attendance || {};
                return (
                  <tr key={reg.registration_id || reg.id}>
                    <td className="px-4 py-2 text-white">{reg.workshop_title || reg.title || "Workshop"}</td>
                    <td className="px-4 py-2 text-brand-muted">{reg.event_date ? new Date(reg.event_date).toLocaleDateString("en-US") : "TBD"}</td>
                    <td className="px-4 py-2">{att.checked_in ? <span className="text-emerald-400">Yes</span> : <span className="text-zinc-400">No</span>}</td>
                    <td className="px-4 py-2">{att.isVerified ? <span className="text-emerald-400">Yes</span> : <span className="text-zinc-400">No</span>}</td>
                    <td className="px-4 py-2 text-brand-muted">{att.verifiedBy || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
