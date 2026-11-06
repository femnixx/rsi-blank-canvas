import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import workshopRoutes from "./routes/workshops.js";
import studentRoutes from "./routes/student.js";
import registrationRoutes from "./routes/registration.js";
import attendanceRoutes from "./routes/attendance.js";
import { initDb, pool } from "./db.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Set it in .env");
  process.exit(1);
}

// Middleware
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");

app.use("/uploads", express.static(uploadsDir));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes (public + protected /me)
app.use("/api/auth", authRoutes);

// Spec-aligned registration/history endpoints (Phase 2)
app.use("/api", registrationRoutes);
// Spec-aligned attendance endpoint (Phase 3)
app.use("/api", attendanceRoutes);

// Legacy workshop routes (admin create, materials, attendance management - to be migrated Phase 3-5)
app.use("/api/workshops", workshopRoutes);

// Legacy student portal routes
app.use("/api/student", studentRoutes);

// Example protected route: verifies strict auth
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({ message: "You are authorized", user: req.user });
});

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

async function start() {
  try {
    // Phase 0: reseed strategy - do NOT auto-drop on every boot; initDb does drop. Use explicit seed.
    // For dev: run `node src/db.js` init via seed or call initDb carefully.
    // Here we only ensure connectivity; schema managed by seed/init script.
    await pool.query("SELECT 1");
    app.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT}`);
      console.log(`[server] frontend allowed origin: ${FRONTEND_URL}`);
    });
  } catch (err) {
    console.error("[server] failed:", err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});
