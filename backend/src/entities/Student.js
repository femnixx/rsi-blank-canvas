import { pool } from "../db.js";

/** Entity: Student — §8 operations only. */
export const Student = {
  async findByNIM(nim, db = pool) {
    const r = await db.query(
      `SELECT nim, full_name AS "fullName", email, study_program AS "studyProgram"
       FROM student WHERE nim = $1`,
      [nim]
    );
    return r.rows[0] || null;
  },

  async validateNIM(nim, db = pool) {
    if (!nim || typeof nim !== "string" || !nim.trim()) return false;
    const s = await this.findByNIM(nim.trim(), db);
    return !!s;
  },
};