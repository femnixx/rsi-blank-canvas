import { VerificationController } from "../src/controllers/VerificationController.js";
import { AttendanceController } from "../src/controllers/AttendanceController.js";
import { pool, initDb } from "../src/db.js";

let passed=0, failed=0; const ok=(n,c)=>{ if(c){passed++;console.log("PASS",n);} else {failed++;console.error("FAIL",n);} };

async function main(){
  await initDb();
  await pool.query("DELETE FROM attendance; DELETE FROM registration; DELETE FROM material; DELETE FROM workshop; DELETE FROM admin; DELETE FROM student;");
  await pool.query(`INSERT INTO student (nim,full_name,email,study_program,password_hash) VALUES ('2404001','Budi','b@x.com','IF','x'),('2404002','Siti','s@x.com','IF','x')`);
  await pool.query(`INSERT INTO admin (full_name,role,email,password_hash) VALUES ('Adm','Workshop Admin','a@x.com','x')`);
  const w = await pool.query(`INSERT INTO workshop (title,schedule_date,location,quota,status) VALUES ('W',NOW(),'Lab',10,'ONGOING') RETURNING workshop_id`);
  const wid = w.rows[0].workshop_id;
  await pool.query(`INSERT INTO registration (nim,workshop_id,registered_at,status) VALUES ('2404001',$1,NOW(),'REGISTERED'),('2404002',$1,NOW(),'REGISTERED')`,[wid]);
  await AttendanceController.recordAttendance('2404001', wid);

  // US-SP-08/09 present list split matched/unmatched
  const list = await VerificationController.requestPresentList(wid);
  ok("US-SP-08 present records returned", list.present.length === 1);
  ok("US-SP-09 matched roster split", list.matched.length === 1 && list.unmatched.length === 0);

  // US-SP-10 / BR-6 finalize atomic
  const fin = await VerificationController.finalizeAttendance(wid, 1);
  ok("US-SP-10 finalize ok", fin.finalized === true && fin.verifiedCount === 1);
  const a = await pool.query(`SELECT is_verified, admin_id FROM attendance`);
  ok("BR-6 verified+admin set", a.rows[0].is_verified === true && a.rows[0].admin_id === 1);
  const r = await pool.query(`SELECT status FROM registration WHERE nim='2404001' AND workshop_id=$1`,[wid]);
  ok("UC-SP-13 participation history updated", r.rows[0].status === 'ATTENDED');

  // BR-7 cancel no-op
  const c = await VerificationController.cancelFinalization(wid);
  ok("BR-7 cancel no-op", c.cancelled === true && c.changed === false);

  await pool.end();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed?1:0);
}
main().catch(e=>{console.error(e);process.exit(1);});