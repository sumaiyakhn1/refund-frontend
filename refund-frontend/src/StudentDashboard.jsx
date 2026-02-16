import { useEffect, useState } from "react";

export default function StudentDashboard() {
    const API_URL = import.meta.env.VITE_API_URL ?? "https://refund-backend-1.onrender.com";
    const studentId = localStorage.getItem("student_id");

    const [loading, setLoading] = useState(true);
    const [record, setRecord] = useState(null);
    const [form, setForm] = useState({
        student_name: "",
        bank_name: "",
        account_no: "",
        ifsc: "",
        account_holder: "",
    });

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };

    // 🔹 Check if student already submitted
    useEffect(() => {
        console.log("Fetching student status from:", `${API_URL}/student/${studentId}`);
        fetch(`${API_URL}/student/${studentId}`)
            .then((res) => {
                if (res.status === 404) return null;
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                if (data) {
                    setRecord(data);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch student status:", err);
                setLoading(false);
            });
    }, [studentId]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            student_id: studentId,
            ...form,
            fee_cleared: "NO",
            library_cleared: "NO",
            scholarship_cleared: "NO",
            registration_cleared: "NO",
            status: "PENDING",
        };

        const res = await fetch(`${API_URL}/admin/student`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            alert("Failed to submit");
            return;
        }

        alert("Application submitted");
        window.location.reload();
    };

    if (loading) return <div className="wrapper text-center"><p>Loading student data...</p></div>;

    // ✅ SHOW STATUS VIEW
    if (record) {
        return (
            <div className="wrapper">
                <div className="dashboard-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <div style={{ background: "#334155", padding: "8px", borderRadius: "8px" }}>
                            <img src="/rksdlogo1.jpeg" alt="Logo" style={{ width: "100px" }} />
                        </div>
                        <div>
                            <h2 className="title" style={{ textAlign: "left", marginBottom: 0 }}>Application Status</h2>
                            <p className="subtitle" style={{ textAlign: "left", marginBottom: 0 }}>
                                Track your refund application
                            </p>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{ background: "#ef4444", padding: "8px 16px", fontSize: 12 }}>
                        Logout
                    </button>
                </div>

                <div className="form-group">
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                            <div>
                                <label style={{ fontSize: 12, color: "#64748b" }}>Student ID</label>
                                <div style={{ fontWeight: 600 }}>{record.student_id}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: "#64748b" }}>Name</label>
                                <div style={{ fontWeight: 600 }}>{record.student_name}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: "#64748b" }}>Applied Status</label>
                                <div>
                                    <span className={`badge ${record.status === 'APPROVED' ? 'badge-green' : record.status === 'REJECTED' ? 'badge-red' : 'badge-blue'}`}>
                                        {record.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <hr style={{ margin: "20px 0", border: 0, borderTop: "1px solid #e2e8f0" }} />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                            <div>
                                <label style={{ fontSize: 12, color: "#64748b" }}>Fee Clearance</label>
                                <div>
                                    <span className={`badge ${record.fee_cleared === 'YES' ? 'badge-green' : 'badge-red'}`}>
                                        {record.fee_cleared === 'YES' ? 'CLEARED' : 'PENDING'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: "#64748b" }}>Library Clearance</label>
                                <div>
                                    <span className={`badge ${record.library_cleared === 'YES' ? 'badge-green' : 'badge-red'}`}>
                                        {record.library_cleared === 'YES' ? 'CLEARED' : 'PENDING'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: "#64748b" }}>Scholarship Clearance</label>
                                <div>
                                    <span className={`badge ${record.scholarship_cleared === 'YES' ? 'badge-green' : 'badge-red'}`}>
                                        {record.scholarship_cleared === 'YES' ? 'CLEARED' : 'PENDING'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: "#64748b" }}>Registration Clearance</label>
                                <div>
                                    <span className={`badge ${record.registration_cleared === 'YES' ? 'badge-green' : 'badge-red'}`}>
                                        {record.registration_cleared === 'YES' ? 'CLEARED' : 'PENDING'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 📝 SHOW FORM (FIRST TIME)
    return (
        <div className="wrapper">
            <div className="dashboard-header">
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ background: "#334155", padding: "8px", borderRadius: "8px" }}>
                        <img src="/rksdlogo1.jpeg" alt="Logo" style={{ width: "100px" }} />
                    </div>
                    <div>
                        <h2 className="title" style={{ textAlign: "left", marginBottom: 0 }}>Refund Application</h2>
                        <p className="subtitle" style={{ textAlign: "left", marginBottom: 0 }}>
                            Please submit your bank details
                        </p>
                    </div>
                </div>
                <button onClick={handleLogout} style={{ background: "#ef4444", padding: "8px 16px", fontSize: 12 }}>
                    Logout
                </button>
            </div>

            <form onSubmit={handleSubmit} className="form-group">
                <div className="input-group">
                    <label>Student ID</label>
                    <input value={studentId} disabled style={{ background: "#f1f5f9" }} />
                </div>

                <div className="input-group">
                    <label>Student Name</label>
                    <input
                        name="student_name"
                        placeholder="Name as per bank records"
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Bank Name</label>
                    <input
                        name="bank_name"
                        placeholder="e.g. HDFC Bank"
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Account Number</label>
                    <input
                        name="account_no"
                        placeholder="Enter full account number"
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>IFSC Code</label>
                    <input
                        name="ifsc"
                        placeholder="e.g. HDFC0001234"
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Account Holder Name</label>
                    <input
                        name="account_holder"
                        placeholder="Beneficiary Name"
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" className="mt-4">
                    Submit Application
                </button>
            </form>
        </div>
    );
}
