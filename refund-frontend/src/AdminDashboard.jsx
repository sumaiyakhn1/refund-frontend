import { useEffect, useState } from "react";
import StudentDetailModal from "./StudentDetailModal";

export default function AdminDashboard() {
    const API_URL = import.meta.env.VITE_API_URL ?? "https://refund-backend-1.onrender.com";
    const [students, setStudents] = useState([]);
    const [msg, setMsg] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState(null);

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

    const getRowTint = (student) => {
        const clearances = [
            student.fee_cleared,
            student.library_cleared,
            student.scholarship_cleared,
            student.registration_cleared
        ];

        const allYes = clearances.every(c => c === "YES");
        const allNo = clearances.every(c => c === "NO");

        // using level 50 tints for very subtle visibility
        if (allYes) return "#f0fdf4";
        if (allNo) return "#fef2f2";
        return "#fff7ed";
    };

    return (
        <div className="admin-wrapper">
            <div className="dashboard-header">
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ background: "#334155", padding: "8px", borderRadius: "8px" }}>
                        <img src="/rksdlogo1.jpeg" alt="RKSD College Logo" style={{ width: "100px" }} />
                    </div>
                    <div>
                        <h2 className="title" style={{ textAlign: "left", marginBottom: 4, color: "white" }}>
                            Admin Dashboard ({adminId})
                        </h2>
                        <p className="subtitle" style={{ textAlign: "left", marginBottom: 0, color: "white" }}>
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
                                <th>Submitted On</th>
                                <th>Name</th>
                                <th>Bank Details</th>
                                <th className="text-center">Fee</th>
                                <th className="text-center">Library</th>
                                <th className="text-center">Scholarship</th>
                                <th className="text-center">Registration</th>
                                <th className="text-center">Status</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {students.map((s, i) => (
                                <tr key={s.student_id} style={{ backgroundColor: getRowTint(s) }}>
                                    <td style={{ fontWeight: 600 }}>{s.student_id}</td>
                                    <td style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>
                                        {s.timestamp || s.Timestamp || "-"}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{s.student_name}</div>
                                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{s.dob}</div>
                                    </td>
                                    <td>
                                        <div>{s.bank_name}</div>
                                        <div style={{ fontSize: 12, color: "#64748b" }}>{s.account_no}</div>
                                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.ifsc}</div>
                                    </td>

                                    <td className="text-center">
                                        <div
                                            className={`badge ${s.fee_cleared === 'YES' ? 'badge-green' : 'badge-red'}`}
                                            onClick={() => setSelectedStudentId(s.student_id)}
                                            style={{ cursor: "pointer", justifyContent: "center", minWidth: "80px" }}
                                        >
                                            {s.fee_cleared}
                                        </div>
                                    </td>

                                    <td className="text-center">
                                        <div
                                            className={`badge ${s.library_cleared === 'YES' ? 'badge-green' : 'badge-red'}`}
                                            onClick={() => setSelectedStudentId(s.student_id)}
                                            style={{ cursor: "pointer", justifyContent: "center", minWidth: "80px" }}
                                        >
                                            {s.library_cleared}
                                        </div>
                                    </td>

                                    <td className="text-center">
                                        <div
                                            className={`badge ${s.scholarship_cleared === 'YES' ? 'badge-green' : 'badge-red'}`}
                                            onClick={() => setSelectedStudentId(s.student_id)}
                                            style={{ cursor: "pointer", justifyContent: "center", minWidth: "80px" }}
                                        >
                                            {s.scholarship_cleared}
                                        </div>
                                    </td>

                                    <td className="text-center">
                                        <div
                                            className={`badge ${s.registration_cleared === 'YES' ? 'badge-green' : 'badge-red'}`}
                                            onClick={() => setSelectedStudentId(s.student_id)}
                                            style={{ cursor: "pointer", justifyContent: "center", minWidth: "80px" }}
                                        >
                                            {s.registration_cleared}
                                        </div>
                                    </td>

                                    <td className="text-center">
                                        <div
                                            className={`badge ${s.status === 'APPROVED' ? 'badge-green' : s.status === 'REJECTED' ? 'badge-red' : 'badge-orange'}`}
                                            style={{ padding: "6px", borderRadius: 6, fontSize: 12, fontWeight: 600, justifyContent: "center", minWidth: "100px" }}
                                        >
                                            {s.status}
                                        </div>
                                    </td>

                                    <td className="text-center">
                                        <button
                                            onClick={() => setSelectedStudentId(s.student_id)}
                                            style={{ padding: "8px 16px", fontSize: 12, background: "#3b82f6", color: "white", minWidth: "120px" }}
                                        >
                                            View & Action
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedStudentId && (
                <StudentDetailModal
                    studentId={selectedStudentId}
                    currentStudent={students.find(s => s.student_id === selectedStudentId)}
                    permissions={permissions}
                    onUpdate={(field, value) => {
                        const index = students.findIndex(s => s.student_id === selectedStudentId);
                        if (index !== -1) handleChange(index, field, value);
                    }}
                    onSave={handleSave}
                    onClose={() => setSelectedStudentId(null)}
                />
            )}
        </div>
    );
}
