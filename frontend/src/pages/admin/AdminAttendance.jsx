import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchWorkshops, fetchWorkshopAttendance } from "../../lib/api.js";

const MOCK_ATTENDANCE = [
  { id: 1, name: "Rafi Wicaksono", nim: "2151502011111045", program: "Teknik Informatika", status: "confirmed", time: "13:00 WIB" },
  { id: 2, name: "Nabila Putri Az", nim: "215150607111014", program: "PTI", status: "confirmed", time: "13:01 WIB" },
  { id: 3, name: "Dimas Arya Set", nim: "2151502001111054", program: "TI", status: "pending", time: "—" },
  { id: 4, name: "Clarissa Nathana", nim: "2151504001111088", program: "SI", status: "pending", time: "—" },
  { id: 5, name: "Irfan Maulana", nim: "215150307111002", program: "TEKIK", status: "excused", time: "—" },
  { id: 6, name: "Tiara Amanda", nim: "215150201111099", program: "TIF", status: "manual_verified", time: "13:04 WIB" },
];

export default function AdminAttendance() {
  const { token } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    loadWorkshops();
  }, []);

  async function loadWorkshops() {
    setLoading(true);
    try {
      const data = await fetchWorkshops();
      setWorkshops(data.workshops || []);
      if (data.workshops?.[0]) setSelectedWorkshop(data.workshops[0]);
    } catch {
      setWorkshops([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedWorkshop) {
      setAttendance(MOCK_ATTENDANCE);
    }
  }, [selectedWorkshop]);

  const filtered = attendance.filter((a) =>
    a.name.toLowerCase().includes(filterText.toLowerCase()) ||
    a.nim.includes(filterText)
  );

  const present = attendance.filter((a) => a.status === "confirmed" || a.status === "manual_verified").length;
  const pending = attendance.filter((a) => a.status === "pending").length;
  const absent = attendance.filter((a) => a.status === "excused").length;

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="border-b border-brand-border bg-brand-glass backdrop-blur-glass">
        <div className="px-6 py-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Session Active
          </span>
        </div>
      </div>

      <div className="p-6">
        <h1 className="section-heading mb-1">Live Attendance & Rosters</h1>
        <p className="section-subheading mb-6">Real-time attendance monitoring with SIAKAD cross-verification.</p>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Present", value: present, color: "emerald-400", bg: "bg-emerald-500/20" },
            { label: "Pending", value: pending, color: "orange-400", bg: "bg-orange-500/20" },
            { label: "Absent", value: absent, color: "red-400", bg: "bg-red-500/20" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card !p-5">
              <div className="text-xs font-medium uppercase tracking-wider text-brand-muted">{stat.label}</div>
              <div className="mt-1 text-2xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="glass-card !p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Attendance Roster</h2>
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter by NIM or name..."
                  className="input-dark !w-48 text-xs"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border">
                      <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">Student</th>
                      <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">NIM</th>
                      <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">Program</th>
                      <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">Status</th>
                      <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">Check-In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {filtered.map((student) => (
                      <tr key={student.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue/20 text-xs font-medium text-brand-blue">
                              {student.name[0]}
                            </div>
                            <span className="text-sm text-white">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-brand-muted font-mono">{student.nim}</td>
                        <td className="py-3 text-xs text-brand-muted">{student.program}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            student.status === "confirmed" || student.status === "manual_verified" ? "bg-emerald-500/20 text-emerald-400" :
                            student.status === "pending" ? "bg-orange-500/20 text-orange-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>
                            {student.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-brand-muted font-mono">{student.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Workship selector */}
            <div className="glass-card !p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Select Workshop</h3>
              <select
                value={selectedWorkshop?.id || ""}
                onChange={(e) => {
                  const ws = workshops.find(w => w.id === parseInt(e.target.value));
                  setSelectedWorkshop(ws);
                }}
                className="input-dark text-sm"
              >
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>

            {/* Batch actions */}
            <div className="glass-card !p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Batch Actions</h3>
              <div className="space-y-2">
                <button className="btn-secondary w-full text-xs justify-start">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Mark All Verified
                </button>
                <button className="btn-ghost w-full text-xs justify-start">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Export Roster CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
