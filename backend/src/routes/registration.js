import express from "express";
import { RegistrationController } from "../controllers/RegistrationController.js";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireStudent } from "../middleware/admin.js";
import { Workshop } from "../entities/Workshop.js";
import { Registration } from "../entities/Registration.js";

const router = express.Router();

function sendErr(res, err) {
  const status = err.status || 500;
  return res.status(status).json({ code: err.code || "INTERNAL", message: err.message || "Internal server error" });
}

// Spec §16: requestPrefill
router.get("/:id/registration-form", async (req, res) => {
  try {
    const data = await RegistrationController.requestPrefill(req.query.nim, req.params.id);
    res.json(data);
  } catch (err) { sendErr(res, err); }
});

// Spec §16: processRegistration (public by NIM as per UC-SP-02/BR-9 context; also accepts details)
router.post("/:id/registrations", async (req, res) => {
  try {
    const { nim } = req.body;
    const data = await RegistrationController.processRegistration(nim, req.params.id, req.body);
    res.status(201).json(data);
  } catch (err) { sendErr(res, err); }
});

// Spec §16: requestHistory
router.get("/students/:nim/registrations", async (req, res) => {
  try {
    const data = await RegistrationController.requestHistory(req.params.nim);
    res.json(data);
  } catch (err) { sendErr(res, err); }
});

// Compatibility: authenticated student history via token NIM
router.get("/student/my-workshops", requireAuth, requireStudent, async (req, res) => {
  try {
    const data = await RegistrationController.requestHistory(req.user.nim);
    // adapt to old frontend shape minimally
    const workshops = data.history.map((h) => ({
      id: h.workshop_id,
      workshop_id: h.workshop_id,
      title: h.title,
      event_date: h.scheduleDate,
      location: h.location,
      registration_id: h.registration_id,
      status: h.status,
    }));
    res.json({ workshops, profile: data.profile });
  } catch (err) { sendErr(res, err); }
});

// Minimal workshop list/read for existing UI (not in §16 but required to navigate)
router.get("/workshops", async (_req, res) => {
  try {
    const r = await pool.query(`SELECT workshop_id AS id, workshop_id, title, schedule_date AS event_date, location, quota, status FROM workshop ORDER BY schedule_date DESC`);
    res.json({ workshops: r.rows });
  } catch (err) { sendErr(res, err); }
});
router.get("/workshops/:id", async (req, res) => {
  try {
    const w = await Workshop.getWorkshop(req.params.id);
    if (!w) return res.status(404).json({ code: "NOT_FOUND", message: "Workshop not found" });
    res.json({ workshop: { ...w, id: w.workshop_id, event_date: w.scheduleDate } });
  } catch (err) { sendErr(res, err); }
});

export default router;