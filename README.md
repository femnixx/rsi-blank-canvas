# RSI — Blank Canvas Scaffold

Minimal full-stack scaffolding with **React + Tailwind CSS** frontend and **Express + PostgreSQL + JWT** backend.

- Navbar with simple logo (left) and Logout button (right)
- Email-only auth (login/registration), no OAuth
- Strict authorization — unauthenticated users cannot access `/` (home)
- Home `main` tag: `Welcome, This is a Blank Canvas` on white background, black text
- PostgreSQL-backed auth

## Prerequisites

- **Node.js** >= 18 and **npm** >= 9
- **PostgreSQL** >= 14 (local install) **or** Docker
- **Git**

Verify:

```bash
node -v
npm -v
psql --version
docker --version  # if using Docker
```

## 1. Fork This Repository

This project is a template — **fork it before you start** so you have your own copy.

1. Click **Fork** (top-right on GitHub) → choose your account → **Create fork**.
2. Clone your fork (not the original):

```bash
git clone https://github.com/<YOUR_USERNAME>/rsi-proj.git
cd rsi-proj
```

3. (Optional) Keep upstream in sync if this repo is a template:

```bash
git remote add upstream https://github.com/<ORIGINAL_OWNER>/rsi-proj.git
git fetch upstream
git merge upstream/main
```

> Replace `<YOUR_USERNAME>` and `<ORIGINAL_OWNER>` with actual GitHub handles. All subsequent setup/run steps assume you are inside your forked clone.

## 2. Set Up

### 2.1 Environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` — **required**:

```env
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/rsi_db
JWT_SECRET=change-this-to-a-long-random-string-at-least-32-chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

Notes:
- **Docker**: use `DATABASE_URL=postgres://postgres:postgres@localhost:5432/rsi_db` (matches `docker-compose.yml`).
- **macOS Homebrew** (local Postgres without Docker): your DB user is usually `whoami`, so use `DATABASE_URL=postgres://tristan@localhost:5432/rsi_db` (replace `tristan` with output of `whoami`). See `backend/.env.example:2` for both variants.
- `JWT_SECRET` must be set — server at `backend/src/index.js:10` exits if missing.

`frontend/.env`:

```env
VITE_API_URL=http://localhost:4000
```

### 2.2 Database

Pick **one** option:

**Option A — Local Postgres (no Docker):**

```bash
createdb rsi_db
# Homebrew check:
psql -d rsi_db -c "SELECT 1;"
```

The table is auto-created on backend start via `backend/src/db.js:14` (`CREATE TABLE IF NOT EXISTS users`). No manual migration needed, but you can verify:

```bash
psql -d rsi_db -c "\d users"
```

**Option B — Docker Postgres only (no local install):**

```bash
docker run --name rsi-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=rsi_db \
  -p 5432:5432 -d postgres:16-alpine
```

### 2.3 Install dependencies

```bash
npm install --prefix backend
npm install --prefix frontend
```

## 3. How to Run

### Option 1 — Local dev (two terminals, recommended for development)

Terminal 1 — Backend (http://localhost:4000):

```bash
cd backend
npm run dev   # watch mode: node --watch src/index.js
# health check:
curl http://localhost:4000/api/health
# -> {"status":"ok",...}
```

Terminal 2 — Frontend (http://localhost:5173):

```bash
cd frontend
npm run dev   # vite
```

Open http://localhost:5173:
- Unauthenticated → redirected to `/login`
- Register at `/register` or login at `/login` (email + password ≥8 chars)
- Authenticated → `/` shows `<main>` with `Welcome, This is a Blank Canvas` (white bg, black text), Navbar logout button appears

### Option 2 — Docker Compose (single command, production-like)

```bash
docker compose up --build
```

Services:
- `postgres` → `localhost:5432`
- `backend` → `http://localhost:4000`
- `frontend` (nginx) → `http://localhost:5173`

Override secrets for production:

```bash
JWT_SECRET=$(openssl rand -base64 32) docker compose up --build
```

Stop:

```bash
docker compose down        # keep data
docker compose down -v     # also delete pgdata volume
```

### Build check (no server needed)

```bash
npm run build --prefix frontend  # vite build → frontend/dist
node --check backend/src/index.js
```

## Project Structure

```
rsi-proj/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server, CORS, initDb, /api/protected
│   │   ├── db.js                 # pg Pool + initDb() users table
│   │   ├── middleware/auth.js    # requireAuth (Bearer JWT)
│   │   └── routes/auth.js        # POST /register, POST /login, GET /me
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # BrowserRouter + ProtectedRoute / PublicOnlyRoute
│   │   ├── components/Navbar.jsx # Logo left, Logout right
│   │   ├── pages/Home.jsx        # <main> Welcome, This is a Blank Canvas
│   │   ├── pages/Login.jsx
│   │   ├── pages/Register.jsx
│   │   ├── context/AuthContext.jsx # token in localStorage, validates via /api/auth/me
│   │   ├── lib/api.js
│   │   ├── main.jsx
│   │   └── index.css             # Tailwind directives
│   ├── index.html
│   ├── vite.config.js            # proxy /api → localhost:4000
│   ├── tailwind.config.js
│   └── .env.example
├── docker-compose.yml
└── README.md
```

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | no | Health check |
| `POST` | `/api/auth/register` | no | `{email, password}` → `{token, user}` |
| `POST` | `/api/auth/login` | no | `{email, password}` → `{token, user}` |
| `GET` | `/api/auth/me` | Bearer | Returns current user |
| `GET` | `/api/protected` | Bearer | Example strict route — 401 without token |

Rules: email regex validated, password ≥8 chars, bcrypt 10 rounds, JWT HS256 (`backend/src/routes/auth.js:10`).

Strict auth flow:
1. `frontend/src/context/AuthContext.jsx:12` stores token in `localStorage`, validates on mount via `/api/auth/me`.
2. `frontend/src/App.jsx:10` `ProtectedRoute` redirects unauthenticated users to `/login`; `PublicOnlyRoute` redirects authenticated users away from `/login`/`/register`.
3. `backend/src/middleware/auth.js:8` `requireAuth` returns 401 on missing/invalid/expired token.

Test with curl:

```bash
# register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123"}'

# login → copy token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123"}'

# authenticated request
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

## Troubleshooting

- `FATAL: role "postgres" does not exist` → you are using `DATABASE_URL` with `postgres` user but local Postgres user is `whoami`. Switch to `postgres://$(whoami)@localhost:5432/rsi_db`.
- `FATAL: database "rsi_db" does not exist` → `createdb rsi_db`.
- `JWT_SECRET is not set` → set it in `backend/.env`.
- Frontend `fetch failed` / CORS → ensure `FRONTEND_URL` matches vite port (5173) and `VITE_API_URL` points to backend (4000).
- Port in use → change `PORT` (backend) or `server.port` in `frontend/vite.config.js:6`.

## Contributing (on your fork)

```bash
git checkout -b feat/my-feature
# make changes, test both local and docker
git commit -m "feat: my feature"
git push origin feat/my-feature
# open Pull Request on GitHub from your fork
```

## License

MIT — do what you want with your fork.
