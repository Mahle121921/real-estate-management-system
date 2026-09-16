
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    Printer,
    Receipt,
    XCircle,
} from "lucide-react";

import "./CustomerPaymentReceipt.css";

function CustomerPaymentReceipt() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchReceipt();
    }, [id]);

    const fetchReceipt = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/");
                return;
            }

            const response = await axios.get(
                `http://localhost:5000/api/payments/receipt/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setReceipt(response.data.receipt);
        } catch (err) {
            console.error("Get receipt error:", err);

            if (err.response?.status === 403) {
                setError(
                    "You are not authorized to view this payment receipt."
                );
            } else if (err.response?.status === 404) {
                setError("Payment receipt not found.");
            } else {
                setError(
                    err.response?.data?.message ||
                    "Failed to load payment receipt."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const formatAmount = (amount) => {
        return `ETB ${Number(amount || 0).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        )}`;
    };

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
            }
        );
    };

    const getTransactionType = () => {
        if (receipt?.SaleID) {
            return "Property Sale";
        }

        if (receipt?.RentalAgreementID) {
            return "Rental";
        }

        return "Payment";
    };

    const getPropertyName = () => {
        return (
            receipt?.SalePropertyName ||
            receipt?.RentalPropertyName ||
            "Property"
        );
    };

    if (loading) {
        return (
            <div className="customer-receipt-page">
                <div className="receipt-loading">
                    <div className="receipt-spinner"></div>
                    <p>Loading payment receipt...</p>
                </div>
            </div>
        );
    }

    if (error || !receipt) {
        return (
            <div className="customer-receipt-page">
                <div className="receipt-error">
                    <XCircle size={55} />
                    <h2>Receipt Unavailable</h2>
                    <p>{error || "Payment receipt not found."}</p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/customer/payments")
                        }
                        className="receipt-back-btn"
                    >
                        <ArrowLeft size={18} />
                        Back to Payments
                    </button>
                </div>
            </div>
        );
    }

    const isPaid =
        String(receipt.PaymentStatus).toLowerCase() === "paid";

    return (
        <div className="customer-receipt-page">

            {/* TOP ACTION BAR */}
            <div className="receipt-topbar no-print">
                <button
                    type="button"
                    className="receipt-back-link"
                    onClick={() =>
                        navigate("/customer/payments")
                    }
                >
                    <ArrowLeft size={18} />
                    Back to Payments
                </button>

                <button
                    type="button"
                    className="receipt-print-btn"
                    onClick={() => window.print()}
                >
                    <Printer size={18} />
                    Print Receipt
                </button>
            </div>

            {/* RECEIPT */}
            <div className="receipt-container">

                <div className="receipt-header">

                    <div className="receipt-brand">
                        <div className="receipt-logo">
                            <Receipt size={28} />
                        </div>

                        <div>
                            <h1>REAL ESTATE</h1>
                            <p>Property Sales & Management System</p>
                        </div>
                    </div>

                    <div
                        className={`receipt-status ${
                            isPaid ? "paid" : "cancelled"
                        }`}
                    >
                        {isPaid ? (
                            <CheckCircle2 size={18} />
                        ) : (
                            <XCircle size={18} />
                        )}

                        <span>
                            {receipt.PaymentStatus || "Unknown"}
                        </span>
                    </div>
                </div>

                <div className="receipt-title-section">
                    <h2>Payment Receipt</h2>

                    <p>
                        Receipt #{receipt.PaymentID}
                    </p>
                </div>

                {/* RECEIPT INFORMATION */}
                <div className="receipt-info-grid">

                    <div className="receipt-info-box">
                        <span>Receipt Number</span>
                        <strong>
                            #{receipt.PaymentID}
                        </strong>
                    </div>

                    <div className="receipt-info-box">
                        <span>Payment Date</span>
                        <strong>
                            {formatDate(
                                receipt.PaymentDate
                            )}
                        </strong>
                    </div>

                    <div className="receipt-info-box">
                        <span>Payment Method</span>
                        <strong>
                            {receipt.PaymentMethod || "—"}
                        </strong>
                    </div>

                    <div className="receipt-info-box">
                        <span>Transaction Type</span>
                        <strong>
                            {getTransactionType()}
                        </strong>
                    </div>

                </div>

                {/* CUSTOMER */}
                <section className="receipt-section">

                    <div className="receipt-section-title">
                        Customer Information
                    </div>

                    <div className="receipt-details-grid">

                        <div>
                            <span>Full Name</span>
                            <strong>
                                {receipt.CustomerName || "—"}
                            </strong>
                        </div>

                        <div>
                            <span>Phone Number</span>
                            <strong>
                                {receipt.PhoneNumber || "—"}
                            </strong>
                        </div>

                        <div>
                            <span>Email</span>
                            <strong>
                                {receipt.Email || "—"}
                            </strong>
                        </div>

                    </div>

                </section>

                {/* PROPERTY */}
                <section className="receipt-section">

                    <div className="receipt-section-title">
                        Property Information
                    </div>

                    <div className="receipt-property">

                        <div className="property-icon">
                            <Receipt size={23} />
                        </div>

                        <div>
                            <span>Property</span>
                            <strong>
                                {getPropertyName()}
                            </strong>
                        </div>

                    </div>

                </section>

                {/* PAYMENT */}
                <section className="receipt-section">

                    <div className="receipt-section-title">
                        Payment Details
                    </div>

                    <div className="payment-table">

                        <div className="payment-row payment-header">
                            <span>Description</span>
                            <span>Amount</span>
                        </div>

                        <div className="payment-row">
                            <span>
                                {getTransactionType()} Payment
                            </span>

                            <strong>
                                {formatAmount(receipt.Amount)}
                            </strong>
                        </div>

                    </div>

                    <div className="receipt-total">
                        <span>Total Paid</span>

                        <strong>
                            {formatAmount(receipt.Amount)}
                        </strong>
                    </div>

                </section>

                {/* HANDLED BY */}
                <section className="receipt-section handled-section">

                    <div>
                        <span>Payment Handled By</span>

                        <strong>
                            {receipt.HandledByName || "—"}
                        </strong>
                    </div>

                    <div>
                        <span>Payment Status</span>

                        <strong
                            className={
                                isPaid
                                    ? "status-paid"
                                    : "status-cancelled"
                            }
                        >
                            {receipt.PaymentStatus || "—"}
                        </strong>
                    </div>

                </section>

                {/* FOOTER */}
                <div className="receipt-footer">

                    <div className="receipt-footer-line"></div>

                    <h3>
                        Thank you for your payment
                    </h3>

                    <p>
                        This receipt was generated from the
                        Real Estate Property Sales and
                        Management System.
                    </p>

                    <small>
                        Receipt #{receipt.PaymentID}
                    </small>

                </div>

            </div>
        </div>
    );
}

export default CustomerPaymentReceipt;
