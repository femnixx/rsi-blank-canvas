import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import StudentRoute from "./components/StudentRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Workshops from "./pages/Workshops.jsx";
import WorkshopDetail from "./pages/WorkshopDetail.jsx";
import CreateWorkshop from "./pages/admin/CreateWorkshop.jsx";
import MyWorkshops from "./pages/student/MyWorkshops.jsx";

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-brand-bg px-6">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Protected — Home (any authenticated user) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

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

        {/* Workshop catalog — public */}
        <Route path="/workshops" element={<Workshops />} />
        <Route path="/workshops/:id" element={<WorkshopDetail />} />

        {/* Admin-only — Workshop management */}
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

        {/* Student-only — Dashboard */}
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
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
