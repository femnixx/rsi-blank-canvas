import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes (public + protected /me)
app.use("/api/auth", authRoutes);

// Example protected route: verifies strict auth
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({ message: "You are authorized", user: req.user });
});

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT}`);
      console.log(`[server] frontend allowed origin: ${FRONTEND_URL}`);
    });
  } catch (err) {
    console.error("[server] failed to init db:", err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});
