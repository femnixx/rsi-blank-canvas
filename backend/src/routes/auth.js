import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { Student } from "../entities/Student.js";
import { Admin } from "../entities/Admin.js";

const router = express.Router();

function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

// UC-SP-01: login for Student or Admin (spec tables)
router.post("/login", async (req, res) => {
  const { email, nim, password } = req.body;
  if (!password || (!email && !nim)) return res.status(400).json({ code: "INVALID_NIM", message: "Credentials required" });
  try {
    if (nim || (email && !String(email).includes("@"))) {
      const n = String(nim || email).trim();
      // Try student then admin by identifier
      const s = await pool.query(`SELECT nim, full_name, email, study_program, password_hash FROM student WHERE nim=$1`, [n]);
      if (s.rows[0]) {
        const ok = await bcrypt.compare(password, s.rows[0].password_hash);
        if (!ok) return res.status(401).json({ code: "FORBIDDEN", message: "Invalid credentials" });
        const user = { role: "student", nim: s.rows[0].nim, email: s.rows[0].email, fullName: s.rows[0].full_name, studyProgram: s.rows[0].study_program };
        return res.json({ token: signToken(user), user });
      }
      const a = await pool.query(`SELECT admin_id, full_name, email, role, password_hash FROM admin WHERE email=$1`, [n]);
      if (a.rows[0]) {
        const ok = await bcrypt.compare(password, a.rows[0].password_hash);
        if (!ok) return res.status(401).json({ code: "FORBIDDEN", message: "Invalid credentials" });
        const user = { role: "admin", admin_id: a.rows[0].admin_id, email: a.rows[0].email, fullName: a.rows[0].full_name };
        return res.json({ token: signToken(user), user });
      }
      return res.status(422).json({ code: "INVALID_NIM", message: "NIM not found" });
    }

    // email login
    const em = String(email).toLowerCase();
    const s = await pool.query(`SELECT nim, full_name, email, study_program, password_hash FROM student WHERE email=$1`, [em]);
    if (s.rows[0]) {
      const ok = await bcrypt.compare(password, s.rows[0].password_hash);
      if (!ok) return res.status(401).json({ code: "FORBIDDEN", message: "Invalid credentials" });
      const user = { role: "student", nim: s.rows[0].nim, email: s.rows[0].email, fullName: s.rows[0].full_name, studyProgram: s.rows[0].study_program };
      return res.json({ token: signToken(user), user });
    }
    const a = await pool.query(`SELECT admin_id, full_name, email, role, password_hash FROM admin WHERE email=$1`, [em]);
    if (a.rows[0]) {
      const ok = await bcrypt.compare(password, a.rows[0].password_hash);
      if (!ok) return res.status(401).json({ code: "FORBIDDEN", message: "Invalid credentials" });
      const user = { role: "admin", admin_id: a.rows[0].admin_id, email: a.rows[0].email, fullName: a.rows[0].full_name };
      return res.json({ token: signToken(user), user });
    }
    return res.status(401).json({ code: "FORBIDDEN", message: "Invalid credentials" });
  } catch (err) {
    console.error("[login]", err);
    return res.status(500).json({ code: "INTERNAL", message: "Internal server error" });
  }
});

// Minimal student registration (keeps domain entity only)
router.post("/register", async (req, res) => {
  const { nim, fullName, email, studyProgram, password } = req.body;
  if (!nim || !fullName || !email || !studyProgram || !password) return res.status(400).json({ code: "INVALID_NIM", message: "All fields required" });
  if (!isValidEmail(email)) return res.status(400).json({ code: "INVALID_NIM", message: "Invalid email" });
  if (password.length < 8) return res.status(400).json({ code: "INVALID_NIM", message: "Password too short" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO student (nim, full_name, email, study_program, password_hash)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING nim, full_name AS "fullName", email, study_program AS "studyProgram"`,
      [String(nim).trim(), fullName, email.toLowerCase(), studyProgram, hash]
    );
    const user = { role: "student", ...r.rows[0] };
    return res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ code: "DUPLICATE", message: "NIM or email already exists" });
    console.error("[register]", err);
    return res.status(500).json({ code: "INTERNAL", message: "Internal server error" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const a = await Admin.getAdmin(req.user.admin_id);
      if (!a) return res.status(404).json({ code: "NOT_FOUND", message: "Admin not found" });
      return res.json({ user: { role: "admin", ...a } });
    }
    const s = await Student.findByNIM(req.user.nim);
    if (!s) return res.status(404).json({ code: "NOT_FOUND", message: "Student not found" });
    return res.json({ user: { role: "student", ...s } });
  } catch (err) {
    return res.status(500).json({ code: "INTERNAL", message: "Internal server error" });
  }
});

export default router;