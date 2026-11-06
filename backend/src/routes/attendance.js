import express from "express";
import { AttendanceController } from "../controllers/AttendanceController.js";

const router = express.Router();

function sendErr(res, err) {
  const status = err.status || 500;
  return res.status(status).json({ code: err.code || "INTERNAL", message: err.message || "Internal server error" });
}

// Spec §16: recordAttendance
router.post("/workshops/:id/attendance", async (req, res) => {
  try {
    const { nim } = req.body;
    const data = await AttendanceController.recordAttendance(nim, req.params.id);
    res.status(201).json(data);
  } catch (err) { sendErr(res, err); }
});

// Compatibility for existing frontend
router.post("/workshops/:id/attendance-public", async (req, res) => {
  try {
    const { nim } = req.body;
    const data = await AttendanceController.recordAttendance(nim, req.params.id);
    res.status(201).json(data);
  } catch (err) { sendErr(res, err); }
});

export default router;