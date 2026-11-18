import { Registration } from "../entities/Registration.js";
import { Workshop } from "../entities/Workshop.js";
import { Material } from "../entities/Material.js";
import { Attendance } from "../entities/Attendance.js";
import { throwError } from "../domainErrors.js";

/**
 * MaterialController — UC-SP-05 (RD-SP-04, SD-SP-04 [PROPOSED]).
 * §15.4: default registration-confirmed access; VERIFIED_ATTENDEE tier requires verified attendance.
 */
export const MaterialController = {
  async getScheduleAndMaterials(nim, workshop_id) {
    const w = await Workshop.getWorkshop(workshop_id);
    if (!w) throwError("NOT_FOUND", "Workshop not found");
    const reg = await Registration.matchRoster(String(nim || "").trim(), workshop_id);
    if (!reg) throwError("NOT_REGISTERED");
    const materials = await Material.findByWorkshop(workshop_id);
    const att = await Attendance.checkExisting(reg.registration_id);
    const verified = att ? att.isVerified === true : false;
    const mapped = materials.map((m) => {
      let accessible = false;
      if (m.access_tier === "REGISTERED") accessible = true; // registration already confirmed
      else if (m.access_tier === "VERIFIED_ATTENDEE") accessible = verified === true;
      return {
        material_id: m.material_id,
        workshop_id: m.workshop_id,
        title: m.title,
        file_url: m.file_url,
        asset_type: m.asset_type,
        access_tier: m.access_tier,
        uploaded_at: m.uploaded_at,
        accessible,
      };
    });
    return { workshop: w, materials: mapped, verified };
  },

  async requestDownload(nim, material_id) {
    const m = await Material.getFile(material_id);
    if (!m) throwError("NOT_FOUND", "Material not found");
    const reg = await Registration.matchRoster(String(nim || "").trim(), m.workshop_id);
    if (!reg) throwError("NOT_REGISTERED");
    const att = await Attendance.checkExisting(reg.registration_id);
    const verified = att ? att.isVerified === true : false;
    if (m.access_tier === "VERIFIED_ATTENDEE" && !verified) throwError("FORBIDDEN_TIER", "Verified attendance required");
    return m;
  },
};
