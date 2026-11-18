import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  fetchWorkshopAttendance,
  updateAttendanceEntry,
  finalizeWorkshopAttendance,
  cancelAttendanceFinalization,
} from "../../lib/api.js";

export default function AttendanceAdminPanel() {
  const { workshopId } = useParams();
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ roster: [], present: [], matched: [], unmatched: [], workshop: null, finalized: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("all");
  const [finalized, setFinalized] = useState(false);

  useEffect(() => {
    if (!isAdmin) return navigate("/", { replace: true });
    load();
  }, [workshopId, isAdmin]);

  async function load() {
    setLoading(true); setError("");
    try {
      const d = await fetchWorkshopAttendance(workshopId, token);
      setData({ ...d, finalized: !!d.finalized });
      setFinalized(!!d.finalized);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // NFR-09: real-time polling (<2s)
  useEffect(() => {
    if (!isAdmin) return;
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [workshopId, isAdmin, token]);

  async function act(fn) {
    setBusy(true); setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function override(attendanceId, action) {
    await act(() => updateAttendanceEntry(attendanceId, action, token));
  }

  async function handleFinalize() {
    setError("");
    try {
      await act(() => finalizeWorkshopAttendance(workshopId, token));
      setFinalized(true);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCancelFinalize() {
    setError("");
    try {
      await act(() => cancelAttendanceFinalization(workshopId, token));
      setFinalized(false);
    } catch (e) {
      setError(e.message);
    }
  }

  const filteredRoster = (data.roster || []).filter((r) => {
    const p = (data.present || []).find((x) => x.nim === r.nim);
    if (tab === "matched") return !!p;
    if (tab === "pending") return !p;
    return true;
  });

  if (loading) return <div className="p-6 text-brand-muted">Loading attendance panel…</div>;

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-heading">Attendance Admin Panel</h1>
          <p className="section-subheading">{data.workshop?.title} — live check-in &amp; finalize (NFR-09 under 2s)</p>
        </div>
        <button onClick={() => navigate("/workshops")} className="btn-ghost">Back</button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
          {error}
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="glass-card !p-4"><div className="text-xs text-brand-muted">Roster</div><div className="text-2xl text-white">{data.roster?.length || 0}</div></div>
        <div className="glass-card !p-4"><div className="text-xs text-brand-muted">Present</div><div className="text-2xl text-emerald-400">{data.present?.length || 0}</div></div>
        <div className="glass-card !p-4"><div className="text-xs text-brand-muted">Matched</div><div className="text-2xl text-brand-blue">{data.matched?.length || 0}</div></div>
      </div>

      {finalized && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400 border border-emerald-500/20">
          FINALIZED — attendance list locked. Workshop set COMPLETED.
        </div>
      )}

      <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-2">
        <div className="flex-1">
          <div className="text-xs text-brand-muted mb-1">Filter roster</div>
          <div className="flex gap-1">
            <button onClick={() => setTab("all")} className={`px-3 py-1 rounded text-xs font-medium transition ${tab === "all" ? "bg-brand-blue text-white" : "bg-zinc-800 text-zinc-300"}`}>All</button>
            <button onClick={() => setTab("matched")} className={`px-3 py-1 rounded text-xs font-medium transition ${tab === "matched" ? "bg-brand-blue text-white" : "bg-zinc-800 text-zinc-300"}`}>Matched</button>
            <button onClick={() => setTab("pending")} className={`px-3 py-1 rounded text-xs font-medium transition ${tab === "pending" ? "bg-brand-blue text-white" : "bg-zinc-800 text-zinc-300"}`}>Pending</button>
          </div>
        </div>
        {!finalized && (
          <div className="flex gap-2">
            <button disabled={busy} onClick={handleCancelFinalize} className="btn-ghost disabled:opacity-50">Cancel Finalization</button>
            <button disabled={busy || finalized} onClick={handleFinalize} className="btn-primary disabled:opacity-50">Lock & Finalize Attendance List</button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Live Check-In Feed (Present)</div>
        <div className="rounded-xl border border-brand-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-brand-muted">
                <th className="px-4 py-2 text-left">NIM</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Checked In At</th>
                <th className="px-4 py-2 text-left">Verified</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {(data.present || []).length === 0 ? (
                <tr><td className="px-4 py-4 text-center text-brand-muted col-span-5">No check-ins yet.</td></tr>
              ) : (
                (data.present || []).map((p) => (
                  <tr key={p.attendance_id || p.nim}>
                    <td className="px-4 py-2 font-mono text-xs text-brand-muted">{p.nim}</td>
                    <td className="px-4 py-2 text-white">{p.fullName}</td>
                    <td className="px-4 py-2 text-brand-muted">{p.checkedInAt ? new Date(p.checkedInAt).toLocaleString("en-US") : "-"}</td>
                    <td className="px-4 py-2">{p.isVerified ? <span className="text-emerald-400">yes</span> : <span className="text-zinc-400">no</span>}</td>
                    <td className="px-4 py-2 text-right">
                      {!finalized && (
                        <>
                          <button onClick={() => override(p.attendance_id, "correct")} className="text-brand-blue text-xs hover:underline mr-2">Correct</button>
                          <button onClick={() => override(p.attendance_id, "remove")} className="text-red-400 text-xs hover:underline">Remove</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs font-semibold text-white uppercase tracking-wider mb-2 px-4 py-2 border-b border-brand-border bg-white/5">
          Roster — {tab} ({filteredRoster.length})
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-brand-muted">
              <th className="px-4 py-2 text-left">NIM</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {filteredRoster.length === 0 ? (
              <tr><td className="px-4 py-4 text-center text-brand-muted col-span-4">No roster entries.</td></tr>
            ) : (
              filteredRoster.map((r) => {
                const p = (data.present || []).find((x) => x.nim === r.nim);
                const matched = !!p;
                return (
                  <tr key={r.registration_id || r.nim} className={matched ? "" : "bg-orange-500/5"}>
                    <td className="px-4 py-2 font-mono text-xs text-brand-muted">{r.nim}</td>
                    <td className="px-4 py-2 text-white">{r.fullName}</td>
                    <td className="px-4 py-2 text-center">{matched ? <span className="text-emerald-400">present</span> : <span className="text-zinc-400">absent</span>}</td>
                    <td className="px-4 py-2 text-right">
                      {!finalized && matched && (
                        <>
                          <button onClick={() => override(p.attendance_id, "correct")} className="text-brand-blue text-xs hover:underline mr-2">Correct</button>
                          <button onClick={() => override(p.attendance_id, "remove")} className="text-red-400 text-xs hover:underline">Remove</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <div className="text-xs text-brand-muted mb-1">Unmatched / Safeguard Entries</div>
        <div className="rounded-xl border border-brand-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-brand-muted">
                <th className="px-4 py-2 text-left">NIM</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Check-In At</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {(data.unmatched || []).length === 0 ? (
                <tr><td className="px-4 py-4 text-center text-brand-muted col-span-4">No unmatched entries.</td></tr>
              ) : (
                (data.unmatched || []).map((p) => (
                  <tr key={p.attendance_id || p.nim} className="bg-orange-500/5">
                    <td className="px-4 py-2 font-mono text-xs text-orange-300">{p.nim}</td>
                    <td className="px-4 py-2 text-white">{p.fullName}</td>
                    <td className="px-4 py-2 text-brand-muted">{p.checkedInAt ? new Date(p.checkedInAt).toLocaleString("en-US") : "-"}</td>
                    <td className="px-4 py-2 text-right">
                      {!finalized && (
                        <button onClick={() => override(p.attendance_id, "remove")} className="text-red-400 text-xs hover:underline">Remove</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
