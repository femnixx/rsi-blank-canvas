import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin, requireStudent } from "../middleware/admin.js";

const router = express.Router();

/**
 * GET /api/workshops
 * Public. List all workshops with registration counts, ordered by event_date.
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        w.id, w.title, w.description, w.speaker_name,
        w.event_date, w.location, w.created_at,
        COUNT(r.id) AS registration_count
      FROM workshops w
      LEFT JOIN workshop_registrations r ON r.workshop_id = w.id
      GROUP BY w.id
      ORDER BY w.event_date DESC
    `);
    return res.json({ workshops: result.rows });
  } catch (err) {
    console.error("[workshops list] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /api/workshops
 * Admin Only (requireAuth, requireAdmin). Create a new workshop.
 */
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { title, description, speaker_name, event_date, location } = req.body;

  if (!title || !event_date) {
    return res.status(400).json({ message: "title and event_date are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO workshops (title, description, speaker_name, event_date, location)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, speaker_name, event_date, location, created_at`,
      [title, description || null, speaker_name || null, event_date, location || null]
    );
    return res.status(201).json({ workshop: result.rows[0] });
  } catch (err) {
    console.error("[workshop create] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/workshops/:id
 * Public. Get a single workshop with full details.
 */
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, speaker_name, event_date, location, created_at
       FROM workshops WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Workshop not found" });
    }
    return res.json({ workshop: result.rows[0] });
  } catch (err) {
    console.error("[workshop get] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /api/workshops/:id/register
 * Student Only (requireAuth, requireStudent). Register the logged-in student.
 * Deduplication: returns 409 Conflict if workshop_id + user_id already registered.
 */
router.post("/:id/register", requireAuth, requireStudent, async (req, res) => {
  try {
    const regResult = await pool.query(
      `INSERT INTO workshop_registrations (workshop_id, user_id, student_nim)
       VALUES ($1, $2, $3)
       RETURNING id, workshop_id, user_id, student_nim, registration_date`,
      [req.params.id, req.user.id, req.user.nim || ""]
    );
    return res.status(201).json({ registration: regResult.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        message: "You are already registered for this workshop",
        conflict: true,
      });
    }
    console.error("[workshop register] error:", err);
    if (err.code === "23507") {
      return res.status(404).json({ message: "Workshop not found" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/workshops/:id/registrations
 * Authenticated. List all registrations for a workshop.
 */
router.get("/:id/registrations", requireAuth, async (req, res) => {
  try {
    const workshopCheck = await pool.query("SELECT id FROM workshops WHERE id = $1", [req.params.id]);
    if (workshopCheck.rows.length === 0) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    const result = await pool.query(
      `SELECT r.id, r.workshop_id, r.user_id, r.student_nim, r.registration_date,
         u.email, u.nim
       FROM workshop_registrations r
       JOIN users u ON u.id = r.user_id
       WHERE r.workshop_id = $1
       ORDER BY r.registration_date DESC`,
      [req.params.id]
    );
    return res.json({ registrations: result.rows });
  } catch (err) {
    console.error("[workshop registrations list] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /api/workshops/:id/materials
 * Admin Only (requireAuth, requireAdmin). Add a material resource.
 */
router.post("/:id/materials", requireAuth, requireAdmin, async (req, res) => {
  const { title, file_url } = req.body;

  if (!title || !file_url) {
    return res.status(400).json({ message: "title and file_url are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO workshop_materials (workshop_id, title, file_url)
       VALUES ($1, $2, $3)
       RETURNING id, workshop_id, title, file_url, uploaded_at`,
      [req.params.id, title, file_url]
    );
    return res.status(201).json({ material: result.rows[0] });
  } catch (err) {
    if (err.code === "23507") {
      return res.status(404).json({ message: "Workshop not found" });
    }
    console.error("[materials create] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/workshops/:id/materials
 * Authenticated. Check if the logged-in student is registered for this workshop.
 * If verified, return the list of materials; otherwise 403 Forbidden.
 */
router.get("/:id/materials", requireAuth, async (req, res) => {
  try {
    const workshopCheck = await pool.query("SELECT id FROM workshops WHERE id = $1", [req.params.id]);
    if (workshopCheck.rows.length === 0) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    const regCheck = await pool.query(
      `SELECT id FROM workshop_registrations
       WHERE workshop_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (regCheck.rows.length === 0) {
      return res.status(403).json({
        message: "You must be a registered participant to access materials",
        verified: false,
      });
    }

    const result = await pool.query(
      `SELECT id, workshop_id, title, file_url, uploaded_at
       FROM workshop_materials
       WHERE workshop_id = $1
       ORDER BY uploaded_at DESC`,
      [req.params.id]
    );
    return res.json({ materials: result.rows, verified: true });
  } catch (err) {
    console.error("[materials list] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PUT /api/workshops/:id
 * Admin Only (requireAuth, requireAdmin). Update a workshop.
 */
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { title, description, speaker_name, event_date, location } = req.body;

  try {
    const result = await pool.query(
      `UPDATE workshops
       SET title = $1, description = $2, speaker_name = $3, event_date = $4, location = $5
       WHERE id = $6
       RETURNING id, title, description, speaker_name, event_date, location, created_at`,
      [title, description || null, speaker_name || null, event_date, location || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Workshop not found" });
    }
    return res.json({ workshop: result.rows[0] });
  } catch (err) {
    console.error("[workshop update] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * DELETE /api/workshops/:id
 * Admin Only (requireAuth, requireAdmin). Delete a workshop (cascades).
 */
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM workshops WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Workshop not found" });
    }
    return res.json({ message: "Workshop deleted", id: result.rows[0].id });
  } catch (err) {
    console.error("[workshop delete] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
