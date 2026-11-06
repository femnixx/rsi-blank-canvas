import { MaterialController } from "../src/controllers/MaterialController.js";
import { ParticipationController } from "../src/controllers/ParticipationController.js";
import { pool, initDb } from "../src/db.js";

let passed=0,failed=0; const ok=(n,c)=>{if(c){passed++;console.log("PASS",n);}else{failed++;console.error("FAIL",n);}};

async function main(){
  await initDb();
  await pool.query("DELETE FROM attendance; DELETE FROM registration; DELETE FROM material; DELETE FROM workshop; DELETE FROM admin; DELETE FROM student;");
  await pool.query(`INSERT INTO student (nim,full_name,email,study_program,password_hash) VALUES ('2404001','Budi','b@x.com','IF','x')`);
  const w = await pool.query(`INSERT INTO workshop (title,schedule_date,location,quota,status) VALUES ('W',NOW(),'Lab',10,'OPEN') RETURNING workshop_id`);
  const wid = w.rows[0].workshop_id;
  await pool.query(`INSERT INTO material (workshop_id,title,file_url) VALUES ($1,'M1','/uploads/m1.pdf')`,[wid]);
  await pool.query(`INSERT INTO registration (nim,workshop_id,registered_at,status) VALUES ('2404001',$1,NOW(),'REGISTERED')`,[wid]);

  // US-SP-05 registered can access
  const m = await MaterialController.getScheduleAndMaterials('2404001', wid);
  ok("US-SP-05 registered access", m.verified === true && m.materials.length === 1);
  // unregistered blocked
  let c; try { await MaterialController.getScheduleAndMaterials('999', wid); } catch(e){ c=e.code; }
  ok("US-SP-05 NOT_REGISTERED", c === 'NOT_REGISTERED');

  // US-SP-07 participation history derived
  await pool.query(`INSERT INTO attendance (registration_id,status,is_verified) SELECT registration_id,'present',true FROM registration WHERE nim='2404001'`);
  const h = await ParticipationController.requestParticipationHistory('2404001');
  ok("US-SP-07 participation history includes attendance", h.history[0]?.attendance?.isVerified === true);

  await pool.end(); console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed?1:0);
}
main().catch(e=>{console.error(e);process.exit(1);});