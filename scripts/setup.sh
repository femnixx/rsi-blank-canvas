#!/usr/bin/env bash
# RSI Blank Canvas — One-shot environment setup
# Works on Linux, macOS, and Windows (Git Bash / WSL)
# Starts PostgreSQL (Docker), creates .env files, seeds the DB, and verifies health.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_ENV="$BACKEND_DIR/.env"
FRONTEND_ENV="$FRONTEND_DIR/.env"

PG_CONTAINER="rsi-pg"
PG_PORT="5432"
PG_USER="postgres"
PG_PASSWORD="postgres"
PG_DB="rsi_db"
BACKEND_PORT="4000"
FRONTEND_PORT="5173"

echo "================================================"
echo " RSI Blank Canvas — Environment Setup"
echo "================================================"
echo ""

# ---------------------------------------------------------------------------
# 0. Prerequisite checks
# ---------------------------------------------------------------------------
echo "[0/6] Checking prerequisites…"
missing=0
for cmd in node npm docker; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "  ✘ $cmd not found — please install it first."
    missing=1
  else
    echo "  ✓ $cmd found"
  fi
done
if [ "$missing" -ne 0 ]; then
  echo ""
  echo "Install missing prerequisites and re-run this script."
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Install dependencies
# ---------------------------------------------------------------------------
echo ""
echo "[1/6] Installing dependencies…"
if [ -d "$BACKEND_DIR/node_modules" ]; then
  echo "  backend node_modules exists — skipping npm install"
else
  (cd "$BACKEND_DIR" && npm install)
fi
if [ -d "$FRONTEND_DIR/node_modules" ]; then
  echo "  frontend node_modules exists — skipping npm install"
else
  (cd "$FRONTEND_DIR" && npm install)
fi

# ---------------------------------------------------------------------------
# 2. Create .env files (from examples, with a generated JWT_SECRET)
# ---------------------------------------------------------------------------
echo ""
echo "[2/6] Creating environment files…"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)}"

cat > "$BACKEND_ENV" <<EOF
PORT=$BACKEND_PORT
DATABASE_URL=postgres://$PG_USER:$PG_PASSWORD@localhost:$PG_PORT/$PG_DB
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:$FRONTEND_PORT
EOF
echo "  ✓ $BACKEND_ENV"

cat > "$FRONTEND_ENV" <<EOF
VITE_API_URL=http://localhost:$BACKEND_PORT
EOF
echo "  ✓ $FRONTEND_ENV"

# ---------------------------------------------------------------------------
# 3. Start PostgreSQL via Docker
# ---------------------------------------------------------------------------
echo ""
echo "[3/6] Starting PostgreSQL via Docker…"

if docker ps -a --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
  echo "  Container '$PG_CONTAINER' already exists."
  if docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
    echo "  It is already running."
  else
    echo "  Starting existing container…"
    docker start "$PG_CONTAINER" >/dev/null
  fi
else
  echo "  Pulling postgres:16-alpine (this may take a moment)…"
  docker run --name "$PG_CONTAINER" \
    -e POSTGRES_USER="$PG_USER" \
    -e POSTGRES_PASSWORD="$PG_PASSWORD" \
    -e POSTGRES_DB="$PG_DB" \
    -p "${PG_PORT}:${PG_PORT}" \
    -d postgres:16-alpine >/dev/null
  echo "  ✓ Container '$PG_CONTAINER' created and started."
fi

# Wait for PostgreSQL to accept connections
echo "  Waiting for PostgreSQL to be ready…"
for i in $(seq 1 30); do
  if docker exec "$PG_CONTAINER" pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
    echo "  ✓ PostgreSQL is ready."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "  ✘ PostgreSQL did not become ready in time."
    exit 1
  fi
  sleep 1
done

# ---------------------------------------------------------------------------
# 4. Seed the database
# ---------------------------------------------------------------------------
echo ""
echo "[4/6] Seeding the database…"
(cd "$BACKEND_DIR" && npm run seed)
echo "  ✓ Database seeded."

# ---------------------------------------------------------------------------
# 5. Verify backend health
# ---------------------------------------------------------------------------
echo ""
echo "[5/6] Verifying backend health…"
# Start backend temporarily to check health, or rely on an already-running one.
HEALTH_CODE=0
for i in $(seq 1 10); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${BACKEND_PORT}/api/health" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✓ Backend is healthy on http://localhost:${BACKEND_PORT}/api/health"
    echo "  Response: $(curl -s "http://localhost:${BACKEND_PORT}/api/health")"
    HEALTH_CODE=0
    break
  fi
  if [ "$i" -eq 10 ]; then
    echo "  ⚠ Backend not responding on port $BACKEND_PORT (start it with: cd backend && npm run dev)"
    HEALTH_CODE=1
  fi
  sleep 1
done

# ---------------------------------------------------------------------------
# 6. Summary
# ---------------------------------------------------------------------------
echo ""
echo "================================================"
echo "  Setup complete!"
echo "================================================"
echo ""
echo "  PostgreSQL:   docker container '$PG_CONTAINER' on port $PG_PORT"
echo "  Database:     $PG_DB (user: $PG_USER)"
echo "  Backend API:  http://localhost:$BACKEND_PORT"
echo "  Frontend:     http://localhost:$FRONTEND_PORT"
echo ""
echo "  Next steps:"
echo "    Terminal 1: cd backend  && npm run dev"
echo "    Terminal 2: cd frontend && npm run dev"
echo ""
if [ "$HEALTH_CODE" -ne 0 ]; then
  echo "  (Start the backend first, then re-run this script to verify health.)"
fi
echo "================================================"
