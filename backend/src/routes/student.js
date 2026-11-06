import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireStudent } from "../middleware/admin.js";
import { ParticipationController } from "../controllers/ParticipationController.js";

const router = express.Router();
const sendErr = (res, err) => res.status(err.status || 500).json({ code: err.code || "INTERNAL", message: err.message });

// Compat: student dashboard (spec-backed)
router.get("/my-workshops", requireAuth, requireStudent, async (req, res) => {
  try {
    const data = await ParticipationController.requestParticipationHistory(req.user.nim);
    const workshops = data.history.map((h) => ({
      id: h.workshop_id, workshop_id: h.workshop_id, title: h.title,
      event_date: h.scheduleDate, location: h.location,
      registration_id: h.registration_id, status: h.status,
      attended: !!h.attendance, attended_at: h.attendance?.checkedInAt || null,
    }));
    res.json({ workshops, profile: data.profile });
  } catch (err) { sendErr(res, err); }
});

export default router;