import { useState } from "react";

export default function StudentForm() {
    const studentId = localStorage.getItem("student_id");

    const [formData, setFormData] = useState({
        student_name: "",
        bank_name: "",
        account_no: "",
        ifsc: "",
        account_holder: "",
    });

    const [msg, setMsg] = useState("");

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };

    if (!studentId) {
        return <p>Session expired. Please login again.</p>;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg("Saving...");

        const hasEmpty = Object.values(formData).some(
            (v) => v.trim() === ""
        );
        if (hasEmpty) {
            setMsg("❌ All fields are required");
            return;
        }

        const payload = {
            student_id: studentId,
            student_name: formData.student_name,
            bank_name: formData.bank_name,
            account_no: formData.account_no,
            ifsc: formData.ifsc,
            account_holder: formData.account_holder,
            fee_cleared: "NO",
            library_cleared: "NO",
            status: "PENDING",
        };

        try {
            const res = await fetch("https://refund-backend-1.onrender.com/admin/student", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Failed to save");
            }

            setMsg("✅ Details saved successfully");
        } catch (err) {
            setMsg("❌ " + err.message);
        }
    };

    return (
        <div className="wrapper">
            <div className="flex-between" style={{ marginBottom: 20 }}>
                <h3 className="title" style={{ marginBottom: 0 }}>Banking Details</h3>
                <button
                    onClick={handleLogout}
                    style={{ padding: "8px 16px", background: "#ef4444", fontSize: 12 }}
                >
                    Logout
                </button>
            </div>

            <p className="subtitle" style={{ textAlign: "left", marginBottom: 20 }}>
                Please ensure your bank details are correct to process refunds.
            </p>

            <form onSubmit={handleSubmit} className="form-group">
                <div className="input-group">
                    <label>Student Name</label>
                    <input
                        name="student_name"
                        placeholder="As per bank records"
                        value={formData.student_name}
                        onChange={handleChange}
                    />
                </div>

                <div className="input-group">
                    <label>Bank Name</label>
                    <input
                        name="bank_name"
                        placeholder="e.g. HDFC Bank"
                        value={formData.bank_name}
                        onChange={handleChange}
                    />
                </div>

                <div className="input-group">
                    <label>Account Number</label>
                    <input
                        name="account_no"
                        placeholder="Enter Account No"
                        value={formData.account_no}
                        onChange={handleChange}
                    />
                </div>

                <div className="input-group">
                    <label>IFSC Code</label>
                    <input
                        name="ifsc"
                        placeholder="e.g. HDFC0001234"
                        value={formData.ifsc}
                        onChange={handleChange}
                    />
                </div>

                <div className="input-group">
                    <label>Account Holder Name</label>
                    <input
                        name="account_holder"
                        placeholder="Beneficiary Name"
                        value={formData.account_holder}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit" className="mt-4">
                    Submit Application
                </button>
            </form>

            {msg && (
                <div className={`alert ${msg.includes('✅') ? 'alert-success' : 'alert-error'}`}>
                    {msg}
                </div>
            )}
        </div>
    );
}
