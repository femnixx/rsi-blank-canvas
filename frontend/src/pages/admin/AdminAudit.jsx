import { useState, useEffect } from "react";

const MOCK_AUDIT_LOGS = [
  { id: 1, action: "Workshop Created", target: "BCC Cloud Infrastructure & DevOps", user: "Aditiya Pratama", time: "2025-10-25 14:30:22 WIB", ip: "192.168.1.45" },
  { id: 2, action: "Material Uploaded", target: "Slide Deck - Docker Kubernetes.pdf", user: "Lab G.2.1", time: "2025-10-25 14:32:10 WIB", ip: "192.168.1.45" },
  { id: 3, action: "Registration Sync", target: "NIM 2151502001111023 → Workshop #1", user: "System Auto", time: "2025-10-25 14:35:00 WIB", ip: "10.0.0.1" },
  { id: 4, action: "Attendance Locked", target: "BCC Front-End Engineering", user: "Aditiya Pratama", time: "2025-10-24 16:00:00 WIB", ip: "192.168.1.45" },
  { id: 5, action: "Certificate Issued", target: "Credential #BC-2024-001", user: "System Auto", time: "2025-10-24 16:05:00 WIB", ip: "10.0.0.1" },
  { id: 6, action: "User Login", target: "aditiya@student.ub.ac.id", user: "Aditiya Pratama", time: "2025-10-24 08:00:12 WIB", ip: "192.168.1.45" },
  { id: 7, action: "Workshop Updated", target: "Modern UI & State Management with React 19", user: "Bramantyo Wardhana", time: "2025-10-23 09:15:33 WIB", ip: "192.168.1.78" },
  { id: 8, action: "Material Uploaded", target: "Hands-On Lab Guide.pdf", user: "Bramantyo Wardhana", time: "2025-10-23 09:16:45 WIB", ip: "192.168.1.78" },
];

const ACTION_COLORS = {
  "Workshop Created": "bg-emerald-500/20 text-emerald-400",
  "Material Uploaded": "bg-brand-blue/20 text-brand-blue",
  "Registration Sync": "bg-purple-500/20 text-purple-400",
  "Attendance Locked": "bg-orange-500/20 text-orange-400",
  "Certificate Issued": "bg-emerald-500/20 text-emerald-400",
  "User Login": "bg-zinc-500/20 text-zinc-400",
  "Workshop Updated": "bg-orange-500/20 text-orange-400",
};

export default function AdminAudit() {
  const [logs, setLogs] = useState(MOCK_AUDIT_LOGS);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? logs : logs.filter((l) => l.action === filter);
  const actionTypes = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="border-b border-brand-border bg-brand-glass backdrop-blur-glass">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="h-4 w-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <span className="text-sm text-brand-muted">CMMI Level 2 Managed</span>
          </div>
          <span className="text-xs text-brand-muted">Hash verification active — Immutable ledger</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-heading mb-1">System Audit Logs</h1>
            <p className="section-subheading">Immutable audit trail for all FILKOM workshop operations.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-dark !w-auto text-xs"
            >
              <option value="all">All Actions</option>
              {actionTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass-card !p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">Action</th>
                  <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">Target</th>
                  <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">User</th>
                  <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">Timestamp</th>
                  <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-brand-muted">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] || "bg-zinc-500/20 text-zinc-400"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-white max-w-xs truncate">{log.target}</td>
                    <td className="py-3 text-xs text-brand-muted">{log.user}</td>
                    <td className="py-3 text-xs text-brand-muted font-mono whitespace-nowrap">{log.time}</td>
                    <td className="py-3 text-xs text-brand-muted font-mono">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Events", value: logs.length, sub: "This session" },
            { label: "Active Users", value: new Set(logs.map((l) => l.user)).size, sub: "Unique actors" },
            { label: "Integrity", value: "100%", sub: "Hash verified" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card !p-5">
              <div className="text-xs text-brand-muted">{stat.label}</div>
              <div className="mt-1 text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-brand-muted">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
