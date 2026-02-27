import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import StudentDashboard from "./StudentDashboard";
import { portalLogin } from "./services/authService";

export default function App() {
  useEffect(() => {
    portalLogin();
  }, []);

  const role = localStorage.getItem("role");

  return (
    <Routes>
      <Route
        path="/"
        element={
          role === "admin" ? <Navigate to="/admin" replace /> :
            role === "student" ? <StudentDashboard /> :
              <Login key="student-login" isAdminRoute={false} />
        }
      />
      <Route
        path="/admin"
        element={
          role === "student" ? <Navigate to="/" replace /> :
            role === "admin" ? <AdminDashboard /> :
              <Login key="admin-login" isAdminRoute={true} />
        }
      />
    </Routes>
  );
}
