import { useEffect, useState } from "react";

export default function AdminDashboard() {
    const [students, setStudents] = useState([]);
    const [msg, setMsg] = useState("");

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };

    // Load all students
    useEffect(() => {
        fetch("http://127.0.0.1:8000/admin/students")
            .then((res) => res.json())
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
        updated[index] = { ...updated[index], [field]: value };
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
            status: student.status,
        };

        try {
            const res = await fetch("http://127.0.0.1:8000/admin/student", {
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
                <div>
                    <h2 className="title" style={{ textAlign: "left", marginBottom: 4 }}>Admin Dashboard</h2>
                    <p className="subtitle" style={{ textAlign: "left", marginBottom: 0 }}>
                        Manage student applications and refunds
                    </p>
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
                                            style={{ border: "none", cursor: "pointer", fontSize: 12 }}
                                            value={s.fee_cleared}
                                            onChange={(e) => handleChange(i, "fee_cleared", e.target.value)}
                                        >
                                            <option value="NO">NO</option>
                                            <option value="YES">YES</option>
                                        </select>
                                    </td>

                                    <td>
                                        <select
                                            className={`badge ${s.library_cleared === 'YES' ? 'badge-green' : 'badge-red'}`}
                                            style={{ border: "none", cursor: "pointer", fontSize: 12 }}
                                            value={s.library_cleared}
                                            onChange={(e) => handleChange(i, "library_cleared", e.target.value)}
                                        >
                                            <option value="NO">NO</option>
                                            <option value="YES">YES</option>
                                        </select>
                                    </td>

                                    <td>
                                        <select
                                            style={{ padding: "6px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}
                                            value={s.status}
                                            onChange={(e) => handleChange(i, "status", e.target.value)}
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
