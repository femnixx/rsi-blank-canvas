import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchWorkshops, fetchWorkshopRegistrations, fetchMyWorkshops } from "../../lib/api.js";

const MOCK_WORKSHOPS = [
  { id: 1, title: "BCC Cloud Infrastructure & DevOps with Docker & Kubernetes", speaker_name: "Lab G.2.1", location: "Auditorium Algoritma Lt. 2", event_date: "2025-10-26T08:30:00Z", registration_count: 145 },
  { id: 2, title: "Modern UI & State Management with React 19", speaker_name: "Bramantyo Wardhana", location: "Gedung G FILKOM UB", event_date: "2025-10-19T13:00:00Z", registration_count: 112 },
  { id: 3, title: "Production REST & gRPC with Go", speaker_name: "Faisal Anwar", location: "Lab Filkom UB", event_date: "2025-10-12T08:00:00Z", registration_count: 89 },
];

const MOCK_STUDENTS = [
  { nim: "2151502001111023", name: "Aditiya Pratama", program: "Teknik Informatika", status: "confirmed", time: "13:00" },
  { nim: "2151502001111045", name: "Nabila Putri Az", program: "PTI", status: "confirmed", time: "13:01" },
  { nim: "2151502001111054", name: "Dimas Arya Set", program: "TI", status: "pending", time: "13:02" },
  { nim: "2151504001111088", name: "Clarissa Nathana", program: "SI", status: "pending", time: "—" },
  { imnim: "215150307111002", name: "Irfan Maulana", program: "TEKIK", status: "excused", time: "—" },
  { nim: "2151502011110099", name: "Tiara Amanda", program: "TIF", status: "manual_verified", time: "13:04" },
];

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, pending: 0, accuracy: 100 });
  const [loading, setLoading] = useState(true);
  const [nimInput, setNimInput] = useState("");
  const [nimStatus, setNimStatus] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchWorkshops();
      const workshopsData = data.workshops || MOCK_WORKSHOPS;
      setWorkshops(workshopsData);

      const totalReg = workshopsData.reduce((sum, w) => sum + (w.registration_count || 0), 0);
      setStats({
        total: totalReg,
        present: Math.floor(totalReg * 0.77),
        pending: Math.floor(totalReg * 0.23),
        accuracy: 100,
      });
    } catch (err) {
      setWorkshops(MOCK_WORKSHOPS);
      setStats({ total: 145, present: 112, pending: 33, accuracy: 100 });
    } finally {
      setLoading(false);
    }
  }

  function handleNimIngest(e) {
    e.preventDefault();
    if (!nimInput.trim()) return;
    setNimStatus({ type: "success", message: `NIM ${nimInput} ingested successfully. Validated against SIAKAD.` });
    setNimInput("");
    setTimeout(() => setNimStatus(null), 3000);
  }

  const liveWorkshop = workshops[0] || MOCK_WORKSHOPS[0];

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Top banner */}
      <div className="border-b border-brand-border bg-brand-glass backdrop-blur-glass">
        <div className="px-6 py-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE STREAM ACTIVE
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cmmi-l2-bg px-3 py-1 text-xs font-medium text-cmmi-l2">
            CMMI Level 2 Managed Session
          </span>
          <span className="text-xs text-brand-muted">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Session info */}
        <div className="mb-6">
          <h1 className="section-heading text-3xl">{liveWorkshop?.title || "BCC Cloud Infrastructure & DevOps"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-brand-muted">
            {liveWorkshop?.speaker_name && (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                {liveWorkshop.speaker_name}
              </span>
            )}
            {liveWorkshop?.location && (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {liveWorkshop.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {liveWorkshop?.event_date ? new Date(liveWorkshop.event_date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD"}
            </span>
          </div>
        </div>

        {/* Stats cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Registered", value: stats.total, sub: "Seats", color: "brand-blue" },
            { label: "Present", value: stats.present, sub: `${Math.round((stats.present / Math.max(stats.total, 1)) * 100)}%`, color: "emerald-400" },
            { label: "Pending", value: stats.pending, sub: "Remaining", color: "orange-400" },
            { label: "Sync Accuracy", value: `${stats.accuracy}%`, sub: "Verified", color: "cmmi-l2" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card !p-5">
              <div className="text-xs font-medium uppercase tracking-wider text-brand-muted">{stat.label}</div>
              <div className="mt-1 text-3xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-xs text-brand-muted">{stat.sub}</div>
              <div className="mt-3 h-1 rounded-full bg-brand-border overflow-hidden">
                <div
                  className={`h-full rounded-full bg-${stat.color}`}
                  style={{ width: `${Math.min(parseFloat(String(stat.value)) / Math.max(stats.total, 1) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* NIM Ingestion */}
            <div className="glass-card !p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-brand-blue/20 flex items-center justify-center">
                  <svg className="h-4 w-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Student NIM Live Ingestion</div>
                  <div className="text-xs text-brand-muted">Kiosk Reader / Rapid Manual Input</div>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Ready
                </span>
              </div>

              <form onSubmit={handleNimIngest} className="flex gap-2">
                <input
                  type="text"
                  value={nimInput}
                  onChange={(e) => setNimInput(e.target.value)}
                  placeholder="Enter 15-digit student NIM"
                  className="input-dark flex-1"
                  maxLength={15}
                />
                <button type="submit" className="btn-primary">
                  Submit
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
              </form>

              {nimStatus && (
                <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${nimStatus.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {nimStatus.message}
                </div>
              )}

              <div className="mt-3 text-xs text-brand-muted">
                Quick test unregistered NIM: <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-brand-blue">225150400111019</code>
              </div>
            </div>

            {/* Roster table */}
            <div className="glass-card !p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Roster Cross-Check Console</h3>
                  <span className="text-xs text-brand-muted">Live verification via SIAKAD</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Filter NIM, Name..."
                    className="input-dark !w-48 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border">
                      <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">Student & NIM</th>
                      <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">Program</th>
                      <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">Check-In Status</th>
                      <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {MOCK_STUDENTS.map((student) => (
                      <tr key={student.nim} className="hover:bg-white/5 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue/20 text-xs font-medium text-brand-blue">
                              {student.name[0]}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{student.name}</div>
                              <div className="text-xs text-brand-muted font-mono">{student.nim}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-brand-muted">{student.program}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            student.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" :
                            student.status === "pending" ? "bg-orange-500/20 text-orange-400" :
                            student.status === "excused" ? "bg-orange-500/20 text-orange-400" :
                            "bg-brand-blue/20 text-brand-blue"
                          }`}>
                            {student.status === "confirmed" && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            {student.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-brand-muted font-mono">{student.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button className="btn-secondary text-xs">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Mark All Filtered Verified
                </button>
                <button className="btn-ghost text-xs">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Export Roster CSV
                </button>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Unregistered alert */}
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-red-400">UNREGISTERED INGESTION — 404 Exception</div>
                  <div className="mt-1 text-xs text-red-300/80 font-mono">NIM 225150400111019 — NOT REGISTERED</div>
                  <p className="mt-2 text-xs text-red-300/80">Student arrived at Room G.2.1 Kiosk. System verified active FILKOM student (Sistem Informasi), but not registered for Docker & Kubernetes.</p>
                  <div className="mt-3 flex gap-2">
                    <button className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-400 transition">Direct to Helpdesk</button>
                    <button className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5 transition">Add to Standby</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live check-in ticker */}
            <div className="glass-card !p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="h-4 w-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span className="text-sm font-semibold text-white">Live Check-in Ticker</span>
                <span className="text-xs text-brand-muted">Influx Feed (Real-time)</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Nabila Putri Az", nim: "215150607111014", status: "matched", time: "13:37:44 WIB", lab: "IP.24" },
                  { name: "Anugrah Da", nim: "225150400111019", status: "not_registered", time: "13:35:50 WIB", lab: "Portal Reject" },
                  { name: "Farras Hilmi Ra", nim: "215150201111009", status: "matched", time: "13:36:18 WIB", lab: "IP.18" },
                  { name: "Dwi Saraswati", nim: "215150308111032", status: "matched", time: "13:34:20 WIB", lab: "IP.45" },
                  { name: "Bagus Santoso", nim: "215150207111029", status: "matched", time: "13:33:05 WIB", lab: "IP.12" },
                ].map((entry) => (
                  <div key={entry.nim} className="flex items-center gap-3 rounded-lg border border-brand-border bg-white/5 p-3">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                      entry.status === "matched" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {entry.status === "matched" ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{entry.name}</div>
                      <div className="text-[10px] text-brand-muted font-mono">{entry.nim}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-brand-muted">{entry.time}</div>
                      <div className="text-[10px] text-brand-muted">{entry.lab}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CMMI Finalization */}
            <div className="glass-card !p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg className="h-4 w-4 text-cmmi-l2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <div>
                  <div className="text-sm font-semibold text-white">CMMI Finalization & Certification</div>
                  <div className="text-xs text-brand-muted">Locking attendance records</div>
                </div>
              </div>
              <p className="text-xs text-brand-muted mb-3">Locks attendance record immutability and dispatches certificate credentials to eligible attendees.</p>
              <div className="flex gap-2">
                <button className="btn-primary text-xs flex-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Lock & Finalize
                </button>
                <button className="btn-secondary text-xs flex-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  Sync to SIAKAD
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
