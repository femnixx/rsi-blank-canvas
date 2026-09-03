import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireStudent } from "../middleware/admin.js";

const router = express.Router();

/**
 * GET /api/student/my-workshops
 * Student Only (requireAuth, requireStudent). Fetch workshops where the
 * authenticated student is enrolled, including material counts.
 */
router.get("/my-workshops", requireAuth, requireStudent, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        w.id, w.title, w.description, w.speaker_name,
        w.event_date, w.location, w.created_at,
        r.id AS registration_id,
        r.student_nim,
        r.registration_date,
        COUNT(m.id) AS material_count
      FROM workshops w
      JOIN workshop_registrations r ON r.workshop_id = w.id
      LEFT JOIN workshop_materials m ON m.workshop_id = w.id
      WHERE r.user_id = $1
      GROUP BY w.id, r.id
      ORDER BY w.event_date DESC
    `, [req.user.id]);

    return res.json({ workshops: result.rows });
  } catch (err) {
    console.error("[student my-workshops] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
