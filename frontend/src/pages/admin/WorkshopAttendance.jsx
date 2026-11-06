import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchWorkshopAttendance, markAttendance, updateAttendanceEntry, finalizeWorkshopAttendance, cancelAttendanceFinalization } from "../../lib/api.js";

export default function WorkshopAttendance() {
  const { id } = useParams();
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ roster: [], present: [], matched: [], unmatched: [], workshop: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nim, setNim] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!isAdmin) return navigate("/", { replace: true }); load(); }, [id, isAdmin]);
  async function load() {
    setLoading(true); setError("");
    try { setData(await fetchWorkshopAttendance(id, token)); } catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  // NFR-09: polling refresh (SSE endpoint also available) [PROPOSED transport]
  useEffect(() => { if (!isAdmin) return; const t = setInterval(load, 4000); return () => clearInterval(t); }, [id, isAdmin, token]);

  const presentByNim = new Set((data.present || []).map(p => p.nim));

  async function act(fn) { setBusy(true); setError(""); try { await fn(); await load(); } catch(e){ setError(e.message); } finally { setBusy(false); } }

  if (loading) return <div className="p-6 text-brand-muted">Loading…</div>;
  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-heading">Attendance Admin Panel (UC-SP-07/08/09)</h1>
          <p className="section-subheading">{data.workshop?.title} — real-time roster verification, finalize (BR-6 atomic)</p>
        </div>
        <button onClick={() => navigate("/workshops")} className="btn-ghost">Back</button>
      </div>
      {error && <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="glass-card !p-4"><div className="text-xs text-brand-muted">Roster</div><div className="text-2xl text-white">{data.roster?.length||0}</div></div>
        <div className="glass-card !p-4"><div className="text-xs text-brand-muted">Matched present</div><div className="text-2xl text-emerald-400">{data.matched?.length||0}</div></div>
        <div className="glass-card !p-4"><div className="text-xs text-brand-muted">Unmatched (safeguard)</div><div className="text-2xl text-orange-400">{data.unmatched?.length||0}</div></div>
      </div>
      <div className="mb-4 flex gap-2">
        <input value={nim} onChange={e=>setNim(e.target.value)} placeholder="NIM check-in (ONGOING workshop)" className="input-dark max-w-xs" />
        <button disabled={busy||!nim} className="btn-primary disabled:opacity-50" onClick={()=>act(async()=>{ await markAttendance(id, nim, token); setNim(""); })}>Record Attendance</button>
        <button disabled={busy} className="btn-primary" onClick={()=>act(()=>finalizeWorkshopAttendance(id, token))}>Lock & Finalize (BR-6)</button>
        <button disabled={busy} className="btn-ghost" onClick={()=>act(()=>cancelAttendanceFinalization(id, token))}>Cancel (BR-7)</button>
      </div>
      <div className="rounded-2xl border border-brand-border overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="border-b border-brand-border text-brand-muted"><th className="px-4 py-2 text-left">NIM</th><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Verified</th><th className="px-4 py-2 text-right">Action</th></tr></thead>
        <tbody className="divide-y divide-brand-border">
          {(data.roster||[]).map(r=>{
            const p = (data.present||[]).find(x=>x.nim===r.nim);
            return <tr key={r.registration_id}><td className="px-4 py-2 font-mono text-xs text-brand-muted">{r.nim}</td><td className="px-4 py-2 text-white">{r.fullName}</td><td className="px-4 py-2 text-center">{p ? <span className="text-emerald-400">present</span> : <span className="text-zinc-400">absent</span>}</td><td className="px-4 py-2 text-center">{p ? (p.isVerified?"yes":"no") : "-"}</td><td className="px-4 py-2 text-right">{p && <button className="text-red-400 text-xs" onClick={()=>act(()=>updateAttendanceEntry(p.attendance_id,"remove",token))}>Remove</button>}</td></tr>;
          })}
          {(data.unmatched||[]).map(p=>(
            <tr key={`u-${p.attendance_id}`} className="bg-orange-500/5"><td className="px-4 py-2 font-mono text-xs text-orange-300">{p.nim}</td><td className="px-4 py-2 text-white">{p.fullName}</td><td className="px-4 py-2 text-center text-orange-400">unmatched</td><td className="px-4 py-2 text-center">{p.isVerified?"yes":"no"}</td><td className="px-4 py-2 text-right"><button className="text-red-400 text-xs" onClick={()=>act(()=>updateAttendanceEntry(p.attendance_id,"remove",token))}>Remove</button></td></tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}