import { useEffect, useState } from "react";
import { getStudentDetails } from "./services/studentService";
import "./StudentDashboard.css";

export default function StudentDashboard() {
    const API_URL = import.meta.env.VITE_API_URL || "https://refund-backend-1.onrender.com";
    console.log("Current Backend URL:", API_URL);
    const studentId = localStorage.getItem("student_id");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [record, setRecord] = useState(null);
    const [liveDetails, setLiveDetails] = useState(null);

    // Auto-fill form from login details
    const studentAuthDetails = JSON.parse(localStorage.getItem("student_details") || "{}");

    const [form, setForm] = useState({
        student_name: studentAuthDetails["Student Name"] || "",
        bank_name: "",
        account_no: "",
        ifsc: "",
        account_holder: "",
        mother_name: "",
        contact_mobile: "",
    });

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };

    // 🔹 1. Check if student already submitted to local backend
    useEffect(() => {
        console.log("Fetching student status from:", `${API_URL}/student/${studentId}`);
        fetch(`${API_URL}/student/${studentId}`)
            .then((res) => {
                if (res.status === 404) return null;
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                if (data) setRecord(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch student status:", err);
                setLoading(false);
            });
    }, [studentId, API_URL]);

    // 🔹 2. Fetch LIVE details from official API
    useEffect(() => {
        const regNo = studentAuthDetails["Registration No"] || studentId;
        if (!regNo) return;

        getStudentDetails(regNo)
            .then(res => {
                const student = res.data || res;
                if (student) {
                    setLiveDetails({
                        "Registration No": student.regNo || regNo,
                        "Student Name": student.studentName || student.name || "N/A",
                        "Fathers Name": student.fatherName || "N/A",
                        "Category": student.category || "N/A",
                        "Student Mobile No": student.phone || student.mobile || "N/A",
                        "course": student.course || student.courseName || student.programName || "N/A",
                        "photo": student.studentPhoto || student.photo || null
                    });
                }
            })
            .catch(err => console.error("Live fetch error:", err));
    }, [studentId, studentAuthDetails["Registration No"]]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const currentCourse = String(liveDetails?.["course"] || studentAuthDetails["course"] || "");
        let securityAmount = String(studentAuthDetails["security"] || "");

        // Auto-set 2000 security for specific SFS courses
        const sfsCourses = [
            "Bachelor of Science (Non Medical) (Self Finance)",
            "Bachelor of Science (Computer Science) (Self Finance)",
            "Bachelor of Vocational in Banking, Financial Service",
            "Bachelor of Business Administration",
            "Bachelor of Computer Applications",
            // Also matching shorthand if they appear
            "B.Sc. (Non-Medical) SFS - SFS",
            "B.Sc. ( computer science ) - SFS",
            "non-medical sfs",
            "computer science",
            "banking",
            "b.voc",
            "bba",
            "bca"
        ];

        if (sfsCourses.some(c => currentCourse.toLowerCase().includes(c.toLowerCase()))) {
            securityAmount = "2000";
        }

        const payload = {
            student_id: studentId,
            ...form,
            fee_cleared: "NO",
            library_cleared: "NO",
            scholarship_cleared: "NO",
            registration_cleared: "NO",
            status: "PENDING",
            security: securityAmount,
            course: currentCourse,
            student_mobile: String(liveDetails?.["Student Mobile No"] || studentAuthDetails["Student Mobile No"] || ""),
            photo: liveDetails?.["photo"] || studentAuthDetails["photo"] || null
        };

        try {
            const res = await fetch(`${API_URL}/admin/student`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                setErrorMessage("Failed to submit. Please check your data and try again.");
                setSubmitting(false);
                return;
            }

            setShowSuccess(true);
        } catch (error) {
            console.error("Submission error:", error);
            setErrorMessage("An error occurred during submission. Please check your connection.");
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="wrapper" style={{ textAlign: "center", padding: "40px 20px" }}>
            <p>Loading student data...</p>
            <button onClick={handleLogout} style={{ marginTop: "20px", background: "#f87171", padding: "8px 16px", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer" }}>
                Logout
            </button>
        </div>
    );
    // ✅ SHOW STATUS VIEW
    if (record) {
        return (
            <div className="dashboard-wrapper">
                <div className="premium-header">
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "12px", backdropFilter: "blur(4px)" }}>
                        <img src="/rksdlogo1.jpeg" alt="Logo" style={{ width: "80px" }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Application Status</h2>
                        <p style={{ fontSize: '14px', opacity: 0.8, margin: 0 }}>Track your refund progress</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                    Logout Account
                </button>
            </div>

                {/* Student Details Card */}
                <div className="glass-card student-info-card" style={{ padding: "24px", marginBottom: "24px", display: "flex", gap: "32px", alignItems: "center" }}>
                    {(liveDetails?.photo || studentAuthDetails.photo) && (
                        <div style={{ flexShrink: 0 }}>
                            <img 
                                src={liveDetails?.photo || studentAuthDetails.photo} 
                                alt="Student" 
                                className="student-photo"
                                style={{ width: "120px", height: "140px" }}
                            />
                        </div>
                    )}
                    <div style={{ flexGrow: 1 }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#334155", marginBottom: "20px", borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>Student Information</h3>
                        <div className="info-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
                            {[
                                { label: "Registration No", key: "Registration No" },
                                { label: "Student Name", key: "Student Name" },
                                { label: "Fathers Name", key: "Fathers Name" },
                                { label: "Category", key: "Category" },
                                { label: "Student Mobile No", key: "Student Mobile No" },
                                { label: "Course", key: "course" }
                            ].map((item) => {
                                const detailsToUse = liveDetails || studentAuthDetails;
                                const value = detailsToUse[item.key]
                                    || detailsToUse[item.key.replace('.', '')]
                                    || (item.label === "Student Mobile No" ? (detailsToUse["student_mobile"] || detailsToUse["Student Mobile"]) : null)
                                    || (item.label === "Course" ? (detailsToUse["Course"] || detailsToUse["course"]) : null)
                                    || "N/A";
                                return (
                                    <div key={item.label} className="info-item">
                                        <span className="info-label">{item.label}</span>
                                        <span className="info-value">{value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "20px", borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>Application Details</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Applied Status</span>
                            <span className="info-value">
                                <span className={`badge ${record.status === 'APPROVED' ? 'badge-green' : record.status === 'REJECTED' ? 'badge-red' : 'badge-blue'}`}>
                                    {record.status}
                                </span>
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Security Amount</span>
                            <span className="info-value">₹{record.security || "—"}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Student ID</span>
                            <span className="info-value">{record.student_id}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Student Name</span>
                            <span className="info-value">{record.student_name}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Mother Name</span>
                            <span className="info-value">{record.mother_name || "—"}</span>
                        </div>
                    </div>

                    {record.remark && (
                        <div style={{ marginTop: "32px", padding: "20px", background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: "12px" }}>
                            <label style={{ fontSize: "11px", color: "#9a3412", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>Admin Remark</label>
                            <div style={{ color: "#9a3412", fontSize: "15px", fontWeight: "500", lineHeight: "1.6" }}>
                                {record.remark}
                            </div>
                        </div>
                    )}

                    <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginTop: "40px", marginBottom: "20px", borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>Department Clearances</h3>
                    <div className="info-grid">
                        {[
                            { label: "Fee Clearance", value: record.fee_cleared },
                            { label: "Library Clearance", value: record.library_cleared },
                            { label: "Scholarship Clearance", value: record.scholarship_cleared },
                            { label: "Registration Clearance", value: record.registration_cleared }
                        ].map((clearance) => (
                            <div key={clearance.label} className="info-item">
                                <span className="info-label">{clearance.label}</span>
                                <span className="info-value">
                                    <span className={`badge ${clearance.value === 'YES' ? 'badge-green' : 'badge-red'}`}>
                                        {clearance.value === 'YES' ? 'CLEARED' : 'PENDING'}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 📝 SHOW FORM (FIRST TIME)
    return (
        <div className="dashboard-wrapper">
            <div className="premium-header">
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "12px", backdropFilter: "blur(4px)" }}>
                        <img src="/rksdlogo1.jpeg" alt="Logo" style={{ width: "80px" }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Refund Portal</h2>
                        <p style={{ fontSize: '14px', opacity: 0.8, margin: 0 }}>Application Status & Tracking</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                    Logout Account
                </button>
            </div>

            {/* Student Profile Card */}
            <div className="glass-card student-info-card" style={{ padding: "24px", marginBottom: "32px", display: "flex", gap: "32px", alignItems: "center" }}>
                {(liveDetails?.photo || studentAuthDetails.photo) && (
                    <div style={{ flexShrink: 0 }}>
                        <img 
                            src={liveDetails?.photo || studentAuthDetails.photo} 
                            alt="Student" 
                            className="student-photo"
                            style={{ width: "120px", height: "140px" }}
                        />
                    </div>
                )}
                <div style={{ flexGrow: 1 }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "20px", borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>Student Profile</h3>
                    <div className="info-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
                        {[
                            { label: "Registration No", key: "Registration No" },
                            { label: "Student Name", key: "Student Name" },
                            { label: "Fathers Name", key: "Fathers Name" },
                            { label: "Category", key: "Category" },
                            { label: "Student Mobile No", key: "Student Mobile No" },
                            { label: "Course", key: "course" }
                        ].map((item) => {
                            const detailsToUse = liveDetails || studentAuthDetails;
                            const value = detailsToUse[item.key]
                                || detailsToUse[item.key.toLowerCase()]
                                || detailsToUse[item.key.replace('.', '')]
                                || (item.label === "Student Mobile No" ? (detailsToUse["student_mobile"] || detailsToUse["Student Mobile"]) : null)
                                || (item.label === "Course" ? (detailsToUse["Course"] || detailsToUse["course"]) : null)
                                || "N/A";
                            return (
                                <div key={item.label} className="info-item">
                                    <span className="info-label">{item.label}</span>
                                    <span className="info-value">{value}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '32px' }}>
                <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '700' }}>Refund Application Form</h3>
                <form onSubmit={handleSubmit} className="form-group">
                <div className="input-group">
                    <label>Student ID</label>
                    <input value={studentId} disabled style={{ background: "#f1f5f9" }} />
                </div>

                <div className="input-group">
                    <label>Student Name</label>
                    <input
                        name="student_name"
                        value={form.student_name}
                        readOnly
                        style={{ background: "#f1f5f9", cursor: "not-allowed" }}
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

                <div className="input-group">
                    <label>Mother Name</label>
                    <input
                        name="mother_name"
                        placeholder="Enter Mother's Name"
                        value={form.mother_name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Contact Mobile Number</label>
                    <input
                        name="contact_mobile"
                        placeholder="Enter another mobile number for contact"
                        value={form.contact_mobile}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" className="mt-4" disabled={submitting}>
                    {submitting ? "Processing..." : "Submit Application"}
                </button>
            </form>
        </div>

        {showSuccess && (
            <div className="modal-overlay">
                <div className="modal-content success-modal">
                    <div className="success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>Submission Successful!</h2>
                    <p style={{ color: '#64748b', marginBottom: '32px', lineHeight: '1.6' }}>Your refund application has been submitted and is now being processed by the administration.</p>
                    <button 
                        className="modal-btn"
                        onClick={() => window.location.reload()}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )}

        {errorMessage && (
            <div className="error-toast">
                <div className="error-toast-content">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="error-toast-icon">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{errorMessage}</span>
                    <button className="error-toast-close" onClick={() => setErrorMessage("")}>&times;</button>
                </div>
            </div>
        )}
    </div>
);
}
