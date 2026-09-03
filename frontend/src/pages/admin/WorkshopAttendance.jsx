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
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-brand-bg px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading attendance data…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-brand-bg px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-navy">Attendance Management</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {workshop?.title || `Workshop #${id}`} • Monitor, verify, and record participant attendance
            </p>
          </div>
          <button
            onClick={() => navigate("/workshops")}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 transition hover:border-brand-blue hover:text-brand-navy"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total Registered</p>
            <p className="mt-2 text-3xl font-bold text-brand-navy">{registrations.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Present Today</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{attendance.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Absent</p>
            <p className="mt-2 text-3xl font-bold text-zinc-700">{Math.max(0, registrations.length - attendance.length)}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("roster")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === "roster"
                  ? "bg-brand-navy text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-brand-blue"
              }`}
            >
              Roster & Check-in
            </button>
            <button
              onClick={() => setActiveTab("present")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === "present"
                  ? "bg-brand-navy text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-brand-blue"
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
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100 sm:w-64"
            />
          )}
        </div>

        {activeTab === "roster" && (
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-500">Student</th>
                    <th className="px-6 py-3 font-medium text-zinc-500">NIM</th>
                    <th className="px-6 py-3 font-medium text-zinc-500">Email</th>
                    <th className="px-6 py-3 font-medium text-zinc-500">Registered</th>
                    <th className="px-6 py-3 font-medium text-zinc-500">Status</th>
                    <th className="px-6 py-3 font-medium text-zinc-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                        No registrations found.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((r) => {
                      const isPresent = presentUserIds.has(r.user_id);
                      return (
                        <tr key={r.id} className="transition hover:bg-zinc-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={r.name} email={r.email} />
                              <span className="font-medium text-brand-navy">{r.name || r.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-600">{r.nim}</td>
                          <td className="px-6 py-4 text-zinc-600">{r.email}</td>
                          <td className="px-6 py-4 text-zinc-600">
                            {new Date(r.registration_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            {isPresent ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Present
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
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
                                className="text-xs font-medium text-red-600 hover:text-red-700"
                              >
                                Undo
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMarkAttendance(r.id)}
                                disabled={markingId === r.id}
                                className="rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-600 disabled:opacity-50"
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
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-500">Student</th>
                    <th className="px-6 py-3 font-medium text-zinc-500">NIM</th>
                    <th className="px-6 py-3 font-medium text-zinc-500">Checked In</th>
                    <th className="px-6 py-3 font-medium text-zinc-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                        No students marked present yet.
                      </td>
                    </tr>
                  ) : (
                    attendance.map((a) => (
                      <tr key={a.id} className="transition hover:bg-zinc-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={a.name} email={a.email} />
                            <span className="font-medium text-brand-navy">{a.name || a.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-600">{a.nim}</td>
                        <td className="px-6 py-4 text-zinc-600">
                          {new Date(a.checked_in_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRemoveAttendance(a.id)}
                            className="text-xs font-medium text-red-600 hover:text-red-700"
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
    </main>
  );
}
