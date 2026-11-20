import express from "express";
import { RegistrationController } from "../controllers/RegistrationController.js";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/auth.js";
import { requireStudent } from "../middleware/admin.js";
import { Workshop } from "../entities/Workshop.js";
import { Registration } from "../entities/Registration.js";
import { validateBody, object, string } from "../validation.js";

const router = express.Router();

const registrationSubmitSchema = object({
  nim: string({ required: true }),
});

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
router.post("/:id/registrations", optionalAuth, validateBody(registrationSubmitSchema), async (req, res) => {
  const { nim } = req.validated;
  const workshop_id = Number(req.params.id);
  if (!Number.isFinite(workshop_id)) return res.status(422).json({ code: "INVALID_NIM", message: "workshop_id must be a number" });
  try {
    const data = await RegistrationController.processRegistration(nim, workshop_id, req.body);
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

export default router;