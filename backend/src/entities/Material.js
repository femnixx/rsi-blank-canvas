import { pool } from "../db.js";

export const Material = {
  async findByWorkshop(workshop_id, db = pool) {
    const r = await db.query(
      `SELECT material_id, workshop_id, title, file_url AS file, uploaded_at AS "uploadedAt"
       FROM material WHERE workshop_id = $1 ORDER BY uploaded_at DESC`,
      [workshop_id]
    );
    return r.rows;
  },

  async getFile(material_id, db = pool) {
    const r = await db.query(
      `SELECT material_id, workshop_id, title, file_url AS file, uploaded_at AS "uploadedAt"
       FROM material WHERE material_id = $1`,
      [material_id]
    );
    return r.rows[0] || null;
  },
};