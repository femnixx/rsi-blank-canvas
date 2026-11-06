import { Student } from "../entities/Student.js";
import { Registration } from "../entities/Registration.js";
import { Attendance } from "../entities/Attendance.js";
import { throwError } from "../domainErrors.js";

/**
 * ParticipationController — UC-SP-06 (RD-SP-05).
 * Participation History is derived (no table).
 */
export const ParticipationController = {
  async requestParticipationHistory(nim) {
    const n = String(nim || "").trim();
    const profile = await Student.findByNIM(n);
    if (!profile) throwError("INVALID_NIM");
    const registrations = await Registration.getHistory(n);
    const ids = registrations.map((r) => r.registration_id);
    const attendances = await Attendance.findByRegistrations(ids);
    const byReg = new Map(attendances.map((a) => [a.registration_id, a]));
    const history = registrations.map((r) => ({ ...r, attendance: byReg.get(r.registration_id) || null }));
    return { profile, history };
  },
};