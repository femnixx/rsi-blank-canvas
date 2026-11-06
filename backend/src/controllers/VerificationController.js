import { pool } from "../db.js";
import { Workshop } from "../entities/Workshop.js";
import { Registration } from "../entities/Registration.js";
import { Attendance } from "../entities/Attendance.js";
import { Admin } from "../entities/Admin.js";
import { throwError } from "../domainErrors.js";

/**
 * VerificationController — UC-SP-07/08/09/13 (RD-SP-06/07/08, SD-SP-03).
 * Real-time data served via polling/SSE boundary; controller returns snapshots.
 * BR-6 finalize is atomic (single transaction). BR-7 cancel is no-op.
 */
export const VerificationController = {
  async requestPresentList(workshop_id) {
    const w = await Workshop.getWorkshop(workshop_id);
    if (!w) throwError("NOT_FOUND", "Workshop not found");
    const present = await Attendance.getPresentRecords(workshop_id);
    const roster = await Registration.getRoster(workshop_id);
    return this.verifyAgainstRoster(present, roster, w);
  },

  verifyAgainstRoster(present, roster, workshop = null) {
    const rosterNims = new Set(roster.map((r) => r.nim));
    const matched = present.filter((p) => rosterNims.has(p.nim));
    const unmatched = present.filter((p) => !rosterNims.has(p.nim)); // safeguard (§15.3)
    return { workshop, matched, unmatched, present, roster };
  },

  async updateEntry(attendance_id, workshop_id, action) {
    if (!attendance_id) throwError("NOT_FOUND", "Attendance record required");
    const res = await Attendance.updateRecord(attendance_id, action);
    if (!res) throwError("NOT_FOUND", "Attendance record not found");
    return res;
  },

  async finalizeAttendance(workshop_id, admin_id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const wRes = await client.query(`SELECT workshop_id FROM workshop WHERE workshop_id=$1 FOR UPDATE`, [workshop_id]);
      if (!wRes.rows[0]) throwError("NOT_FOUND", "Workshop not found");
      const aRes = await client.query(`SELECT admin_id FROM admin WHERE admin_id=$1`, [admin_id]);
      if (!aRes.rows[0]) throwError("FORBIDDEN", "Admin not found");

      const present = await client.query(
        `SELECT a.attendance_id, a.registration_id, r.nim
         FROM attendance a JOIN registration r ON r.registration_id=a.registration_id
         WHERE r.workshop_id=$1`, [workshop_id]
      );
      const roster = await client.query(`SELECT nim FROM registration WHERE workshop_id=$1`, [workshop_id]);
      // verify step (BR-6 step 1) — safeguard; no mutations except finalize
      const rosterNims = new Set(roster.rows.map(r => r.nim));
      const validIds = present.rows.filter(p => rosterNims.has(p.nim)).map(p => p.registration_id);

      await client.query(
        `UPDATE attendance a SET is_verified=true, admin_id=$2
         FROM registration r
         WHERE a.registration_id=r.registration_id AND r.workshop_id=$1`,
        [workshop_id, admin_id]
      );
      // UC-SP-13: update participation history (status reflects finalized attendance)
      if (validIds.length) {
        await client.query(`UPDATE registration SET status='ATTENDED' WHERE registration_id = ANY($1::int[])`, [validIds]);
      }
      await client.query("COMMIT");
      return { workshop_id, finalized: true, verifiedCount: validIds.length };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async cancelFinalization(_workshop_id) {
    // BR-7
    return { cancelled: true, changed: false };
  },
};