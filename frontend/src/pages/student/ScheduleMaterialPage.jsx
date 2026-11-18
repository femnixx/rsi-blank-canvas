import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchMaterialsByNim } from "../../lib/api.js";

export default function ScheduleMaterialPage() {
  const { workshopId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ workshop: null, materials: [], verified: false });

  useEffect(() => {
    if (!workshopId || !user?.nim) return;
    async function load() {
      setLoading(true); setError("");
      try {
        const d = await fetchMaterialsByNim(workshopId, user.nim);
        setData({ workshop: d.workshop || d, materials: d.materials || [], verified: !!d.verified });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workshopId, user?.nim]);

  if (loading) return <div className="p-6 text-brand-muted">Loading schedule and materials…</div>;
  if (!data.workshop) return <div className="p-6 text-brand-muted">Workshop not found.</div>;

  const { workshop, materials, verified } = data;

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-heading">Schedule & Materials</h1>
          <p className="section-subheading">{workshop.title}</p>
        </div>
      </div>

      <div className="mb-6 card-accent p-4">
        <div className="text-sm font-semibold text-white mb-1">Workshop Schedule</div>
        <div className="text-sm text-brand-muted">
          <span className="mr-3">Date: {workshop.event_date ? new Date(workshop.event_date).toLocaleDateString("en-US") : "TBD"}</span>
          <span className="mr-3">Location: {workshop.location || "TBD"}</span>
          <span>Status: {workshop.status}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
          {error}
        </div>
      )}

      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-blue/20 px-3 py-1.5 text-xs font-medium text-brand-blue">
        <span className="h-2 w-2 rounded-full bg-brand-blue" />
        {verified ? "Verified: attendance verified — tier 2 materials unlocked." : "Registration unlocked — tier 1 materials only."}
      </div>

      <div className="rounded-2xl border border-brand-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-brand-muted">
              <th className="px-4 py-2 text-left">Material</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Tier</th>
              <th className="px-4 py-2 text-left">Access</th>
              <th className="px-4 py-2 text-left">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {materials.length === 0 ? (
              <tr><td className="px-4 py-4 text-center text-brand-muted col-span-5">No materials available.</td></tr>
            ) : (
              materials.map((m) => {
                const accessible = m.accessible !== false;
                const tierLabel = m.access_tier === "REGISTERED" ? "Registration Unlocked" : m.access_tier === "VERIFIED_ATTENDEE" ? "Attendance Verified" : m.access_tier;
                const canDownload = accessible && (m.access_tier === "REGISTERED" || (m.access_tier === "VERIFIED_ATTENDEE" && verified));
                return (
                  <tr key={m.id || m.title}>
                    <td className="px-4 py-2 text-white">{m.title}</td>
                    <td className="px-4 py-2 text-brand-muted">{m.asset_type || "-"}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${canDownload ? "bg-brand-blue/20 text-brand-blue" : "bg-zinc-500/20 text-zinc-400"}`}>
                        {tierLabel}
                      </span>
                    </td>
                    <td className="px-4 py-2">{canDownload ? <span className="text-emerald-400">Accessible</span> : <span className="text-zinc-400">Locked</span>}</td>
                    <td className="px-4 py-2 text-right">
                      {canDownload ? (
                        <a href={m.file || m.file_url} download className="text-brand-blue hover:underline text-xs">Download</a>
                      ) : (
                        <span className="text-xs text-zinc-400">FORBIDDEN_TIER</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
