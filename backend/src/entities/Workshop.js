import { pool } from "../db.js";

export const Workshop = {
  async getWorkshop(workshop_id, db = pool) {
    const r = await db.query(
      `SELECT workshop_id, title, schedule_date AS "scheduleDate", location, quota, status
       FROM workshop WHERE workshop_id = $1`,
      [workshop_id]
    );
    return r.rows[0] || null;
  },

  async checkSessionOngoing(workshop_id, db = pool) {
    const w = await this.getWorkshop(workshop_id, db);
    return !!w && w.status === "ONGOING";
  },
};