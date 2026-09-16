import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    CreditCard,
    Plus,
    Search,
    RefreshCw,
    Eye,
    Edit,
    Ban,
    X,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Receipt,
    DollarSign
} from "lucide-react";

import "./Payments.css";


// =====================================================
// API
// =====================================================

const API = axios.create({
    baseURL: "http://localhost:5000/api"
});


// =====================================================
// HELPERS
// =====================================================

const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");


const formatCurrency = (amount) => {
    const value = Number(amount || 0);

    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};


const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};


// =====================================================
// COMPONENT
// =====================================================

function Payments() {

    // -------------------------------------------------
    // STATE
    // -------------------------------------------------

    const [payments, setPayments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [sales, setSales] = useState([]);
    const [rentals, setRentals] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [methodFilter, setMethodFilter] = useState("All");

    const [showModal, setShowModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);

    const [editingPayment, setEditingPayment] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [receipt, setReceipt] = useState(null);

    const [form, setForm] = useState({
        CustomerID: "",
        SaleID: "",
        RentalAgreementID: "",
        PaymentMethod: "Cash",
        Amount: "",
        PaymentDate: "",
        PaymentStatus: "Pending"
    });


    // =================================================
    // AUTH HEADERS
    // =================================================

    const getHeaders = () => {
        const token = getToken();

        return {
            Authorization: `Bearer ${token}`
        };
    };


    // =================================================
    // LOAD DATA
    // =================================================

    const loadData = useCallback(async () => {

        try {
            setLoading(true);

            const headers = getHeaders();

            const [
                paymentsResponse,
                customersResponse,
                salesResponse,
                rentalsResponse
            ] = await Promise.all([
                API.get("/payments", { headers }),
                API.get("/customers", { headers }),
                API.get("/sales", { headers }),
                API.get("/rentals", { headers })
            ]);

            const paymentData =
                paymentsResponse.data?.payments ||
                paymentsResponse.data?.data ||
                [];

            const customerData =
                customersResponse.data?.customers ||
                customersResponse.data?.data ||
                [];

            const salesData =
                salesResponse.data?.sales ||
                salesResponse.data?.data ||
                [];

            const rentalData =
                rentalsResponse.data?.rentals ||
                rentalsResponse.data?.data ||
                [];

            setPayments(Array.isArray(paymentData) ? paymentData : []);
            setCustomers(Array.isArray(customerData) ? customerData : []);
            setSales(Array.isArray(salesData) ? salesData : []);
            setRentals(Array.isArray(rentalData) ? rentalData : []);

        } catch (error) {

            console.error("Failed to load payment data:", error);

            alert(
                error.response?.data?.message ||
                "Failed to load payment data."
            );

        } finally {
            setLoading(false);
        }

    }, []);


    useEffect(() => {
        loadData();
    }, [loadData]);


    // =================================================
    // FORM CHANGE
    // =================================================

    const handleChange = (event) => {

        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

        // A payment belongs to either Sale OR Rental
        if (name === "SaleID" && value) {
            setForm((previous) => ({
                ...previous,
                SaleID: value,
                RentalAgreementID: ""
            }));
        }

        if (name === "RentalAgreementID" && value) {
            setForm((previous) => ({
                ...previous,
                RentalAgreementID: value,
                SaleID: ""
            }));
        }
    };


    // =================================================
    // OPEN CREATE MODAL
    // =================================================

    const openCreateModal = () => {

        setEditingPayment(null);

        setForm({
            CustomerID: "",
            SaleID: "",
            RentalAgreementID: "",
            PaymentMethod: "Cash",
            Amount: "",
            PaymentDate: new Date().toISOString().slice(0, 16),
            PaymentStatus: "Pending"
        });

        setShowModal(true);
    };


    // =================================================
    // OPEN EDIT MODAL
    // =================================================

    const openEditModal = (payment) => {

        setEditingPayment(payment);

        setForm({
            CustomerID: payment.CustomerID || "",
            SaleID: payment.SaleID || "",
            RentalAgreementID: payment.RentalAgreementID || "",
            PaymentMethod: payment.PaymentMethod || "Cash",
            Amount: payment.Amount || "",
            PaymentDate: payment.PaymentDate
                ? new Date(payment.PaymentDate)
                    .toISOString()
                    .slice(0, 16)
                : "",
            PaymentStatus: payment.PaymentStatus || "Pending"
        });

        setShowModal(true);
    };


    // =================================================
    // CLOSE MODAL
    // =================================================

    const closeModal = () => {

        if (saving) return;

        setShowModal(false);
        setEditingPayment(null);
    };


    // =================================================
    // SUBMIT PAYMENT
    // =================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        if (!form.CustomerID) {
            alert("Please select a customer.");
            return;
        }

        if (!form.SaleID && !form.RentalAgreementID) {
            alert("Please select either a sale or rental agreement.");
            return;
        }

        if (form.SaleID && form.RentalAgreementID) {
            alert("Payment cannot belong to both a sale and rental agreement.");
            return;
        }

        if (!form.Amount || Number(form.Amount) <= 0) {
            alert("Please enter a valid payment amount.");
            return;
        }

        try {

            setSaving(true);

            const headers = getHeaders();

            if (editingPayment) {

                await API.patch(
                    `/payments/${editingPayment.PaymentID}`,
                    {
                        PaymentMethod: form.PaymentMethod,
                        Amount: Number(form.Amount),
                        PaymentStatus: form.PaymentStatus
                    },
                    { headers }
                );

                alert("Payment updated successfully.");

            } else {

                await API.post(
                    "/payments",
                    {
                        CustomerID: Number(form.CustomerID),
                        SaleID: form.SaleID
                            ? Number(form.SaleID)
                            : null,
                        RentalAgreementID:
                            form.RentalAgreementID
                                ? Number(form.RentalAgreementID)
                                : null,
                        PaymentMethod: form.PaymentMethod,
                        Amount: Number(form.Amount),
                        PaymentDate: form.PaymentDate || null,
                        PaymentStatus: form.PaymentStatus
                    },
                    { headers }
                );

                alert("Payment recorded successfully.");
            }

            closeModal();
            await loadData();

        } catch (error) {

            console.error("Payment save error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to save payment."
            );

        } finally {
            setSaving(false);
        }
    };


    // =================================================
    // CANCEL PAYMENT
    // =================================================

    const handleCancelPayment = async (payment) => {

        if (payment.PaymentStatus === "Cancelled") {
            alert("This payment is already cancelled.");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to cancel Payment #${payment.PaymentID}?`
        );

        if (!confirmed) return;

        try {

            setSaving(true);

            await API.patch(
                `/payments/${payment.PaymentID}/cancel`,
                {},
                {
                    headers: getHeaders()
                }
            );

            alert("Payment cancelled successfully.");

            await loadData();

        } catch (error) {

            console.error("Cancel payment error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to cancel payment."
            );

        } finally {
            setSaving(false);
        }
    };


    // =================================================
    // VIEW PAYMENT
    // =================================================

    const handleViewPayment = async (payment) => {

        try {

            const response = await API.get(
                `/payments/${payment.PaymentID}`,
                {
                    headers: getHeaders()
                }
            );

            setSelectedPayment(
                response.data?.payment || payment
            );

            setShowDetails(true);

        } catch (error) {

            console.error("Get payment error:", error);

            setSelectedPayment(payment);
            setShowDetails(true);
        }
    };


    // =================================================
    // VIEW RECEIPT
    // =================================================

    const handleReceipt = async (payment) => {

        try {

            const response = await API.get(
                `/payments/${payment.PaymentID}/receipt`,
                {
                    headers: getHeaders()
                }
            );

            setReceipt(
                response.data?.receipt || payment
            );

            setShowReceipt(true);

        } catch (error) {

            console.error("Receipt error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to load receipt."
            );
        }
    };


    // =================================================
    // FILTER PAYMENTS
    // =================================================

    const filteredPayments = useMemo(() => {

        const searchValue = search.trim().toLowerCase();

        return payments.filter((payment) => {

            const matchesSearch =
                !searchValue ||
                String(payment.PaymentID)
                    .toLowerCase()
                    .includes(searchValue) ||
                String(payment.CustomerName || "")
                    .toLowerCase()
                    .includes(searchValue) ||
                String(payment.SalePropertyName || "")
                    .toLowerCase()
                    .includes(searchValue) ||
                String(payment.RentalPropertyName || "")
                    .toLowerCase()
                    .includes(searchValue) ||
                String(payment.HandledByName || "")
                    .toLowerCase()
                    .includes(searchValue);

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
        search,
        statusFilter,
        methodFilter
    ]);


    // =================================================
    // PAYMENT STATISTICS
    // =================================================

    const statistics = useMemo(() => {

        const paid = payments.filter(
            (payment) => payment.PaymentStatus === "Paid"
        );

        const pending = payments.filter(
            (payment) => payment.PaymentStatus === "Pending"
        );

        const failed = payments.filter(
            (payment) => payment.PaymentStatus === "Failed"
        );

        const cancelled = payments.filter(
            (payment) => payment.PaymentStatus === "Cancelled"
        );

        return {
            total: payments.reduce(
                (sum, payment) =>
                    sum + Number(payment.Amount || 0),
                0
            ),

            paid: paid.reduce(
                (sum, payment) =>
                    sum + Number(payment.Amount || 0),
                0
            ),

            pending: pending.reduce(
                (sum, payment) =>
                    sum + Number(payment.Amount || 0),
                0
            ),

            failed: failed.reduce(
                (sum, payment) =>
                    sum + Number(payment.Amount || 0),
                0
            ),

            cancelled: cancelled.reduce(
                (sum, payment) =>
                    sum + Number(payment.Amount || 0),
                0
            )
        };

    }, [payments]);


    // =================================================
    // PAYMENT TYPE
    // =================================================

    const getPaymentType = (payment) => {

        if (payment.SaleID) {
            return "Sale";
        }

        if (payment.RentalAgreementID) {
            return "Rental";
        }

        return "Other";
    };


    // =================================================
    // STATUS ICON
    // =================================================

    const getStatusIcon = (status) => {

        switch (status) {

            case "Paid":
                return <CheckCircle size={14} />;

            case "Pending":
                return <Clock size={14} />;

            case "Failed":
                return <AlertCircle size={14} />;

            case "Cancelled":
                return <XCircle size={14} />;

            default:
                return null;
        }
    };


    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="payments-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="payments-header">

                <div>
                    <div className="payments-title-row">
                        <CreditCard size={28} />
                        <h1>Payments</h1>
                    </div>

                    <p>
                        Manage property sale and rental payments
                    </p>
                </div>

                <button
                    className="primary-btn"
                    onClick={openCreateModal}
                >
                    <Plus size={18} />
                    Record Payment
                </button>

            </div>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="payment-stats">

                <div className="stat-card total">
                    <div className="stat-icon">
                        <DollarSign size={22} />
                    </div>

                    <div>
                        <span>Total Payments</span>
                        <strong>
                            {formatCurrency(statistics.total)} ETB
                        </strong>
                    </div>
                </div>


                <div className="stat-card paid">
                    <div className="stat-icon">
                        <CheckCircle size={22} />
                    </div>

                    <div>
                        <span>Paid</span>
                        <strong>
                            {formatCurrency(statistics.paid)} ETB
                        </strong>
                    </div>
                </div>


                <div className="stat-card pending">
                    <div className="stat-icon">
                        <Clock size={22} />
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>
                            {formatCurrency(statistics.pending)} ETB
                        </strong>
                    </div>
                </div>


                <div className="stat-card cancelled">
                    <div className="stat-icon">
                        <XCircle size={22} />
                    </div>

                    <div>
                        <span>Cancelled / Failed</span>
                        <strong>
                            {formatCurrency(
                                statistics.cancelled +
                                statistics.failed
                            )} ETB
                        </strong>
                    </div>
                </div>

            </div>


            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="payments-toolbar">

                <div className="payment-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search customer, property, payment..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />
                </div>


                <select
                    value={statusFilter}
                    onChange={(event) =>
                        setStatusFilter(event.target.value)
                    }
                >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Failed">Failed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>


                <select
                    value={methodFilter}
                    onChange={(event) =>
                        setMethodFilter(event.target.value)
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


                <button
                    className="refresh-btn"
                    onClick={loadData}
                    disabled={loading}
                    title="Refresh"
                >
                    <RefreshCw
                        size={18}
                        className={loading ? "spin" : ""}
                    />
                </button>

            </div>


            {/* =================================================
                PAYMENT TABLE
            ================================================= */}

            <div className="payments-card">

                {loading ? (

                    <div className="loading-state">
                        <RefreshCw
                            size={30}
                            className="spin"
                        />

                        <p>Loading payments...</p>
                    </div>

                ) : filteredPayments.length === 0 ? (

                    <div className="empty-state">
                        <CreditCard size={42} />

                        <h3>No payments found</h3>

                        <p>
                            No payment records match your current filters.
                        </p>

                        <button
                            className="primary-btn"
                            onClick={openCreateModal}
                        >
                            <Plus size={18} />
                            Record Payment
                        </button>
                    </div>

                ) : (

                    <div className="table-wrapper">

                        <table className="payments-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Customer</th>
                                    <th>Property</th>
                                    <th>Type</th>
                                    <th>Method</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Handled By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredPayments.map((payment) => (

                                    <tr key={payment.PaymentID}>

                                        <td>
                                            <strong>
                                                #{payment.PaymentID}
                                            </strong>
                                        </td>

                                        <td>
                                            <div className="customer-cell">
                                                <strong>
                                                    {payment.CustomerName || "-"}
                                                </strong>

                                                {payment.CustomerPhone && (
                                                    <small>
                                                        {payment.CustomerPhone}
                                                    </small>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            {
                                                payment.SalePropertyName ||
                                                payment.RentalPropertyName ||
                                                "-"
                                            }
                                        </td>

                                        <td>
                                            <span className="type-badge">
                                                {getPaymentType(payment)}
                                            </span>
                                        </td>

                                        <td>
                                            {payment.PaymentMethod}
                                        </td>

                                        <td>
                                            <strong>
                                                {formatCurrency(payment.Amount)}
                                                {" "}ETB
                                            </strong>
                                        </td>

                                        <td>
                                            {formatDate(payment.PaymentDate)}
                                        </td>

                                        <td>
                                            <span
                                                className={`status-badge status-${String(
                                                    payment.PaymentStatus || ""
                                                ).toLowerCase()}`}
                                            >
                                                {getStatusIcon(
                                                    payment.PaymentStatus
                                                )}

                                                {payment.PaymentStatus}
                                            </span>
                                        </td>

                                        <td>
                                            {payment.HandledByName || "-"}
                                        </td>

                                        <td>

                                            <div className="action-buttons">

                                                <button
                                                    className="icon-btn view"
                                                    title="View payment"
                                                    onClick={() =>
                                                        handleViewPayment(payment)
                                                    }
                                                >
                                                    <Eye size={16} />
                                                </button>


                                                <button
                                                    className="icon-btn edit"
                                                    title="Edit payment"
                                                    onClick={() =>
                                                        openEditModal(payment)
                                                    }
                                                    disabled={
                                                        payment.PaymentStatus ===
                                                        "Cancelled"
                                                    }
                                                >
                                                    <Edit size={16} />
                                                </button>


                                                <button
                                                    className="icon-btn receipt"
                                                    title="Receipt"
                                                    onClick={() =>
                                                        handleReceipt(payment)
                                                    }
                                                >
                                                    <Receipt size={16} />
                                                </button>


                                                <button
                                                    className="icon-btn cancel"
                                                    title="Cancel payment"
                                                    onClick={() =>
                                                        handleCancelPayment(payment)
                                                    }
                                                    disabled={
                                                        payment.PaymentStatus ===
                                                        "Cancelled"
                                                    }
                                                >
                                                    <Ban size={16} />
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* =================================================
                CREATE / EDIT MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeModal();
                        }
                    }}
                >

                    <div className="payment-modal">

                        <div className="modal-header">

                            <div>
                                <h2>
                                    {editingPayment
                                        ? "Edit Payment"
                                        : "Record New Payment"}
                                </h2>

                                <p>
                                    {editingPayment
                                        ? `Payment #${editingPayment.PaymentID}`
                                        : "Enter payment transaction details"}
                                </p>
                            </div>

                            <button
                                className="close-btn"
                                onClick={closeModal}
                            >
                                <X size={20} />
                            </button>

                        </div>


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
                                    value={form.CustomerID}
                                    onChange={handleChange}
                                    required
                                    disabled={Boolean(editingPayment)}
                                >
                                    <option value="">
                                        Select customer
                                    </option>

                                    {customers.map((customer) => (

                                        <option
                                            key={customer.CustomerID}
                                            value={customer.CustomerID}
                                        >
                                            {customer.FullName}
                                        </option>

                                    ))}

                                </select>

                            </div>


                            {/* SALE */}

                            <div className="form-group">

                                <label>
                                    Sale
                                </label>

                                <select
                                    name="SaleID"
                                    value={form.SaleID}
                                    onChange={handleChange}
                                    disabled={
                                        Boolean(form.RentalAgreementID) ||
                                        Boolean(editingPayment)
                                    }
                                >
                                    <option value="">
                                        Select sale
                                    </option>

                                    {sales.map((sale) => (

                                        <option
                                            key={sale.SaleID}
                                            value={sale.SaleID}
                                        >
                                            Sale #{sale.SaleID}
                                            {" - "}
                                            {sale.PropertyName ||
                                                `Property #${sale.PropertyID}`}
                                        </option>

                                    ))}

                                </select>

                            </div>


                            <div className="form-or">
                                OR
                            </div>


                            {/* RENTAL */}

                            <div className="form-group">

                                <label>
                                    Rental Agreement
                                </label>

                                <select
                                    name="RentalAgreementID"
                                    value={form.RentalAgreementID}
                                    onChange={handleChange}
                                    disabled={
                                        Boolean(form.SaleID) ||
                                        Boolean(editingPayment)
                                    }
                                >
                                    <option value="">
                                        Select rental agreement
                                    </option>

                                    {rentals.map((rental) => (

                                        <option
                                            key={
                                                rental.RentalID ||
                                                rental.RentalAgreementID
                                            }
                                            value={
                                                rental.RentalID ||
                                                rental.RentalAgreementID
                                            }
                                        >
                                            Rental #
                                            {rental.RentalID ||
                                                rental.RentalAgreementID}
                                            {" - "}
                                            {rental.PropertyName ||
                                                `Property #${rental.PropertyID}`}
                                        </option>

                                    ))}

                                </select>

                            </div>


                            <div className="form-row">

                                {/* PAYMENT METHOD */}

                                <div className="form-group">

                                    <label>
                                        Payment Method
                                        <span>*</span>
                                    </label>

                                    <select
                                        name="PaymentMethod"
                                        value={form.PaymentMethod}
                                        onChange={handleChange}
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


                                {/* AMOUNT */}

                                <div className="form-group">

                                    <label>
                                        Amount (ETB)
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="number"
                                        name="Amount"
                                        value={form.Amount}
                                        onChange={handleChange}
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Enter amount"
                                        required
                                    />

                                </div>

                            </div>


                            <div className="form-row">

                                {/* PAYMENT DATE */}

                                <div className="form-group">

                                    <label>
                                        Payment Date
                                    </label>

                                    <input
                                        type="datetime-local"
                                        name="PaymentDate"
                                        value={form.PaymentDate}
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
                                        value={form.PaymentStatus}
                                        onChange={handleChange}
                                    >
                                        <option value="Pending">
                                            Pending
                                        </option>

                                        <option value="Paid">
                                            Paid
                                        </option>

                                        <option value="Failed">
                                            Failed
                                        </option>

                                        <option value="Cancelled">
                                            Cancelled
                                        </option>
                                    </select>

                                </div>

                            </div>


                            {/* ACTIONS */}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw
                                                size={17}
                                                className="spin"
                                            />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={17} />
                                            {editingPayment
                                                ? "Update Payment"
                                                : "Record Payment"}
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* =================================================
                PAYMENT DETAILS MODAL
            ================================================= */}

            {showDetails && selectedPayment && (

                <div
                    className="modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowDetails(false);
                        }
                    }}
                >

                    <div className="payment-modal details-modal">

                        <div className="modal-header">

                            <div>
                                <h2>
                                    Payment #{selectedPayment.PaymentID}
                                </h2>

                                <p>
                                    Payment transaction details
                                </p>
                            </div>

                            <button
                                className="close-btn"
                                onClick={() =>
                                    setShowDetails(false)
                                }
                            >
                                <X size={20} />
                            </button>

                        </div>


                        <div className="payment-details">

                            <div className="detail-status">

                                <span
                                    className={`status-badge status-${String(
                                        selectedPayment.PaymentStatus || ""
                                    ).toLowerCase()}`}
                                >
                                    {getStatusIcon(
                                        selectedPayment.PaymentStatus
                                    )}

                                    {selectedPayment.PaymentStatus}
                                </span>

                                <strong>
                                    {formatCurrency(
                                        selectedPayment.Amount
                                    )} ETB
                                </strong>

                            </div>


                            <div className="details-grid">

                                <div>
                                    <span>Customer</span>
                                    <strong>
                                        {selectedPayment.CustomerName || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Payment Type</span>
                                    <strong>
                                        {getPaymentType(selectedPayment)}
                                    </strong>
                                </div>

                                <div>
                                    <span>Property</span>
                                    <strong>
                                        {
                                            selectedPayment.SalePropertyName ||
                                            selectedPayment.RentalPropertyName ||
                                            "-"
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>Payment Method</span>
                                    <strong>
                                        {selectedPayment.PaymentMethod}
                                    </strong>
                                </div>

                                <div>
                                    <span>Payment Date</span>
                                    <strong>
                                        {formatDate(
                                            selectedPayment.PaymentDate
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>Handled By</span>
                                    <strong>
                                        {
                                            selectedPayment.HandledByName ||
                                            "-"
                                        }
                                    </strong>
                                </div>

                                {selectedPayment.SaleID && (
                                    <div>
                                        <span>Sale ID</span>
                                        <strong>
                                            #{selectedPayment.SaleID}
                                        </strong>
                                    </div>
                                )}

                                {selectedPayment.RentalAgreementID && (
                                    <div>
                                        <span>Rental Agreement</span>
                                        <strong>
                                            #
                                            {
                                                selectedPayment.RentalAgreementID
                                            }
                                        </strong>
                                    </div>
                                )}

                            </div>


                            <div className="details-actions">

                                <button
                                    className="secondary-btn"
                                    onClick={() =>
                                        setShowDetails(false)
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    className="primary-btn"
                                    onClick={() => {
                                        setShowDetails(false);
                                        handleReceipt(selectedPayment);
                                    }}
                                >
                                    <Receipt size={17} />
                                    Receipt
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                RECEIPT MODAL
            ================================================= */}

            {showReceipt && receipt && (

                <div
                    className="modal-overlay receipt-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowReceipt(false);
                        }
                    }}
                >

                    <div className="receipt-modal">

                        <div className="receipt-header">

                            <div>
                                <Receipt size={24} />

                                <h2>
                                    Payment Receipt
                                </h2>
                            </div>

                            <button
                                className="close-btn"
                                onClick={() =>
                                    setShowReceipt(false)
                                }
                            >
                                <X size={20} />
                            </button>

                        </div>


                        <div className="receipt-content">

                            <div className="receipt-company">
                                <h1>Vita Real Estate</h1>
                                <p>
                                    Property Sales, Rental & Management
                                </p>
                            </div>


                            <div className="receipt-number">
                                Receipt #{receipt.PaymentID}
                            </div>


                            <div className="receipt-divider" />


                            <div className="receipt-row">
                                <span>Customer</span>
                                <strong>
                                    {receipt.CustomerName || "-"}
                                </strong>
                            </div>


                            <div className="receipt-row">
                                <span>Property</span>
                                <strong>
                                    {
                                        receipt.SalePropertyName ||
                                        receipt.RentalPropertyName ||
                                        "-"
                                    }
                                </strong>
                            </div>


                            <div className="receipt-row">
                                <span>Payment Type</span>
                                <strong>
                                    {getPaymentType(receipt)}
                                </strong>
                            </div>


                            <div className="receipt-row">
                                <span>Payment Method</span>
                                <strong>
                                    {receipt.PaymentMethod}
                                </strong>
                            </div>


                            <div className="receipt-row">
                                <span>Payment Date</span>
                                <strong>
                                    {formatDate(receipt.PaymentDate)}
                                </strong>
                            </div>


                            <div className="receipt-divider" />


                            <div className="receipt-total">
                                <span>Amount Paid</span>

                                <strong>
                                    {formatCurrency(
                                        receipt.Amount
                                    )} ETB
                                </strong>
                            </div>


                            <div className="receipt-status">
                                <span
                                    className={`status-badge status-${String(
                                        receipt.PaymentStatus || ""
                                    ).toLowerCase()}`}
                                >
                                    {receipt.PaymentStatus}
                                </span>
                            </div>


                            <div className="receipt-footer">
                                <p>
                                    Handled by:{" "}
                                    {receipt.HandledByName || "-"}
                                </p>

                                <p>
                                    Thank you for your payment.
                                </p>
                            </div>

                        </div>


                        <div className="receipt-actions">

                            <button
                                className="secondary-btn"
                                onClick={() =>
                                    setShowReceipt(false)
                                }
                            >
                                Close
                            </button>

                            <button
                                className="primary-btn"
                                onClick={() => window.print()}
                            >
                                <Receipt size={17} />
                                Print Receipt
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Payments;
