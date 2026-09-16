import { useEffect, useState } from "react";
import axios from "axios";
import "./Sales.css";
import {
    ShoppingCart,
    Plus,
    Search,
    X,
    Edit,
    Ban,
    RefreshCw
} from "lucide-react";

function Sales() {
    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [properties, setProperties] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);

    const [editingSale, setEditingSale] = useState(null);

    const [form, setForm] = useState({
        PropertyID: "",
        CustomerID: "",
        SaleDate: "",
        SalePrice: "",
        PaymentStatus: "Pending"
    });

    const token = localStorage.getItem("token");

    const api = axios.create({
        baseURL: "http://localhost:5000/api",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    // ============================================================
    // LOAD DATA
    // ============================================================
    const loadData = async () => {
        try {
            setLoading(true);

            const [salesRes, customersRes, propertiesRes] =
                await Promise.all([
                    api.get("/sales"),
                    api.get("/customers"),
                    api.get("/properties")
                ]);

            setSales(
                Array.isArray(salesRes.data)
                    ? salesRes.data
                    : salesRes.data.sales || []
            );

            setCustomers(
                Array.isArray(customersRes.data)
                    ? customersRes.data
                    : customersRes.data.customers || []
            );

            setProperties(
                Array.isArray(propertiesRes.data)
                    ? propertiesRes.data
                    : propertiesRes.data.properties || []
            );
        } catch (error) {
            console.error("Failed to load sales data:", error);

            alert(
                error.response?.data?.message ||
                "Failed to load sales data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // ============================================================
    // FORM HANDLERS
    // ============================================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const openCreateModal = () => {
        setEditingSale(null);

        setForm({
            PropertyID: "",
            CustomerID: "",
            SaleDate: new Date().toISOString().split("T")[0],
            SalePrice: "",
            PaymentStatus: "Pending"
        });

        setShowModal(true);
    };

    const openEditModal = (sale) => {
        setEditingSale(sale);

        setForm({
            PropertyID: sale.PropertyID || "",
            CustomerID: sale.CustomerID || "",
            SaleDate: sale.SaleDate
                ? String(sale.SaleDate).split("T")[0]
                : "",
            SalePrice: sale.SalePrice || "",
            PaymentStatus: sale.PaymentStatus || "Pending"
        });

        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingSale(null);
    };

    // ============================================================
    // CREATE / UPDATE SALE
    // ============================================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            !form.PropertyID ||
            !form.CustomerID ||
            !form.SaleDate ||
            !form.SalePrice
        ) {
            alert("Please complete all required fields.");
            return;
        }

        if (Number(form.SalePrice) <= 0) {
            alert("Sale price must be greater than zero.");
            return;
        }

        try {
            setSaving(true);

            if (editingSale) {
                await api.put(
                    `/sales/${editingSale.SaleID}`,
                    form
                );

                alert("Sale updated successfully.");
            } else {
                await api.post("/sales", form);

                alert("Sale created successfully.");
            }

            closeModal();
            await loadData();
        } catch (error) {
            console.error("Save sale error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to save sale."
            );
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // CANCEL SALE
    // ============================================================
    const handleCancel = async (sale) => {
        const confirmed = window.confirm(
            `Are you sure you want to cancel Sale #${sale.SaleID}?`
        );

        if (!confirmed) return;

        try {
            await api.patch(
                `/sales/${sale.SaleID}/cancel`
            );

            alert("Sale cancelled successfully.");

            await loadData();
        } catch (error) {
            console.error("Cancel sale error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to cancel sale."
            );
        }
    };

    // ============================================================
    // SEARCH
    // ============================================================
    const filteredSales = sales.filter((sale) => {
        const text = `
            ${sale.SaleID || ""}
            ${sale.PropertyName || ""}
            ${sale.CustomerName || ""}
            ${sale.HandledByName || ""}
            ${sale.PaymentStatus || ""}
        `.toLowerCase();

        return text.includes(search.toLowerCase());
    });

    // ============================================================
    // HELPERS
    // ============================================================
    const getStatusClass = (status) => {
        switch (status) {
            case "Paid":
                return "status-paid";

            case "Pending":
                return "status-pending";

            case "Cancelled":
                return "status-cancelled";

            default:
                return "";
        }
    };

    const availableProperties = properties.filter(
        (property) =>
            property.Status !== "Sold" &&
            property.Status !== "Rented"
    );

    // ============================================================
    // UI
    // ============================================================
    return (
        <div className="sales-page">

            <div className="sales-header">
                <div>
                    <h1>
                        <ShoppingCart size={28} />
                        Sales Management
                    </h1>

                    <p>
                        Manage property sales and sale transactions.
                    </p>
                </div>

                <button
                    type="button"
                    className="primary-btn"
                    onClick={openCreateModal}
                >
                    <Plus size={18} />
                    New Sale
                </button>
            </div>

            {/* SEARCH */}
            <div className="sales-toolbar">

                <div className="search-box">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search sales..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />
                </div>

                <button
                    type="button"
                    className="refresh-btn"
                    onClick={loadData}
                    disabled={loading}
                >
                    <RefreshCw
                        size={17}
                        className={loading ? "spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* TABLE */}
            <div className="sales-card">

                {loading ? (
                    <div className="loading-state">
                        Loading sales...
                    </div>
                ) : filteredSales.length === 0 ? (
                    <div className="empty-state">
                        <ShoppingCart size={40} />
                        <h3>No sales found</h3>
                        <p>
                            There are currently no sales matching your search.
                        </p>
                    </div>
                ) : (
                    <div className="table-wrapper">

                        <table className="sales-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Property</th>
                                    <th>Customer</th>
                                    <th>Sale Date</th>
                                    <th>Sale Price</th>
                                    <th>Payment</th>
                                    <th>Handled By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredSales.map((sale) => (
                                    <tr key={sale.SaleID}>

                                        <td>
                                            #{sale.SaleID}
                                        </td>

                                        <td>
                                            <strong>
                                                {sale.PropertyName ||
                                                    `Property #${sale.PropertyID}`}
                                            </strong>
                                        </td>

                                        <td>
                                            {sale.CustomerName ||
                                                `Customer #${sale.CustomerID}`}
                                        </td>

                                        <td>
                                            {sale.SaleDate
                                                ? new Date(
                                                      sale.SaleDate
                                                  ).toLocaleDateString()
                                                : "-"}
                                        </td>

                                        <td>
                                            {Number(
                                                sale.SalePrice || 0
                                            ).toLocaleString()}{" "}
                                            ETB
                                        </td>

                                        <td>
                                            <span
                                                className={`status-badge ${getStatusClass(
                                                    sale.PaymentStatus
                                                )}`}
                                            >
                                                {sale.PaymentStatus}
                                            </span>
                                        </td>

                                        <td>
                                            {sale.HandledByName || "-"}
                                        </td>

                                        <td>
                                            <div className="action-buttons">

                                                {sale.PaymentStatus !==
                                                    "Cancelled" && (
                                                    <button
                                                        type="button"
                                                        className="icon-btn edit"
                                                        title="Edit sale"
                                                        onClick={() =>
                                                            openEditModal(
                                                                sale
                                                            )
                                                        }
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}

                                                {sale.PaymentStatus !==
                                                    "Cancelled" && (
                                                    <button
                                                        type="button"
                                                        className="icon-btn cancel"
                                                        title="Cancel sale"
                                                        onClick={() =>
                                                            handleCancel(
                                                                sale
                                                            )
                                                        }
                                                    >
                                                        <Ban size={16} />
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

            {/* ====================================================
                CREATE / EDIT MODAL
            ==================================================== */}
            {showModal && (
                <div
                    className="modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeModal();
                        }
                    }}
                >

                    <div className="sales-modal">

                        <div className="modal-header">

                            <div>
                                <h2>
                                    {editingSale
                                        ? "Edit Sale"
                                        : "Create New Sale"}
                                </h2>

                                <p>
                                    Enter the sale transaction details.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="close-btn"
                                onClick={closeModal}
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <form
                            className="sales-form"
                            onSubmit={handleSubmit}
                        >

                            {/* PROPERTY */}
                            <div className="form-group">

                                <label>
                                    Property *
                                </label>

                                <select
                                    name="PropertyID"
                                    value={form.PropertyID}
                                    onChange={handleChange}
                                    disabled={Boolean(editingSale)}
                                    required
                                >

                                    <option value="">
                                        Select property
                                    </option>

                                    {editingSale && (
                                        <option
                                            value={editingSale.PropertyID}
                                        >
                                            {editingSale.PropertyName ||
                                                `Property #${editingSale.PropertyID}`}
                                        </option>
                                    )}

                                    {!editingSale &&
                                        availableProperties.map(
                                            (property) => (
                                                <option
                                                    key={
                                                        property.PropertyID
                                                    }
                                                    value={
                                                        property.PropertyID
                                                    }
                                                >
                                                    {property.PropertyName}{" "}
                                                    -
                                                    {property.SalePrice
                                                        ? ` ${Number(
                                                              property.SalePrice
                                                          ).toLocaleString()} ETB`
                                                        : ""}
                                                </option>
                                            )
                                        )}

                                </select>

                            </div>

                            {/* CUSTOMER */}
                            <div className="form-group">

                                <label>
                                    Customer *
                                </label>

                                <select
                                    name="CustomerID"
                                    value={form.CustomerID}
                                    onChange={handleChange}
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
                                                {customer.FullName}
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                            {/* DATE */}
                            <div className="form-group">

                                <label>
                                    Sale Date *
                                </label>

                                <input
                                    type="date"
                                    name="SaleDate"
                                    value={form.SaleDate}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            {/* PRICE */}
                            <div className="form-group">

                                <label>
                                    Sale Price *
                                </label>

                                <input
                                    type="number"
                                    name="SalePrice"
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter sale price"
                                    value={form.SalePrice}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            {/* PAYMENT STATUS */}
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

                                    <option value="Cancelled">
                                        Cancelled
                                    </option>

                                </select>

                            </div>

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
                                    {saving
                                        ? "Saving..."
                                        : editingSale
                                        ? "Update Sale"
                                        : "Create Sale"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Sales;
