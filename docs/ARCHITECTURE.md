# ARCHITECTURE.md — Phase 1: Architecture, Stack Confirmation & API Contract

**Project:** BCC IIS — Workshop Registration & Attendance Reconciliation System  
**Phase:** 1 (Architecture, Stack Confirmation & API Contract)  
**Spec source:** BCC_IIS_Reconciled_Specification_Clean.docx — Sections 3.1–3.10, Table 3.9, UC-SP-01..13, US-SP-01..10  
**Conventions:** Follow AGENTS.md commands. JavaScript (ESM). Workspace is NOT empty — do not reinitialize.

---

## 1. Stack Confirmation

| Layer | Technology | Version / notes |
|-------|-----------|-----------------|
| Backend runtime | Node.js | ESM (`"type": "module"`) |
| Backend framework | Express | `src/index.js` server, CORS, JSON body, static `/uploads` |
| Database client | pg (node-postgres) | `db.js` Pool + `initDb()` |
| Env config | dotenv | `backend/.env` (PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL) |
| Password hashing | bcryptjs | 10 rounds (auth.js register/login, seed.js) |
| JWT | jsonwebtoken | HS256, `JWT_EXPIRES_IN` default 7d |
| CORS | cors | origin = FRONTEND_URL, credentials: true |
| File upload | multer | diskStorage to `backend/uploads`, 10 MB limit |
| Frontend build tool | Vite | dev server localhost:5173 |
| Frontend framework | React 18 | ESM |
| Routing | React Router DOM v6 | `App.jsx` router + guards |
| Styling | Tailwind CSS | PostCSS + autoprefixer |

### Commands (per AGENTS.md)

Backend:
```
cd backend
npm run dev      # node --watch src/index.js
npm start        # node src/index.js
node --check src/index.js
node --check src/routes/workshops.js
node --check src/routes/student.js
node --check src/routes/auth.js
node --check src/routes/registration.js
node --check src/routes/attendance.js
node --check src/routes/adminAttendance.js
node --check src/routes/portal.js
node --check src/db.js
node --check src/middleware/auth.js
node --check src/middleware/admin.js
npm test         # node tests/*.test.js
npm run seed     # node src/seed.js
```

Frontend:
```
cd frontend
npm run dev      # vite (localhost:5173)
npm run build    # production build -> dist/
npm run preview  # preview production build
```

Database (AGENTS.md): PostgreSQL via Docker or `pg_ctl`, database `rsi_db`.

---

## 2. Directory Layout — Boundary -> Controller -> Entity

Backend (`backend/src/`):

```
backend/src/
  index.js              # Express app, CORS, mount routes, health check, server start
  db.js                 # pg Pool + initDb() (spec DDL: student, workshop, registration, attendance, material, admin)
  seed.js               # deterministic seed (bcryptjs hashes, spec data)
  domainErrors.js       # domainError() + ERROR map + throwError()
  entities/
    Student.js          # findByNIM, validateNIM
    Workshop.js         # getWorkshop, checkSessionOngoing
    Registration.js     # saveRegistration, getHistory, checkDuplicate, matchRoster, getRoster, updateParticipationHistory
    Attendance.js       # checkExisting, saveAttendance, getPresentRecords, updateRecord, finalizeRecords, findByRegistrations
    Material.js         # findByWorkshop, getFile
    Admin.js            # getAdmin
  controllers/
    RegistrationController.js  # requestPrefill, processRegistration, requestHistory
    AttendanceController.js    # recordAttendance
    MaterialController.js      # getScheduleAndMaterials, requestDownload
    ParticipationController.js # requestParticipationHistory
    VerificationController.js  # requestPresentList, verifyAgainstRoster, updateEntry, finalizeAttendance, cancelFinalization
  routes/
    auth.js             # POST /register, POST /login, GET /me
    workshops.js        # workshop CRUD (admin), material upload (admin)
    registration.js     # /:id/registrations, /students/:nim/registrations, /student/my-workshops, /workshops
    attendance.js       # /workshops/:id/attendance
    adminAttendance.js  # /admin/workshops/:id/attendance, /admin/attendance/:id, /finalize, /cancel-finalization, /stream
    portal.js           # /workshops/:id/materials, /materials/:id/file, /students/:nim/participation
  middleware/
    auth.js             # requireAuth (Bearer JWT)
    admin.js            # requireAdmin, requireStudent
  tests/                # registration, attendance, verification, portal controller tests
  uploads/              # material file storage (served static at /uploads)
```

Frontend (`frontend/src/`):

```
frontend/src/
  App.jsx               # Router + ProtectedRoute/AdminRoute/StudentRoute/PublicOnlyRoute
  main.jsx              # Vite entry
  components/
    Navbar.jsx          # Navy gradient header, role-based nav, login/logout
    Sidebar.jsx         # Admin sidebar navigation
    WorkshopCard.jsx
    WorkshopRegistrationModal.jsx
    ProtectedRoute.jsx  # general auth guard
    AdminRoute.jsx      # admin-only guard
    StudentRoute.jsx    # student-only guard
  pages/
    Home.jsx
    Login.jsx
    Register.jsx
    Workshops.jsx
    WorkshopDetail.jsx
    student/
      MyWorkshops.jsx
    admin/
      CreateWorkshop.jsx
      AdminSchedules.jsx
      AdminRegistration.jsx
      AdminParticipants.jsx
      AdminDashboard.jsx
      AdminAttendance.jsx
      AdminAudit.jsx
  context/
    AuthContext.jsx     # token in localStorage, /api/auth/me validation, role tracking
  lib/
    api.js              # axios/fetch client with VITE_API_URL, auth header
```

### The 5 controllers and their boundary pages

| Controller | File | Boundary pages (frontend consumers) | Spec coverage |
|------------|------|-------------------------------------|---------------|
| RegistrationController | backend/src/controllers/RegistrationController.js | pages/Register.jsx, pages/WorkshopDetail.jsx, pages/Workshops.jsx, pages/student/MyWorkshops.jsx | UC-SP-02/03/10/11/12; US-SP-01/02/03/10 |
| AttendanceController | backend/src/controllers/AttendanceController.js | pages/WorkshopDetail.jsx (check-in) | UC-SP-04; US-SP-04 |
| MaterialController | backend/src/controllers/MaterialController.js | pages/WorkshopDetail.jsx, pages/Workshops.jsx | UC-SP-05/11; US-SP-05 |
| ParticipationController | backend/src/controllers/ParticipationController.js | pages/student/MyWorkshops.jsx | UC-SP-06; US-SP-06 |
| VerificationController | backend/src/controllers/VerificationController.js | pages/admin/AdminAttendance.jsx, pages/admin/AdminSchedules.jsx, pages/admin/AdminRegistration.jsx, pages/admin/AdminParticipants.jsx, pages/admin/AdminDashboard.jsx, pages/admin/AdminAudit.jsx | UC-SP-07/08/09/13; US-SP-07/08/09 |

Dependency direction (hard boundary): **Route -> Controller -> Entity -> db (pg)**. Routes never query `pool` directly except legacy compat routes (to be migrated). Controllers call entities only; entities own SQL.

---

## 3. ERD / SQL Schema (Section 3.9 / Table 3.9)

Domain tables only. Roster and Participation History are derived views (no tables).

```sql
-- WORKSHOP_ADMIN
CREATE TABLE workshop_admin (
  admin_id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'Workshop Admin',
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);

-- STUDENT (PK nim VARCHAR(15))
CREATE TABLE student (
  nim VARCHAR(15) PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  study_program VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL
);

-- WORKSHOP (PK workshop_id INT)
CREATE TABLE workshop (
  workshop_id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  schedule_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(100) NOT NULL,
  quota INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('DRAFT','OPEN','ONGOING','COMPLETED'))
);

-- REGISTRATION (UNIQUE(nim, workshop_id))
CREATE TABLE registration (
  registration_id SERIAL PRIMARY KEY,
  nim VARCHAR(15) NOT NULL REFERENCES student(nim) ON DELETE RESTRICT,
  workshop_id INT NOT NULL REFERENCES workshop(workshop_id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED'
    CHECK (status IN ('CONFIRMED','CANCELLED')),
  CONSTRAINT uq_registration_nim_workshop UNIQUE (nim, workshop_id)
);

-- ATTENDANCE (UNIQUE(registration_id), nullable FK verified_by_admin_id -> WORKSHOP_ADMIN)
CREATE TABLE attendance (
  attendance_id SERIAL PRIMARY KEY,
  registration_id INT NOT NULL UNIQUE REFERENCES registration(registration_id) ON DELETE CASCADE,
  verified_by_admin_id INT NULL REFERENCES workshop_admin(admin_id) ON DELETE SET NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'present',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE
);

-- MATERIAL (FK workshop_id, access_tier, asset_type)
CREATE TABLE material (
  material_id SERIAL PRIMARY KEY,
  workshop_id INT NOT NULL REFERENCES workshop(workshop_id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  file_url VARCHAR(255) NOT NULL,
  access_tier VARCHAR(20) NOT NULL DEFAULT 'registered',
  asset_type VARCHAR(30) NOT NULL DEFAULT 'file',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_nim ON registration(nim);
CREATE INDEX IF NOT EXISTS idx_registration_workshop ON registration(workshop_id);
CREATE INDEX IF NOT EXISTS idx_attendance_registration ON attendance(registration_id);
CREATE INDEX IF NOT EXISTS idx_material_workshop ON material(workshop_id);
```

Derived (no tables):
- **Roster**: `SELECT ... FROM registration r JOIN student s ON s.nim = r.nim WHERE r.workshop_id = $1` (Registration.getRoster)
- **Participation History**: registrations joined with attendance per student (ParticipationController, Registration.getHistory + Attendance.findByRegistrations)

---

## 4. Schema Alignment Gaps vs Existing Code

The existing `db.js` DDL predates Table 3.9 finalization. Gaps Phase 2 must close:

| Element | Existing code (`db.js`) | Spec (Table 3.9) | Gap |
|---------|------------------------|------------------|-----|
| `workshop.status` CHECK | `('OPEN','ONGOING','CLOSED')` | `('DRAFT','OPEN','ONGOING','COMPLETED')` | Replace CLOSED with DRAFT/COMPLETED |
| `registration.status` default/CHECK | default `'REGISTERED'`, no CHECK shown | default `'CONFIRMED'`, CHECK `('CONFIRMED','CANCELLED')` | Rename REGISTERED -> CONFIRMED |
| `attendance.verified_by_admin_id` | column named `admin_id` referencing `admin(admin_id)` | nullable FK `verified_by_admin_id -> workshop_admin(admin_id)` | Rename column + retarget FK |
| `material.access_tier` | absent | VARCHAR, default 'registered' | Add column |
| `material.asset_type` | absent | VARCHAR, default 'file' | Add column |
| Table naming | `workshop`, `student`, `registration`, `attendance`, `material`, `admin` | `workshop_admin` (not `admin`) | Rename `admin` -> `workshop_admin` |

Existing entity/layer already uses `admin_id` on attendance and references table `admin`; Phase 2 migration must rename to `verified_by_admin_id` -> `workshop_admin` and backfill data.

---

## 5. REST Endpoints (API Contract)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 1 | GET | /api/health | none | Health check |
| 2 | POST | /api/auth/register | none | Register student (with NIM), returns {token, user} |
| 3 | POST | /api/auth/login | none | Login (email or NIM + password), returns {token, user} |
| 4 | GET | /api/auth/me | Bearer JWT | Current user (incl. role, nim/admin_id) |
| 5 | GET | /api/workshops | none | List all workshops with registration counts |
| 6 | POST | /api/workshops | admin | Create a workshop |
| 7 | GET | /api/workshops/:id | none | Workshop details |
| 8 | PUT | /api/workshops/:id | admin | Update a workshop |
| 9 | DELETE | /api/workshops/:id | admin | Delete a workshop |
| 10 | POST | /api/workshops/:id/register | student | Register for workshop (409 duplicate) |
| 11 | GET | /api/workshops/:id/registrations | auth | List registrations (roster) |
| 12 | POST | /api/workshops/:id/attendance | student | Record attendance (requires ONGOING) |
| 13 | GET | /api/workshops/:id/attendance | admin | Present list vs roster (verify view) |
| 14 | PATCH | /api/admin/attendance/:id | admin | Correct/remove attendance entry |
| 15 | POST | /api/workshops/:id/attendance/finalize | admin | Finalize attendance (atomic, sets is_verified + verified_by_admin_id) |
| 16 | POST | /api/workshops/:id/materials | admin | Add material (upload) |
| 17 | GET | /api/workshops/:id/materials | auth + enrolled | Materials (403 if not registered) |
| 18 | GET | /api/materials/:id/file | auth + enrolled | Download material file |
| 19 | GET | /api/students/:nim/registrations | auth | Student registration history |
| 20 | GET | /api/students/:nim/participation | auth | Student participation history (derived) |
| 21 | GET | /api/student/my-workshops | student | Student's enrolled workshops |

Note: existing code mounts spec routes under `/api` (registration.js, attendance.js, adminAttendance.js, portal.js) and legacy compat under `/api/workshops`, `/api/student`. Phase 2 converges to the single contract above.

---

## 6. Zod Request/Response Schema Shapes (Mutation Endpoints)

Contract shapes to be adopted in Phase 2 (Zod). Not yet implemented in current codebase.

```js
// Auth
const RegisterSchema = z.object({
  nim: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  studyProgram: z.string().min(1),
  password: z.string().min(8),
});
const LoginSchema = z.object({
  identifier: z.string().min(1), // email or NIM
  password: z.string().min(1),
});

// Registration (mutation)
const RegisterForWorkshopSchema = z.object({
  nim: z.string().min(1).refine(v => /^\d+$/.test(v), "Invalid NIM"),
});
// Response: { registration: { registration_id, nim, workshop_id, registeredAt, status }, message }

// Attendance (mutation)
const RecordAttendanceSchema = z.object({
  nim: z.string().min(1),
});
// Response: { attendance: { attendance_id, registration_id, checkedInAt, status, isVerified }, message }

// Material upload (mutation, multipart)
// Response: { materials: [{ id, workshop_id, title, file_url, uploadedAt }] }

// Finalize (mutation)
// Response: { workshop_id, finalized: true, verifiedCount: number }
```

Validation rules: password ≥ 8 chars; email regex; NIM digits only; quota enforced via flag (`ENFORCE_QUOTA=true`) + DB UNIQUE constraint authoritative.

---

## 7. Deterministic Error Codes (HTTP Status)

| Code | HTTP | Meaning | Raised by |
|------|------|---------|-----------|
| INVALID_NIM | 422 | NIM missing, malformed, or not a known student | Registration.processRegistration, Attendance.recordAttendance, Participation.requestParticipationHistory, Material.getScheduleAndMaterials |
| DUPLICATE_REGISTRATION | 409 | (nim, workshop_id) already registered (DB 23505) | Registration.processRegistration |
| QUOTA_FULL | 409 | Workshop quota reached (ENFORCE_QUOTA=true) | Registration.processRegistration (BR-8) |
| SESSION_NOT_ONGOING | 409 | Workshop.status !== ONGOING when recording attendance | Attendance.recordAttendance (BR-1) |
| NOT_REGISTERED | 404 | No registration for (nim, workshop_id) | Attendance.recordAttendance, Material.getScheduleAndMaterials |
| ALREADY_RECORDED | 409 | Attendance row already exists for registration_id | Attendance.recordAttendance (BR-4) |
| FORBIDDEN_TIER | 403 | Material access_tier not satisfied by user role/verification | MaterialController (verified_attendance mode) |
| FORBIDDEN | 403 | Missing/invalid token, wrong role, admin not found | auth middleware, VerificationController, admin guards |
| NOT_FOUND | 404 | Workshop/registration/attendance/material/admin not found | All controllers |

Existing `domainErrors.js` ERROR map uses `DUPLICATE`/`NOT_REGISTERED`/`ALREADY_RECORDED`/`SESSION_NOT_ONGOING`/`NOT_FOUND`/`FORBIDDEN`. Phase 2 renames `DUPLICATE` -> `DUPLICATE_REGISTRATION` and adds `QUOTA_FULL`/`FORBIDDEN_TIER`.

---

## 8. Traceability Matrix — Endpoints / Controller Methods to UC-SP & US-SP

| Endpoint | Controller method | UC-SP | US-SP | Notes |
|----------|------------------|-------|-------|-------|
| POST /api/auth/register | (auth route) | UC-SP-01 | — | Student registration |
| POST /api/auth/login | (auth route) | UC-SP-01 | — | Email or NIM login |
| GET /api/auth/me | (auth route) | UC-SP-01 | — | Current user |
| GET /api/workshops | (workshops route) | UC-SP-12 | US-SP-01 | Workshop list |
| POST /api/workshops/:id/register | RegistrationController.processRegistration | UC-SP-02/03/10 | US-SP-02/03/10 | Register, duplicate, quota |
| GET /api/workshops/:id/registration-form | RegistrationController.requestPrefill | UC-SP-02 | US-SP-01 | Prefill profile + history |
| GET /api/students/:nim/registrations | RegistrationController.requestHistory | UC-SP-02 | US-SP-02 | Registration history |
| POST /api/workshops/:id/attendance | AttendanceController.recordAttendance | UC-SP-04 | US-SP-04 | Record attendance (ONGOING) |
| GET /api/workshops/:id/materials | MaterialController.getScheduleAndMaterials | UC-SP-05/11 | US-SP-05 | Materials (tier-gated) |
| GET /api/materials/:id/file | MaterialController.requestDownload | UC-SP-05 | US-SP-05 | File download |
| GET /api/students/:nim/participation | ParticipationController.requestParticipationHistory | UC-SP-06 | US-SP-06 | Participation history (derived) |
| GET /api/student/my-workshops | ParticipationController / Registration | UC-SP-06 | US-SP-06 | Enrolled workshops |
| GET /api/workshops/:id/attendance | VerificationController.requestPresentList | UC-SP-07 | US-SP-07 | Present list vs roster |
| PATCH /api/admin/attendance/:id | VerificationController.updateEntry | UC-SP-08 | US-SP-08 | Correct/remove entry |
| POST /api/workshops/:id/attendance/finalize | VerificationController.finalizeAttendance | UC-SP-09/13 | US-SP-09 | Atomic finalize, is_verified + status |
| POST /api/workshops/:id/materials | (workshops route, multer) | UC-SP-05/11 | — | Admin material upload |
| PUT/DELETE /api/workshops/:id | (workshops route) | UC-SP-12 | — | Admin workshop CRUD |

Use Cases / Requirements Satisfied: UC-SP-01, UC-SP-02, UC-SP-03, UC-SP-04, UC-SP-05, UC-SP-06, UC-SP-07, UC-SP-08, UC-SP-09, UC-SP-10, UC-SP-11, UC-SP-12, UC-SP-13; US-SP-01, US-SP-02, US-SP-03, US-SP-04, US-SP-05, US-SP-06, US-SP-07, US-SP-08, US-SP-09, US-SP-10.

---
