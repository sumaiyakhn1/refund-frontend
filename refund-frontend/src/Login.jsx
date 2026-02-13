import { useState } from "react";

export default function Login() {
    const API_URL = import.meta.env.VITE_API_URL ?? "https://refund-backend-1.onrender.com";
    const [role, setRole] = useState("student"); // 'student' | 'admin'
    const [id, setId] = useState("");
    const [password, setPassword] = useState(""); // DOB or Admin Password
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!id || !password) {
            alert("Please enter all fields");
            return;
        }

        setLoading(true);

        try {
            // Using the same endpoint but logic differs slightly
            // Using the same endpoint but logic differs slightly
            console.log("Logging in with:", `${API_URL}/login`);
            const res = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: id,
                    password: password,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.detail || `Login failed: ${res.status}`);
                } catch (e) {
                    throw new Error(`Login failed: ${res.status} ${text}`);
                }
            }

            const data = await res.json();

            // Role Mismatch Check
            if (data.role !== role) {
                throw new Error(`This account exists but is not a ${role} account.`);
            }

            if (data.role === "student") {
                localStorage.setItem("role", "student");
                localStorage.setItem("student_id", data.student_id);
                setMessage(`✅ Welcome, ${data.student_id}`);
                setTimeout(() => window.location.reload(), 1000);
            } else if (data.role === "admin") {
                localStorage.setItem("role", "admin");
                localStorage.setItem("admin_id", data.admin_id);
                setMessage("✅ Welcome Admin");
                setTimeout(() => window.location.reload(), 1000);
            }

        } catch (err) {
            setMessage(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="wrapper">
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div style={{ background: "#334155", padding: "12px", borderRadius: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
                    <img
                        src="/rksdlogo.png"
                        alt="Logo"
                        style={{ width: "180px" }}
                    />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#334155" }}>
                        {role === 'admin' ? 'Admin Portal' : 'Student Portal'}
                    </h2>
                    <p style={{ margin: 0, fontSize: "16px", color: "#64748b" }}>
                        Sign in to manage your refund applications
                    </p>
                </div>
            </div>

            {/* TAB SYSTEM */}
            <div className="tabs">
                <div
                    className={`tab ${role === 'student' ? 'active' : ''}`}
                    onClick={() => { setRole('student'); setMessage(""); setId(""); setPassword(""); }}
                >
                    Student Login
                </div>
                <div
                    className={`tab ${role === 'admin' ? 'active' : ''}`}
                    onClick={() => { setRole('admin'); setMessage(""); setId(""); setPassword(""); }}
                >
                    Admin Login
                </div>
            </div>

            <form onSubmit={handleLogin} className="form-group">
                <div className="input-group">
                    <label>{role === 'admin' ? 'Admin Username' : 'Registration Number'}</label>
                    <input
                        placeholder={role === 'admin' ? 'e.g. admin' : 'e.g. REG2024001'}
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="input-group">
                    <label>{role === 'admin' ? 'Password' : 'Date of Birth'}</label>
                    <input
                        type={role === 'admin' ? 'password' : 'text'}
                        placeholder={role === 'admin' ? 'Enter password' : 'DD-MM-YYYY'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Authenticating..." : `Sign In as ${role === 'admin' ? 'Admin' : 'Student'}`}
                </button>
            </form>

            <div style={{ marginTop: 32, textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
                <span>Crafted with ❤️ by <b>Okie Dokie</b></span>
            </div>

            {message && (
                <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>
                    {message}
                </div>
            )}
        </div>
    );
}
