import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchStudentProfile, fetchStudentRegistrations } from "../../lib/api.js";

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ total: 0, confirmed: 0, completed: 0 });

  useEffect(() => {
    if (!user?.nim) return;
    async function load() {
      setLoading(true); setError("");
      try {
        const [profileRes, regRes] = await Promise.all([
          fetchStudentProfile(user.nim),
          fetchStudentRegistrations(user.nim)
        ]);
        setProfile(profileRes.profile || profileRes);
        const regs = regRes.history || regRes;
        setRegistrations(regs);
        setStats({
          total: regs.length,
          confirmed: regs.filter(r => r.status === "CONFIRMED").length,
          completed: regs.filter(r => r.attendance?.isVerified === true).length
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.nim]);

  if (loading) return <div className="p-6 text-brand-muted animate-pulse">Loading profile…</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!profile) return <div className="p-6 text-brand-muted">Profile not found.</div>;

  return (
    <div className="min-h-screen p-6 animate-fade-in max-w-3xl mx-auto">
      <h1 className="section-heading mb-6">Profile</h1>

      {/* Profile Card */}
      <div className="card-accent p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue text-2xl font-bold text-white">
            {profile.fullName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{profile.fullName || "Student"}</h2>
            <p className="text-brand-muted text-sm">{user?.email}</p>
            <p className="text-brand-muted text-xs mt-1">{profile.studyProgram || "FILKOM"}</p>
          </div>
        </div>
        <div className="border-t border-brand-border pt-4">
          <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">NIM</p>
          <p className="text-lg font-mono text-white mt-1">{user?.nim}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-accent p-4 text-center">
          <p className="text-2xl font-bold text-brand-blue">{stats.total}</p>
          <p className="text-xs text-brand-muted uppercase tracking-wider">Total Registrations</p>
        </div>
        <div className="card-accent p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{stats.confirmed}</p>
          <p className="text-xs text-brand-muted uppercase tracking-wider">Active Enrollments</p>
        </div>
        <div className="card-accent p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{stats.completed}</p>
          <p className="text-xs text-brand-muted uppercase tracking-wider">Completed</p>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="card-accent p-6">
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider text-brand-muted">Recent Workshops</h3>
        {registrations.length === 0 ? (
          <p className="text-brand-muted text-center py-8">No workshops registered yet.</p>
        ) : (
          <div className="space-y-3">
            {registrations.slice(0, 5).map((r) => (
              <div key={r.registration_id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                <div>
                  <p className="text-sm font-medium text-white">{r.title}</p>
                  <p className="text-xs text-brand-muted">{r.scheduleDate ? new Date(r.scheduleDate).toLocaleDateString() : "TBD"} • {r.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    r.status === "CONFIRMED" ? "bg-emerald-500/20 text-emerald-400" :
                    r.status === "CANCELLED" ? "bg-red-500/20 text-red-400" :
                    "bg-zinc-500/20 text-zinc-400"
                  }`}>
                    {r.status}
                  </span>
                  {r.attendance?.isVerified && (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">Verified</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}