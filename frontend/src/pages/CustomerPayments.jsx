import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    DollarSign,
    FileText,
    Home,
    Loader2,
    RefreshCw,
    Wallet,
    X,
    AlertCircle,
} from "lucide-react";

import "./CustomerPayments.css";

const API_BASE = "http://localhost:5000/api";

function CustomerPayments() {
    const navigate = useNavigate();

    const [payments, setPayments] = useState([]);
    const [transactions, setTransactions] = useState({
        sales: [],
        rentals: [],
    });

    const [loading, setLoading] = useState(true);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [showPaymentForm, setShowPaymentForm] = useState(false);

    const [formData, setFormData] = useState({
        transactionType: "",
        transactionId: "",
        amount: "",
        paymentMethod: "Cash",
    });

    const [message, setMessage] = useState({
        type: "",
        text: "",
    });

    const token = localStorage.getItem("token");

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    // =====================================================
    // LOAD PAYMENT HISTORY
    // =====================================================

    const fetchPayments = async () => {
        try {
            setLoading(true);
const response = await axios.get(`${API_BASE}/payments/my`, {
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

const data = response.data;

if (Array.isArray(data)) {
    setPayments(data);
} else if (Array.isArray(data.payments)) {
    setPayments(data.payments);
} else if (Array.isArray(data.data)) {
    setPayments(data.data);
} else {
    setPayments([]);
}
        } catch (error) {
            console.error("Failed to load payments:", error);

            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Failed to load payment history.",
            });
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // LOAD CUSTOMER SALES AND RENTALS
    // =====================================================

    const fetchTransactions = async () => {
        try {
            setTransactionsLoading(true);

            const response = await axios.get(
                `${API_BASE}/payments/my-transactions`,
                authConfig
            );

            setTransactions({
                sales: response.data?.sales || [],
                rentals: response.data?.rentals || [],
            });
        } catch (error) {
            console.error("Failed to load transactions:", error);

            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Failed to load your sales and rental agreements.",
            });
        } finally {
            setTransactionsLoading(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        fetchPayments();
        fetchTransactions();
    }, []);

    // =====================================================
    // OPEN PAYMENT FORM
    // =====================================================

    const openPaymentForm = () => {
        setMessage({
            type: "",
            text: "",
        });

        setFormData({
            transactionType: "",
            transactionId: "",
            amount: "",
            paymentMethod: "Cash",
        });

        setShowPaymentForm(true);
    };

    // =====================================================
    // CLOSE PAYMENT FORM
    // =====================================================

    const closePaymentForm = () => {
        if (submitting) return;

        setShowPaymentForm(false);

        setMessage({
            type: "",
            text: "",
        });
    };

    // =====================================================
    // HANDLE INPUT CHANGE
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        // Reset transaction when changing type
        if (name === "transactionType") {
            setFormData((previous) => ({
                ...previous,
                transactionType: value,
                transactionId: "",
                amount: "",
            }));
        }
    };

    // =====================================================
    // GET SELECTED TRANSACTION
    // =====================================================

    const getSelectedTransaction = () => {
        if (!formData.transactionId) {
            return null;
        }

        if (formData.transactionType === "sale") {
            return transactions.sales.find(
                (sale) =>
                    String(sale.SaleID) === String(formData.transactionId)
            );
        }

        if (formData.transactionType === "rental") {
            return transactions.rentals.find(
                (rental) =>
                    String(r.RentalID) ===
                    String(formData.transactionId)
            );
        }

        return null;
    };

    // =====================================================
    // SUBMIT CUSTOMER PAYMENT
    // =====================================================

    const handleSubmitPayment = async (e) => {
        e.preventDefault();

        setMessage({
            type: "",
            text: "",
        });

        if (!formData.transactionType) {
            setMessage({
                type: "error",
                text: "Please select Sale or Rental.",
            });
            return;
        }

        if (!formData.transactionId) {
            setMessage({
                type: "error",
                text: "Please select a transaction.",
            });
            return;
        }

        const amount = Number(formData.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            setMessage({
                type: "error",
                text: "Please enter a valid payment amount greater than zero.",
            });
            return;
        }

        const selectedTransaction = getSelectedTransaction();

        if (!selectedTransaction) {
            setMessage({
                type: "error",
                text: "Selected transaction could not be found.",
            });
            return;
        }

        try {
            setSubmitting(true);

            const paymentData = {
                PaymentMethod: formData.paymentMethod,
                Amount: amount,
            };

            if (formData.transactionType === "sale") {
                paymentData.SaleID = Number(formData.transactionId);
            } else {
                paymentData.RentalAgreementID = Number(
                    formData.transactionId
                );
            }

            const response = await axios.post(
                `${API_BASE}/payments/customer`,
                paymentData,
                authConfig
            );

            setMessage({
                type: "success",
                text:
                    response.data?.message ||
                    "Payment submitted successfully. It is pending verification.",
            });

            // Clear form
            setFormData({
                transactionType: "",
                transactionId: "",
                amount: "",
                paymentMethod: "Cash",
            });

            // Refresh payment history
            await fetchPayments();

            // Keep form open so customer can see success message
            setTimeout(() => {
                setShowPaymentForm(false);

                setMessage({
                    type: "",
                    text: "",
                });
            }, 2500);
        } catch (error) {
            console.error("Customer payment error:", error);

            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Failed to submit payment.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    // =====================================================
    // FORMAT CURRENCY
    // =====================================================

    const formatCurrency = (amount) => {
        const number = Number(amount || 0);

        return `ETB ${number.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
        });
    };

    // =====================================================
    // PAYMENT STATISTICS
    // =====================================================

    const totalPayments = payments.length;

    const totalAmount = payments.reduce(
        (sum, payment) => sum + Number(payment.Amount || 0),
        0
    );

    const paidAmount = payments
        .filter(
            (payment) =>
                String(payment.PaymentStatus).toLowerCase() === "paid"
        )
        .reduce(
            (sum, payment) => sum + Number(payment.Amount || 0),
            0
        );

    const pendingAmount = payments
        .filter(
            (payment) =>
                String(payment.PaymentStatus).toLowerCase() === "pending"
        )
        .reduce(
            (sum, payment) => sum + Number(payment.Amount || 0),
            0
        );

    const cancelledPayments = payments.filter(
        (payment) =>
            String(payment.PaymentStatus).toLowerCase() === "cancelled"
    ).length;

    const selectedTransaction = getSelectedTransaction();

    return (
        <div className="customer-payments-page">

            {/* =====================================================
                TOP BAR
            ===================================================== */}

            <div className="customer-payments-topbar">
                <Link
                    to="/customer-dashboard"
                    className="back-dashboard-link"
                >
                    <ArrowLeft size={18} />
                    Dashboard
                </Link>

                <button
                    className="refresh-payments-btn"
                    onClick={() => {
                        fetchPayments();
                        fetchTransactions();
                    }}
                    disabled={loading || transactionsLoading}
                >
                    <RefreshCw
                        size={17}
                        className={
                            loading || transactionsLoading
                                ? "spinning"
                                : ""
                        }
                    />
                    Refresh
                </button>
            </div>

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="customer-payments-header">

                <div>
                    <div className="payment-title-row">
                        <div className="payment-title-icon">
                            <Wallet size={28} />
                        </div>

                        <div>
                            <h1>Payment History</h1>
                            <p>
                                View and track your property payments
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="make-payment-btn"
                    onClick={openPaymentForm}
                >
                    <CreditCard size={18} />
                    Make Payment
                </button>

            </div>

            {/* =====================================================
                MESSAGE
            ===================================================== */}

            {message.text && !showPaymentForm && (
                <div
                    className={`payment-message ${
                        message.type === "success"
                            ? "success-message"
                            : "error-message"
                    }`}
                >
                    {message.type === "success" ? (
                        <CheckCircle2 size={20} />
                    ) : (
                        <AlertCircle size={20} />
                    )}

                    <span>{message.text}</span>
                </div>
            )}

            {/* =====================================================
                STATISTICS
            ===================================================== */}

            <div className="payment-statistics">

                <div className="payment-stat-card">
                    <div className="payment-stat-icon">
                        <FileText size={22} />
                    </div>

                    <div>
                        <span>Total Payments</span>
                        <strong>{totalPayments}</strong>
                    </div>
                </div>

                <div className="payment-stat-card">
                    <div className="payment-stat-icon">
                        <DollarSign size={22} />
                    </div>

                    <div>
                        <span>Total Amount</span>
                        <strong>{formatCurrency(totalAmount)}</strong>
                    </div>
                </div>

                <div className="payment-stat-card">
                    <div className="payment-stat-icon">
                        <CheckCircle2 size={22} />
                    </div>

                    <div>
                        <span>Paid Amount</span>
                        <strong>{formatCurrency(paidAmount)}</strong>
                    </div>
                </div>

                <div className="payment-stat-card">
                    <div className="payment-stat-icon pending-stat-icon">
                        <CreditCard size={22} />
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>{formatCurrency(pendingAmount)}</strong>
                    </div>
                </div>

            </div>

            {/* =====================================================
                PAYMENT HISTORY
            ===================================================== */}

            <div className="payment-history-card">

                <div className="payment-history-header">
                    <div>
                        <h2>Payment History</h2>
                        <p>
                            {totalPayments}{" "}
                            {totalPayments === 1
                                ? "payment"
                                : "payments"}{" "}
                            recorded
                        </p>
                    </div>

                    <button
                        className="header-make-payment-btn"
                        onClick={openPaymentForm}
                    >
                        <CreditCard size={17} />
                        Make Payment
                    </button>
                </div>

                {loading ? (
                    <div className="payment-loading">
                        <Loader2 size={30} className="spinning" />
                        <p>Loading payment history...</p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="payment-empty-state">
                        <div className="empty-payment-icon">
                            <Wallet size={38} />
                        </div>

                        <h3>No Payments Yet</h3>

                        <p>
                            You don't have any recorded payments yet.
                        </p>

                        <button
                            className="empty-make-payment-btn"
                            onClick={openPaymentForm}
                        >
                            <CreditCard size={17} />
                            Make Payment
                        </button>
                    </div>
                ) : (
                    <div className="payment-table-wrapper">
                        <table className="payment-table">

                            <thead>
                                <tr>
                                    <th>Payment</th>
                                    <th>Property</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {payments.map((payment) => {

                                    const status =
                                        String(
                                            payment.PaymentStatus || ""
                                        ).toLowerCase();

                                    return (
                                        <tr key={payment.PaymentID}>

                                            <td>
                                                <div className="payment-number">
                                                    <div className="payment-row-icon">
                                                        <Wallet size={16} />
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            #{payment.PaymentID}
                                                        </strong>

                                                        <span>
                                                            Payment
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="property-cell">
                                                    <Home size={17} />
                                                    <span>
                                                        {payment.PropertyName ||
                                                            "Property"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                {payment.SaleID
                                                    ? "Property Sale"
                                                    : payment.RentalAgreementID
                                                    ? "Rental"
                                                    : "-"}
                                            </td>

                                            <td>
                                                <strong className="amount-cell">
                                                    {formatCurrency(
                                                        payment.Amount
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                {formatDate(
                                                    payment.PaymentDate
                                                )}
                                            </td>

                                            <td>
                                                {payment.PaymentMethod || "-"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`payment-status status-${status}`}
                                                >
                                                    {status === "paid" && (
                                                        <CheckCircle2
                                                            size={14}
                                                        />
                                                    )}

                                                    {status === "pending" && (
                                                        <CreditCard
                                                            size={14}
                                                        />
                                                    )}

                                                    {status ===
                                                        "cancelled" && (
                                                        <X size={14} />
                                                    )}

                                                    {payment.PaymentStatus}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    className="view-receipt-btn"
                                                    onClick={() =>
                                                        navigate(
                                                            `/customer/payments/receipt/${payment.PaymentID}`
                                                        )
                                                    }
                                                >
                                                    <FileText size={15} />
                                                    View Receipt
                                                </button>
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>

                        </table>
                    </div>
                )}

            </div>

            {/* =====================================================
                CANCELLED NOTICE
            ===================================================== */}

            {cancelledPayments > 0 && (
                <div className="cancelled-payment-notice">
                    <AlertCircle size={19} />

                    <span>
                        You have{" "}
                        <strong>{cancelledPayments}</strong>{" "}
                        cancelled{" "}
                        {cancelledPayments === 1
                            ? "payment"
                            : "payments"}{" "}
                        in your payment history.
                    </span>
                </div>
            )}

            {/* =====================================================
                MAKE PAYMENT MODAL
            ===================================================== */}

            {showPaymentForm && (
                <div
                    className="payment-modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closePaymentForm();
                        }
                    }}
                >

                    <div className="payment-modal">

                        <div className="payment-modal-header">

                            <div>
                                <div className="modal-title-icon">
                                    <CreditCard size={22} />
                                </div>

                                <div>
                                    <h2>Make Payment</h2>
                                    <p>
                                        Submit a payment for your sale or
                                        rental
                                    </p>
                                </div>
                            </div>

                            <button
                                className="close-modal-btn"
                                onClick={closePaymentForm}
                                disabled={submitting}
                            >
                                <X size={21} />
                            </button>

                        </div>

                        {/* =================================================
                            FORM MESSAGE
                        ================================================= */}

                        {message.text && (
                            <div
                                className={`payment-message ${
                                    message.type === "success"
                                        ? "success-message"
                                        : "error-message"
                                }`}
                            >
                                {message.type === "success" ? (
                                    <CheckCircle2 size={20} />
                                ) : (
                                    <AlertCircle size={20} />
                                )}

                                <span>{message.text}</span>
                            </div>
                        )}

                        <form
                            className="customer-payment-form"
                            onSubmit={handleSubmitPayment}
                        >

                            {/* Transaction Type */}

                            <div className="form-group">
                                <label htmlFor="transactionType">
                                    Payment For
                                </label>

                                <select
                                    id="transactionType"
                                    name="transactionType"
                                    value={formData.transactionType}
                                    onChange={handleChange}
                                    disabled={submitting}
                                    required
                                >
                                    <option value="">
                                        Select Sale or Rental
                                    </option>

                                    <option value="sale">
                                        Property Sale
                                    </option>

                                    <option value="rental">
                                        Rental Agreement
                                    </option>
                                </select>
                            </div>

                            {/* Transaction */}

                            {formData.transactionType && (
                                <div className="form-group">

                                    <label htmlFor="transactionId">
                                        Select{" "}
                                        {formData.transactionType === "sale"
                                            ? "Property Sale"
                                            : "Rental Agreement"}
                                    </label>

                                    {transactionsLoading ? (
                                        <div className="select-loading">
                                            <Loader2
                                                size={17}
                                                className="spinning"
                                            />
                                            Loading...
                                        </div>
                                    ) : (
                                        <select
                                            id="transactionId"
                                            name="transactionId"
                                            value={formData.transactionId}
                                            onChange={handleChange}
                                            disabled={submitting}
                                            required
                                        >
                                            <option value="">
                                                Select transaction
                                            </option>

                                            {formData.transactionType ===
                                            "sale" ? (
                                                transactions.sales.length >
                                                0 ? (
                                                    transactions.sales.map(
                                                        (sale) => (
                                                            <option
                                                                key={
                                                                    sale.SaleID
                                                                }
                                                                value={
                                                                    sale.SaleID
                                                                }
                                                            >
                                                                {
                                                                    sale.PropertyName
                                                                }{" "}
                                                                —{" "}
                                                                {formatCurrency(
                                                                    sale.SalePrice
                                                                )}
                                                            </option>
                                                        )
                                                    )
                                                ) : (
                                                    <option
                                                        value=""
                                                        disabled
                                                    >
                                                        No sales found
                                                    </option>
                                                )
                                            ) : transactions.rentals.length >
                                              0 ? (
transactions.rentals.map(
    (rental) => (
        <option
            key={rental.RentalID}
            value={rental.RentalID}
        >
            {rental.PropertyName}{" "}
            — Monthly{" "}
            {formatCurrency(
                rental.MonthlyRent
            )}
        </option>
    )
)
                                            ) : (
                                                <option value="" disabled>
                                                    No rental agreements found
                                                </option>
                                            )}
                                        </select>
                                    )}

                                </div>
                            )}

                            {/* Selected Property Information */}

                            {selectedTransaction && (
                                <div className="selected-transaction">

                                    <div className="selected-property-icon">
                                        <Home size={20} />
                                    </div>

                                    <div>
                                        <span>Selected Property</span>

                                        <strong>
                                            {
                                                selectedTransaction.PropertyName
                                            }
                                        </strong>

                                        {formData.transactionType ===
                                        "sale" ? (
                                            <small>
                                                Sale Price:{" "}
                                                {formatCurrency(
                                                    selectedTransaction.SalePrice
                                                )}
                                            </small>
                                        ) : (
                                            <small>
                                                Monthly Rent:{" "}
                                                {formatCurrency(
                                                    selectedTransaction.MonthlyRent
                                                )}
                                            </small>
                                        )}
                                    </div>

                                </div>
                            )}

                            {/* Amount */}

                            <div className="form-group">

                                <label htmlFor="amount">
                                    Payment Amount
                                </label>

                                <div className="amount-input-wrapper">
                                    <span>ETB</span>

                                    <input
                                        id="amount"
                                        name="amount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Enter amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        disabled={submitting}
                                        required
                                    />
                                </div>

                            </div>

                            {/* Payment Method */}

                            <div className="form-group">

                                <label htmlFor="paymentMethod">
                                    Payment Method
                                </label>

                                <select
                                    id="paymentMethod"
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    disabled={submitting}
                                    required
                                >
                                    <option value="Cash">
                                        Cash
                                    </option>

                                    <option value="Bank Transfer">
                                        Bank Transfer
                                    </option>

                                    <option value="Online Payment">
                                        Online Payment
                                    </option>
                                </select>

                            </div>

                            {/* Pending Information */}

                            <div className="pending-information">

                                <div className="pending-info-icon">
                                    <AlertCircle size={19} />
                                </div>

                                <div>
                                    <strong>
                                        Payment will be Pending
                                    </strong>

                                    <p>
                                        Your payment will be submitted for
                                        verification. An administrator will
                                        review and confirm the payment before
                                        it is marked as Paid.
                                    </p>
                                </div>

                            </div>

                            {/* Buttons */}

                            <div className="payment-form-actions">

                                <button
                                    type="button"
                                    className="cancel-payment-btn"
                                    onClick={closePaymentForm}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="submit-payment-btn"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="spinning"
                                            />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={18} />
                                            Submit Payment
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

export default CustomerPayments;