import { useEffect, useState } from "react";
import axios from "axios";
import {
    UserRound,
    Search,
    Plus,
    Edit,
    Eye,
    CheckCircle2,
    XCircle,
    X,
    Loader2
} from "lucide-react";

import "./OwnerCustomers.css";

const API_URL = "http://localhost:5000/api/customers";

function OwnerCustomers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        email: "",
        address: "",
        idType: "",
        idNumber: ""
    });

    const getToken = () => {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken")
        );
    };

    const getHeaders = () => ({
        Authorization: `Bearer ${getToken()}`
    });

    // ========================================================
    // LOAD CUSTOMERS
    // ========================================================
    const fetchCustomers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(API_URL, {
                headers: getHeaders()
            });

            setCustomers(response.data.customers || []);
        } catch (err) {
            console.error("Failed to load customers:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load customers."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    // ========================================================
    // SEARCH
    // ========================================================
    const handleSearch = async (value) => {
        setSearch(value);

        if (!value.trim()) {
            fetchCustomers();
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/search`,
                {
                    params: {
                        q: value
                    },
                    headers: getHeaders()
                }
            );

            setCustomers(response.data.customers || []);
        } catch (err) {
            console.error("Search customers error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to search customers."
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================================
    // FORM CHANGE
    // ========================================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // ========================================================
    // OPEN ADD
    // ========================================================
    const openAddModal = () => {
        setEditingCustomer(null);

        setFormData({
            fullName: "",
            phoneNumber: "",
            email: "",
            address: "",
            idType: "",
            idNumber: ""
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // ========================================================
    // OPEN EDIT
    // ========================================================
    const openEditModal = (customer) => {
        setEditingCustomer(customer);

        setFormData({
            fullName: customer.FullName || "",
            phoneNumber: customer.PhoneNumber || "",
            email: customer.Email || "",
            address: customer.Address || "",
            idType: customer.IDType || "",
            idNumber: customer.IDNumber || ""
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // ========================================================
    // SAVE CUSTOMER
    // ========================================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.fullName.trim()) {
            setError("Full name is required.");
            return;
        }

        if (!formData.email.trim()) {
            setError("Email is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            if (editingCustomer) {
                await axios.put(
                    `${API_URL}/${editingCustomer.CustomerID}`,
                    formData,
                    {
                        headers: {
                            ...getHeaders(),
                            "Content-Type": "application/json"
                        }
                    }
                );

                setSuccess("Customer updated successfully.");
            } else {
                await axios.post(
                    API_URL,
                    formData,
                    {
                        headers: {
                            ...getHeaders(),
                            "Content-Type": "application/json"
                        }
                    }
                );

                setSuccess("Customer created successfully.");
            }

            setShowModal(false);

            await fetchCustomers();
        } catch (err) {
            console.error("Save customer error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to save customer."
            );
        } finally {
            setSaving(false);
        }
    };

    // ========================================================
    // VIEW CUSTOMER
    // ========================================================
    const handleView = async (customer) => {
        try {
            setError("");

            const response = await axios.get(
                `${API_URL}/${customer.CustomerID}`,
                {
                    headers: getHeaders()
                }
            );

            setSelectedCustomer(response.data.customer);
            setShowDetails(true);
        } catch (err) {
            console.error("Get customer error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load customer details."
            );
        }
    };

    // ========================================================
    // CHANGE STATUS
    // ========================================================
    const handleStatusChange = async (customer) => {
        const newStatus =
            customer.Status === "Active"
                ? "Inactive"
                : "Active";

        const confirmed = window.confirm(
            `Are you sure you want to change ${customer.FullName}'s status to ${newStatus}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await axios.patch(
                `${API_URL}/${customer.CustomerID}/status`,
                {
                    status: newStatus
                },
                {
                    headers: {
                        ...getHeaders(),
                        "Content-Type": "application/json"
                    }
                }
            );

            setSuccess(
                `Customer ${newStatus.toLowerCase()} successfully.`
            );

            await fetchCustomers();
        } catch (err) {
            console.error("Status update error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to update customer status."
            );
        }
    };

    return (
        <div className="owner-customers-page">

            {/* ==================================================
                HEADER
            ================================================== */}
            <div className="customers-header">
                <div>
                    <h1>
                        <UserRound size={28} />
                        Customers
                    </h1>

                    <p>
                        Manage customers related to your properties.
                    </p>
                </div>

                <button
                    className="add-customer-btn"
                    onClick={openAddModal}
                >
                    <Plus size={18} />
                    Add Customer
                </button>
            </div>

            {/* ==================================================
                ALERTS
            ================================================== */}
            {error && (
                <div className="customer-alert error">
                    <XCircle size={18} />
                    <span>{error}</span>

                    <button onClick={() => setError("")}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {success && (
                <div className="customer-alert success">
                    <CheckCircle2 size={18} />
                    <span>{success}</span>

                    <button onClick={() => setSuccess("")}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* ==================================================
                SEARCH
            ================================================== */}
            <div className="customer-toolbar">

                <div className="customer-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search by name, email, phone, ID..."
                        value={search}
                        onChange={(e) =>
                            handleSearch(e.target.value)
                        }
                    />
                </div>

                <div className="customer-count">
                    {customers.length} customer
                    {customers.length !== 1 ? "s" : ""}
                </div>
            </div>

            {/* ==================================================
                TABLE
            ================================================== */}
            <div className="customers-card">

                {loading ? (
                    <div className="customer-loading">
                        <Loader2
                            size={30}
                            className="spin"
                        />
                        <p>Loading customers...</p>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="customer-empty">
                        <UserRound size={45} />

                        <h3>No customers found</h3>

                        <p>
                            There are no customers related to
                            your properties yet.
                        </p>
                    </div>
                ) : (
                    <div className="customer-table-wrapper">

                        <table className="customer-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Customer</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>ID Number</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {customers.map((customer) => (
                                    <tr
                                        key={
                                            customer.CustomerID
                                        }
                                    >

                                        <td>
                                            #
                                            {
                                                customer.CustomerID
                                            }
                                        </td>

                                        <td>
                                            <div className="customer-name">
                                                <div className="customer-avatar">
                                                    <UserRound
                                                        size={18}
                                                    />
                                                </div>

                                                <div>
                                                    <strong>
                                                        {
                                                            customer.FullName
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            customer.IDType ||
                                                            "No ID type"
                                                        }
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {
                                                customer.PhoneNumber ||
                                                "—"
                                            }
                                        </td>

                                        <td>
                                            {
                                                customer.Email ||
                                                "—"
                                            }
                                        </td>

                                        <td>
                                            {
                                                customer.IDNumber ||
                                                "—"
                                            }
                                        </td>

                                        <td>
                                            <span
                                                className={`status-badge ${
                                                    customer.Status ===
                                                    "Active"
                                                        ? "active"
                                                        : "inactive"
                                                }`}
                                            >
                                                {customer.Status}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="customer-actions">

                                                <button
                                                    className="icon-btn view"
                                                    title="View"
                                                    onClick={() =>
                                                        handleView(
                                                            customer
                                                        )
                                                    }
                                                >
                                                    <Eye
                                                        size={17}
                                                    />
                                                </button>

                                                <button
                                                    className="icon-btn edit"
                                                    title="Edit"
                                                    onClick={() =>
                                                        openEditModal(
                                                            customer
                                                        )
                                                    }
                                                >
                                                    <Edit
                                                        size={17}
                                                    />
                                                </button>

                                                <button
                                                    className="icon-btn status"
                                                    title={
                                                        customer.Status ===
                                                        "Active"
                                                            ? "Deactivate"
                                                            : "Activate"
                                                    }
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            customer
                                                        )
                                                    }
                                                >
                                                    {customer.Status ===
                                                    "Active" ? (
                                                        <XCircle
                                                            size={17}
                                                        />
                                                    ) : (
                                                        <CheckCircle2
                                                            size={17}
                                                        />
                                                    )}
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

            {/* ==================================================
                ADD / EDIT MODAL
            ================================================== */}
            {showModal && (
                <div className="customer-modal-overlay">

                    <div className="customer-modal">

                        <div className="modal-header">

                            <div>
                                <h2>
                                    {editingCustomer
                                        ? "Edit Customer"
                                        : "Add Customer"}
                                </h2>

                                <p>
                                    {editingCustomer
                                        ? "Update customer information."
                                        : "Create a new customer record."}
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowModal(false)
                                }
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="customer-form"
                        >

                            <div className="form-group">
                                <label>
                                    Full Name *
                                </label>

                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>

                            <div className="form-row">

                                <div className="form-group">
                                    <label>
                                        Phone Number
                                    </label>

                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={
                                            formData.phoneNumber
                                        }
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Email *
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter email"
                                        required
                                    />
                                </div>

                            </div>

                            <div className="form-group">
                                <label>
                                    Address
                                </label>

                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Enter address"
                                    rows="3"
                                />
                            </div>

                            <div className="form-row">

                                <div className="form-group">
                                    <label>
                                        ID Type
                                    </label>

                                    <select
                                        name="idType"
                                        value={formData.idType}
                                        onChange={handleChange}
                                    >
                                        <option value="">
                                            Select ID type
                                        </option>

                                        <option value="National ID">
                                            National ID
                                        </option>

                                        <option value="Passport">
                                            Passport
                                        </option>

                                        <option value="Driving License">
                                            Driving License
                                        </option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>
                                        ID Number
                                    </label>

                                    <input
                                        type="text"
                                        name="idNumber"
                                        value={
                                            formData.idNumber
                                        }
                                        onChange={handleChange}
                                        placeholder="Enter ID number"
                                    />
                                </div>

                            </div>

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() =>
                                        setShowModal(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2
                                                size={17}
                                                className="spin"
                                            />
                                            Saving...
                                        </>
                                    ) : (
                                        editingCustomer
                                            ? "Update Customer"
                                            : "Create Customer"
                                    )}
                                </button>

                            </div>

                        </form>

                    </div>
                </div>
            )}

            {/* ==================================================
                DETAILS MODAL
            ================================================== */}
            {showDetails && selectedCustomer && (
                <div className="customer-modal-overlay">

                    <div className="customer-modal details-modal">

                        <div className="modal-header">

                            <div>
                                <h2>
                                    Customer Details
                                </h2>

                                <p>
                                    Customer #
                                    {
                                        selectedCustomer.CustomerID
                                    }
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowDetails(false)
                                }
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <div className="customer-details">

                            <div className="details-avatar">
                                <UserRound size={35} />
                            </div>

                            <h3>
                                {
                                    selectedCustomer.FullName
                                }
                            </h3>

                            <span
                                className={`status-badge ${
                                    selectedCustomer.Status ===
                                    "Active"
                                        ? "active"
                                        : "inactive"
                                }`}
                            >
                                {
                                    selectedCustomer.Status
                                }
                            </span>

                            <div className="details-grid">

                                <div>
                                    <label>
                                        Phone
                                    </label>
                                    <p>
                                        {
                                            selectedCustomer.PhoneNumber ||
                                            "—"
                                        }
                                    </p>
                                </div>

                                <div>
                                    <label>
                                        Email
                                    </label>
                                    <p>
                                        {
                                            selectedCustomer.Email ||
                                            "—"
                                        }
                                    </p>
                                </div>

                                <div>
                                    <label>
                                        ID Type
                                    </label>
                                    <p>
                                        {
                                            selectedCustomer.IDType ||
                                            "—"
                                        }
                                    </p>
                                </div>

                                <div>
                                    <label>
                                        ID Number
                                    </label>
                                    <p>
                                        {
                                            selectedCustomer.IDNumber ||
                                            "—"
                                        }
                                    </p>
                                </div>

                                <div className="full-width">
                                    <label>
                                        Address
                                    </label>
                                    <p>
                                        {
                                            selectedCustomer.Address ||
                                            "—"
                                        }
                                    </p>
                                </div>

                                <div>
                                    <label>
                                        Registration Date
                                    </label>
                                    <p>
                                        {
                                            selectedCustomer.RegistrationDate
                                                ? new Date(
                                                      selectedCustomer.RegistrationDate
                                                  ).toLocaleDateString()
                                                : "—"
                                        }
                                    </p>
                                </div>

                            </div>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

export default OwnerCustomers;