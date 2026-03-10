import { useState, useEffect } from "react";
import { portalLogin } from "./services/authService";
import { getStudentDetails } from "./services/studentService";
import { getSecurityFee } from "./utils/feeMapping";

export default function Login({ isAdminRoute = false }) {
    const API_URL = import.meta.env.VITE_API_URL || "https://refund-backend-1.onrender.com";
    console.log("Current Backend URL:", API_URL);
    const [role, setRole] = useState(isAdminRoute ? "admin" : "student"); // 'student' | 'admin'
    
    // Detect pre-fill from URL
    const getInitialRegNo = () => {
        const params = new URLSearchParams(window.location.search || window.location.hash.split('?')[1]);
        return params.get("regNo") || "";
    };

    const [regNo, setRegNo] = useState(getInitialRegNo());
    const [adminId, setAdminId] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");

        if (role === 'student' && !regNo) {
            alert("Please enter Registration No");
            return;
        }

        if (role === 'admin' && (!adminId || !adminPassword)) {
            alert("Please enter admin credentials");
            return;
        }

        setLoading(true);

        try {
            if (role === 'admin') {
                const res = await fetch(`${API_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: adminId,
                        password: adminPassword,
                        role: 'admin'
                    }),
                });

                if (!res.ok) throw new Error("Invalid admin credentials");
                const data = await res.json();

                localStorage.setItem("role", "admin");
                localStorage.setItem("admin_id", data.admin_id);
                localStorage.setItem("permissions", JSON.stringify(data.permissions || "all"));

                setMessage("✅ Welcome Admin");
                setTimeout(() => window.location.reload(), 1000);
            } else {
                // Student Login via Official API
                const token = await portalLogin();
                if (!token) throw new Error("Authentication server unavailable");

                const student = await getStudentDetails(regNo);
                
                if (!student) throw new Error("Student not found in official records");

                // Store student details for pre-filling the form
                const mappedDetails = {
                    "Registration No": student.regNo || regNo,
                    "Student Name": student.studentName || student.name || "N/A",
                    "Fathers Name": student.fatherName || "N/A",
                    "Category": student.category || "N/A",
                    "Student Mobile No": student.phone || student.mobile || "N/A",
                    "course": student.course || student.courseName || "N/A",
                    "security": getSecurityFee(student.course || student.courseName),
                    "id": student.rollNo || student.id || regNo,
                    "photo": student.studentPhoto || student.photo || null
                };

                localStorage.setItem("role", "student");
                localStorage.setItem("student_id", mappedDetails.id);
                localStorage.setItem("student_name", mappedDetails["Student Name"]);
                localStorage.setItem("student_details", JSON.stringify(mappedDetails));
                localStorage.setItem("authToken", token);

                setMessage(`✅ Welcome, ${mappedDetails["Student Name"]}`);
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
            {loading && (
                <div className="fullscreen-loader">
                    <div className="spinner-container">
                        <div className="spiral-spinner"></div>
                        <div className="spiral-spinner reverse-spinner"></div>
                        <div className="loader-logos">
                            <img src="/rksdlogo1.jpeg" alt="RKSD" className="rksd-spin-logo" />
                            <img src="https://okiedokie-erp-images.s3.ap-south-1.amazonaws.com/Okie%20Dokie/2025/12/sourceURL/26aebcbe10f4ac5a3e8b-611ed1b9032568edd4f3-Okie_Dokie_App_icon__2___2_-removebg-preview.png" alt="Okie Dokie" className="okie-spin-logo" />
                        </div>
                    </div>
                    <h2>Authenticating...</h2>
                    <p>Connecting to secure server</p>
                </div>
            )}

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



                <form onSubmit={handleLogin} className="form-group">
                    {role === 'student' ? (
                        <div className="input-group">
                            <label>Registration No</label>
                            <input
                                placeholder="e.g. 1211982002614"
                                value={regNo}
                                onChange={(e) => setRegNo(e.target.value)}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="input-group">
                                <label>Admin Username</label>
                                <input
                                    placeholder="e.g. admin"
                                    value={adminId}
                                    onChange={(e) => setAdminId(e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                />
                            </div>
                        </>
                    )}

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
