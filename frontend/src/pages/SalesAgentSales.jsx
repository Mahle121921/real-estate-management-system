
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    ShoppingCart,
    Plus,
    Search,
    Eye,
    Edit3,
    X,
    RefreshCw,
    UserRound,
    Building2,
    CalendarDays,
    DollarSign,
    CheckCircle2,
    Clock3,
    XCircle
} from "lucide-react";

import "./SalesAgentSales.css";

const API_URL = "http://localhost:5000/api";

function SalesAgentSales() {
    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [properties, setProperties] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [showSaleModal, setShowSaleModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const [selectedSale, setSelectedSale] = useState(null);

    const [editingSale, setEditingSale] = useState(false);

    const [form, setForm] = useState({
        PropertyID: "",
        CustomerID: "",
        SaleDate: new Date().toISOString().split("T")[0],
        SalePrice: "",
        PaymentStatus: "Pending"
    });

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    };

    // =====================================================
    // LOAD DATA
    // =====================================================

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [salesResponse, customersResponse, propertiesResponse] =
                await Promise.all([
                    axios.get(`${API_URL}/sales`, authConfig),
                    axios.get(`${API_URL}/customers`, authConfig),
                    axios.get(`${API_URL}/properties`, authConfig)
                ]);

            if (salesResponse.data.success) {
                setSales(salesResponse.data.sales || []);
            }

            if (customersResponse.data.success) {
                setCustomers(customersResponse.data.customers || []);
            }

            if (propertiesResponse.data.success) {
                setProperties(propertiesResponse.data.properties || []);
            }
        } catch (err) {
            console.error("Load sales data error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load sales information."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            loadData();
        } else {
            setLoading(false);
            setError("You are not logged in.");
        }
    }, [token]);

    // =====================================================
    // AVAILABLE PROPERTIES
    // =====================================================

    const availableProperties = useMemo(() => {
        return properties.filter(
            (property) =>
                String(property.Status).toLowerCase() === "available"
        );
    }, [properties]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const statistics = useMemo(() => {
        const total = sales.length;

        const pending = sales.filter(
            (sale) => sale.PaymentStatus === "Pending"
        ).length;

        const paid = sales.filter(
            (sale) => sale.PaymentStatus === "Paid"
        ).length;

        const cancelled = sales.filter(
            (sale) => sale.PaymentStatus === "Cancelled"
        ).length;

        const totalValue = sales
            .filter((sale) => sale.PaymentStatus !== "Cancelled")
            .reduce(
                (sum, sale) => sum + Number(sale.SalePrice || 0),
                0
            );

        return {
            total,
            pending,
            paid,
            cancelled,
            totalValue
        };
    }, [sales]);

    // =====================================================
    // FILTER SALES
    // =====================================================

    const filteredSales = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return sales.filter((sale) => {
            const matchesSearch =
                !search ||
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
                statusFilter === "All" ||
                sale.PaymentStatus === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [sales, searchTerm, statusFilter]);

    // =====================================================
    // FORM HANDLING
    // =====================================================

    const handleFormChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

        if (name === "PropertyID") {
            const selectedProperty = properties.find(
                (property) =>
                    String(property.PropertyID) === String(value)
            );

            if (selectedProperty) {
                setForm((previous) => ({
                    ...previous,
                    PropertyID: value,
                    SalePrice: selectedProperty.SalePrice || ""
                }));
            }
        }
    };

    // =====================================================
    // OPEN NEW SALE
    // =====================================================

    const openNewSale = () => {
        setEditingSale(false);
        setSelectedSale(null);

        setForm({
            PropertyID: "",
            CustomerID: "",
            SaleDate: new Date().toISOString().split("T")[0],
            SalePrice: "",
            PaymentStatus: "Pending"
        });

        setShowSaleModal(true);
    };

    // =====================================================
    // OPEN EDIT SALE
    // =====================================================

    const openEditSale = (sale) => {
        setSelectedSale(sale);
        setEditingSale(true);

        setForm({
            PropertyID: sale.PropertyID,
            CustomerID: sale.CustomerID,
            SaleDate: sale.SaleDate
                ? String(sale.SaleDate).substring(0, 10)
                : "",
            SalePrice: sale.SalePrice || "",
            PaymentStatus: sale.PaymentStatus || "Pending"
        });

        setShowSaleModal(true);
    };

    // =====================================================
    // SUBMIT SALE
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (
                !form.PropertyID ||
                !form.CustomerID ||
                !form.SaleDate ||
                form.SalePrice === ""
            ) {
                alert("Please complete all required fields.");
                return;
            }

            if (editingSale) {
                await axios.put(
                    `${API_URL}/sales/${selectedSale.SaleID}`,
                    form,
                    authConfig
                );

                alert("Sale updated successfully.");
            } else {
                await axios.post(
                    `${API_URL}/sales`,
                    form,
                    authConfig
                );

                alert("Sale recorded successfully.");
            }

            setShowSaleModal(false);
            setSelectedSale(null);
            setEditingSale(false);

            await loadData();
        } catch (err) {
            console.error("Save sale error:", err);

            alert(
                err.response?.data?.message ||
                "Failed to save sale."
            );
        }
    };

    // =====================================================
    // CANCEL SALE
    // =====================================================

    const handleCancelSale = async (sale) => {
        const confirmed = window.confirm(
            `Are you sure you want to cancel Sale #${sale.SaleID}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            await axios.patch(
                `${API_URL}/sales/${sale.SaleID}/cancel`,
                {},
                authConfig
            );

            alert("Sale cancelled successfully.");

            setShowDetailsModal(false);
            setSelectedSale(null);

            await loadData();
        } catch (err) {
            console.error("Cancel sale error:", err);

            alert(
                err.response?.data?.message ||
                "Failed to cancel sale."
            );
        }
    };

    // =====================================================
    // VIEW SALE
    // =====================================================

    const viewSale = (sale) => {
        setSelectedSale(sale);
        setShowDetailsModal(true);
    };

    // =====================================================
    // FORMAT PRICE
    // =====================================================

    const formatPrice = (price) => {
        return `${Number(price || 0).toLocaleString()} ETB`;
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString();
    };

    // =====================================================
    // STATUS BADGE
    // =====================================================

    const getStatusClass = (status) => {
        if (status === "Paid") return "sale-status paid";
        if (status === "Pending") return "sale-status pending";
        if (status === "Cancelled") return "sale-status cancelled";

        return "sale-status";
    };

    return (
        <div className="sales-agent-sales-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="sales-page-header">
                <div className="sales-page-title">
                    <div className="sales-page-icon">
                        <ShoppingCart size={25} />
                    </div>

                    <div>
                        <h1>Property Sales</h1>
                        <p>
                            Manage customer property sales and transactions
                        </p>
                    </div>
                </div>

                <div className="sales-header-actions">
                    <button
                        className="sales-refresh-btn"
                        onClick={loadData}
                        disabled={loading}
                    >
                        <RefreshCw
                            size={17}
                            className={loading ? "spinning" : ""}
                        />
                        Refresh
                    </button>

                    <button
                        className="new-sale-btn"
                        onClick={openNewSale}
                    >
                        <Plus size={18} />
                        Record New Sale
                    </button>
                </div>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="sales-error">
                    <strong>Unable to load sales</strong>
                    <p>{error}</p>

                    <button onClick={loadData}>
                        Try Again
                    </button>
                </div>
            )}

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="sales-stat-grid">

                <div className="sales-stat-card">
                    <div className="sales-stat-icon total">
                        <ShoppingCart size={20} />
                    </div>

                    <div>
                        <span>Total Sales</span>
                        <strong>{statistics.total}</strong>
                    </div>
                </div>

                <div className="sales-stat-card">
                    <div className="sales-stat-icon pending">
                        <Clock3 size={20} />
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>{statistics.pending}</strong>
                    </div>
                </div>

                <div className="sales-stat-card">
                    <div className="sales-stat-icon paid">
                        <CheckCircle2 size={20} />
                    </div>

                    <div>
                        <span>Paid</span>
                        <strong>{statistics.paid}</strong>
                    </div>
                </div>

                <div className="sales-stat-card">
                    <div className="sales-stat-icon cancelled">
                        <XCircle size={20} />
                    </div>

                    <div>
                        <span>Cancelled</span>
                        <strong>{statistics.cancelled}</strong>
                    </div>
                </div>

                <div className="sales-stat-card sales-value-card">
                    <div className="sales-stat-icon value">
                        <DollarSign size={20} />
                    </div>

                    <div>
                        <span>Sales Value</span>
                        <strong>
                            {formatPrice(statistics.totalValue)}
                        </strong>
                    </div>
                </div>

            </div>

            {/* =================================================
                SEARCH / FILTER
            ================================================= */}

            <div className="sales-filter-panel">

                <div className="sales-search">
                    <Search size={19} />

                    <input
                        type="text"
                        placeholder="Search property, customer, or sales agent..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                    />

                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value)
                    }
                >
                    <option value="All">All Payment Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                </select>

            </div>

            {/* =================================================
                SALES TABLE
            ================================================= */}

            <div className="sales-table-container">

                <div className="sales-table-header">
                    <div>
                        <h2>Sales Transactions</h2>
                        <span>
                            {filteredSales.length} transaction
                            {filteredSales.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="sales-loading">
                        <RefreshCw
                            size={30}
                            className="spinning"
                        />
                        <p>Loading sales...</p>
                    </div>
                ) : filteredSales.length === 0 ? (
                    <div className="sales-empty">
                        <ShoppingCart size={42} />

                        <h3>No sales found</h3>

                        <p>
                            There are no sales matching your search.
                        </p>
                    </div>
                ) : (
                    <div className="sales-table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Property</th>
                                    <th>Customer</th>
                                    <th>Sale Price</th>
                                    <th>Sale Date</th>
                                    <th>Payment Status</th>
                                    <th>Handled By</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredSales.map((sale) => (
                                    <tr key={sale.SaleID}>
                                        <td>
                                            <div className="property-cell">
                                                <div className="table-property-icon">
                                                    <Building2 size={17} />
                                                </div>

                                                <div>
                                                    <strong>
                                                        {sale.PropertyName}
                                                    </strong>

                                                    <small>
                                                        Property #
                                                        {sale.PropertyID}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="customer-cell">
                                                <UserRound size={16} />

                                                <span>
                                                    {sale.CustomerName}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <strong className="table-price">
                                                {formatPrice(
                                                    sale.SalePrice
                                                )}
                                            </strong>
                                        </td>

                                        <td>
                                            <div className="date-cell">
                                                <CalendarDays size={15} />
                                                {formatDate(
                                                    sale.SaleDate
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={getStatusClass(
                                                    sale.PaymentStatus
                                                )}
                                            >
                                                {sale.PaymentStatus}
                                            </span>
                                        </td>

                                        <td>
                                            {sale.HandledByName || "-"}
                                        </td>

                                        <td>
                                            <div className="table-actions">

                                                <button
                                                    className="view-sale-action"
                                                    title="View sale"
                                                    onClick={() =>
                                                        viewSale(sale)
                                                    }
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {sale.PaymentStatus !==
                                                    "Cancelled" && (
                                                    <button
                                                        className="edit-sale-action"
                                                        title="Edit sale"
                                                        onClick={() =>
                                                            openEditSale(
                                                                sale
                                                            )
                                                        }
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                )}

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
                NEW / EDIT SALE MODAL
            ================================================= */}

            {showSaleModal && (
                <div
                    className="sale-modal-overlay"
                    onClick={() => setShowSaleModal(false)}
                >
                    <div
                        className="sale-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="sale-modal-header">
                            <div>
                                <span>
                                    {editingSale
                                        ? "Update Transaction"
                                        : "New Transaction"}
                                </span>

                                <h2>
                                    {editingSale
                                        ? "Edit Property Sale"
                                        : "Record Property Sale"}
                                </h2>
                            </div>

                            <button
                                onClick={() =>
                                    setShowSaleModal(false)
                                }
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="sale-form-grid">

                                {/* CUSTOMER */}

                                <div className="sale-form-group">
                                    <label>
                                        Customer
                                        <span>*</span>
                                    </label>

                                    <div className="sale-input-with-icon">
                                        <UserRound size={17} />

                                        <select
                                            name="CustomerID"
                                            value={form.CustomerID}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">
                                                Select customer
                                            </option>

                                            {customers.map(
                                                (customer) => (
                                                    <option
                                                        key={
                                                            customer.CustomerID
                                                        }
                                                        value={
                                                            customer.CustomerID
                                                        }
                                                    >
                                                        {
                                                            customer.FullName
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {/* PROPERTY */}

                                <div className="sale-form-group">
                                    <label>
                                        Available Property
                                        <span>*</span>
                                    </label>

                                    <div className="sale-input-with-icon">
                                        <Building2 size={17} />

                                        <select
                                            name="PropertyID"
                                            value={form.PropertyID}
                                            onChange={handleFormChange}
                                            required
                                            disabled={editingSale}
                                        >
                                            <option value="">
                                                Select property
                                            </option>

                                            {availableProperties.map(
                                                (property) => (
                                                    <option
                                                        key={
                                                            property.PropertyID
                                                        }
                                                        value={
                                                            property.PropertyID
                                                        }
                                                    >
                                                        {
                                                            property.PropertyName
                                                        }
                                                        {" — "}
                                                        {formatPrice(
                                                            property.SalePrice
                                                        )}
                                                    </option>
                                                )
                                            )}

                                            {editingSale &&
                                                selectedSale && (
                                                    <option
                                                        value={
                                                            selectedSale.PropertyID
                                                        }
                                                    >
                                                        {
                                                            selectedSale.PropertyName
                                                        }
                                                    </option>
                                                )}
                                        </select>
                                    </div>
                                </div>

                                {/* SALE PRICE */}

                                <div className="sale-form-group">
                                    <label>
                                        Sale Price
                                        <span>*</span>
                                    </label>

                                    <div className="sale-input-with-icon">
                                        <DollarSign size={17} />

                                        <input
                                            type="number"
                                            name="SalePrice"
                                            value={form.SalePrice}
                                            onChange={handleFormChange}
                                            min="0"
                                            step="0.01"
                                            placeholder="Enter sale price"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* SALE DATE */}

                                <div className="sale-form-group">
                                    <label>
                                        Sale Date
                                        <span>*</span>
                                    </label>

                                    <div className="sale-input-with-icon">
                                        <CalendarDays size={17} />

                                        <input
                                            type="date"
                                            name="SaleDate"
                                            value={form.SaleDate}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* PAYMENT STATUS */}

                                <div className="sale-form-group full-width">
                                    <label>
                                        Payment Status
                                    </label>

                                    <select
                                        name="PaymentStatus"
                                        value={form.PaymentStatus}
                                        onChange={handleFormChange}
                                    >
                                        <option value="Pending">
                                            Pending
                                        </option>

                                        <option value="Paid">
                                            Paid
                                        </option>

                                        <option value="Cancelled">
                                            Cancelled
                                        </option>
                                    </select>

                                    <small className="payment-help">
                                        Pending reserves the property.
                                        Paid marks the property as sold.
                                    </small>
                                </div>

                            </div>

                            <div className="sale-form-footer">
                                <button
                                    type="button"
                                    className="cancel-form-btn"
                                    onClick={() =>
                                        setShowSaleModal(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-sale-btn"
                                >
                                    {editingSale
                                        ? "Update Sale"
                                        : "Record Sale"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* =================================================
                SALE DETAILS MODAL
            ================================================= */}

            {showDetailsModal && selectedSale && (
                <div
                    className="sale-modal-overlay"
                    onClick={() =>
                        setShowDetailsModal(false)
                    }
                >
                    <div
                        className="sale-details-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="sale-modal-header">
                            <div>
                                <span>Transaction Details</span>

                                <h2>
                                    Sale #{selectedSale.SaleID}
                                </h2>
                            </div>

                            <button
                                onClick={() =>
                                    setShowDetailsModal(false)
                                }
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="sale-details-content">

                            <div className="sale-detail-status">
                                <span
                                    className={getStatusClass(
                                        selectedSale.PaymentStatus
                                    )}
                                >
                                    {selectedSale.PaymentStatus}
                                </span>
                            </div>

                            <div className="sale-detail-grid">

                                <div className="sale-detail-item">
                                    <Building2 size={19} />

                                    <div>
                                        <small>Property</small>
                                        <strong>
                                            {
                                                selectedSale.PropertyName
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="sale-detail-item">
                                    <UserRound size={19} />

                                    <div>
                                        <small>Customer</small>
                                        <strong>
                                            {
                                                selectedSale.CustomerName
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="sale-detail-item">
                                    <DollarSign size={19} />

                                    <div>
                                        <small>Sale Price</small>
                                        <strong>
                                            {formatPrice(
                                                selectedSale.SalePrice
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <div className="sale-detail-item">
                                    <CalendarDays size={19} />

                                    <div>
                                        <small>Sale Date</small>
                                        <strong>
                                            {formatDate(
                                                selectedSale.SaleDate
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <div className="sale-detail-item">
                                    <UserRound size={19} />

                                    <div>
                                        <small>Handled By</small>
                                        <strong>
                                            {
                                                selectedSale.HandledByName
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="sale-detail-item">
                                    <Building2 size={19} />

                                    <div>
                                        <small>Property ID</small>
                                        <strong>
                                            {
                                                selectedSale.PropertyID
                                            }
                                        </strong>
                                    </div>
                                </div>

                            </div>

                            {selectedSale.PaymentStatus !==
                                "Cancelled" && (
                                <div className="sale-details-actions">

                                    <button
                                        className="edit-details-btn"
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            openEditSale(
                                                selectedSale
                                            );
                                        }}
                                    >
                                        <Edit3 size={17} />
                                        Edit Sale
                                    </button>

                                    <button
                                        className="cancel-sale-btn"
                                        onClick={() =>
                                            handleCancelSale(
                                                selectedSale
                                            )
                                        }
                                    >
                                        <XCircle size={17} />
                                        Cancel Sale
                                    </button>

                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SalesAgentSales;

