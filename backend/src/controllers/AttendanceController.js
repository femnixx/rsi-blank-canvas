import { Workshop } from "../entities/Workshop.js";
import { Registration } from "../entities/Registration.js";
import { Attendance } from "../entities/Attendance.js";
import { throwError } from "../domainErrors.js";

/**
 * AttendanceController — UC-SP-04 (RD-SP-03 / SD-SP-02).
 * BR-1: attendance only when Workshop.status=ONGOING.
 * BR-4: one Attendance per Registration; repeat → ALREADY_RECORDED.
 * BR-5: new Attendance status="present", isVerified=false, admin_id=NULL.
 */
export const AttendanceController = {
  async recordAttendance(nim, workshop_id) {
    const n = String(nim || "").trim();
    if (!n) throwError("INVALID_NIM");

    const ongoing = await Workshop.checkSessionOngoing(workshop_id);
    if (!ongoing) {
      const w = await Workshop.getWorkshop(workshop_id);
      if (!w) throwError("NOT_FOUND", "Workshop not found");
      throwError("SESSION_NOT_ONGOING");
    }

    const reg = await Registration.matchRoster(n, workshop_id);
    if (!reg) throwError("NOT_REGISTERED");

    const existing = await Attendance.checkExisting(reg.registration_id);
    if (existing) throwError("ALREADY_RECORDED");

    try {
      const att = await Attendance.saveAttendance(reg.registration_id, new Date(), "present", false);
      if (!att) throwError("NOT_REGISTERED"); // composition guard
      return { attendance: att, message: "Attendance recorded" };
    } catch (err) {
      if (err.code === "23505") throwError("ALREADY_RECORDED"); // race on UNIQUE(registration_id)
      throw err;
    }
  },
};