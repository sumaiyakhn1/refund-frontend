import { useEffect, useState } from "react";

export default function AdminDashboard() {
    const API_URL = import.meta.env.VITE_API_URL ?? "https://refund-backend-1.onrender.com";
    const [students, setStudents] = useState([]);
    const [msg, setMsg] = useState("");

    // Get role and permissions
    const role = localStorage.getItem("role");
    const adminId = localStorage.getItem("admin_id");

    let permissions = "all";
    try {
        permissions = JSON.parse(localStorage.getItem("permissions"));
    } catch (e) {
        permissions = "all"; // Fallback
    }

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };

    // Helper: Check if user can edit a specific field
    const canEdit = (field) => {
        if (permissions === "all") return true;
        return permissions === field;
    };

    // Load all students
    useEffect(() => {
        console.log("Fetching students from:", `${API_URL}/admin/students`);
        fetch(`${API_URL}/admin/students`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) {
                    setStudents(data);
                } else {
                    setStudents([]); // Fallback
                    console.error("API returned non-array:", data);
                }
            })
            .catch((err) => {
                console.error("Failed to load students", err);
                setMsg("❌ Failed to load student data. Is the backend running?");
            });
    }, []);

    const handleChange = (index, field, value) => {
        const updated = [...students];
        const student = { ...updated[index], [field]: value };

        // ================= AUTOMATIC STATUS LOGIC =================
        // Logic: 
        // 1. If ALL 4 clearances are "YES" -> Status "APPROVED"
        // 2. If ANY is "NO" -> Status "PENDING"
        // 3. Exception: If status is manually set to "REJECTED", keep it? 
        //    Current Requirement: "logic if all is false then pending if all true accepted"
        //    Let's enforce: Auto-logic overrides Pending/Approved. Rejected is sticky unless all YES?
        //    Simpler: Just calculate it based on clearance.

        // Only run this logic if we are editing a clearance field
        const clearanceFields = ["fee_cleared", "library_cleared", "scholarship_cleared", "registration_cleared"];

        if (clearanceFields.includes(field)) {
            const allYes =
                student.fee_cleared === "YES" &&
                student.library_cleared === "YES" &&
                student.scholarship_cleared === "YES" &&
                student.registration_cleared === "YES";

            if (allYes) {
                student.status = "APPROVED";
            } else {
                // If it was APPROVED, move back to PENDING. 
                // If it was REJECTED, user might want to keep it rejected?
                // Requirement said "if all is false then pending". 
                // Let's assume if not all YES and not REJECTED, it should be PENDING.
                // Or maybe even if REJECTED, if we fix a clearance, should it go to pending?
                // Safest bet for "Auto": 
                if (student.status !== "REJECTED") {
                    student.status = "PENDING";
                }
            }
        }

        // Update the array
        updated[index] = student;
        setStudents(updated);
    };

    const handleSave = async (student) => {
        setMsg("Saving...");

        // 🔒 Strip fields backend does not accept
        const payload = {
            student_id: String(student.student_id),
            student_name: student.student_name,
            bank_name: student.bank_name,
            account_no: String(student.account_no),
            ifsc: String(student.ifsc),
            account_holder: student.account_holder,
            fee_cleared: student.fee_cleared,
            library_cleared: student.library_cleared,
            scholarship_cleared: student.scholarship_cleared,
            registration_cleared: student.registration_cleared,
            status: student.status,
        };

        try {
            const res = await fetch(`${API_URL}/admin/student`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setMsg(`❌ ${data.detail || "Update failed"}`);
                return;
            }

            setMsg(`✅ Student ${payload.student_id} updated successfully`);
        } catch (err) {
            setMsg("❌ Network error");
            console.error(err);
        }
    };

    return (
        <div className="admin-wrapper">
            <div className="dashboard-header">
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ background: "#334155", padding: "8px", borderRadius: "8px" }}>
                        <img src="/rksdlogo.png" alt="Logo" style={{ width: "100px" }} />
                    </div>
                    <div>
                        <h2 className="title" style={{ textAlign: "left", marginBottom: 4 }}>
                            Admin Dashboard ({adminId})
                        </h2>
                        <p className="subtitle" style={{ textAlign: "left", marginBottom: 0 }}>
                            {permissions === 'all' ? 'Super Admin Access' : `Role: ${permissions}`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    style={{ background: "#ef4444", padding: "10px 20px" }}
                >
                    Logout
                </button>
            </div>

            {msg && (
                <div className={`alert ${msg.includes('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
                    {msg}
                </div>
            )}

            <div className="card">
                <div style={{ overflowX: "auto" }}>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Bank Details</th>
                                <th>Fee Cleared</th>
                                <th>Library Cleared</th>
                                <th>Scholarship Cleared</th>
                                <th>Registration Cleared</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {students.map((s, i) => (
                                <tr key={s.student_id}>
                                    <td style={{ fontWeight: 600 }}>{s.student_id}</td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{s.student_name}</div>
                                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{s.dob}</div>
                                    </td>
                                    <td>
                                        <div>{s.bank_name}</div>
                                        <div style={{ fontSize: 12, color: "#64748b" }}>{s.account_no}</div>
                                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.ifsc}</div>
                                    </td>

                                    <td>
                                        <select
                                            className={`badge ${s.fee_cleared === 'YES' ? 'badge-green' : 'badge-red'}`}
                                            style={{ border: "none", cursor: canEdit('fee_cleared') ? "pointer" : "not-allowed", fontSize: 12, opacity: canEdit('fee_cleared') ? 1 : 0.6 }}
                                            value={s.fee_cleared}
                                            onChange={(e) => handleChange(i, "fee_cleared", e.target.value)}
                                            disabled={!canEdit('fee_cleared')}
                                        >
                                            <option value="NO">NO</option>
                                            <option value="YES">YES</option>
                                        </select>
                                    </td>

                                    <td>
                                        <select
                                            className={`badge ${s.library_cleared === 'YES' ? 'badge-green' : 'badge-red'}`}
                                            style={{ border: "none", cursor: canEdit('library_cleared') ? "pointer" : "not-allowed", fontSize: 12, opacity: canEdit('library_cleared') ? 1 : 0.6 }}
                                            value={s.library_cleared}
                                            onChange={(e) => handleChange(i, "library_cleared", e.target.value)}
                                            disabled={!canEdit('library_cleared')}
                                        >
                                            <option value="NO">NO</option>
                                            <option value="YES">YES</option>
                                        </select>
                                    </td>

                                    <td>
                                        <select
                                            className={`badge ${s.scholarship_cleared === 'YES' ? 'badge-green' : 'badge-red'}`}
                                            style={{ border: "none", cursor: canEdit('scholarship_cleared') ? "pointer" : "not-allowed", fontSize: 12, opacity: canEdit('scholarship_cleared') ? 1 : 0.6 }}
                                            value={s.scholarship_cleared}
                                            onChange={(e) => handleChange(i, "scholarship_cleared", e.target.value)}
                                            disabled={!canEdit('scholarship_cleared')}
                                        >
                                            <option value="NO">NO</option>
                                            <option value="YES">YES</option>
                                        </select>
                                    </td>

                                    <td>
                                        <select
                                            className={`badge ${s.registration_cleared === 'YES' ? 'badge-green' : 'badge-red'}`}
                                            style={{ border: "none", cursor: canEdit('registration_cleared') ? "pointer" : "not-allowed", fontSize: 12, opacity: canEdit('registration_cleared') ? 1 : 0.6 }}
                                            value={s.registration_cleared}
                                            onChange={(e) => handleChange(i, "registration_cleared", e.target.value)}
                                            disabled={!canEdit('registration_cleared')}
                                        >
                                            <option value="NO">NO</option>
                                            <option value="YES">YES</option>
                                        </select>
                                    </td>

                                    <td>
                                        <select
                                            style={{
                                                padding: "6px",
                                                borderRadius: 6,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: canEdit('all') ? "pointer" : "not-allowed",
                                                opacity: canEdit('all') ? 1 : 0.7
                                            }}
                                            value={s.status}
                                            onChange={(e) => handleChange(i, "status", e.target.value)}
                                            disabled={!canEdit('all')}
                                        >
                                            <option value="PENDING">PENDING</option>
                                            <option value="APPROVED">APPROVED</option>
                                            <option value="REJECTED">REJECTED</option>
                                        </select>
                                    </td>

                                    <td>
                                        <button
                                            onClick={() => handleSave(s)}
                                            style={{ padding: "8px 16px", fontSize: 12 }}
                                        >
                                            Save
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
