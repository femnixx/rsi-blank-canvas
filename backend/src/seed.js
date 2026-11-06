import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/rsi_db",
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM attendance");
    await client.query("DELETE FROM registration");
    await client.query("DELETE FROM material");
    await client.query("DELETE FROM workshop");
    await client.query("DELETE FROM admin");
    await client.query("DELETE FROM student");

    const adminHash = await bcrypt.hash("admin123", 10);
    const admin = await client.query(
      `INSERT INTO admin (full_name, role, email, password_hash)
       VALUES ($1,$2,$3,$4) RETURNING admin_id`,
      ["Workshop Admin BCC", "Workshop Admin", "admin@filkom.ub.ac.id", adminHash]
    );

    const studentHash = await bcrypt.hash("student123", 10);
    const students = [
      ["2404001", "Budi Santoso", "budi.santoso@student.ub.ac.id", "Informatika"],
      ["2404002", "Siti Rahayu", "siti.rahayu@student.ub.ac.id", "Informatika"],
      ["2404003", "Ahmad Fauzi", "ahmad.fauzi@student.ub.ac.id", "Sistem Informasi"],
      ["2404004", "Dewi Lestari", "dewi.lestari@student.ub.ac.id", "Informatika"],
      ["2404005", "Rudi Hermawan", "rudi.hermawan@student.ub.ac.id", "Teknik Komputer"],
    ];
    for (const [nim, full_name, email, study_program] of students) {
      await client.query(
        `INSERT INTO student (nim, full_name, email, study_program, password_hash)
         VALUES ($1,$2,$3,$4,$5)`,
        [nim, full_name, email, study_program, studentHash]
      );
    }

    const now = Date.now();
    const ws = [
      ["React Patterns", new Date(now + 7*86400000), "Lab 301", 30, "OPEN"],
      ["ML Fundamentals", new Date(now - 86400000), "Aula Barat", 50, "ONGOING"],
      ["Cybersecurity Basics", new Date(now - 10*86400000), "Lab 404", 25, "CLOSED"],
    ];
    const wids = [];
    for (const [title, schedule_date, location, quota, status] of ws) {
      const r = await client.query(
        `INSERT INTO workshop (title, schedule_date, location, quota, status)
         VALUES ($1,$2,$3,$4,$5) RETURNING workshop_id`,
        [title, schedule_date, location, quota, status]
      );
      wids.push(r.rows[0].workshop_id);
    }

    // Registrations (BR-3 constraint tested by data shape)
    const regs = [
      ["2404001", wids[0]], ["2404002", wids[0]],
      ["2404001", wids[1]], ["2404003", wids[1]],
      ["2404001", wids[2]], ["2404004", wids[2]],
    ];
    const regIds = {};
    for (const [nim, wid] of regs) {
      const r = await client.query(
        `INSERT INTO registration (nim, workshop_id, registered_at, status)
         VALUES ($1,$2,NOW(),'REGISTERED') RETURNING registration_id`,
        [nim, wid]
      );
      regIds[`${nim}:${wid}`] = r.rows[0].registration_id;
    }

    // Attendance for ongoing workshop (unverified) and closed (finalized by admin)
    await client.query(
      `INSERT INTO attendance (registration_id, checked_in_at, status, is_verified)
       VALUES ($1, NOW(), 'present', false)`,
      [regIds[`2404001:${wids[1]}`]]
    );
    await client.query(
      `INSERT INTO attendance (registration_id, admin_id, checked_in_at, status, is_verified)
       VALUES ($1, $2, NOW(), 'present', true)`,
      [regIds[`2404001:${wids[2]}`], admin.rows[0].admin_id]
    );

    await client.query(
      `INSERT INTO material (workshop_id, title, file_url, uploaded_at)
       VALUES ($1,$2,$3,NOW()),($1,$4,$5,NOW())`,
      [wids[0], "React Slides", "/uploads/react-slides.pdf", "Code Samples", "/uploads/react-code.zip"]
    );

    await client.query("COMMIT");
    console.log("Seeded spec data: 1 admin, 5 students, 3 workshops, 6 registrations, 2 attendance, 2 materials");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => { console.error(e); process.exit(1); });