import { pool } from "../db.js";

export const Admin = {
  async getAdmin(admin_id, db = pool) {
    const r = await db.query(
      `SELECT admin_id, full_name AS "fullName", role, email FROM admin WHERE admin_id = $1`,
      [admin_id]
    );
    return r.rows[0] || null;
  },
};