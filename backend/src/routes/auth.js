import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, nim: user.nim },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password, nim } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    if (nim) {
      const existingNim = await pool.query("SELECT id FROM users WHERE nim = $1", [nim]);
      if (existingNim.rows.length > 0) {
        return res.status(409).json({ message: "NIM already registered" });
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, nim) VALUES ($1, $2, $3) RETURNING id, email, role, nim",
      [email.toLowerCase(), hash, nim || null]
    );
    const user = result.rows[0];
    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error("[register] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/auth/login — accepts email or NIM
router.post("/login", async (req, res) => {
  const { email, nim, password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }
  if (!email && !nim) {
    return res.status(400).json({ message: "Email or NIM is required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, email, password_hash, role, nim FROM users WHERE email = $1 OR nim = $2",
      [email ? email.toLowerCase() : null, nim || null]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role, nim: user.nim } });
  } catch (err) {
    console.error("[login] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/auth/me — protected, returns current user including role and NIM
router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, role, nim, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("[me] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
