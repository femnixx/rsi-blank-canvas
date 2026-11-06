import { Registration } from "../entities/Registration.js";
import { Workshop } from "../entities/Workshop.js";
import { Material } from "../entities/Material.js";
import { Attendance } from "../entities/Attendance.js";
import { throwError } from "../domainErrors.js";

/**
 * MaterialController — UC-SP-05 (RD-SP-04, SD-SP-04 [PROPOSED]).
 * §15.4: default registration-confirmed access; MATERIAL_ACCESS_MODE=verified_attendance supported [PROPOSED].
 */
export const MaterialController = {
  async getScheduleAndMaterials(nim, workshop_id) {
    const w = await Workshop.getWorkshop(workshop_id);
    if (!w) throwError("NOT_FOUND", "Workshop not found");
    const reg = await Registration.matchRoster(String(nim || "").trim(), workshop_id);
    if (!reg) throwError("NOT_REGISTERED");
    const mode = process.env.MATERIAL_ACCESS_MODE || "registration";
    if (mode === "verified_attendance") {
      const att = await Attendance.checkExisting(reg.registration_id);
      if (!att || !att.isVerified) throwError("NOT_REGISTERED", "Verified attendance required");
    }
    const materials = await Material.findByWorkshop(workshop_id);
    return { workshop: w, materials, verified: true };
  },

  async requestDownload(nim, material_id) {
    const m = await Material.getFile(material_id);
    if (!m) throwError("NOT_FOUND", "Material not found");
    // enforce access by workshop
    await this.getScheduleAndMaterials(nim, m.workshop_id);
    return m;
  },
};