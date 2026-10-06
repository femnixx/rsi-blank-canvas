import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import StudentRoute from "./components/StudentRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Workshops from "./pages/Workshops.jsx";
import WorkshopDetail from "./pages/WorkshopDetail.jsx";
import CreateWorkshop from "./pages/admin/CreateWorkshop.jsx";
import WorkshopAttendance from "./pages/admin/WorkshopAttendance.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminRegistration from "./pages/admin/AdminRegistration.jsx";
import AdminAttendance from "./pages/admin/AdminAttendance.jsx";
import AdminSchedules from "./pages/admin/AdminSchedules.jsx";
import AdminParticipants from "./pages/admin/AdminParticipants.jsx";
import AdminAudit from "./pages/admin/AdminAudit.jsx";
import MyWorkshops from "./pages/student/MyWorkshops.jsx";

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
          <p className="text-sm text-brand-muted">Loading…</p>
        </div>
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function AppLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-brand-bg">
      {isAuthenticated && <Sidebar />}
      <main className={isAuthenticated ? "lg:ml-64" : ""}>
        <AppRoutes />
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public-only — Auth */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      {/* Protected — Home (any authenticated user) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      {/* Public workshop pages */}
      <Route path="/workshops" element={<Workshops />} />
      <Route path="/workshops/:id" element={<WorkshopDetail />} />

      {/* Admin routes */}
      <Route
        path="/admin/create-workshop"
        element={
          <AdminRoute>
            <CreateWorkshop />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/create-workshop/:id/edit"
        element={
          <AdminRoute>
            <CreateWorkshop />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/workshops/:id/attendance"
        element={
          <AdminRoute>
            <WorkshopAttendance />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/registration"
        element={
          <AdminRoute>
            <AdminRegistration />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <AdminRoute>
            <AdminAttendance />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/schedules"
        element={
          <AdminRoute>
            <AdminSchedules />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/participants"
        element={
          <AdminRoute>
            <AdminParticipants />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <AdminRoute>
            <AdminAudit />
          </AdminRoute>
        }
      />

      {/* Student routes */}
      <Route
        path="/dashboard"
        element={
          <StudentRoute>
            <MyWorkshops />
          </StudentRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
