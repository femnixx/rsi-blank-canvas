import { pool } from "../db.js";

export const Attendance = {
  async checkExisting(registration_id, db = pool) {
    const r = await db.query(
      `SELECT attendance_id, registration_id, admin_id, checked_in_at AS "checkedInAt", status, is_verified AS "isVerified"
       FROM attendance WHERE registration_id = $1`,
      [registration_id]
    );
    return r.rows[0] || null;
  },

  async saveAttendance(registration_id, checked_in_at, status, is_verified, db = pool) {
    const r = await db.query(
      `INSERT INTO attendance (registration_id, admin_id, checked_in_at, status, is_verified)
       SELECT $1, NULL, $2, $3, $4
       WHERE EXISTS (SELECT 1 FROM registration WHERE registration_id = $1)
       RETURNING attendance_id, registration_id, admin_id, checked_in_at AS "checkedInAt", status, is_verified AS "isVerified"`,
      [registration_id, checked_in_at || new Date(), status || "present", is_verified ?? false]
    );
    return r.rows[0] || null;
  },

  async getPresentRecords(workshop_id, db = pool) {
    const r = await db.query(
      `SELECT a.attendance_id, a.registration_id, a.admin_id, a.checked_in_at AS "checkedInAt",
              a.status, a.is_verified AS "isVerified", r.nim, s.full_name AS "fullName"
       FROM attendance a
       JOIN registration r ON r.registration_id = a.registration_id
       JOIN student s ON s.nim = r.nim
       WHERE r.workshop_id = $1
       ORDER BY a.checked_in_at DESC`,
      [workshop_id]
    );
    return r.rows;
  },

  async updateRecord(attendance_id, action, db = pool) {
    if (action === "remove" || action === "delete") {
      const r = await db.query(`DELETE FROM attendance WHERE attendance_id = $1 RETURNING attendance_id`, [attendance_id]);
      return { removed: r.rows[0]?.attendance_id || null };
    }
    if (action === "correct") {
      const r = await db.query(
        `UPDATE attendance SET status = 'present', checked_in_at = NOW() WHERE attendance_id = $1
         RETURNING attendance_id, status, is_verified AS "isVerified"`,
        [attendance_id]
      );
      return r.rows[0] || null;
    }
    return null;
  },

  async finalizeRecords(workshop_id, admin_id, is_verified, db = pool) {
    const r = await db.query(
      `UPDATE attendance a
       SET is_verified = $3, admin_id = $2
       FROM registration r
       WHERE a.registration_id = r.registration_id AND r.workshop_id = $1
       RETURNING a.attendance_id, a.registration_id, a.is_verified AS "isVerified"`,
      [workshop_id, admin_id, is_verified]
    );
    return r.rows;
  },

  async findByRegistrations(ids, db = pool) {
    if (!ids?.length) return [];
    const r = await db.query(
      `SELECT attendance_id, registration_id, admin_id, checked_in_at AS "checkedInAt", status, is_verified AS "isVerified"
       FROM attendance WHERE registration_id = ANY($1::int[])`,
      [ids]
    );
    return r.rows;
  },
};