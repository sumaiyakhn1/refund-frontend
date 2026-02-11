import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import StudentDashboard from "./StudentDashboard";

export default function App() {
  const role = localStorage.getItem("role");

  if (role === "admin") return <AdminDashboard />;
  if (role === "student") return <StudentDashboard />;

  return <Login />;
}
