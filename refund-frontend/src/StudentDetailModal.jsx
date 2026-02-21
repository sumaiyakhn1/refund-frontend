
import { useEffect, useState } from 'react';
import { getStudentDetails, checkStudentDues, getLibraryBookCount } from './services/studentService';

export default function StudentDetailModal({ studentId, currentStudent, onUpdate, onSave, permissions, onClose }) {
    const [details, setDetails] = useState(null);
    const [dues, setDues] = useState(null);
    const [libraryCount, setLibraryCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (studentId) {
            setLoading(true);
            getStudentDetails(studentId)
                .then(data => {
                    setDetails(data);
                    const mongoId = data._id || data.id;
                    if (mongoId) {
                        return Promise.all([
                            checkStudentDues(mongoId),
                            getLibraryBookCount(mongoId)
                        ]);
                    }
                    return [null, null];
                })
                .then(([dueData, libraryData]) => {
                    if (dueData) setDues(dueData.dueDetails);
                    if (libraryData) setLibraryCount(libraryData.count);
                    setLoading(false);
                })
                .catch(err => {
                    setError(err.message || 'Failed to fetch details');
                    setLoading(false);
                });
        }
    }, [studentId]);

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric"
        });
    };

    if (loading && !details) return (
        <Overlay>
            <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="spinner" style={{ width: "20px", height: "20px", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                <span style={{ fontWeight: 600, color: "#64748b" }}>Loading Student Profile...</span>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } `}</style>
        </Overlay>
    );

    if (error) return (
        <Overlay onClose={onClose}>
            <div style={{ background: "white", padding: "30px", borderRadius: "12px", maxWidth: "400px", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                <div style={{ color: "#ef4444", fontSize: "40px", marginBottom: "10px" }}>⚠️</div>
                <h3 style={{ margin: "0 0 10px 0", color: "#1e293b" }}>Unable to Load Details</h3>
                <p style={{ color: "#64748b", margin: "0 0 20px 0" }}>{error}</p>
                <button onClick={onClose} style={{
                    padding: "10px 20px", background: "#f1f5f9", color: "#334155",
                    border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer"
                }}>Close</button>
            </div>
        </Overlay>
    );

    if (!details) return null;

    return (
        <Overlay onClose={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                background: "white", width: "95%", maxWidth: "700px",
                borderRadius: "16px", overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                display: "flex", flexDirection: "column", maxHeight: "90vh"
            }}>
                {/* Header */}
                <div style={{
                    padding: "20px 30px", background: "linear-gradient(to right, #f8fafc, #f1f5f9)",
                    borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <div style={{
                            width: "60px", height: "60px", borderRadius: "50%",
                            background: "white", border: "2px solid #e2e8f0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "24px", color: "#3b82f6", fontWeight: "700", overflow: "hidden", shadow: "0 4px 6px rgba(0,0,0,0.05)"
                        }}>
                            {details.photo ? (
                                <img src={details.photo} alt="Student" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                details.name?.charAt(0) || "S"
                            )}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: "#0f172a", fontSize: "20px", fontWeight: "700", letterSpacing: "-0.5px" }}>{details.name}</h2>
                            <span style={{ fontSize: "13px", fontWeight: "500", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "4px" }}>
                                {studentId}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", color: "#94a3b8", cursor: "pointer", padding: "5px" }}>&times;</button>
                </div>

                {/* Body - Scrollable */}
                <div className="custom-scrollbar" style={{
                    padding: "30px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "30px",
                    scrollBehavior: "smooth", overscrollBehavior: "contain"
                }}>

                    {/* Section: Academic Info */}
                    <Section title="Academic & Personal Details">
                        <Grid>
                            <InfoItem label="Father's Name" value={details.fatherName} />
                            <InfoItem label="Mother's Name" value={details.motherName} />
                            <InfoItem label="Date of Birth" value={formatDate(details.dob)} />
                            <InfoItem label="Gender" value={details.gender} />
                            <InfoItem label="Phone" value={details.phone} />
                            <InfoItem label="Email" value={details.email} />
                            <InfoItem label="Stream" value={details.stream} />
                            <InfoItem label="Class / Section" value={`${details.batch || ""} ${details.section ? `(Sec ${details.section})` : ""} `} />
                        </Grid>
                    </Section>

                    {/* Section: Fee Status */}
                    {dues && (
                        <Section title="Fee Status (2024-25 Odd)">
                            <div style={{
                                background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "20px"
                            }}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "20px" }}>
                                    <FeeItem label="Total Demand" value={`₹${dues.demand} `} />
                                    <FeeItem label="Concession" value={`₹${dues.concession} `} color="#16a34a" />
                                    <FeeItem label="Payable" value={`₹${dues.payable} `} bold />
                                    <FeeItem label="Received" value={`₹${dues.received} `} />
                                    <FeeItem label="Due Amount" value={`₹${dues.dueAmount} `} color={dues.dueAmount > 0 ? "#dc2626" : "#16a34a"} bold />

                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Status</span>
                                        <span style={{
                                            fontWeight: "700", fontSize: "15px",
                                            color: dues.dueAmount > 0 ? "#dc2626" : "#16a34a",
                                            marginTop: "4px"
                                        }}>
                                            {dues.dueAmount > 0 ? "⚠️ Pending" : "✅ Cleared"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* Section: Library Status */}
                    {libraryCount !== null && (
                        <Section title="Library Status">
                            <div style={{
                                background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "10px", padding: "20px"
                            }}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "20px" }}>
                                    <FeeItem label="Books Issued" value={libraryCount} bold />
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Status</span>
                                        <span style={{
                                            fontWeight: "700", fontSize: "15px",
                                            color: libraryCount > 0 ? "#dc2626" : "#16a34a",
                                            marginTop: "4px"
                                        }}>
                                            {libraryCount > 0 ? "⚠️ Pending Return" : "✅ Clear"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* Section: Actions */}
                    {currentStudent && onUpdate && (
                        <Section title="Clearance Actions">
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    {["fee_cleared", "library_cleared", "scholarship_cleared", "registration_cleared"].map(field => {
                                        const canEdit = permissions === "all" || permissions === field;
                                        const label = field.replace('_cleared', '').toUpperCase();
                                        const value = currentStudent[field];

                                        return (
                                            <div key={field} style={{
                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                padding: "10px 15px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0"
                                            }}>
                                                <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>{label}</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <select
                                                        value={value}
                                                        onChange={(e) => onUpdate(field, e.target.value)}
                                                        disabled={!canEdit}
                                                        style={{
                                                            padding: "6px 24px 6px 12px", borderRadius: "6px",
                                                            border: `1px solid ${value === 'YES' ? '#86efac' : '#fca5a5'} `,
                                                            background: value === 'YES' ? '#f0fdf4' : '#fef2f2',
                                                            color: value === 'YES' ? '#166534' : '#991b1b',
                                                            fontWeight: "600", fontSize: "13px",
                                                            cursor: canEdit ? "pointer" : "not-allowed",
                                                            opacity: canEdit ? 1 : 0.7,
                                                            appearance: "none",
                                                            backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23334155' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
                                                            backgroundRepeat: "no-repeat",
                                                            backgroundPosition: "right 8px center",
                                                            backgroundSize: "12px"
                                                        }}
                                                    >
                                                        <option value="NO">NO</option>
                                                        <option value="YES">YES</option>
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{ marginTop: "25px", display: "flex", justifyContent: "flex-end" }}>
                                    <button
                                        onClick={() => onSave(currentStudent)}
                                        style={{
                                            padding: "12px 30px", background: "#2563eb", color: "white",
                                            border: "none", borderRadius: "8px", cursor: "pointer",
                                            fontWeight: "600", fontSize: "14px",
                                            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                                            transition: "background 0.2s"
                                        }}
                                        onMouseOver={e => e.target.style.background = "#1d4ed8"}
                                        onMouseOut={e => e.target.style.background = "#2563eb"}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </Section>
                    )}
                </div>
            </div>
        </Overlay>
    );
}

// Subcomponents for cleaner code
const Overlay = ({ children, onClose }) => (
    <div onClick={onClose} style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        animation: "fadeIn 0.2s ease-out"
    }}>
        {children}
        <GlobalStyles />
        <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } `}</style>
    </div>
);

const Section = ({ title, children }) => (
    <div>
        <h4 style={{
            fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em",
            color: "#94a3b8", fontWeight: "700", marginBottom: "12px"
        }}>{title}</h4>
        {children}
    </div>
);

const Grid = ({ children }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>{children}</div>
);

const InfoItem = ({ label, value }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>{label}</span>
        <span style={{ fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>{value || "—"}</span>
    </div>
);

const FeeItem = ({ label, value, color = "#1e293b", bold = false }) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>{label}</span>
        <span style={{
            fontSize: "15px", color: color, fontWeight: bold ? "700" : "500", marginTop: "4px"
        }}>{value}</span>
    </div>
);

// Global Styles for this component to ensure smooth scrolling and nice scrollbars
const GlobalStyles = () => (
    <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    `}</style>
);
