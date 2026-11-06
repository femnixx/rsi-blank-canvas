import { RegistrationController } from "../src/controllers/RegistrationController.js";
import { pool, initDb } from "../src/db.js";
import { Registration } from "../src/entities/Registration.js";

let passed = 0; let failed = 0;
function ok(name, cond) { if (cond) { passed++; console.log("PASS", name); } else { failed++; console.error("FAIL", name); } }

async function main() {
  await initDb();
  // seed minimal
  await pool.query("DELETE FROM attendance; DELETE FROM registration; DELETE FROM material; DELETE FROM workshop; DELETE FROM admin; DELETE FROM student;");
  await pool.query(`INSERT INTO student (nim,full_name,email,study_program,password_hash) VALUES ('2404001','Budi','b@x.com','IF','x'),('2404002','Siti','s@x.com','IF','x')`);
  await pool.query(`INSERT INTO workshop (title,schedule_date,location,quota,status) VALUES ('W1',NOW()+interval '1 day','Lab',10,'OPEN'),('W2',NOW(),'Lab',10,'ONGOING')`);

  // US-SP-01 prefill known NIM
  const pre = await RegistrationController.requestPrefill('2404001', 1);
  ok("US-SP-01 prefill profile", pre.profile?.nim === '2404001' && pre.locked === true);

  // US-SP-02 history
  await RegistrationController.processRegistration('2404001', 1);
  await RegistrationController.processRegistration('2404001', 2).catch(()=>{}); // W2 not OPEN
  const h = await RegistrationController.requestHistory('2404001');
  ok("US-SP-02 history has registration", h.history.length >= 1);

  // US-SP-03 duplicate blocked
  let dupCode = null;
  try { await RegistrationController.processRegistration('2404001', 1); } catch (e) { dupCode = e.code; }
  ok("US-SP-03 duplicate DUPLICATE", dupCode === 'DUPLICATE');

  // US-SP-03 concurrent race -> only one row
  await pool.query("DELETE FROM registration WHERE workshop_id=1 AND nim='2404002'");
  const results = await Promise.allSettled([
    Registration.saveRegistration('2404002', 1, new Date(), 'REGISTERED'),
    Registration.saveRegistration('2404002', 1, new Date(), 'REGISTERED'),
  ]);
  const rows = await pool.query("SELECT COUNT(*)::int n FROM registration WHERE workshop_id=1 AND nim='2404002'");
  ok("US-SP-03 race single row", rows.rows[0].n === 1);

  // US-SP-04 invalid NIM
  let inv = null;
  try { await RegistrationController.processRegistration('9999999', 1); } catch (e) { inv = e.code; }
  ok("BR-2 invalid NIM", inv === 'INVALID_NIM');

  await pool.end();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });