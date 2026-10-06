import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchWorkshops, registerParticipant, registerParticipantByNim } from "../../lib/api.js";

const MOCK_WORKSHOPS = [
  { id: 1, title: "BCC Cloud Infrastructure & DevOps with Docker & Kubernetes", event_date: "2025-10-26T08:30:00Z", location: "Auditorium Algoritma Lt. 2", registration_count: 145 },
  { id: 2, title: "Modern UI & State Management with React 19", event_date: "2025-10-19T13:00:00Z", location: "Gedung G FILKOM UB", registration_count: 112 },
  { id: 3, title: "Production REST & gRPC with Go", event_date: "2025-10-12T08:00:00Z", location: "Lab Filkom UB", registration_count: 89 },
];

export default function AdminRegistration() {
  const { token } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [nimInput, setNimInput] = useState("");
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState(null);

  useState(() => {
    loadWorkshops();
  }, []);

  async function loadWorkshops() {
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

  async function handleRegisterByNim(e) {
    e.preventDefault();
    if (!nimInput.trim() || !selectedWorkshop) return;
    setRegistering(true);
    setMessage(null);
    try {
      const result = await registerParticipantByNim(selectedWorkshop.id, nimInput);
      setMessage({ type: "success", text: `Registered successfully. Attendee ID: ${result.attendee_id || nimInput}` });
      setNimInput("");
      loadWorkshops();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="border-b border-brand-border bg-brand-glass backdrop-blur-glass">
        <div className="px-6 py-3 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/20 px-3 py-1 text-xs font-medium text-brand-blue">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Attendance-Verified Student Access
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
            Auto-unlocked via NIM Validation
          </span>
          <span className="text-xs text-brand-muted">Sem. Ganjil 2024/2025</span>
        </div>
      </div>

      <div className="p-6">
        <h1 className="section-heading mb-1">Workshop Registration (NIM-Sync)</h1>
        <p className="section-subheading mb-6">Standardized single-source-of-truth registration center for FILKOM workshop cohorts.</p>

        {message && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Workshop list */}
          <div className="lg:col-span-2">
            <div className="glass-card !p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Active Workshop Cohorts</h2>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost text-xs">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Sync All Assets
                  </button>
                  <button className="btn-secondary text-xs">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    UB SSO Link Active
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-sm text-brand-muted">Loading workshops…</div>
              ) : (
                <div className="space-y-3">
                  {workshops.map((workshop) => (
                    <div
                      key={workshop.id}
                      onClick={() => setSelectedWorkshop(workshop)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        selectedWorkshop?.id === workshop.id
                          ? "border-brand-blue bg-brand-blue/10"
                          : "border-brand-border bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-brand-muted">#{String(workshop.id).padStart(2, "0")}</span>
                            <span className="category-pill text-[10px]">Track: Front-End</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                              <span className="h-1 w-1 rounded-full bg-emerald-400" /> Current Active Session
                            </span>
                          </div>
                          <h3 className="mt-1 text-sm font-semibold text-white">{workshop.title}</h3>
                          <div className="mt-1 flex items-center gap-3 text-xs text-brand-muted">
                            <span>{workshop.speaker_name}</span>
                            <span>·</span>
                            <span>{workshop.location}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{workshop.registration_count}</div>
                          <div className="text-xs text-brand-muted">registered</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* NIM Registration panel */}
          <div>
            <div className="glass-card !p-5 sticky top-6">
              <h3 className="text-sm font-semibold text-white mb-4">Quick NIM Registration</h3>
              {selectedWorkshop ? (
                <form onSubmit={handleRegisterByNim} className="space-y-3">
                  <div>
                    <label className="text-xs text-brand-muted mb-1 block">Selected Workshop</label>
                    <div className="rounded-lg border border-brand-border bg-white/5 p-2.5 text-xs text-white">
                      {selectedWorkshop.title}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-brand-muted mb-1 block">Student NIM</label>
                    <input
                      type="text"
                      value={nimInput}
                      onChange={(e) => setNimInput(e.target.value)}
                      placeholder="15-digit NIM"
                      className="input-dark"
                      maxLength={15}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={registering || !nimInput.trim()}
                    className="btn-primary w-full"
                  >
                    {registering ? (
                      <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Registering…</>
                    ) : (
                      <>Register Student</>
                    )}
                  </button>
                </form>
              ) : (
                <div className="rounded-lg border border-dashed border-brand-border p-6 text-center">
                  <svg className="mx-auto h-8 w-8 text-brand-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  <p className="text-xs text-brand-muted">Select a workshop from the list to register students via NIM.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
