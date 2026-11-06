import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("[db] DATABASE_URL not set, using default postgres://postgres:postgres@localhost:5432/rsi_db");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/rsi_db",
});

/**
 * Phase 1 — spec-aligned PDM (Postgres mapping) + UC-SP-01 auth attrs.
 * Domain tables only: student, workshop, registration, attendance, material, admin.
 * [OVERRIDE] PostgreSQL types; [PROPOSED] password_hash on student/admin for UC-SP-01.
 * [PROPOSED] Workshop.status/Registration.status enums via CHECK; quota enforced via flag in controller.
 */
export async function initDb() {
  const query = `
    -- Drop legacy tables (reseed strategy per Phase 0)
    DROP TABLE IF EXISTS workshop_attendance CASCADE;
    DROP TABLE IF EXISTS workshop_registrations CASCADE;
    DROP TABLE IF EXISTS workshop_materials CASCADE;
    DROP TABLE IF EXISTS workshops CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS material CASCADE;
    DROP TABLE IF EXISTS attendance CASCADE;
    DROP TABLE IF EXISTS registration CASCADE;
    DROP TABLE IF EXISTS workshop CASCADE;
    DROP TABLE IF EXISTS admin CASCADE;
    DROP TABLE IF EXISTS student CASCADE;

    CREATE TABLE student (
      nim VARCHAR(15) PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      study_program VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL
    );

    CREATE TABLE workshop (
      workshop_id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      schedule_date TIMESTAMPTZ NOT NULL,
      location VARCHAR(100) NOT NULL,
      quota INT NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'ONGOING', 'CLOSED'))
    );

    CREATE TABLE admin (
      admin_id SERIAL PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'Workshop Admin',
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL
    );

    CREATE TABLE registration (
      registration_id SERIAL PRIMARY KEY,
      nim VARCHAR(15) NOT NULL REFERENCES student(nim) ON DELETE RESTRICT,
      workshop_id INT NOT NULL REFERENCES workshop(workshop_id) ON DELETE CASCADE,
      registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
      CONSTRAINT uq_registration_nim_workshop UNIQUE (nim, workshop_id)
    );

    CREATE TABLE attendance (
      attendance_id SERIAL PRIMARY KEY,
      registration_id INT NOT NULL UNIQUE REFERENCES registration(registration_id) ON DELETE CASCADE,
      admin_id INT NULL REFERENCES admin(admin_id) ON DELETE SET NULL,
      checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status VARCHAR(20) NOT NULL DEFAULT 'present',
      is_verified BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE material (
      material_id SERIAL PRIMARY KEY,
      workshop_id INT NOT NULL REFERENCES workshop(workshop_id) ON DELETE CASCADE,
      title VARCHAR(150) NOT NULL,
      file_url VARCHAR(255) NOT NULL,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_registration_nim ON registration(nim);
    CREATE INDEX IF NOT EXISTS idx_registration_workshop ON registration(workshop_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_workshop ON attendance(attendance_id);
  `;
  await pool.query(query);
  console.log("[db] spec tables ready: student, workshop, registration, attendance, material, admin");
}