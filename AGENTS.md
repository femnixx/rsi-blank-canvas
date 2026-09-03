# AGENTS.md

Project-specific commands and conventions for the RSI Blank Canvas scaffold.

## Commands

### Backend
```bash
cd backend
npm run dev      # node --watch src/index.js (watch mode)
npm start         # node src/index.js (production)
node --check src/index.js            # syntax check
node --check src/routes/workshops.js # syntax check
node --check src/routes/student.js   # syntax check
node --check src/db.js               # syntax check
node --check src/middleware/auth.js  # syntax check
node --check src/middleware/admin.js # syntax check
node --check src/routes/auth.js      # syntax check
```

### Frontend
```bash
cd frontend
npm run dev       # vite dev server (localhost:5173)
npm run build     # production build → dist/
npm run preview   # preview production build
```

### Database
```bash
# Start PostgreSQL via Docker (recommended)
docker run --name rsi-pg \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=rsi_db \
  -p 5432:5432 -d postgres:16-alpine

# Or start manually
pg_ctl -D /tmp/pgdata -l /tmp/pg.log -o "-c listen_addresses='localhost' -c port=5432 -c unix_socket_directories=/tmp" start

# Create database
psql -h localhost -U postgres -c "CREATE DATABASE rsi_db;"

# Verify tables
psql -h localhost -U postgres -d rsi_db -c "\dt"
```

## Testing Checklist

### API Verification
1. `GET /api/health` returns `{"status":"ok",...}`
2. `POST /api/auth/register` creates user (with NIM), returns `{token, user}`
3. `POST /api/auth/login` accepts email or NIM + password
4. `POST /api/workshops/:id/register` returns 409 on duplicate registration
5. `GET /api/workshops/:id/materials` returns 403 for unenrolled students, 401 for unauthenticated
6. `POST /api/workshops` (create) returns 403 for students, 201 for admins
7. `GET /api/student/my-workshops` returns enrolled workshops for authenticated students

### Frontend Verification
1. `npm run build` in frontend/ compiles without errors
2. All backend JS files pass `node --check`

## Environment Variables

### backend/.env
```
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/rsi_db
JWT_SECRET=<at least 32 chars>
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### frontend/.env
```
VITE_API_URL=http://localhost:4000
```

## Project Structure

```
backend/src/
  index.js              # Express server, CORS, initDb, routes
  db.js                 # pg Pool + initDb() (users w/ role+nim, workshops, registrations, materials)
  middleware/auth.js    # requireAuth (Bearer JWT)
  middleware/admin.js   # requireAdmin, requireStudent
  routes/auth.js        # POST /register (with NIM), POST /login (email or NIM), GET /me
  routes/workshops.js   # Workshop CRUD (admin), register (student, 409), materials
  routes/student.js     # GET /my-workshops (student enrolled workshops)

frontend/src/
  App.jsx               # Router with ProtectedRoute, AdminRoute, StudentRoute, PublicOnlyRoute
  components/Navbar.jsx # Navy gradient header, role-based center nav, login/logout
  components/WorkshopCard.jsx
  components/WorkshopRegistrationModal.jsx
  components/AdminRoute.jsx
  components/ProtectedRoute.jsx
  components/StudentRoute.jsx
  pages/Home.jsx
  pages/Login.jsx
  pages/Register.jsx
  pages/Workshops.jsx
  pages/admin/CreateWorkshop.jsx
  pages/student/MyWorkshops.jsx
  pages/WorkshopDetail.jsx
  context/AuthContext.jsx # token in localStorage, validates via /api/auth/me, tracks role
   lib/api.js
```

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | no | Health check |
| `POST` | `/api/auth/register` | no | `{email, password, nim?}` → `{token, user}` |
| `POST` | `/api/auth/login` | no | `{email or nim, password}` → `{token, user}` |
| `GET` | `/api/auth/me` | Bearer | Returns current user (incl. role, nim) |
| `GET` | `/api/workshops` | no | List all workshops with registration counts |
| `POST` | `/api/workshops` | admin | Create a workshop |
| `GET` | `/api/workshops/:id` | no | Workshop details |
| `POST` | `/api/workshops/:id/register` | student | Register (409 if already registered) |
| `GET` | `/api/workshops/:id/registrations` | auth | List registrations |
| `POST` | `/api/workshops/:id/materials` | admin | Add material |
| `GET` | `/api/workshops/:id/materials` | auth+enrolled | Materials (403 if not registered) |
| `GET` | `/api/student/my-workshops` | student | Student's enrolled workshops |
| `PUT` | `/api/workshops/:id` | admin | Update workshop |
| `DELETE` | `/api/workshops/:id` | admin | Delete workshop |

Rules: email regex validated, password ≥8 chars, bcrypt 10 rounds, JWT HS256.
`ProtectedRoute` for general auth, `AdminRoute` for admin-only, `StudentRoute` for student-only.
