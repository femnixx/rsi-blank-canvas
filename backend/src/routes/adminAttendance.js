import express from "express";
import { VerificationController } from "../controllers/VerificationController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router = express.Router();
const sendErr = (res, err) => res.status(err.status || 500).json({ code: err.code || "INTERNAL", message: err.message });

// Spec §16: requestPresentList (admin)
router.get("/admin/workshops/:id/attendance", requireAuth, requireAdmin, async (req, res) => {
  try { res.json(await VerificationController.requestPresentList(req.params.id)); }
  catch (err) { sendErr(res, err); }
});

// NFR-09 [PROPOSED transport]: SSE snapshot stream (polling also possible client-side)
router.get("/admin/workshops/:id/attendance/stream", requireAuth, requireAdmin, async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const send = async () => {
    try { res.write(`data: ${JSON.stringify(await VerificationController.requestPresentList(req.params.id))}\n\n`); }
    catch (e) { res.write(`data: ${JSON.stringify({ code: e.code, message: e.message })}\n\n`); }
  };
  await send();
  const t = setInterval(send, 3000);
  req.on("close", () => clearInterval(t));
});

// Spec §16: updateEntry (admin) — PATCH /admin/attendance/:id
router.patch("/admin/attendance/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { action, workshop_id } = req.body; // workshop_id optional context
    res.json(await VerificationController.updateEntry(req.params.id, workshop_id, action));
  } catch (err) { sendErr(res, err); }
});

// Spec §16: finalizeAttendance
router.post("/admin/workshops/:id/attendance/finalize", requireAuth, requireAdmin, async (req, res) => {
  try { res.json(await VerificationController.finalizeAttendance(req.params.id, req.user.admin_id)); }
  catch (err) { sendErr(res, err); }
});

// BR-7
router.post("/admin/workshops/:id/attendance/cancel-finalization", requireAuth, requireAdmin, async (req, res) => {
  try { res.json(await VerificationController.cancelFinalization(req.params.id)); }
  catch (err) { sendErr(res, err); }
});

export default router;