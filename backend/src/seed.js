import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { initDb } from "./db.js";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/rsi_db",
});

async function seed() {
  await initDb();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM attendance");
    await client.query("DELETE FROM registration");
    await client.query("DELETE FROM material");
    await client.query("DELETE FROM workshop");
    await client.query("DELETE FROM workshop_admin");
    await client.query("DELETE FROM student");

    const adminHash = await bcrypt.hash("admin123", 10);
    const admin = await client.query(
      `INSERT INTO workshop_admin (nim_or_staff_id, full_name, role, email, password_hash)
       VALUES ($1,$2,$3,$4,$5) RETURNING admin_id`,
      ["ADM001", "Workshop Admin BCC", "Workshop Admin", "admin@filkom.ub.ac.id", adminHash]
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
      ["React Patterns", new Date(now + 7 * 86400000), "Lab 301", 30, "OPEN", "Intro to React Patterns"],
      ["ML Fundamentals", new Date(now), "Aula Barat", 50, "ONGOING", "Machine Learning basics"],
      ["Cybersecurity Basics", new Date(now - 10 * 86400000), "Lab 404", 25, "COMPLETED", "Security fundamentals"],
    ];
    const wids = [];
    for (const [title, schedule_date, location, quota, status, description] of ws) {
      const r = await client.query(
        `INSERT INTO workshop (title, schedule_date, location, quota, status, description)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING workshop_id`,
        [title, schedule_date, location, quota, status, description]
      );
      wids.push(r.rows[0].workshop_id);
    }

    // Registrations CONFIRMED, honoring UNIQUE(nim,workshop_id)
    const regs = [
      ["2404001", wids[0]], ["2404002", wids[0]],
      ["2404001", wids[1]], ["2404003", wids[1]],
      ["2404001", wids[2]], ["2404004", wids[2]],
    ];
    const regIds = {};
    for (const [nim, wid] of regs) {
      const r = await client.query(
        `INSERT INTO registration (nim, workshop_id, registered_at, status)
         VALUES ($1,$2,NOW(),'CONFIRMED') RETURNING registration_id`,
        [nim, wid]
      );
      regIds[`${nim}:${wid}`] = r.rows[0].registration_id;
    }

    // Attendance: one unverified PRESENT for ONGOING workshop
    await client.query(
      `INSERT INTO attendance (registration_id, checked_in_at, status, is_verified)
       VALUES ($1, NOW(), 'PRESENT', false)`,
      [regIds[`2404001:${wids[1]}`]]
    );
    // one verified PRESENT with verified_by_admin_id for COMPLETED workshop
    await client.query(
      `INSERT INTO attendance (registration_id, verified_by_admin_id, checked_in_at, status, is_verified)
       VALUES ($1, $2, NOW(), 'PRESENT', true)`,
      [regIds[`2404001:${wids[2]}`], admin.rows[0].admin_id]
    );

    // Materials: one REGISTERED tier and one VERIFIED_ATTENDEE tier with asset_type
    await client.query(
      `INSERT INTO material (workshop_id, title, file_url, asset_type, access_tier, uploaded_at)
       VALUES ($1,$2,$3,$4,'REGISTERED',NOW()),($1,$5,$6,$7,'VERIFIED_ATTENDEE',NOW())`,
      [wids[0], "React Slides", "/uploads/react-slides.pdf", "slides", "Code Samples", "/uploads/react-code.zip", "code"]
    );

    await client.query("COMMIT");
    console.log("Seeded spec data: 1 workshop_admin, 5 students, 3 workshops, 6 registrations, 2 attendance, 2 materials");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => { console.error(e); process.exit(1); });
