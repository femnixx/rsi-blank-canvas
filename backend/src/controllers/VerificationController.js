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
      const wRes = await client.query(`SELECT workshop_id, status FROM workshop WHERE workshop_id=$1 FOR UPDATE`, [workshop_id]);
      if (!wRes.rows[0]) throwError("NOT_FOUND", "Workshop not found");
      if (wRes.rows[0].status !== "ONGOING") throwError("SESSION_NOT_ONGOING", "Workshop session not ongoing");
      const aRes = await client.query(`SELECT admin_id FROM workshop_admin WHERE admin_id=$1`, [admin_id]);
      if (!aRes.rows[0]) throwError("FORBIDDEN", "Admin not found");

      // Cross-check attendance records against CONFIRMED registration roster for the workshop
      const roster = await client.query(`SELECT registration_id FROM registration WHERE workshop_id=$1 AND status='CONFIRMED'`, [workshop_id]);
      const confirmedIds = roster.rows.map(r => r.registration_id);

      const present = await client.query(
        `SELECT a.attendance_id, a.registration_id
         FROM attendance a
         WHERE a.registration_id = ANY($1::int[])`, [confirmedIds]
      );

      const upd = await client.query(
        `UPDATE attendance SET is_verified=true, verified_by_admin_id=$2
         WHERE registration_id = ANY($1::int[])`, [confirmedIds, admin_id]
      );
      await client.query(`UPDATE workshop SET status='COMPLETED' WHERE workshop_id=$1`, [workshop_id]);
      await client.query("COMMIT");
      return { workshop_id, finalized: true, verifiedCount: upd.rowCount };
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