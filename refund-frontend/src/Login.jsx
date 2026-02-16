import { useState } from "react";

export default function Login() {
    const API_URL = import.meta.env.VITE_API_URL ?? "https://refund-backend-1.onrender.com";
    const [role, setRole] = useState("student"); // 'student' | 'admin'
    const [course, setCourse] = useState("");
    const [id, setId] = useState("");
    const [password, setPassword] = useState(""); // DOB or Admin Password
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const COURSES = [
        "b.a", "bcoma ided", "bcom sf", "bsc ele.", "bsc med.",
        "bsc nm", "bscn nm sf", "bsc cs", "b.voc", "bba",
        "bca", "eng", "hindi", "pol.sc.", "msc maths", "YOGA"
    ];

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!id || !password || (role === 'student' && !course)) {
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
                    course: role === 'student' ? course : null
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
                if (data.student_details) {
                    localStorage.setItem("student_details", JSON.stringify(data.student_details));
                }
                setMessage(`✅ Welcome, ${data.student_id}`);
                setTimeout(() => window.location.reload(), 1000);
            } else if (data.role === "admin") {
                localStorage.setItem("role", "admin");
                localStorage.setItem("admin_id", data.admin_id);
                // Store permissions if available, else default to 'all' (backward compatibility)
                localStorage.setItem("permissions", JSON.stringify(data.permissions || "all"));

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
        <>
            <div className="wrapper">
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "45px",
                    marginBottom: "32px",
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: "24px",
                    textAlign: "left"
                }}>
                    <img
                        src="/rksdlogo1.jpeg"
                        alt="Logo"
                        style={{ width: "120px", height: "auto" }}
                    />
                    <div>
                        <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "900", color: "#1e293b", textTransform: "uppercase", lineHeight: "1.1", letterSpacing: "0.5px" }}>
                            R.K.S.D. College
                        </h1>
                        <h2 style={{ margin: "6px 0 0 0", fontSize: "16px", fontWeight: "700", color: "#64748b", letterSpacing: "3px", textTransform: "uppercase" }}>
                            Kaithal, Haryana
                        </h2>
                    </div>
                </div>

                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#1e293b" }}>
                        {role === 'admin' ? 'Admin Portal' : 'Student Portal'}
                    </h3>
                    <p style={{ margin: "8px 0 0 0", fontSize: "15px", color: "#64748b" }}>
                        Sign in to manage your refund applications
                    </p>
                </div>

                {/* TAB SYSTEM */}
                <div className="tabs">
                    <div
                        className={`tab ${role === 'student' ? 'active' : ''}`}
                        onClick={() => { setRole('student'); setMessage(""); setId(""); setPassword(""); setCourse(""); }}
                    >
                        Student Login
                    </div>
                    <div
                        className={`tab ${role === 'admin' ? 'active' : ''}`}
                        onClick={() => { setRole('admin'); setMessage(""); setId(""); setPassword(""); setCourse(""); }}
                    >
                        Admin Login
                    </div>
                </div>

                <form onSubmit={handleLogin} className="form-group">
                    {role === 'student' && (
                        <div className="input-group">
                            <label>Class / Course</label>
                            <select
                                value={course}
                                onChange={(e) => setCourse(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    color: "#334155",
                                    outline: "none",
                                    background: "#fff"
                                }}
                            >
                                <option value="">Select your course</option>
                                {COURSES.map(c => (
                                    <option key={c} value={c}>{c.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="input-group">
                        <label>{role === 'admin' ? 'Admin Username' : 'Registration Number'}</label>
                        <input
                            placeholder={role === 'admin' ? 'e.g. admin' : 'e.g. REG2024001'}
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                        // Autofocus only if this field is empty to be polite
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter password"
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

            <div style={{ position: "fixed", bottom: 20, right: 20, display: "flex", alignItems: "center", gap: 8, opacity: 0.8, zIndex: 100 }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Partner</span>
                <img
                    src="https://okiedokie-erp-images.s3.ap-south-1.amazonaws.com/Okie%20Dokie/2025/12/sourceURL/26aebcbe10f4ac5a3e8b-611ed1b9032568edd4f3-Okie_Dokie_App_icon__2___2_-removebg-preview.png"
                    alt="Okie Dokie"
                    style={{ height: "24px", width: "auto" }}
                />
            </div>
        </>
    );
}
