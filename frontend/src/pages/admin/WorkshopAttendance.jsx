import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  fetchWorkshopRegistrations,
  fetchWorkshopAttendance,
  markAttendance,
  deleteAttendance,
} from "../../lib/api.js";

function Avatar({ name, email }) {
  const initial = (name || email || "?").charAt(0).toUpperCase();
  const hue = (name || email || "").split("").reduce((a, b) => a + b.charCodeAt(0), 0) % 360;
  return (
    <div
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: `hsl(${hue}, 70%, 45%)` }}
      title={name || email}
    >
      {initial}
    </div>
  );
}

export default function WorkshopAttendance() {
  const { id } = useParams();
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [workshop, setWorkshop] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("roster");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    loadData();
  }, [id, isAdmin]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [regData, attData] = await Promise.all([
        fetchWorkshopRegistrations(id, token),
        fetchWorkshopAttendance(id, token),
      ]);
      setRegistrations(regData.registrations || []);
      setAttendance(attData.attendance || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAttendance(registrationId) {
    setMarkingId(registrationId);
    setError("");
    try {
      const result = await markAttendance(id, registrationId, token);
      setAttendance((prev) => [...prev, result.attendance]);
    } catch (err) {
      setError(err.message);
    } finally {
      setMarkingId(null);
    }
  }

  async function handleRemoveAttendance(attendanceId) {
    if (!confirm("Remove this attendance record?")) return;
    try {
      await deleteAttendance(id, attendanceId, token);
      setAttendance((prev) => prev.filter((a) => a.id !== attendanceId));
    } catch (err) {
      setError(err.message);
    }
  }

  const presentUserIds = new Set(attendance.map((a) => a.user_id));
  const filteredRegistrations = registrations.filter((r) => {
    const term = search.toLowerCase();
    return (
      !term ||
      (r.email && r.email.toLowerCase().includes(term)) ||
      (r.nim && r.nim.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
          <p className="text-sm text-brand-muted">Loading attendance data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="border-b border-brand-border bg-brand-glass backdrop-blur-glass">
        <div className="px-6 py-3">
          <span className="text-sm text-brand-muted">BCC Integrated Information System</span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="section-heading">Attendance Management</h1>
            <p className="section-subheading mt-1">
              {workshop?.title || `Workshop #${id}`} • Monitor, verify, and record participant attendance
            </p>
          </div>
          <button
            onClick={() => navigate("/workshops")}
            className="btn-ghost"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400 shadow-sm">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Registered", value: registrations.length, color: "text-white", bg: "bg-brand-blue/20" },
            { label: "Present Today", value: attendance.length, color: "text-emerald-400", bg: "bg-emerald-500/20" },
            { label: "Absent", value: Math.max(0, registrations.length - attendance.length), color: "text-orange-400", bg: "bg-orange-500/20" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card !p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">{stat.label}</p>
              <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("roster")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === "roster"
                  ? "bg-brand-blue text-white"
                  : "border border-brand-border bg-white/5 text-brand-muted hover:bg-white/10"
              }`}
            >
              Roster & Check-in
            </button>
            <button
              onClick={() => setActiveTab("present")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === "present"
                  ? "bg-brand-blue text-white"
                  : "border border-brand-border bg-white/5 text-brand-muted hover:bg-white/10"
              }`}
            >
              Present Students ({attendance.length})
            </button>
          </div>
          {activeTab === "roster" && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by NIM or email…"
              className="input-dark sm:w-64"
            />
          )}
        </div>

        {activeTab === "roster" && (
          <div className="rounded-2xl border border-brand-border bg-brand-card backdrop-blur-glass shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="px-6 py-3 font-medium text-brand-muted">Student</th>
                    <th className="px-6 py-3 font-medium text-brand-muted">NIM</th>
                    <th className="px-6 py-3 font-medium text-brand-muted">Email</th>
                    <th className="px-6 py-3 font-medium text-brand-muted">Registered</th>
                    <th className="px-6 py-3 font-medium text-brand-muted">Status</th>
                    <th className="px-6 py-3 font-medium text-brand-muted text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-brand-muted">
                        No registrations found.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((r) => {
                      const isPresent = presentUserIds.has(r.user_id);
                      return (
                        <tr key={r.id} className="transition hover:bg-white/5">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={r.name} email={r.email} />
                              <span className="font-medium text-white">{r.name || r.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-brand-muted font-mono text-xs">{r.nim}</td>
                          <td className="px-6 py-4 text-brand-muted text-xs">{r.email}</td>
                          <td className="px-6 py-4 text-brand-muted text-xs">
                            {new Date(r.registration_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            {isPresent ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Present
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/20 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                                Absent
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isPresent ? (
                              <button
                                onClick={() => {
                                  const att = attendance.find((a) => a.user_id === r.user_id);
                                  if (att) handleRemoveAttendance(att.id);
                                }}
                                className="text-xs font-medium text-red-400 hover:text-red-300"
                              >
                                Undo
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMarkAttendance(r.id)}
                                disabled={markingId === r.id}
                                className="btn-primary !py-1.5 !text-xs disabled:opacity-50"
                              >
                                {markingId === r.id ? "Marking…" : "Mark Present"}
                              </button>
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
        )}

        {activeTab === "present" && (
          <div className="rounded-2xl border border-brand-border bg-brand-card backdrop-blur-glass shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="px-6 py-3 font-medium text-brand-muted">Student</th>
                    <th className="px-6 py-3 font-medium text-brand-muted">NIM</th>
                    <th className="px-6 py-3 font-medium text-brand-muted">Checked In</th>
                    <th className="px-6 py-3 font-medium text-brand-muted text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-brand-muted">
                        No students marked present yet.
                      </td>
                    </tr>
                  ) : (
                    attendance.map((a) => (
                      <tr key={a.id} className="transition hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={a.name} email={a.email} />
                            <span className="font-medium text-white">{a.name || a.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-brand-muted font-mono text-xs">{a.nim}</td>
                        <td className="px-6 py-4 text-brand-muted text-xs">
                          {new Date(a.checked_in_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRemoveAttendance(a.id)}
                            className="text-xs font-medium text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
