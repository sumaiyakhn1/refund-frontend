import { useEffect, useState } from "react";
import StudentDetailModal from "./StudentDetailModal";

export default function AdminDashboard() {
    const API_URL = import.meta.env.VITE_API_URL || "https://refund-backend-1.onrender.com";
    console.log("Current Backend URL:", API_URL);
    const [students, setStudents] = useState([]);
    const [msg, setMsg] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredStudents = students.filter(s => {
        if (statusFilter === "ALL") return true;
        const sStatus = s.status ? s.status.toUpperCase() : "";
        if (statusFilter === "CLEARED") return sStatus === "APPROVED" || sStatus === "CLEARED";
        return sStatus === statusFilter;
    });

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

    // Get role and permissions
    const role = localStorage.getItem("role");
    const adminId = localStorage.getItem("admin_id");

    let permissions = "all";
    try {
        permissions = JSON.parse(localStorage.getItem("permissions"));
    } catch (e) {
        permissions = "all"; // Fallback
    }

    const handleDownload = () => {
        const hasApproved = students.some(s => s.status === 'APPROVED');
        if (!hasApproved) {
            alert("There are currently no approved entries to download.");
            return;
        }
        window.open(`${API_URL}/admin/download`, "_blank");
    };

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
            student_id: String(student.student_id || ""),
            student_name: student.student_name != null ? String(student.student_name) : null,
            bank_name: student.bank_name != null ? String(student.bank_name) : null,
            account_no: student.account_no != null ? String(student.account_no) : null,
            ifsc: student.ifsc != null ? String(student.ifsc) : null,
            account_holder: student.account_holder != null ? String(student.account_holder) : null,
            mother_name: student.mother_name != null ? String(student.mother_name) : null,
            contact_mobile: student.contact_mobile != null ? String(student.contact_mobile) : null,
            fee_cleared: student.fee_cleared != null ? String(student.fee_cleared) : null,
            library_cleared: student.library_cleared != null ? String(student.library_cleared) : null,
            scholarship_cleared: student.scholarship_cleared != null ? String(student.scholarship_cleared) : null,
            registration_cleared: student.registration_cleared != null ? String(student.registration_cleared) : null,
            status: student.status != null ? String(student.status) : null,
            remark: student.remark != null ? String(student.remark) : null,
            engaged: student.engaged != null ? String(student.engaged) : null,
            security: student.security != null ? String(student.security) : null,
            course: student.course != null ? String(student.course) : null,
        };



        try {
            const res = await fetch(`${API_URL}/admin/student`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                let errorMsg = data.detail || "Update failed";
                if (typeof errorMsg === 'object') {
                    errorMsg = JSON.stringify(errorMsg);
                }
                setMsg(`❌ ${errorMsg}`);
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
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={handleDownload}
                        style={{ background: "#059669", padding: "10px 20px" }}
                    >
                        📊 Download Excel
                    </button>
                    <button
                        onClick={handleLogout}
                        style={{ background: "#ef4444", padding: "10px 20px" }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {msg && (
                <div className={`alert ${msg.includes('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
                    {msg}
                </div>
            )}

            {/* Dashboard Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>TOTAL</div>
                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", marginTop: "8px" }}>{students.length}</div>
                </div>
                <div style={{ padding: "20px", background: "#fffbeb", borderRadius: "12px", border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>PENDING</div>
                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#d97706", marginTop: "8px" }}>
                        {students.filter(s => !s.status || s.status.toUpperCase() === "PENDING").length}
                    </div>
                </div>
                <div style={{ padding: "20px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>APPROVED</div>
                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#16a34a", marginTop: "8px" }}>
                        {students.filter(s => s.status && (s.status.toUpperCase() === "APPROVED" || s.status.toUpperCase() === "CLEARED")).length}
                    </div>
                </div>
                <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>TODAY</div>
                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", marginTop: "8px" }}>
                        {students.filter(s => {
                            if (!s.timestamp && !s.Timestamp) return false;
                            const ts = s.timestamp || s.Timestamp;
                            const dateStr = ts.split(" ")[0];
                            const today = new Date();
                            const ymd = today.toISOString().split("T")[0];
                            const dmy = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
                            return dateStr === ymd || dateStr === dmy;
                        }).length}
                    </div>
                </div>
            </div>

            <div className="card">
                <div style={{ overflowX: "auto" }}>
                    <table>
                        <thead>
                            <tr>
                                <th>S.No.</th>
                                <th>ID</th>
                                <th>Submitted On</th>
                                <th>Name</th>

                                <th>Bank Details</th>

                                <th className="text-center">Fee</th>
                                <th className="text-center">Library</th>
                                <th className="text-center">Scholarship</th>
                                <th className="text-center">Registration</th>
                                <th className="text-center" title="Engaged Status" style={{ padding: "8px 4px", width: "50px", cursor: "default" }}>🔗</th>
                                <th className="text-center">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            padding: "4px", borderRadius: "4px", border: "none",
                                            background: "transparent", fontWeight: "700",
                                            color: "#64748b", fontSize: "11px", textTransform: "uppercase",
                                            cursor: "pointer",
                                            minWidth: "100px",
                                            textAlign: "center"
                                        }}
                                    >
                                        <option value="ALL">STATUS (ALL)</option>
                                        <option value="PENDING">PENDING</option>
                                        <option value="CLEARED">CLEARED</option>
                                        <option value="REJECTED">REJECTED</option>
                                    </select>
                                </th>
                                <th className="text-center" style={{ minWidth: "150px" }}>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentItems.map((s, i) => (
                                <tr key={s.student_id} style={{ backgroundColor: getRowTint(s) }}>
                                    <td style={{ fontWeight: 600 }}>{startIndex + i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{s.student_id}</td>
                                    <td style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>
                                        {(() => {
                                            const ts = s.timestamp || s.Timestamp || "-";
                                            const [date, time] = ts.split(" ");
                                            return time ? <>{date}<br />{time}</> : ts;
                                        })()}
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

                                    {/* Engaged toggle slider */}
                                    <td className="text-center" style={{ padding: "0 4px", width: "50px" }}>
                                        <div
                                            title={s.engaged === "YES" ? "Engaged" : "Not Engaged"}
                                            onClick={() => {
                                                const index = students.findIndex(st => st.student_id === s.student_id);
                                                const newVal = s.engaged === "YES" ? "NO" : "YES";
                                                handleChange(index, "engaged", newVal);
                                                handleSave({ ...s, engaged: newVal });
                                            }}
                                            style={{
                                                display: "inline-block",
                                                width: "32px", height: "18px", borderRadius: "9px",
                                                background: s.engaged === "YES" ? "#22c55e" : "#cbd5e1",
                                                position: "relative", cursor: "pointer",
                                                transition: "background 0.25s"
                                            }}
                                        >
                                            <div style={{
                                                width: "12px", height: "12px", borderRadius: "50%",
                                                background: "white", position: "absolute",
                                                top: "3px",
                                                left: s.engaged === "YES" ? "17px" : "3px",
                                                transition: "left 0.25s",
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
                                            }} />
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
                                            style={{ padding: "8px 16px", fontSize: 12, background: "#3b82f6", color: "white", minWidth: "100px", whiteSpace: "nowrap" }}
                                        >
                                            Action
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", padding: "15px" }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: "8px 16px",
                                background: currentPage === 1 ? "#cbd5e1" : "#3b82f6",
                                color: "white",
                                borderRadius: "6px",
                                border: "none",
                                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                fontWeight: "600"
                            }}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: "8px 16px",
                                background: currentPage === totalPages ? "#cbd5e1" : "#3b82f6",
                                color: "white",
                                borderRadius: "6px",
                                border: "none",
                                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                fontWeight: "600"
                            }}
                        >
                            Next
                        </button>
                    </div>
                )}
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
