import { RegistrationController } from "../src/controllers/RegistrationController.js";
import { AttendanceController } from "../src/controllers/AttendanceController.js";
import { MaterialController } from "../src/controllers/MaterialController.js";
import { ParticipationController } from "../src/controllers/ParticipationController.js";
import { VerificationController } from "../src/controllers/VerificationController.js";
import { Registration } from "../src/entities/Registration.js";
import { pool, initDb } from "../src/db.js";

let passed = 0; let failed = 0;
function ok(name, cond) { if (cond) { passed++; console.log("PASS", name); } else { failed++; console.error("FAIL", name); } }

async function main() {
  await initDb();
  await pool.query("DELETE FROM attendance; DELETE FROM registration; DELETE FROM material; DELETE FROM workshop; DELETE FROM workshop_admin; DELETE FROM student;");

  await pool.query(`INSERT INTO student (nim,full_name,email,study_program,password_hash) VALUES ('2404001','Budi','b@x.com','IF','x'),('2404002','Siti','s@x.com','IF','x')`);
  await pool.query(`INSERT INTO workshop_admin (full_name,role,email,password_hash) VALUES ('Adm','Workshop Admin','a@x.com','x')`);
  await pool.query(`INSERT INTO workshop (title,schedule_date,location,quota,status) VALUES ('W-Open',NOW()+interval '1 day','Lab',10,'OPEN'),('W-Ongoing',NOW(),'Lab',10,'ONGOING'),('W-Completed',NOW()-interval '1 day','Lab',10,'COMPLETED')`);

  const wOpen = (await pool.query("SELECT workshop_id FROM workshop WHERE status='OPEN'")).rows[0].workshop_id;
  const wOngoing = (await pool.query("SELECT workshop_id FROM workshop WHERE status='ONGOING'")).rows[0].workshop_id;
  const wCompleted = (await pool.query("SELECT workshop_id FROM workshop WHERE status='COMPLETED'")).rows[0].workshop_id;
  const adminId = 1;

  // US-SP-01: requestPrefill(nim, workshopId) returns profile + locked===true for known NIM
  const pre1 = await RegistrationController.requestPrefill('2404001', wOpen);
  ok("US-SP-01 prefill known NIM locked", pre1.profile.nim === '2404001' && pre1.locked === true);

  // US-SP-04: same NIM pre-filled across two different workshops (continuous profile)
  const preA = await RegistrationController.requestPrefill('2404001', wOpen);
  const preB = await RegistrationController.requestPrefill('2404001', wOngoing);
  ok("US-SP-04 continuous profile across workshops", preA.profile.nim === preB.profile.nim && preB.profile.nim === '2404001');

  // US-SP-02: processRegistration then requestHistory(nim) returns >=1 registration
  await RegistrationController.processRegistration('2404001', wOpen);
  const hist = await RegistrationController.requestHistory('2404001');
  ok("US-SP-02 history after registration", hist.history.length >= 1);

  // US-SP-03: processRegistration same (nim,workshop) twice -> 2nd throws DUPLICATE_REGISTRATION
  let dup = null;
  try { await RegistrationController.processRegistration('2404001', wOpen); } catch (e) { dup = e.code; }
  ok("US-SP-03 duplicate DUPLICATE_REGISTRATION", dup === 'DUPLICATE_REGISTRATION');

  // Edge: concurrent duplicate registration race -> DB UNIQUE yields exactly 1 row
  await pool.query("DELETE FROM registration WHERE nim='2404002' AND workshop_id=$1", [wOpen]);
  await Promise.allSettled([
    Registration.saveRegistration('2404002', wOpen, new Date(), 'CONFIRMED'),
    Registration.saveRegistration('2404002', wOpen, new Date(), 'CONFIRMED'),
  ]);
  const raceCount = await pool.query("SELECT COUNT(*)::int n FROM registration WHERE nim='2404002' AND workshop_id=$1", [wOpen]);
  ok("EDGE concurrent duplicate registration race single row", raceCount.rows[0].n === 1);

  // US-SP-05: getScheduleAndMaterials for CONFIRMED registration returns materials with accessible flags
  await pool.query(`INSERT INTO material (workshop_id,title,file_url,asset_type,access_tier) VALUES ($1,'Reg Doc','/uploads/reg.pdf','doc','REGISTERED'),($1,'Ver Doc','/uploads/ver.pdf','doc','VERIFIED_ATTENDEE')`, [wOpen]);
  const mats = await MaterialController.getScheduleAndMaterials('2404002', wOpen);
  const regMat = mats.materials.find(m => m.access_tier === 'REGISTERED');
  const verMat = mats.materials.find(m => m.access_tier === 'VERIFIED_ATTENDEE');
  ok("US-SP-05 materials accessible flags", mats.materials.length === 2 && regMat.accessible === true && verMat.accessible === false && typeof mats.verified === 'boolean');

  // US-SP-06 setup: register 2404001 for ongoing workshop
  await pool.query(`INSERT INTO registration (nim,workshop_id,registered_at,status) VALUES ('2404001',$1,NOW(),'CONFIRMED')`, [wOngoing]);

  // US-SP-06: recordAttendance(nim, ONGOING workshop) -> status PRESENT, isVerified false, admin_id null
  const att = await AttendanceController.recordAttendance('2404001', wOngoing);
  ok("US-SP-06 record attendance present unverified", att.attendance.status === 'PRESENT' && att.attendance.isVerified === false && att.attendance.admin_id == null);

  // Edge: unregistered check-in rejection -> NOT_REGISTERED
  let unreg = null;
  try { await AttendanceController.recordAttendance('2404002', wOngoing); } catch (e) { unreg = e.code; }
  ok("EDGE unregistered check-in NOT_REGISTERED", unreg === 'NOT_REGISTERED');

  // Edge: double check-in idempotency -> ALREADY_RECORDED
  let dbl = null;
  try { await AttendanceController.recordAttendance('2404001', wOngoing); } catch (e) { dbl = e.code; }
  ok("EDGE double check-in ALREADY_RECORDED", dbl === 'ALREADY_RECORDED');

  // Two-tier material download setup for ongoing workshop
  await pool.query(`INSERT INTO material (workshop_id,title,file_url,asset_type,access_tier) VALUES ($1,'Ong-Reg','/uploads/o1.pdf','doc','REGISTERED'),($1,'Ong-Ver','/uploads/o2.pdf','doc','VERIFIED_ATTENDEE')`, [wOngoing]);
  const ongMats = await pool.query("SELECT material_id, access_tier FROM material WHERE workshop_id=$1", [wOngoing]);
  const regMatId = ongMats.rows.find(m => m.access_tier === 'REGISTERED').material_id;
  const verMatId = ongMats.rows.find(m => m.access_tier === 'VERIFIED_ATTENDEE').material_id;

  // Edge: download VERIFIED_ATTENDEE without verified attendance -> FORBIDDEN_TIER
  let forb = null;
  try { await MaterialController.requestDownload('2404001', verMatId); } catch (e) { forb = e.code; }
  ok("EDGE verified-tier download FORBIDDEN_TIER before verify", forb === 'FORBIDDEN_TIER');

  // Edge: download REGISTERED tier without verified attendance -> returns material
  const downloaded = await MaterialController.requestDownload('2404001', regMatId);
  ok("EDGE registered-tier download OK before verify", downloaded.material_id === regMatId);

  // US-SP-08: requestPresentList(workshopId) returns present records (live monitor snapshot)
  const presentList = await VerificationController.requestPresentList(wOngoing);
  ok("US-SP-08 present list snapshot", presentList.present.length >= 1);

  // US-SP-10: finalizeAttendance atomic -> verified flags + COMPLETED + {finalized:true, verifiedCount:n}
  const fin = await VerificationController.finalizeAttendance(wOngoing, adminId);
  ok("US-SP-10 finalize atomic returns", fin.finalized === true && fin.verifiedCount === 1);
  const attDb = await pool.query("SELECT is_verified, verified_by_admin_id FROM attendance WHERE registration_id=(SELECT registration_id FROM registration WHERE nim='2404001' AND workshop_id=$1)", [wOngoing]);
  ok("US-SP-10 DB verified+admin set", attDb.rows[0].is_verified === true && attDb.rows[0].verified_by_admin_id === adminId);
  const wDb = await pool.query("SELECT status FROM workshop WHERE workshop_id=$1", [wOngoing]);
  ok("US-SP-10 workshop status COMPLETED", wDb.rows[0].status === 'COMPLETED');

  // Edge: verified-tier download OK after verified attendance
  const downloadedAfter = await MaterialController.requestDownload('2404001', verMatId);
  ok("EDGE verified-tier download OK after verify", downloadedAfter.material_id === verMatId);

  // US-SP-07: after finalize, requestParticipationHistory(nim) history[0].attendance.isVerified === true
  const part = await ParticipationController.requestParticipationHistory('2404001');
  ok("US-SP-07 participation history verified", part.history[0]?.attendance?.isVerified === true);

  // US-SP-09: requestPresentList matched/unmatched split
  const list2 = await VerificationController.requestPresentList(wOngoing);
  const rosterNims = new Set(list2.present.map(p => p.nim));
  ok("US-SP-09 matched split", list2.matched.length === list2.present.length && list2.present.every(p => rosterNims.has(p.nim)));
  ok("US-SP-09 unmatched split empty when consistent", list2.unmatched.length === 0);
  const synth = VerificationController.verifyAgainstRoster([{ nim: '0000000', attendance_id: 999 }], [{ nim: '2404001' }], { workshop_id: wOngoing });
  ok("US-SP-09 unmatched direct branch", synth.unmatched.length === 1 && synth.matched.length === 0);

  // Edge: finalizeAttendance on COMPLETED (non-ONGOING) workshop -> SESSION_NOT_ONGOING
  let sess = null;
  try { await VerificationController.finalizeAttendance(wCompleted, adminId); } catch (e) { sess = e.code; }
  ok("EDGE finalize COMPLETED SESSION_NOT_ONGOING", sess === 'SESSION_NOT_ONGOING');

  // Edge: second finalize is idempotent/no-op
  let sess2 = null;
  try { await VerificationController.finalizeAttendance(wOngoing, adminId); } catch (e) { sess2 = e.code; }
  const after2 = await pool.query("SELECT is_verified, verified_by_admin_id FROM attendance WHERE registration_id=(SELECT registration_id FROM registration WHERE nim='2404001' AND workshop_id=$1)", [wOngoing]);
  const w2 = await pool.query("SELECT status FROM workshop WHERE workshop_id=$1", [wOngoing]);
  ok("EDGE second finalize no-op", sess2 === 'SESSION_NOT_ONGOING' && after2.rows[0].is_verified === true && after2.rows[0].verified_by_admin_id === adminId && w2.rows[0].status === 'COMPLETED');

  await pool.end();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
