import { useEffect, useState } from "react";
import axios from "axios";
import {
Users,
Search,
Plus,
RefreshCw,
Edit,
UserCheck,
UserX,
X
} from "lucide-react";
import "./Customers.css";

const API_URL = "http://localhost:5000/api/customers";

const Customers = () => {
const [customers, setCustomers] = useState([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [search, setSearch] = useState("");
const [showModal, setShowModal] = useState(false);
const [editingCustomer, setEditingCustomer] = useState(null);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");


const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    idType: "",
    idNumber: ""
});

const getToken = () => localStorage.getItem("token");

const getAuthConfig = () => ({
    headers: {
        Authorization: `Bearer ${getToken()}`
    }
});

const fetchCustomers = async () => {
    try {
        setLoading(true);
        setError("");

        const response = await axios.get(
            API_URL,
            getAuthConfig()
        );

        setCustomers(response.data.customers || []);
    } catch (err) {
        console.error("Fetch customers error:", err);

        setError(
            err.response?.data?.message ||
            "Failed to load customers"
        );
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    fetchCustomers();
}, []);

const handleSearch = async (value) => {
    setSearch(value);

    if (!value.trim()) {
        fetchCustomers();
        return;
    }

    try {
        const response = await axios.get(
            `${API_URL}/search?q=${encodeURIComponent(value)}`,
            getAuthConfig()
        );

        setCustomers(response.data.customers || []);
    } catch (err) {
        console.error("Search customers error:", err);

        setError(
            err.response?.data?.message ||
            "Failed to search customers"
        );
    }
};

const openAddModal = () => {
    setEditingCustomer(null);

    setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        address: "",
        idType: "",
        idNumber: ""
    });

    setError("");
    setSuccess("");
    setShowModal(true);
};

const openEditModal = (customer) => {
    setEditingCustomer(customer);

    setFormData({
        fullName: customer.FullName || "",
        email: customer.Email || "",
        phoneNumber: customer.PhoneNumber || "",
        address: customer.Address || "",
        idType: customer.IDType || "",
        idNumber: customer.IDNumber || ""
    });

    setError("");
    setSuccess("");
    setShowModal(true);
};

const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCustomer(null);
};

const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
        ...previous,
        [name]: value
    }));
};

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
                getAuthConfig()
            );

            setSuccess("Customer updated successfully.");
        } else {
            await axios.post(
                API_URL,
                formData,
                getAuthConfig()
            );

            setSuccess("Customer created successfully.");
        }

        await fetchCustomers();

        setTimeout(() => {
            setShowModal(false);
            setEditingCustomer(null);
            setSuccess("");
        }, 700);

    } catch (err) {
        console.error("Save customer error:", err);

        setError(
            err.response?.data?.message ||
            "Failed to save customer"
        );
    } finally {
        setSaving(false);
    }
};

const handleStatusChange = async (customer) => {
    const newStatus =
        customer.Status === "Active"
            ? "Inactive"
            : "Active";

    const action =
        newStatus === "Active"
            ? "activate"
            : "deactivate";

    if (
        !window.confirm(
            `Are you sure you want to ${action} ${customer.FullName}?`
        )
    ) {
        return;
    }

    try {
        setError("");

        await axios.patch(
            `${API_URL}/${customer.CustomerID}/status`,
            {
                status: newStatus
            },
            getAuthConfig()
        );

        setSuccess(
            `Customer ${action}d successfully.`
        );

        await fetchCustomers();

        setTimeout(() => {
            setSuccess("");
        }, 2000);

    } catch (err) {
        console.error("Update customer status error:", err);

        setError(
            err.response?.data?.message ||
            "Failed to update customer status"
        );
    }
};

return (
    <div className="customers-page">

        <div className="customers-header">
            <div>
                <h1>
                    <Users size={28} />
                    Customers
                </h1>

                <p>
                    Manage customer information and account status
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

        {error && (
            <div className="customer-alert error">
                {error}
            </div>
        )}

        {success && (
            <div className="customer-alert success">
                {success}
            </div>
        )}

        <div className="customers-toolbar">

            <div className="customer-search">
                <Search size={18} />

                <input
                    type="text"
                    placeholder="Search by name, email, phone or ID..."
                    value={search}
                    onChange={(e) =>
                        handleSearch(e.target.value)
                    }
                />
            </div>

            <button
                className="refresh-btn"
                onClick={fetchCustomers}
                disabled={loading}
            >
                <RefreshCw
                    size={18}
                    className={loading ? "spin" : ""}
                />
                Refresh
            </button>

        </div>

        <div className="customers-card">

            <div className="customers-card-header">
                <div>
                    <h2>Customer List</h2>
                    <span>
                        {customers.length} customer
                        {customers.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="customers-loading">
                    <RefreshCw size={30} className="spin" />
                    <p>Loading customers...</p>
                </div>
            ) : customers.length === 0 ? (
                <div className="customers-empty">
                    <Users size={45} />
                    <h3>No customers found</h3>
                    <p>
                        There are no customers matching your search.
                    </p>
                </div>
            ) : (
                <div className="table-container">

                    <table className="customers-table">

                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer</th>
                                <th>Contact</th>
                                <th>ID Information</th>
                                <th>Registration Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {customers.map((customer) => (
                                <tr key={customer.CustomerID}>

                                    <td>
                                        #{customer.CustomerID}
                                    </td>

                                    <td>
                                        <div className="customer-name">
                                            <div className="customer-avatar">
                                                {customer.FullName
                                                    ?.charAt(0)
                                                    ?.toUpperCase()}
                                            </div>

                                            <div>
                                                <strong>
                                                    {customer.FullName}
                                                </strong>

                                                <small>
                                                    {customer.Email || "No email"}
                                                </small>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        <div className="contact-info">
                                            <span>
                                                {customer.PhoneNumber ||
                                                    "No phone"}
                                            </span>

                                            <span>
                                                {customer.Address ||
                                                    "No address"}
                                            </span>
                                        </div>
                                    </td>

                                    <td>
                                        {customer.IDType ? (
                                            <div className="id-info">
                                                <strong>
                                                    {customer.IDType}
                                                </strong>
                                                <span>
                                                    {customer.IDNumber ||
                                                        "No ID number"}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="muted">
                                                Not provided
                                            </span>
                                        )}
                                    </td>

                                    <td>
                                        {customer.RegistrationDate
                                            ? new Date(
                                                customer.RegistrationDate
                                            ).toLocaleDateString()
                                            : "-"}
                                    </td>

                                    <td>
                                        <span
                                            className={`status-badge ${
                                                customer.Status
                                                    ?.toLowerCase()
                                            }`}
                                        >
                                            {customer.Status}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="customer-actions">

                                            <button
                                                className="action-btn edit"
                                                title="Edit customer"
                                                onClick={() =>
                                                    openEditModal(customer)
                                                }
                                            >
                                                <Edit size={16} />
                                            </button>

                                            <button
                                                className={`action-btn ${
                                                    customer.Status ===
                                                    "Active"
                                                        ? "deactivate"
                                                        : "activate"
                                                }`}
                                                title={
                                                    customer.Status ===
                                                    "Active"
                                                        ? "Deactivate customer"
                                                        : "Activate customer"
                                                }
                                                onClick={() =>
                                                    handleStatusChange(
                                                        customer
                                                    )
                                                }
                                            >
                                                {customer.Status ===
                                                "Active" ? (
                                                    <UserX size={16} />
                                                ) : (
                                                    <UserCheck size={16} />
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

        {showModal && (
            <div className="customer-modal-overlay">

                <div className="customer-modal">

                    <div className="customer-modal-header">

                        <div>
                            <h2>
                                {editingCustomer
                                    ? "Edit Customer"
                                    : "Add Customer"}
                            </h2>

                            <p>
                                {editingCustomer
                                    ? "Update customer information"
                                    : "Enter customer information"}
                            </p>
                        </div>

                        <button
                            className="modal-close-btn"
                            onClick={closeModal}
                            disabled={saving}
                        >
                            <X size={20} />
                        </button>

                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="form-grid">

                            <div className="form-group full-width">
                                <label>
                                    Full Name *
                                </label>

                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
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
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Phone Number
                                </label>

                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>
                                    Address
                                </label>

                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Enter address"
                                />
                            </div>

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

                                    <option value="Kebele ID">
                                        Kebele ID
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
                                    value={formData.idNumber}
                                    onChange={handleChange}
                                    placeholder="Enter ID number"
                                />
                            </div>

                        </div>

                        <div className="modal-actions">

                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="save-btn"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingCustomer
                                        ? "Update Customer"
                                        : "Add Customer"}
                            </button>

                        </div>

                    </form>

                </div>

            </div>
        )}

    </div>
);


};

export default Customers;
