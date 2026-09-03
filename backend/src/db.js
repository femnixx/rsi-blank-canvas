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
 * Initialize all tables if not exists.
 * Extends users with role + nim columns.
 * Drops workshop_registrations for schema migration (workshop_id + user_id unique).
 * Drops workshop_attendance (not needed in this design).
 */
export async function initDb() {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS nim VARCHAR(20) UNIQUE;

    CREATE TABLE IF NOT EXISTS workshops (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      speaker_name VARCHAR(100),
      event_date TIMESTAMP WITH TIME ZONE NOT NULL,
      location VARCHAR(200),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    DROP TABLE IF EXISTS workshop_attendance CASCADE;
    DROP TABLE IF EXISTS workshop_registrations CASCADE;
    CREATE TABLE workshop_registrations (
      id SERIAL PRIMARY KEY,
      workshop_id INT REFERENCES workshops(id) ON DELETE CASCADE,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      student_nim VARCHAR(20) NOT NULL,
      registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(workshop_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS workshop_materials (
      id SERIAL PRIMARY KEY,
      workshop_id INT REFERENCES workshops(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
  console.log("[db] users, workshops, workshop_registrations, workshop_materials tables ready");
}
