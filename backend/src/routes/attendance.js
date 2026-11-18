import express from "express";
import { AttendanceController } from "../controllers/AttendanceController.js";
import { optionalAuth } from "../middleware/auth.js";
import { validateBody, object, string } from "../validation.js";

const router = express.Router();

const attendanceSubmitSchema = object({
  nim: string({ required: true }),
});

function sendErr(res, err) {
  const status = err.status || 500;
  return res.status(status).json({ code: err.code || "INTERNAL", message: err.message || "Internal server error" });
}

// Spec §16: recordAttendance
router.post("/workshops/:id/attendance", optionalAuth, validateBody(attendanceSubmitSchema), async (req, res) => {
  try {
    const { nim } = req.validated;
    const workshop_id = Number(req.params.id);
    if (!Number.isFinite(workshop_id)) return res.status(422).json({ code: "INVALID_NIM", message: "workshop_id must be a number" });
    const data = await AttendanceController.recordAttendance(nim, workshop_id);
    res.status(201).json(data);
  } catch (err) { sendErr(res, err); }
});

// Compatibility for existing frontend
router.post("/workshops/:id/attendance-public", optionalAuth, validateBody(attendanceSubmitSchema), async (req, res) => {
  try {
    const { nim } = req.validated;
    const workshop_id = Number(req.params.id);
    if (!Number.isFinite(workshop_id)) return res.status(422).json({ code: "INVALID_NIM", message: "workshop_id must be a number" });
    const data = await AttendanceController.recordAttendance(nim, workshop_id);
    res.status(201).json(data);
  } catch (err) { sendErr(res, err); }
});

export default router;