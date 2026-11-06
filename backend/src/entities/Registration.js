import { pool } from "../db.js";

export const Registration = {
  async getHistory(nim, db = pool) {
    const r = await db.query(
      `SELECT r.registration_id, r.nim, r.workshop_id, r.registered_at AS "registeredAt", r.status,
              w.title, w.schedule_date AS "scheduleDate", w.location, w.status AS workshop_status
       FROM registration r
       JOIN workshop w ON w.workshop_id = r.workshop_id
       WHERE r.nim = $1
       ORDER BY r.registered_at DESC`,
      [nim]
    );
    return r.rows;
  },

  async checkDuplicate(nim, workshop_id, db = pool) {
    const r = await db.query(
      `SELECT 1 FROM registration WHERE nim = $1 AND workshop_id = $2`,
      [nim, workshop_id]
    );
    return r.rows.length > 0;
  },

  async saveRegistration(nim, workshop_id, registered_at, status, db = pool) {
    const r = await db.query(
      `INSERT INTO registration (nim, workshop_id, registered_at, status)
       VALUES ($1, $2, $3, $4)
       RETURNING registration_id, nim, workshop_id, registered_at AS "registeredAt", status`,
      [nim, workshop_id, registered_at || new Date(), status || "REGISTERED"]
    );
    return r.rows[0];
  },

  async matchRoster(nim, workshop_id, db = pool) {
    const r = await db.query(
      `SELECT registration_id, nim, workshop_id, registered_at AS "registeredAt", status
       FROM registration WHERE nim = $1 AND workshop_id = $2`,
      [nim, workshop_id]
    );
    return r.rows[0] || null;
  },

  async getRoster(workshop_id, db = pool) {
    const r = await db.query(
      `SELECT r.registration_id, r.nim, r.registered_at AS "registeredAt", r.status,
              s.full_name AS "fullName", s.email, s.study_program AS "studyProgram"
       FROM registration r
       JOIN student s ON s.nim = r.nim
       WHERE r.workshop_id = $1
       ORDER BY r.registered_at ASC`,
      [workshop_id]
    );
    return r.rows;
  },

  async updateParticipationHistory(registration_ids, status, db = pool) {
    if (!registration_ids?.length) return [];
    const r = await db.query(
      `UPDATE registration SET status = $2 WHERE registration_id = ANY($1::int[])
       RETURNING registration_id, status`,
      [registration_ids, status]
    );
    return r.rows;
  },
};