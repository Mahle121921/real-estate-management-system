import { useEffect, useState } from "react";
import {
    CreditCard,
    Plus,
    Search,
    X,
    Loader2,
    CheckCircle2,
    Clock3,
    AlertCircle
} from "lucide-react";

import "./SalesAgentPayments.css";

function SalesAgentPayments() {
    const [payments, setPayments] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        CustomerID: "",
        SaleID: "",
        RentalAgreementID: "",
        PaymentMethod: "Cash",
        Amount: "",
        PaymentDate: new Date().toISOString().split("T")[0],
        PaymentStatus: "Completed"
    });

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");

    // =====================================================
    // LOAD PAYMENTS
    // =====================================================

    const loadPayments = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "http://localhost:5000/api/payments",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load payments"
                );
            }

            setPayments(
                data.payments ||
                data.data ||
                []
            );

        } catch (err) {
            console.error("Load payments error:", err);
            setError(err.message || "Failed to load payments");
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // LOAD CUSTOMERS
    // =====================================================

    const loadCustomers = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/customers",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load customers"
                );
            }

            setCustomers(
                data.customers ||
                data.data ||
                []
            );

        } catch (err) {
            console.error("Load customers error:", err);
        }
    };

    useEffect(() => {
        if (token) {
            loadPayments();
            loadCustomers();
        }
    }, [token]);

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // =====================================================
    // RECORD PAYMENT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!formData.CustomerID) {
            setError("Please select a customer.");
            return;
        }

        if (!formData.Amount || Number(formData.Amount) <= 0) {
            setError("Please enter a valid payment amount.");
            return;
        }

        try {
            setSaving(true);

            const currentUser = JSON.parse(
                localStorage.getItem("user") || "{}"
            );

            const handledBy =
                currentUser?.UserID ||
                currentUser?.userId ||
                currentUser?.id;

            const payload = {
                CustomerID: Number(formData.CustomerID),
                HandledBy: handledBy
                    ? Number(handledBy)
                    : null,
                SaleID: formData.SaleID
                    ? Number(formData.SaleID)
                    : null,
                RentalAgreementID: formData.RentalAgreementID
                    ? Number(formData.RentalAgreementID)
                    : null,
                PaymentMethod: formData.PaymentMethod,
                Amount: Number(formData.Amount),
                PaymentDate: formData.PaymentDate,
                PaymentStatus: formData.PaymentStatus
            };

            const response = await fetch(
                "http://localhost:5000/api/payments",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to record payment"
                );
            }

            setSuccess("Customer payment recorded successfully.");

            setFormData({
                CustomerID: "",
                SaleID: "",
                RentalAgreementID: "",
                PaymentMethod: "Cash",
                Amount: "",
                PaymentDate: new Date()
                    .toISOString()
                    .split("T")[0],
                PaymentStatus: "Completed"
            });

            await loadPayments();

            setTimeout(() => {
                setShowModal(false);
                setSuccess("");
            }, 1000);

        } catch (err) {
            console.error("Record payment error:", err);
            setError(
                err.message ||
                "Failed to record customer payment"
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // SEARCH
    // =====================================================

    const filteredPayments = payments.filter((payment) => {
        const search = searchTerm.toLowerCase();

        return (
            String(payment.PaymentID || "")
                .toLowerCase()
                .includes(search) ||
            String(payment.CustomerName || "")
                .toLowerCase()
                .includes(search) ||
            String(payment.PaymentMethod || "")
                .toLowerCase()
                .includes(search) ||
            String(payment.PaymentStatus || "")
                .toLowerCase()
                .includes(search)
        );
    });

    // =====================================================
    // STATUS ICON
    // =====================================================

    const getStatusIcon = (status) => {
        const value = String(status || "").toLowerCase();

        if (value === "completed" || value === "paid") {
            return <CheckCircle2 size={15} />;
        }

        if (value === "pending") {
            return <Clock3 size={15} />;
        }

        return <AlertCircle size={15} />;
    };

    return (
        <div className="sales-agent-payments">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="payments-header">

                <div className="payments-header-content">

                    <div className="payments-header-icon">
                        <CreditCard size={28} />
                    </div>

                    <div>
                        <p className="payments-eyebrow">
                            SALES AGENT PORTAL
                        </p>

                        <h1>Customer Payments</h1>

                        <p>
                            Record and manage customer payment
                            transactions.
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    className="record-payment-btn"
                    onClick={() => {
                        setError("");
                        setSuccess("");
                        setShowModal(true);
                    }}
                >
                    <Plus size={19} />
                    Record Payment
                </button>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && !showModal && (
                <div className="payments-alert error">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="payment-summary">

                <div className="payment-summary-card">

                    <div className="summary-icon">
                        <CreditCard size={21} />
                    </div>

                    <div>
                        <span>Total Payments</span>
                        <strong>
                            {payments.length}
                        </strong>
                    </div>

                </div>

                <div className="payment-summary-card">

                    <div className="summary-icon">
                        <CheckCircle2 size={21} />
                    </div>

                    <div>
                        <span>Completed</span>
                        <strong>
                            {
                                payments.filter(
                                    (p) =>
                                        String(
                                            p.PaymentStatus
                                        ).toLowerCase() ===
                                        "completed"
                                ).length
                            }
                        </strong>
                    </div>

                </div>

                <div className="payment-summary-card">

                    <div className="summary-icon">
                        <Clock3 size={21} />
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>
                            {
                                payments.filter(
                                    (p) =>
                                        String(
                                            p.PaymentStatus
                                        ).toLowerCase() ===
                                        "pending"
                                ).length
                            }
                        </strong>
                    </div>

                </div>

            </div>

            {/* =================================================
                PAYMENT TABLE
            ================================================= */}

            <section className="payments-card">

                <div className="payments-card-header">

                    <div>
                        <p className="payments-section-label">
                            TRANSACTIONS
                        </p>

                        <h2>Customer Payment Records</h2>
                    </div>

                    <div className="payment-search">

                        <Search size={17} />

                        <input
                            type="text"
                            placeholder="Search payments..."
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                </div>

                {loading ? (

                    <div className="payments-loading">
                        <Loader2
                            size={25}
                            className="spin"
                        />
                        <span>
                            Loading payments...
                        </span>
                    </div>

                ) : filteredPayments.length === 0 ? (

                    <div className="payments-empty">

                        <CreditCard size={40} />

                        <h3>
                            No payment records found
                        </h3>

                        <p>
                            Record a customer payment to
                            see it here.
                        </p>

                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                        >
                            <Plus size={17} />
                            Record Payment
                        </button>

                    </div>

                ) : (

                    <div className="payments-table-wrapper">

                        <table className="payments-table">

                            <thead>
                                <tr>
                                    <th>Payment ID</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredPayments.map(
                                    (payment) => (

                                        <tr
                                            key={
                                                payment.PaymentID
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    PAY-
                                                    {
                                                        payment.PaymentID
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    payment.CustomerName ||
                                                    payment.customerName ||
                                                    `Customer #${
                                                        payment.CustomerID
                                                    }`
                                                }
                                            </td>

                                            <td>
                                                <strong>
                                                    {Number(
                                                        payment.Amount || 0
                                                    ).toLocaleString()}{" "}
                                                    ETB
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    payment.PaymentMethod ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    payment.PaymentDate
                                                        ? new Date(
                                                              payment.PaymentDate
                                                          ).toLocaleDateString()
                                                        : "-"
                                                }
                                            </td>

                                            <td>

                                                <span
                                                    className={`payment-status ${String(
                                                        payment.PaymentStatus ||
                                                            ""
                                                    )
                                                        .toLowerCase()
                                                        .replace(
                                                            /\s+/g,
                                                            "-"
                                                        )}`}
                                                >
                                                    {getStatusIcon(
                                                        payment.PaymentStatus
                                                    )}

                                                    {
                                                        payment.PaymentStatus ||
                                                        "Unknown"
                                                    }
                                                </span>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

            {/* =================================================
                RECORD PAYMENT MODAL
            ================================================= */}

            {showModal && (

                <div className="payment-modal-overlay">

                    <div className="payment-modal">

                        <div className="payment-modal-header">

                            <div>
                                <p className="payments-section-label">
                                    PAYMENT MANAGEMENT
                                </p>

                                <h2>
                                    Record Customer Payment
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={() => {
                                    setShowModal(false);
                                    setError("");
                                    setSuccess("");
                                }}
                            >
                                <X size={20} />
                            </button>

                        </div>

                        {error && (
                            <div className="payments-alert error">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="payments-alert success">
                                <CheckCircle2 size={18} />
                                {success}
                            </div>
                        )}

                        <form
                            className="payment-form"
                            onSubmit={handleSubmit}
                        >

                            {/* CUSTOMER */}

                            <div className="form-group">

                                <label>
                                    Customer
                                    <span>*</span>
                                </label>

                                <select
                                    name="CustomerID"
                                    value={
                                        formData.CustomerID
                                    }
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">
                                        Select Customer
                                    </option>

                                    {customers.map(
                                        (customer) => (

                                            <option
                                                key={
                                                    customer.CustomerID ||
                                                    customer.id
                                                }
                                                value={
                                                    customer.CustomerID ||
                                                    customer.id
                                                }
                                            >
                                                {
                                                    customer.FullName ||
                                                    customer.fullName ||
                                                    customer.Name ||
                                                    customer.name
                                                }
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                            <div className="form-row">

                                {/* AMOUNT */}

                                <div className="form-group">

                                    <label>
                                        Amount (ETB)
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="number"
                                        name="Amount"
                                        value={
                                            formData.Amount
                                        }
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter amount"
                                        required
                                    />

                                </div>

                                {/* METHOD */}

                                <div className="form-group">

                                    <label>
                                        Payment Method
                                    </label>

                                    <select
                                        name="PaymentMethod"
                                        value={
                                            formData.PaymentMethod
                                        }
                                        onChange={handleChange}
                                    >

                                        <option value="Cash">
                                            Cash
                                        </option>

                                        <option value="Bank Transfer">
                                            Bank Transfer
                                        </option>

                                        <option value="Mobile Money">
                                            Mobile Money
                                        </option>

                                        <option value="Cheque">
                                            Cheque
                                        </option>

                                    </select>

                                </div>

                            </div>

                            <div className="form-row">

                                {/* SALE ID */}

                                <div className="form-group">

                                    <label>
                                        Sale ID
                                    </label>

                                    <input
                                        type="number"
                                        name="SaleID"
                                        value={
                                            formData.SaleID
                                        }
                                        onChange={handleChange}
                                        placeholder="Optional"
                                    />

                                </div>

                                {/* RENTAL AGREEMENT */}

                                <div className="form-group">

                                    <label>
                                        Rental Agreement ID
                                    </label>

                                    <input
                                        type="number"
                                        name="RentalAgreementID"
                                        value={
                                            formData.RentalAgreementID
                                        }
                                        onChange={handleChange}
                                        placeholder="Optional"
                                    />

                                </div>

                            </div>

                            <div className="form-row">

                                {/* DATE */}

                                <div className="form-group">

                                    <label>
                                        Payment Date
                                    </label>

                                    <input
                                        type="date"
                                        name="PaymentDate"
                                        value={
                                            formData.PaymentDate
                                        }
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* STATUS */}

                                <div className="form-group">

                                    <label>
                                        Payment Status
                                    </label>

                                    <select
                                        name="PaymentStatus"
                                        value={
                                            formData.PaymentStatus
                                        }
                                        onChange={handleChange}
                                    >

                                        <option value="Completed">
                                            Completed
                                        </option>

                                        <option value="Pending">
                                            Pending
                                        </option>

                                    </select>

                                </div>

                            </div>

                            <div className="payment-form-actions">

                                <button
                                    type="button"
                                    className="cancel-payment-btn"
                                    onClick={() =>
                                        setShowModal(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-payment-btn"
                                    disabled={saving}
                                >

                                    {saving ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="spin"
                                            />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2
                                                size={18}
                                            />
                                            Record Payment
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default SalesAgentPayments;