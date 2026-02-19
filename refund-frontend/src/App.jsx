import { useEffect } from "react";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import StudentDashboard from "./StudentDashboard";
import { portalLogin } from "./services/authService";

export default function App() {
  useEffect(() => {
    portalLogin();
  }, []);

  const role = localStorage.getItem("role");


  if (role === "admin") return <AdminDashboard />;
  if (role === "student") return <StudentDashboard />;

  return <Login />;
}
