import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin, requireStudent } from "../middleware/admin.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "uploads"));
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".zip", ".png", ".jpg", ".jpeg"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

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
 * Admin Only (requireAuth, requireAdmin). Add material resources with optional file uploads.
 */
router.post("/:id/materials", requireAuth, requireAdmin, upload.array("files", 10), async (req, res) => {
  const { title, files: filesJson } = req.body;

  const titles = Array.isArray(title) ? title : [title];
  const files = req.files || [];

  if (titles.length === 0 && files.length === 0) {
    return res.status(400).json({ message: "At least one title or file is required" });
  }

  try {
    const rows = [];
    for (let i = 0; i < Math.max(titles.length, files.length); i++) {
      const file = files[i];
      const materialTitle = titles[i] || file?.originalname || "Untitled Material";
      const file_url = file ? `/uploads/${file.filename}` : null;

      const result = await pool.query(
        `INSERT INTO workshop_materials (workshop_id, title, file_url)
         VALUES ($1, $2, $3)
         RETURNING id, workshop_id, title, file_url, uploaded_at`,
        [req.params.id, materialTitle, file_url]
      );
      rows.push(result.rows[0]);
    }

    return res.status(201).json({ materials: rows });
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
 * POST /api/workshops/:id/attendance
 * Admin Only (requireAuth, requireAdmin). Mark attendance for a registered student.
 */
router.post("/:id/attendance", requireAuth, requireAdmin, async (req, res) => {
  const { registration_id } = req.body;

  if (!registration_id) {
    return res.status(400).json({ message: "registration_id is required" });
  }

  try {
    const regCheck = await pool.query(
      "SELECT id, workshop_id, user_id FROM workshop_registrations WHERE id = $1 AND workshop_id = $2",
      [registration_id, req.params.id]
    );

    if (regCheck.rows.length === 0) {
      return res.status(404).json({ message: "Registration not found for this workshop" });
    }

    const reg = regCheck.rows[0];

    const result = await pool.query(
      `INSERT INTO workshop_attendance (registration_id, workshop_id, user_id, status)
       VALUES ($1, $2, $3, 'present')
       ON CONFLICT (workshop_id, user_id) DO UPDATE SET checked_in_at = CURRENT_TIMESTAMP, status = 'present'
       RETURNING id, registration_id, workshop_id, user_id, checked_in_at, status`,
      [reg.id, reg.workshop_id, reg.user_id]
    );

    return res.status(201).json({ attendance: result.rows[0] });
  } catch (err) {
    console.error("[attendance create] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/workshops/:id/attendance
 * Admin Only. List attendance records for a workshop.
 */
router.get("/:id/attendance", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.registration_id, a.workshop_id, a.user_id, a.checked_in_at, a.status,
              u.email, u.nim
       FROM workshop_attendance a
       JOIN users u ON u.id = a.user_id
       WHERE a.workshop_id = $1
       ORDER BY a.checked_in_at DESC`,
      [req.params.id]
    );
    return res.json({ attendance: result.rows });
  } catch (err) {
    console.error("[attendance list] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * DELETE /api/workshops/:id/attendance/:attendanceId
 * Admin Only. Remove an attendance record.
 */
router.delete("/:id/attendance/:attendanceId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM workshop_attendance WHERE id = $1 AND workshop_id = $2 RETURNING id",
      [req.params.attendanceId, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    return res.json({ message: "Attendance record deleted", id: result.rows[0].id });
  } catch (err) {
    console.error("[attendance delete] error:", err);
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
 * DELETE /api/workshops/:id/materials/:materialId
 * Admin Only (requireAuth, requireAdmin). Delete a material.
 */
router.delete("/:id/materials/:materialId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM workshop_materials WHERE id = $1 AND workshop_id = $2 RETURNING id",
      [req.params.materialId, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Material not found" });
    }
    return res.json({ message: "Material deleted", id: result.rows[0].id });
  } catch (err) {
    console.error("[materials delete] error:", err);
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
