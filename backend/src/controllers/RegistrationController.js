import { pool } from "../db.js";
import { Student } from "../entities/Student.js";
import { Workshop } from "../entities/Workshop.js";
import { Registration } from "../entities/Registration.js";
import { throwError } from "../domainErrors.js";

/**
 * RegistrationController — UC-SP-02/03/10/11/12 (RD-SP-01, RD-SP-02).
 * Controllers call entities only; boundaries call this controller.
 * [PROPOSED] BR-8 quota flag off by default.
 */
export const RegistrationController = {
  async requestPrefill(nim, workshop_id) {
    const workshop = await Workshop.getWorkshop(workshop_id);
    if (!workshop) throwError("NOT_FOUND", "Workshop not found");
    const profile = nim ? await Student.findByNIM(String(nim).trim()) : null;
    const history = profile ? await Registration.getHistory(profile.nim) : [];
    return { workshop, profile, history, locked: !!profile };
  },

  async processRegistration(nim, workshop_id, details = {}) {
    const n = String(nim || "").trim();
    if (!n) throwError("INVALID_NIM");
    const workshop = await Workshop.getWorkshop(workshop_id);
    if (!workshop) throwError("NOT_FOUND", "Workshop not found");
    if (workshop.status !== "OPEN") throwError("FORBIDDEN", "Registration closed");

    const valid = await Student.validateNIM(n);
    if (!valid) throwError("INVALID_NIM");

    // BR-3: pre-check + DB UNIQUE constraint authoritative
    const dup = await Registration.checkDuplicate(n, workshop_id);
    if (dup) throwError("DUPLICATE");

    // BR-8 [PROPOSED]: quota off by default
    if (process.env.ENFORCE_QUOTA === "true" && workshop.quota > 0) {
      const c = await pool.query(`SELECT COUNT(*)::int AS n FROM registration WHERE workshop_id=$1`, [workshop_id]);
      if (c.rows[0].n >= workshop.quota) throwError("FORBIDDEN", "Quota exceeded");
    }

    try {
      const reg = await Registration.saveRegistration(n, workshop_id, new Date(), "REGISTERED");
      return { registration: reg, message: "Registration confirmed" };
    } catch (err) {
      if (err.code === "23505") throwError("DUPLICATE"); // concurrent race
      throw err;
    }
  },

  async requestHistory(nim) {
    const n = String(nim || "").trim();
    const profile = await Student.findByNIM(n);
    if (!profile) throwError("INVALID_NIM");
    const history = await Registration.getHistory(n);
    return { profile, history };
  },
};