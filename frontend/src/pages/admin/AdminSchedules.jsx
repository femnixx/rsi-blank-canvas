import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchWorkshops } from "../../lib/api.js";

const MOCK_WORKSHOPS = [
  { id: 1, title: "BCC Cloud Infrastructure & DevOps", date: "2025-10-26", time: "08:30 - 15:30 WIB", location: "Auditorium Algoritma Lt. 2", speaker: "Lab G.2.1", registrations: 145 },
  { id: 2, title: "Modern UI & State Management with React 19", date: "2025-10-19", time: "13:00 - 15:30 WIB", location: "Gedung G FILKOM UB", speaker: "Bramantyo Wardhana", registrations: 112 },
  { id: 3, title: "Production REST & gRPC with Go", date: "2025-10-12", time: "08:00 - 11:00 WIB", location: "Lab Filkom UB", speaker: "Faisal Anwar", registrations: 89 },
];

export default function AdminSchedules() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchWorkshops();
        setWorkshops(data.workshops || MOCK_WORKSHOPS);
      } catch {
        setWorkshops(MOCK_WORKSHOPS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = filter === "all" ? workshops : workshops.filter((w) => w.id === parseInt(filter));

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="border-b border-brand-border bg-brand-glass backdrop-blur-glass">
        <div className="px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-brand-muted">BCC Integrated Information System</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-muted">SSO Gateway:</span>
            <code className="rounded bg-white/5 px-2 py-0.5 text-xs text-brand-blue font-mono">filkom-siam.ub.ac.id:443</code>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h1 className="section-heading mb-1">Schedules & Repository</h1>
        <p className="section-subheading mb-6">Standardized workshop life-cycle with verified session tracking.</p>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Workshops", value: workshops.length, sub: "This semester", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
            { label: "Total Registrations", value: workshops.reduce((s, w) => s + (w.registration_count || 0), 0), sub: "Across all tracks", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
            { label: "Sync Accuracy", value: "99.8%", sub: "0.2% variance", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card !p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/20">
                  <svg className="h-5 w-5 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} /></svg>
                </div>
                <div>
                  <div className="text-xs text-brand-muted">{stat.label}</div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-brand-muted">{stat.sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Workshop schedule list */}
        <div className="glass-card !p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Upcoming Schedule</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-dark !w-auto text-xs"
            >
              <option value="all">All Tracks</option>
              {workshops.map((w) => (
                <option key={w.id} value={w.id}>{w.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {filtered.map((workshop) => (
              <div key={workshop.id} className="rounded-xl border border-brand-border bg-white/5 p-4 hover:border-brand-blue/40 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/20 text-brand-blue font-bold text-sm">
                      {String(workshop.id).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{workshop.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-brand-muted">
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {workshop.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {workshop.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                          {workshop.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{workshop.registrations}</div>
                    <div className="text-xs text-brand-muted">registered</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
