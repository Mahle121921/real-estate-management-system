import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    CreditCard,
    Search,
    RefreshCw,
    DollarSign,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Eye,
    X,
    Receipt,
    User,
    Building2,
    Calendar,
    FileText,
} from "lucide-react";
import "./OwnerPayments.css";

const OwnerPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [methodFilter, setMethodFilter] = useState("All");

    const [selectedPayment, setSelectedPayment] = useState(null);

    // =====================================================
    // GET TOKEN
    // =====================================================
    const getToken = () => {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken")
        );
    };

    // =====================================================
    // FETCH OWNER PAYMENTS
    // =====================================================
const fetchPayments = useCallback(async (isRefresh = false) => {
    try {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        const token = getToken();

        if (!token) {
            setError("Authentication token not found. Please login again.");
            return;
        }

        const response = await axios.get(
            "http://localhost:5000/api/owners/owner/payments",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("Owner payments response:", response.data);

        if (response.data?.success) {
            setPayments(response.data.payments || []);
        } else {
            setError(
                response.data?.message ||
                "Failed to retrieve payments."
            );
            setPayments([]);
        }

    } catch (err) {
        console.error("Fetch owner payments error:", err);

        if (err.response?.status === 401) {
            setError("Your session has expired. Please login again.");
        } else if (err.response?.status === 403) {
            setError("You are not authorized to view owner payments.");
        } else if (err.response?.status === 404) {
            setError(
                err.response?.data?.message ||
                "Owner or payment records were not found."
            );
        } else {
            setError(
                err.response?.data?.message ||
                "Failed to load owner payments."
            );
        }

        setPayments([]);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
}, []);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    // =====================================================
    // FORMAT CURRENCY
    // =====================================================
    const formatCurrency = (amount) => {
        const value = Number(amount || 0);

        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================
    const formatDate = (date) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // =====================================================
    // PAYMENT PROPERTY NAME
    // =====================================================
    const getPropertyName = (payment) => {
        return (
            payment.SalePropertyName ||
            payment.RentalPropertyName ||
            "Unknown Property"
        );
    };

    // =====================================================
    // PAYMENT TYPE
    // =====================================================
    const getPaymentType = (payment) => {
        if (payment.SaleID) {
            return "Sale";
        }

        if (payment.RentalAgreementID) {
            return "Rental";
        }

        return "Other";
    };

    // =====================================================
    // STATUS ICON
    // =====================================================
    const getStatusIcon = (status) => {
        switch (status) {
            case "Paid":
                return <CheckCircle size={16} />;

            case "Pending":
                return <Clock size={16} />;

            case "Failed":
                return <XCircle size={16} />;

            case "Cancelled":
                return <AlertCircle size={16} />;

            default:
                return <Clock size={16} />;
        }
    };

    // =====================================================
    // STATUS CLASS
    // =====================================================
    const getStatusClass = (status) => {
        switch (status) {
            case "Paid":
                return "status-paid";

            case "Pending":
                return "status-pending";

            case "Failed":
                return "status-failed";

            case "Cancelled":
                return "status-cancelled";

            default:
                return "status-default";
        }
    };

    // =====================================================
    // FILTER PAYMENTS
    // =====================================================
    const filteredPayments = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return payments.filter((payment) => {
            const propertyName = getPropertyName(payment);
            const paymentType = getPaymentType(payment);

            const matchesSearch =
                !search ||
                String(payment.PaymentID || "")
                    .toLowerCase()
                    .includes(search) ||
                String(payment.CustomerName || "")
                    .toLowerCase()
                    .includes(search) ||
                propertyName.toLowerCase().includes(search) ||
                paymentType.toLowerCase().includes(search) ||
                String(payment.PaymentMethod || "")
                    .toLowerCase()
                    .includes(search);

            const matchesStatus =
                statusFilter === "All" ||
                payment.PaymentStatus === statusFilter;

            const matchesMethod =
                methodFilter === "All" ||
                payment.PaymentMethod === methodFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesMethod
            );
        });
    }, [
        payments,
        searchTerm,
        statusFilter,
        methodFilter,
    ]);

    // =====================================================
    // SUMMARY DATA
    // =====================================================
    const summary = useMemo(() => {
        const paidPayments = payments.filter(
            (payment) => payment.PaymentStatus === "Paid"
        );

        const pendingPayments = payments.filter(
            (payment) => payment.PaymentStatus === "Pending"
        );

        const cancelledPayments = payments.filter(
            (payment) => payment.PaymentStatus === "Cancelled"
        );

        const failedPayments = payments.filter(
            (payment) => payment.PaymentStatus === "Failed"
        );

        const totalPaid = paidPayments.reduce(
            (total, payment) =>
                total + Number(payment.Amount || 0),
            0
        );

        const totalPending = pendingPayments.reduce(
            (total, payment) =>
                total + Number(payment.Amount || 0),
            0
        );

        return {
            totalPayments: payments.length,
            totalPaid,
            totalPending,
            cancelledPayments: cancelledPayments.length,
            failedPayments: failedPayments.length,
        };
    }, [payments]);

    // =====================================================
    // VIEW PAYMENT
    // =====================================================
 const handleViewPayment = async (payment) => {
    try {
        const token = getToken();

        const response = await axios.get(
            `http://localhost:5000/api/owners/owner/payments/${payment.PaymentID}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("Payment details response:", response.data);

        if (response.data?.success) {
            setSelectedPayment(response.data.payment);
        } else {
            setSelectedPayment(payment);
        }

    } catch (err) {
        console.error("Get payment details error:", err);

        // Show the payment already loaded in the table
        setSelectedPayment(payment);
    }
};

    // =====================================================
    // CLOSE MODAL
    // =====================================================
    const closeModal = () => {
        setSelectedPayment(null);
    };

    // =====================================================
    // LOADING STATE
    // =====================================================
    if (loading) {
        return (
            <div className="owner-payments-page">
                <div className="owner-payments-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading payments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="owner-payments-page">

            {/* =================================================
                HEADER
            ================================================= */}
            <div className="owner-payments-header">
                <div>
                    <div className="owner-payments-title-row">
                        <div className="owner-payments-title-icon">
                            <CreditCard size={24} />
                        </div>

                        <div>
                            <h1>Payments</h1>
                            <p>
                                View and monitor payments related to
                                your properties.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="refresh-button"
                    onClick={() => fetchPayments(true)}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={18}
                        className={
                            refreshing
                                ? "refresh-spinning"
                                : ""
                        }
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}
            {error && (
                <div className="owner-payments-error">
                    <AlertCircle size={20} />

                    <div>
                        <strong>Unable to load payments</strong>
                        <p>{error}</p>
                    </div>

                    <button
                        onClick={() => fetchPayments()}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}
            <div className="payment-summary-grid">

                <div className="payment-summary-card">
                    <div className="summary-card-icon total">
                        <CreditCard size={22} />
                    </div>

                    <div>
                        <span>Total Payments</span>
                        <strong>{summary.totalPayments}</strong>
                    </div>
                </div>

                <div className="payment-summary-card">
                    <div className="summary-card-icon paid">
                        <DollarSign size={22} />
                    </div>

                    <div>
                        <span>Total Paid</span>
                        <strong>
                            {formatCurrency(summary.totalPaid)} ETB
                        </strong>
                    </div>
                </div>

                <div className="payment-summary-card">
                    <div className="summary-card-icon pending">
                        <Clock size={22} />
                    </div>

                    <div>
                        <span>Pending Amount</span>
                        <strong>
                            {formatCurrency(summary.totalPending)} ETB
                        </strong>
                    </div>
                </div>

                <div className="payment-summary-card">
                    <div className="summary-card-icon cancelled">
                        <XCircle size={22} />
                    </div>

                    <div>
                        <span>Cancelled</span>
                        <strong>
                            {summary.cancelledPayments}
                        </strong>
                    </div>
                </div>
            </div>

            {/* =================================================
                FILTERS
            ================================================= */}
            <div className="payments-toolbar">

                <div className="payment-search">
                    <Search size={19} />

                    <input
                        type="text"
                        placeholder="Search customer, property, payment..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value)
                    }
                >
                    <option value="All">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>

                <select
                    value={methodFilter}
                    onChange={(e) =>
                        setMethodFilter(e.target.value)
                    }
                >
                    <option value="All">All Methods</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">
                        Bank Transfer
                    </option>
                    <option value="Online Payment">
                        Online Payment
                    </option>
                </select>
            </div>

            {/* =================================================
                TABLE
            ================================================= */}
            <div className="payments-card">

                <div className="payments-card-header">
                    <div>
                        <h2>Payment Transactions</h2>
                        <p>
                            {filteredPayments.length} payment
                            {filteredPayments.length !== 1
                                ? "s"
                                : ""}{" "}
                            found
                        </p>
                    </div>
                </div>

                {filteredPayments.length === 0 ? (
                    <div className="empty-payments">
                        <div className="empty-icon">
                            <CreditCard size={34} />
                        </div>

                        <h3>No payments found</h3>

                        <p>
                            {payments.length === 0
                                ? "There are no payment records associated with your properties yet."
                                : "Try changing your search or filters."}
                        </p>
                    </div>
                ) : (
                    <div className="payments-table-wrapper">
                        <table className="payments-table">
                            <thead>
                                <tr>
                                    <th>Payment ID</th>
                                    <th>Customer</th>
                                    <th>Property</th>
                                    <th>Type</th>
                                    <th>Method</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
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
                                                <span className="payment-id">
                                                    #
                                                    {
                                                        payment.PaymentID
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <div className="customer-cell">
                                                    <div className="customer-avatar">
                                                        <User
                                                            size={16}
                                                        />
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {payment.CustomerName ||
                                                                "Unknown Customer"}
                                                        </strong>

                                                        <span>
                                                            Customer
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="property-cell">
                                                    <Building2
                                                        size={17}
                                                    />

                                                    <span>
                                                        {
                                                            getPropertyName(
                                                                payment
                                                            )
                                                        }
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <span
                                                    className={`payment-type ${getPaymentType(
                                                        payment
                                                    ).toLowerCase()}`}
                                                >
                                                    {
                                                        getPaymentType(
                                                            payment
                                                        )
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="payment-method">
                                                    {
                                                        payment.PaymentMethod
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <strong className="amount-value">
                                                    {formatCurrency(
                                                        payment.Amount
                                                    )}{" "}
                                                    ETB
                                                </strong>
                                            </td>

                                            <td>
                                                <span className="date-cell">
                                                    {
                                                        formatDate(
                                                            payment.PaymentDate
                                                        )
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`payment-status ${getStatusClass(
                                                        payment.PaymentStatus
                                                    )}`}
                                                >
                                                    {getStatusIcon(
                                                        payment.PaymentStatus
                                                    )}

                                                    {
                                                        payment.PaymentStatus
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    className="view-payment-button"
                                                    onClick={() =>
                                                        handleViewPayment(
                                                            payment
                                                        )
                                                    }
                                                    title="View payment details"
                                                >
                                                    <Eye
                                                        size={17}
                                                    />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* =================================================
                PAYMENT DETAILS MODAL
            ================================================= */}
            {selectedPayment && (
                <div
                    className="payment-modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="payment-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >
                        <div className="payment-modal-header">
                            <div>
                                <div className="modal-title-icon">
                                    <Receipt size={21} />
                                </div>

                                <div>
                                    <h2>
                                        Payment #
                                        {
                                            selectedPayment.PaymentID
                                        }
                                    </h2>

                                    <p>
                                        Payment transaction details
                                    </p>
                                </div>
                            </div>

                            <button
                                className="modal-close-button"
                                onClick={closeModal}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="payment-modal-body">

                            <div className="modal-payment-status">
                                <span>Status</span>

                                <span
                                    className={`payment-status ${getStatusClass(
                                        selectedPayment.PaymentStatus
                                    )}`}
                                >
                                    {getStatusIcon(
                                        selectedPayment.PaymentStatus
                                    )}

                                    {
                                        selectedPayment.PaymentStatus
                                    }
                                </span>
                            </div>

                            <div className="modal-amount">
                                <span>Payment Amount</span>

                                <strong>
                                    {formatCurrency(
                                        selectedPayment.Amount
                                    )}{" "}
                                    ETB
                                </strong>
                            </div>

                            <div className="details-grid">

                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <User size={18} />
                                    </div>

                                    <div>
                                        <span>
                                            Customer
                                        </span>

                                        <strong>
                                            {
                                                selectedPayment.CustomerName ||
                                                "Unknown"
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <Building2
                                            size={18}
                                        />
                                    </div>

                                    <div>
                                        <span>
                                            Property
                                        </span>

                                        <strong>
                                            {getPropertyName(
                                                selectedPayment
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <FileText size={18} />
                                    </div>

                                    <div>
                                        <span>
                                            Transaction Type
                                        </span>

                                        <strong>
                                            {getPaymentType(
                                                selectedPayment
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <CreditCard
                                            size={18}
                                        />
                                    </div>

                                    <div>
                                        <span>
                                            Payment Method
                                        </span>

                                        <strong>
                                            {
                                                selectedPayment.PaymentMethod
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <Calendar
                                            size={18}
                                        />
                                    </div>

                                    <div>
                                        <span>
                                            Payment Date
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedPayment.PaymentDate
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <User size={18} />
                                    </div>

                                    <div>
                                        <span>
                                            Handled By
                                        </span>

                                        <strong>
                                            {
                                                selectedPayment.HandledByName ||
                                                "—"
                                            }
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {selectedPayment.SaleID && (
                                <div className="reference-box">
                                    <span>Sale Reference</span>
                                    <strong>
                                        Sale #
                                        {
                                            selectedPayment.SaleID
                                        }
                                    </strong>
                                </div>
                            )}

                            {selectedPayment.RentalAgreementID && (
                                <div className="reference-box">
                                    <span>
                                        Rental Agreement
                                    </span>

                                    <strong>
                                        Agreement #
                                        {
                                            selectedPayment.RentalAgreementID
                                        }
                                    </strong>
                                </div>
                            )}
                        </div>

                        <div className="payment-modal-footer">
                            <button
                                className="modal-done-button"
                                onClick={closeModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerPayments;