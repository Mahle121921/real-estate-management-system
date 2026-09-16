import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    BarChart3,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    Eye,
    FileText,
    RefreshCw,
    Search,
    User,
    X,
    XCircle,
} from "lucide-react";
import "./OwnerSales.css";

const API_URL = "http://localhost:5000/api";

const OwnerSales = () => {
    const [sales, setSales] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("All");

    const getToken = () => {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken")
        );
    };

    const fetchSales = useCallback(async (isRefresh = false) => {
        const token = getToken();

        if (!token) {
            setError("Authentication token not found. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await axios.get(
                `${API_URL}/owners/owner/sales`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setSales(response.data?.sales || []);
        } catch (err) {
            console.error("Failed to fetch owner sales:", err);

            if (err.response?.status === 401) {
                setError("Your session has expired. Please log in again.");
            } else if (err.response?.status === 403) {
                setError("You are not authorized to view owner sales.");
            } else {
                setError(
                    err.response?.data?.message ||
                    "Failed to load sales. Please try again."
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const formatCurrency = (amount) => {
        const value = Number(amount || 0);

        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

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

    const filteredSales = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return sales.filter((sale) => {
            const matchesSearch =
                !search ||
                String(sale.SaleID || "")
                    .toLowerCase()
                    .includes(search) ||
                String(sale.PropertyName || "")
                    .toLowerCase()
                    .includes(search) ||
                String(sale.CustomerName || "")
                    .toLowerCase()
                    .includes(search) ||
                String(sale.HandledByName || "")
                    .toLowerCase()
                    .includes(search);

            const matchesStatus =
                paymentStatus === "All" ||
                sale.PaymentStatus === paymentStatus;

            return matchesSearch && matchesStatus;
        });
    }, [sales, searchTerm, paymentStatus]);

    const statistics = useMemo(() => {
        const totalSales = sales.length;

        const paidSales = sales.filter(
            (sale) => sale.PaymentStatus === "Paid"
        );

        const pendingSales = sales.filter(
            (sale) => sale.PaymentStatus === "Pending"
        );

        const cancelledSales = sales.filter(
            (sale) => sale.PaymentStatus === "Cancelled"
        );

        const totalValue = sales.reduce(
            (sum, sale) => sum + Number(sale.SalePrice || 0),
            0
        );

        const paidValue = paidSales.reduce(
            (sum, sale) => sum + Number(sale.SalePrice || 0),
            0
        );

        const pendingValue = pendingSales.reduce(
            (sum, sale) => sum + Number(sale.SalePrice || 0),
            0
        );

        return {
            totalSales,
            paidSales: paidSales.length,
            pendingSales: pendingSales.length,
            cancelledSales: cancelledSales.length,
            totalValue,
            paidValue,
            pendingValue,
        };
    }, [sales]);

    const getStatusClass = (status) => {
        switch (status) {
            case "Paid":
                return "owner-sale-status owner-sale-status-paid";

            case "Pending":
                return "owner-sale-status owner-sale-status-pending";

            case "Cancelled":
                return "owner-sale-status owner-sale-status-cancelled";

            default:
                return "owner-sale-status";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Paid":
                return <CheckCircle size={14} />;

            case "Pending":
                return <Clock size={14} />;

            case "Cancelled":
                return <XCircle size={14} />;

            default:
                return <Clock size={14} />;
        }
    };

    const getStatusLabel = (status) => {
        return status || "Unknown";
    };

    const handleViewSale = async (saleId) => {
        const token = getToken();

        if (!token) {
            setError("Authentication token not found.");
            return;
        }

        try {
            setError("");

            const response = await axios.get(
                `${API_URL}/owners/owner/sales/${saleId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setSelectedSale(response.data?.sale || null);
        } catch (err) {
            console.error("Failed to fetch sale details:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load sale details."
            );
        }
    };

    const closeModal = () => {
        setSelectedSale(null);
    };

    return (
        <div className="owner-sales-page">

            {/* HEADER */}
            <div className="owner-sales-header">
                <div>
                    <div className="owner-sales-title-row">
                        <div className="owner-sales-title-icon">
                            <BarChart3 size={24} />
                        </div>

                        <div>
                            <h1>Sales Management</h1>
                            <p>
                                Monitor sales and payment activity for your properties.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    className="owner-sales-refresh-btn"
                    onClick={() => fetchSales(true)}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={17}
                        className={refreshing ? "owner-sales-spin" : ""}
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* ERROR */}
            {error && (
                <div className="owner-sales-error">
                    <XCircle size={19} />
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Close error"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* SUMMARY CARDS */}
            <div className="owner-sales-summary-grid">

                <div className="owner-sales-summary-card">
                    <div className="owner-sales-summary-icon total">
                        <FileText size={21} />
                    </div>

                    <div>
                        <span>Total Sales</span>
                        <strong>{statistics.totalSales}</strong>
                    </div>
                </div>

                <div className="owner-sales-summary-card">
                    <div className="owner-sales-summary-icon value">
                        <DollarSign size={21} />
                    </div>

                    <div>
                        <span>Total Sales Value</span>
                        <strong>
                            {formatCurrency(statistics.totalValue)} ETB
                        </strong>
                    </div>
                </div>

                <div className="owner-sales-summary-card">
                    <div className="owner-sales-summary-icon paid">
                        <CheckCircle size={21} />
                    </div>

                    <div>
                        <span>Paid Sales</span>
                        <strong>{statistics.paidSales}</strong>
                        <small>
                            {formatCurrency(statistics.paidValue)} ETB
                        </small>
                    </div>
                </div>

                <div className="owner-sales-summary-card">
                    <div className="owner-sales-summary-icon pending">
                        <Clock size={21} />
                    </div>

                    <div>
                        <span>Pending Sales</span>
                        <strong>{statistics.pendingSales}</strong>
                        <small>
                            {formatCurrency(statistics.pendingValue)} ETB
                        </small>
                    </div>
                </div>

                <div className="owner-sales-summary-card">
                    <div className="owner-sales-summary-icon cancelled">
                        <XCircle size={21} />
                    </div>

                    <div>
                        <span>Cancelled Sales</span>
                        <strong>{statistics.cancelledSales}</strong>
                    </div>
                </div>

            </div>

            {/* TOOLBAR */}
            <div className="owner-sales-toolbar">

                <div className="owner-sales-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search sale, property, customer..."
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                    />
                </div>

                <div className="owner-sales-filter">
                    <label htmlFor="paymentStatus">
                        Payment Status
                    </label>

                    <select
                        id="paymentStatus"
                        value={paymentStatus}
                        onChange={(event) =>
                            setPaymentStatus(event.target.value)
                        }
                    >
                        <option value="All">All Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                <div className="owner-sales-result-count">
                    {filteredSales.length} of {sales.length} sales
                </div>

            </div>

            {/* TABLE */}
            <div className="owner-sales-card">

                <div className="owner-sales-card-header">
                    <div>
                        <h2>Property Sales</h2>
                        <p>
                            Sales recorded for properties owned by you.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="owner-sales-loading">
                        <RefreshCw
                            size={28}
                            className="owner-sales-spin"
                        />

                        <p>Loading sales...</p>
                    </div>
                ) : filteredSales.length === 0 ? (
                    <div className="owner-sales-empty">
                        <div className="owner-sales-empty-icon">
                            <FileText size={30} />
                        </div>

                        <h3>No sales found</h3>

                        <p>
                            {sales.length === 0
                                ? "There are no sales recorded for your properties yet."
                                : "No sales match your current search or filter."}
                        </p>

                        {(searchTerm || paymentStatus !== "All") && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm("");
                                    setPaymentStatus("All");
                                }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="owner-sales-table-wrapper">
                        <table className="owner-sales-table">

                            <thead>
                                <tr>
                                    <th>Sale ID</th>
                                    <th>Property</th>
                                    <th>Customer</th>
                                    <th>Sale Date</th>
                                    <th>Sale Price</th>
                                    <th>Payment Status</th>
                                    <th>Handled By</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredSales.map((sale) => (
                                    <tr key={sale.SaleID}>

                                        <td>
                                            <span className="owner-sales-id">
                                                #{sale.SaleID}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="owner-sales-property">
                                                <div className="owner-sales-property-icon">
                                                    <Building2 size={17} />
                                                </div>

                                                <div>
                                                    <strong>
                                                        {sale.PropertyName || "—"}
                                                    </strong>

                                                    <span>
                                                        {sale.PropertyType || "Property"}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="owner-sales-customer">
                                                <User size={16} />

                                                <span>
                                                    {sale.CustomerName || "—"}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="owner-sales-date">
                                                <Calendar size={15} />

                                                <span>
                                                    {formatDate(sale.SaleDate)}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <strong className="owner-sales-price">
                                                {formatCurrency(sale.SalePrice)} ETB
                                            </strong>
                                        </td>

                                        <td>
                                            <span
                                                className={getStatusClass(
                                                    sale.PaymentStatus
                                                )}
                                            >
                                                {getStatusIcon(
                                                    sale.PaymentStatus
                                                )}

                                                {getStatusLabel(
                                                    sale.PaymentStatus
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="owner-sales-handled-by">
                                                {sale.HandledByName || "—"}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="owner-sales-view-btn"
                                                onClick={() =>
                                                    handleViewSale(
                                                        sale.SaleID
                                                    )
                                                }
                                            >
                                                <Eye size={16} />
                                                View
                                            </button>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                )}

            </div>

            {/* SALE DETAILS MODAL */}
            {selectedSale && (
                <div
                    className="owner-sales-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div className="owner-sales-modal">

                        <div className="owner-sales-modal-header">

                            <div>
                                <div className="owner-sales-modal-title">
                                    <CreditCard size={21} />
                                    <h2>
                                        Sale #{selectedSale.SaleID}
                                    </h2>
                                </div>

                                <p>
                                    Sale transaction details
                                </p>
                            </div>

                            <button
                                type="button"
                                className="owner-sales-modal-close"
                                onClick={closeModal}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <div className="owner-sales-modal-status">
                            <span
                                className={getStatusClass(
                                    selectedSale.PaymentStatus
                                )}
                            >
                                {getStatusIcon(
                                    selectedSale.PaymentStatus
                                )}

                                {getStatusLabel(
                                    selectedSale.PaymentStatus
                                )}
                            </span>
                        </div>

                        <div className="owner-sales-detail-price">
                            <span>Sale Price</span>

                            <strong>
                                {formatCurrency(
                                    selectedSale.SalePrice
                                )}{" "}
                                ETB
                            </strong>
                        </div>

                        <div className="owner-sales-details-grid">

                            <div className="owner-sales-detail-item">
                                <span>Property</span>

                                <strong>
                                    {selectedSale.PropertyName || "—"}
                                </strong>

                                <small>
                                    {selectedSale.PropertyType || "—"}
                                </small>
                            </div>

                            <div className="owner-sales-detail-item">
                                <span>Address</span>

                                <strong>
                                    {selectedSale.Address || "—"}
                                </strong>
                            </div>

                            <div className="owner-sales-detail-item">
                                <span>Customer</span>

                                <strong>
                                    {selectedSale.CustomerName || "—"}
                                </strong>
                            </div>

                            <div className="owner-sales-detail-item">
                                <span>Customer ID</span>

                                <strong>
                                    {selectedSale.CustomerID || "—"}
                                </strong>
                            </div>

                            <div className="owner-sales-detail-item">
                                <span>Sale Date</span>

                                <strong>
                                    {formatDate(
                                        selectedSale.SaleDate
                                    )}
                                </strong>
                            </div>

                            <div className="owner-sales-detail-item">
                                <span>Handled By</span>

                                <strong>
                                    {selectedSale.HandledByName || "—"}
                                </strong>
                            </div>

                            <div className="owner-sales-detail-item">
                                <span>Handled By ID</span>

                                <strong>
                                    {selectedSale.HandledBy || "—"}
                                </strong>
                            </div>

                            <div className="owner-sales-detail-item">
                                <span>Property ID</span>

                                <strong>
                                    {selectedSale.PropertyID || "—"}
                                </strong>
                            </div>

                        </div>

                        <div className="owner-sales-modal-footer">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="owner-sales-close-btn"
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

export default OwnerSales;