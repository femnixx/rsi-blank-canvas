import { AttendanceController } from "../src/controllers/AttendanceController.js";
import { pool, initDb } from "../src/db.js";
import { Attendance } from "../src/entities/Attendance.js";
import { Registration } from "../src/entities/Registration.js";

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("PASS", name); } else { failed++; console.error("FAIL", name); } };

async function main() {
  await initDb();
  await pool.query("DELETE FROM attendance; DELETE FROM registration; DELETE FROM material; DELETE FROM workshop; DELETE FROM admin; DELETE FROM student;");
  await pool.query(`INSERT INTO student (nim,full_name,email,study_program,password_hash) VALUES ('2404001','Budi','b@x.com','IF','x')`);
  await pool.query(`INSERT INTO workshop (title,schedule_date,location,quota,status) VALUES ('Closed',NOW(),'Lab',10,'CLOSED'),('Ongoing',NOW(),'Lab',10,'ONGOING'),('Open',NOW(),'Lab',10,'OPEN')`);
  // roster only for workshop 2 (ongoing)
  const reg = await pool.query(`INSERT INTO registration (nim,workshop_id,registered_at,status) VALUES ('2404001',2,NOW(),'REGISTERED') RETURNING registration_id`);

  // BR-1 SESSION_NOT_ONGOING
  let c1; try { await AttendanceController.recordAttendance('2404001', 1); } catch(e){ c1=e.code; }
  ok("BR-1 SESSION_NOT_ONGOING (closed)", c1 === "SESSION_NOT_ONGOING");
  let c1b; try { await AttendanceController.recordAttendance('2404001', 3); } catch(e){ c1b=e.code; }
  ok("BR-1 SESSION_NOT_ONGOING (open)", c1b === "SESSION_NOT_ONGOING");

  // NOT_REGISTERED
  let c2; try { await AttendanceController.recordAttendance('9999999', 2); } catch(e){ c2=e.code; } // unknown NIM -> NOT_REGISTERED? controller checks matchRoster; unknown NIM not in student? matchRoster joins none
  ok("NOT_REGISTERED / invalid handled", c2 === "NOT_REGISTERED" || c2 === "INVALID_NIM");

  // US-SP-06 success: present, unverified
  const a = await AttendanceController.recordAttendance('2404001', 2);
  ok("US-SP-06 recorded present unverified", a.attendance?.status === "present" && a.attendance?.isVerified === false && a.attendance?.admin_id == null);

  // BR-4 ALREADY_RECORDED
  let c3; try { await AttendanceController.recordAttendance('2404001', 2); } catch(e){ c3=e.code; }
  ok("US-SP-06b ALREADY_RECORDED", c3 === "ALREADY_RECORDED");

  // Race: concurrent save for same registration (simulate direct) -> single row
  await pool.query("DELETE FROM attendance");
  const rid = reg.rows[0].registration_id;
  await Promise.allSettled([
    Attendance.saveAttendance(rid, new Date(), "present", false),
    Attendance.saveAttendance(rid, new Date(), "present", false),
  ]);
  const n = await pool.query("SELECT COUNT(*)::int n FROM attendance WHERE registration_id=$1", [rid]);
  ok("BR-4 race single attendance row", n.rows[0].n === 1);

  await pool.end();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
main().catch(e=>{console.error(e);process.exit(1);});