import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { MaterialController } from "../controllers/MaterialController.js";
import { ParticipationController } from "../controllers/ParticipationController.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sendErr = (res, err) => res.status(err.status || 500).json({ code: err.code || "INTERNAL", message: err.message });

// Spec §16: getScheduleAndMaterials (NIM-gated)
router.get("/workshops/:id/materials", async (req, res) => {
  try { res.json(await MaterialController.getScheduleAndMaterials(req.query.nim, req.params.id)); }
  catch (err) { sendErr(res, err); }
});
// Compat
router.get("/workshops/:id/materials-public", async (req, res) => {
  try { res.json(await MaterialController.getScheduleAndMaterials(req.query.nim, req.params.id)); }
  catch (err) { sendErr(res, err); }
});

// Spec §16: requestDownload
router.get("/materials/:id/file", async (req, res) => {
  try {
    const m = await MaterialController.requestDownload(req.query.nim, req.params.id);
    const filePath = path.resolve(path.join(__dirname, "..", "..", m.file.replace(/^\//, "")));
    return res.sendFile(filePath, (e) => { if (e && !res.headersSent) sendErr(res, { status: 404, code: "NOT_FOUND", message: "File not found" }); });
  } catch (err) { sendErr(res, err); }
});

// Spec §16: requestParticipationHistory
router.get("/students/:nim/participation", async (req, res) => {
  try { res.json(await ParticipationController.requestParticipationHistory(req.params.nim)); }
  catch (err) { sendErr(res, err); }
});

export default router;