import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const sendErr = (res, err) => res.status(err?.status || 500).json({ code: err?.code || "INTERNAL", message: err?.message || "Internal server error" });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, "..", "..", "uploads")),
  filename: (_req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Public/compat reads (spec schema)
router.get("/", async (_req, res) => {
  try {
    const r = await pool.query(`SELECT w.workshop_id AS id, w.workshop_id, w.title, w.schedule_date AS event_date, w.location, w.status, w.quota,
      COUNT(r.registration_id)::int AS registration_count FROM workshop w LEFT JOIN registration r ON r.workshop_id=w.workshop_id GROUP BY w.workshop_id ORDER BY w.schedule_date DESC`);
    res.json({ workshops: r.rows });
  } catch (err) { sendErr(res, err); }
});
router.get("/:id", async (req, res) => {
  try {
    const r = await pool.query(`SELECT workshop_id AS id, workshop_id, title, schedule_date AS event_date, location, status, quota FROM workshop WHERE workshop_id=$1`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ code: "NOT_FOUND", message: "Workshop not found" });
    res.json({ workshop: r.rows[0] });
  } catch (err) { sendErr(res, err); }
});

// Admin workshop CRUD (spec schema)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { title, event_date, schedule_date, location, quota, status } = req.body;
  if (!title || !(event_date || schedule_date)) return res.status(400).json({ code: "INVALID", message: "title and schedule_date required" });
  try {
    const r = await pool.query(
      `INSERT INTO workshop (title, schedule_date, location, quota, status) VALUES ($1,$2,$3,$4,$5)
       RETURNING workshop_id AS id, workshop_id, title, schedule_date AS event_date, location, quota, status`,
      [title, event_date || schedule_date, location || "-", Number(quota) || 0, status || "OPEN"]
    );
    res.status(201).json({ workshop: r.rows[0] });
  } catch (err) { sendErr(res, err); }
});
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { title, event_date, schedule_date, location, quota, status } = req.body;
  try {
    const r = await pool.query(
      `UPDATE workshop SET title=COALESCE($1,title), schedule_date=COALESCE($2,schedule_date), location=COALESCE($3,location), quota=COALESCE($4,quota), status=COALESCE($5,status)
       WHERE workshop_id=$6 RETURNING workshop_id AS id, workshop_id, title, schedule_date AS event_date, location, quota, status`,
      [title, event_date || schedule_date, location, quota, status, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ code: "NOT_FOUND", message: "Workshop not found" });
    res.json({ workshop: r.rows[0] });
  } catch (err) { sendErr(res, err); }
});
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(`DELETE FROM workshop WHERE workshop_id=$1 RETURNING workshop_id`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ code: "NOT_FOUND", message: "Workshop not found" });
    res.json({ message: "Deleted" });
  } catch (err) { sendErr(res, err); }
});

// Admin material upload (spec table `material`)
router.post("/:id/materials", requireAuth, requireAdmin, upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files || [];
    const rows = [];
    for (const f of files) {
      const r = await pool.query(
        `INSERT INTO material (workshop_id, title, file_url) VALUES ($1,$2,$3)
         RETURNING material_id AS id, workshop_id, title, file_url, uploaded_at`,
        [req.params.id, f.originalname, `/uploads/${f.filename}`]
      );
      rows.push(r.rows[0]);
    }
    res.status(201).json({ materials: rows });
  } catch (err) { sendErr(res, err); }
});
router.delete("/:id/materials/:materialId", requireAuth, requireAdmin, async (req, res) => {
  try { await pool.query(`DELETE FROM material WHERE material_id=$1 AND workshop_id=$2`, [req.params.materialId, req.params.id]); res.json({ message: "Deleted" }); }
  catch (err) { sendErr(res, err); }
});

export default router;