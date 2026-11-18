import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { requestHistory } from "../../lib/api.js";

export default function RegistrationHistoryPage() {
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
        const data = await requestHistory(user.nim);
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

  if (loading) return <div className="p-6 text-brand-muted">Loading registration history…</div>;

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="section-heading">Registration History</h1>
        <p className="section-subheading">NIM: {user?.nim}</p>
      </div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
          {error}
        </div>
      )}
      {!history || history.length === 0 ? (
        <div className="py-8 text-center"><p className="text-sm text-brand-muted">No registration history found.</p></div>
      ) : (
        <div className="rounded-2xl border border-brand-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-brand-muted">
                <th className="px-4 py-2 text-left">Workshop</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Registered At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {history.map((r) => (
                <tr key={r.registration_id || r.id}>
                  <td className="px-4 py-2 text-white">{r.workshop_title || r.title}</td>
                  <td className="px-4 py-2 text-brand-muted">{r.event_date ? new Date(r.event_date).toLocaleDateString("en-US") : "TBD"}</td>
                  <td className="px-4 py-2 text-brand-muted">{r.location || "TBD"}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "CONFIRMED" ? "bg-brand-blue/20 text-brand-blue" : "bg-zinc-500/20 text-zinc-400"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-brand-muted">{r.registered_at ? new Date(r.registered_at).toLocaleString("en-US") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
