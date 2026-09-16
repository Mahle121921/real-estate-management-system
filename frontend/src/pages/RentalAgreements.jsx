import { useEffect, useState } from "react";
import axios from "axios";
import {
    FileText,
    Plus,
    Search,
    X,
    Edit,
    RefreshCw,
    Ban,
    CalendarDays
} from "lucide-react";
import "./RentalAgreements.css";

function RentalAgreements() {
    const [rentals, setRentals] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [properties, setProperties] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingRental, setEditingRental] = useState(null);

    const [form, setForm] = useState({
        PropertyID: "",
        CustomerID: "",
        MonthlyRent: "",
        StartDate: "",
        EndDate: "",
        DueDate: "",
        Status: "Active"
    });

    const token = localStorage.getItem("token");

    const api = axios.create({
        baseURL: "http://localhost:5000/api",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    // ============================================================
    // LOAD RENTAL AGREEMENTS, CUSTOMERS AND PROPERTIES
    // ============================================================
    const loadData = async () => {
        try {
            setLoading(true);

            const [
                rentalsResponse,
                customersResponse,
                propertiesResponse
            ] = await Promise.all([
                api.get("/rentals"),
                api.get("/customers"),
                api.get("/properties")
            ]);

            const rentalData = Array.isArray(rentalsResponse.data)
                ? rentalsResponse.data
                : rentalsResponse.data?.rentals || [];

            const customerData = Array.isArray(customersResponse.data)
                ? customersResponse.data
                : customersResponse.data?.customers || [];

            const propertyData = Array.isArray(propertiesResponse.data)
                ? propertiesResponse.data
                : propertiesResponse.data?.properties || [];

            setRentals(rentalData);
            setCustomers(customerData);
            setProperties(propertyData);
        } catch (error) {
            console.error("Failed to load rental data:", error);

            alert(
                error.response?.data?.message ||
                "Failed to load rental agreements."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // ============================================================
    // FORM
    // ============================================================
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const resetForm = () => {
        setForm({
            PropertyID: "",
            CustomerID: "",
            MonthlyRent: "",
            StartDate: new Date().toISOString().split("T")[0],
            EndDate: "",
            DueDate: "",
            Status: "Active"
        });
    };

    const openCreateModal = () => {
        setEditingRental(null);
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (rental) => {
        setEditingRental(rental);

        setForm({
            PropertyID: rental.PropertyID || "",
            CustomerID: rental.CustomerID || "",
            MonthlyRent: rental.MonthlyRent || "",
            StartDate: rental.StartDate
                ? String(rental.StartDate).split("T")[0]
                : "",
            EndDate: rental.EndDate
                ? String(rental.EndDate).split("T")[0]
                : "",
            DueDate: rental.DueDate || "",
            Status: rental.Status || "Active"
        });

        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingRental(null);
        resetForm();
    };

    // ============================================================
    // CREATE RENTAL
    // ============================================================
    const createRental = async () => {
        await api.post("/rentals", {
            PropertyID: Number(form.PropertyID),
            CustomerID: Number(form.CustomerID),
            MonthlyRent: Number(form.MonthlyRent),
            StartDate: form.StartDate,
            EndDate: form.EndDate,
            DueDate: Number(form.DueDate),
            Status: form.Status
        });
    };

    // ============================================================
    // UPDATE / RENEW RENTAL
    // ============================================================
    const updateRental = async () => {
        await api.patch(
            `/rentals/${editingRental.RentalID}/renew`,
            {
                EndDate: form.EndDate,
                MonthlyRent: Number(form.MonthlyRent),
                DueDate: Number(form.DueDate)
            }
        );
    };

    // ============================================================
    // SUBMIT
    // ============================================================
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (
            !form.PropertyID ||
            !form.CustomerID ||
            !form.MonthlyRent ||
            !form.StartDate ||
            !form.EndDate ||
            !form.DueDate
        ) {
            alert("Please complete all required fields.");
            return;
        }

        if (Number(form.MonthlyRent) <= 0) {
            alert("Monthly rent must be greater than zero.");
            return;
        }

        if (
            Number(form.DueDate) < 1 ||
            Number(form.DueDate) > 31
        ) {
            alert("Due date must be between 1 and 31.");
            return;
        }

        if (
            new Date(form.EndDate) <=
            new Date(form.StartDate)
        ) {
            alert("End date must be after start date.");
            return;
        }

        try {
            setSaving(true);

            if (editingRental) {
                await updateRental();
                alert("Rental agreement renewed successfully.");
            } else {
                await createRental();
                alert("Rental agreement created successfully.");
            }

            closeModal();
            await loadData();
        } catch (error) {
            console.error("Save rental error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to save rental agreement."
            );
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // TERMINATE RENTAL
    // ============================================================
    const handleTerminate = async (rental) => {
        const confirmed = window.confirm(
            `Are you sure you want to terminate Rental Agreement #${rental.RentalID}?`
        );

        if (!confirmed) return;

        try {
            await api.patch(
                `/rentals/${rental.RentalID}/terminate`
            );

            alert("Rental agreement terminated successfully.");

            await loadData();
        } catch (error) {
            console.error("Terminate rental error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to terminate rental agreement."
            );
        }
    };

    // ============================================================
    // SEARCH
    // ============================================================
    const filteredRentals = rentals.filter((rental) => {
        const searchText = `
            ${rental.RentalID || ""}
            ${rental.PropertyName || ""}
            ${rental.CustomerName || ""}
            ${rental.CustomerPhone || ""}
            ${rental.HandledByName || ""}
            ${rental.Status || ""}
        `.toLowerCase();

        return searchText.includes(
            search.toLowerCase()
        );
    });

    // ============================================================
    // AVAILABLE PROPERTIES
    // ============================================================
    const availableProperties = properties.filter(
        (property) =>
            property.Status !== "Sold" &&
            property.Status !== "Rented"
    );

    // ============================================================
    // STATUS CLASS
    // ============================================================
    const getStatusClass = (status) => {
        switch (status) {
            case "Active":
                return "rental-status-active";

            case "Expired":
                return "rental-status-expired";

            case "Terminated":
                return "rental-status-terminated";

            default:
                return "";
        }
    };

    // ============================================================
    // DATE FORMAT
    // ============================================================
    const formatDate = (date) => {
        if (!date) return "-";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return date;
        }

        return parsed.toLocaleDateString();
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="rental-agreements-page">

            {/* ==================================================
                HEADER
            ================================================== */}
            <div className="rental-header">

                <div>
                    <h1>
                        <FileText size={28} />
                        Rental Agreements
                    </h1>

                    <p>
                        Manage property rental agreements,
                        renewals and terminations.
                    </p>
                </div>

                <button
                    type="button"
                    className="rental-primary-btn"
                    onClick={openCreateModal}
                >
                    <Plus size={18} />
                    New Rental Agreement
                </button>

            </div>

            {/* ==================================================
                TOOLBAR
            ================================================== */}
            <div className="rental-toolbar">

                <div className="rental-search-box">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search rental agreements..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />
                </div>

                <button
                    type="button"
                    className="rental-refresh-btn"
                    onClick={loadData}
                    disabled={loading}
                >
                    <RefreshCw
                        size={17}
                        className={
                            loading
                                ? "rental-spin"
                                : ""
                        }
                    />
                    Refresh
                </button>

            </div>

            {/* ==================================================
                TABLE
            ================================================== */}
            <div className="rental-table-card">

                {loading ? (
                    <div className="rental-loading">
                        Loading rental agreements...
                    </div>
                ) : filteredRentals.length === 0 ? (
                    <div className="rental-empty">

                        <FileText size={42} />

                        <h3>
                            No rental agreements found
                        </h3>

                        <p>
                            There are currently no rental
                            agreements matching your search.
                        </p>

                    </div>
                ) : (
                    <div className="rental-table-wrapper">

                        <table className="rental-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Property</th>
                                    <th>Customer</th>
                                    <th>Monthly Rent</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Due Day</th>
                                    <th>Status</th>
                                    <th>Handled By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredRentals.map(
                                    (rental) => (
                                        <tr
                                            key={
                                                rental.RentalID
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    #
                                                    {
                                                        rental.RentalID
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        rental.PropertyName
                                                    }
                                                </strong>

                                                <small>
                                                    Property #
                                                    {
                                                        rental.PropertyID
                                                    }
                                                </small>
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        rental.CustomerName
                                                    }
                                                </strong>

                                                {rental.CustomerPhone && (
                                                    <small>
                                                        {
                                                            rental.CustomerPhone
                                                        }
                                                    </small>
                                                )}
                                            </td>

                                            <td>
                                                {Number(
                                                    rental.MonthlyRent ||
                                                    0
                                                ).toLocaleString()}{" "}
                                                ETB
                                            </td>

                                            <td>
                                                {formatDate(
                                                    rental.StartDate
                                                )}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    rental.EndDate
                                                )}
                                            </td>

                                            <td>
                                                <span className="due-day">
                                                    <CalendarDays
                                                        size={14}
                                                    />
                                                    Day{" "}
                                                    {
                                                        rental.DueDate
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`rental-status-badge ${getStatusClass(
                                                        rental.Status
                                                    )}`}
                                                >
                                                    {
                                                        rental.Status
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {
                                                    rental.HandledByName
                                                }
                                            </td>

                                            <td>
                                                <div className="rental-action-buttons">

                                                    {rental.Status ===
                                                        "Active" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="rental-icon-btn edit"
                                                                title="Renew rental"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        rental
                                                                    )
                                                                }
                                                            >
                                                                <Edit
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="rental-icon-btn terminate"
                                                                title="Terminate rental"
                                                                onClick={() =>
                                                                    handleTerminate(
                                                                        rental
                                                                    )
                                                                }
                                                            >
                                                                <Ban
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>
                                                        </>
                                                    )}

                                                </div>
                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* ==================================================
                CREATE / RENEW MODAL
            ================================================== */}
            {showModal && (
                <div
                    className="rental-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="rental-modal">

                        <div className="rental-modal-header">

                            <div>
                                <h2>
                                    {editingRental
                                        ? "Renew Rental Agreement"
                                        : "Create Rental Agreement"}
                                </h2>

                                <p>
                                    {editingRental
                                        ? "Update the rental period and payment terms."
                                        : "Enter the rental agreement details."}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="rental-close-btn"
                                onClick={closeModal}
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <form
                            className="rental-form"
                            onSubmit={handleSubmit}
                        >

                            {/* PROPERTY */}
                            <div className="rental-form-group">

                                <label>
                                    Property *
                                </label>

                                <select
                                    name="PropertyID"
                                    value={form.PropertyID}
                                    onChange={handleChange}
                                    disabled={
                                        Boolean(
                                            editingRental
                                        )
                                    }
                                    required
                                >

                                    <option value="">
                                        Select property
                                    </option>

                                    {editingRental && (
                                        <option
                                            value={
                                                editingRental.PropertyID
                                            }
                                        >
                                            {
                                                editingRental.PropertyName
                                            }
                                        </option>
                                    )}

                                    {!editingRental &&
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
                                                    {
                                                        property.PropertyName
                                                    }
                                                </option>
                                            )
                                        )}

                                </select>

                            </div>

                            {/* CUSTOMER */}
                            <div className="rental-form-group">

                                <label>
                                    Customer *
                                </label>

                                <select
                                    name="CustomerID"
                                    value={form.CustomerID}
                                    onChange={handleChange}
                                    disabled={
                                        Boolean(
                                            editingRental
                                        )
                                    }
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

                            {/* MONTHLY RENT */}
                            <div className="rental-form-group">

                                <label>
                                    Monthly Rent *
                                </label>

                                <input
                                    type="number"
                                    name="MonthlyRent"
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter monthly rent"
                                    value={
                                        form.MonthlyRent
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>

                            {/* START DATE */}
                            <div className="rental-form-group">

                                <label>
                                    Start Date *
                                </label>

                                <input
                                    type="date"
                                    name="StartDate"
                                    value={
                                        form.StartDate
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        Boolean(
                                            editingRental
                                        )
                                    }
                                    required
                                />

                            </div>

                            {/* END DATE */}
                            <div className="rental-form-group">

                                <label>
                                    End Date *
                                </label>

                                <input
                                    type="date"
                                    name="EndDate"
                                    value={
                                        form.EndDate
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>

                            {/* DUE DATE */}
                            <div className="rental-form-group">

                                <label>
                                    Monthly Due Day *
                                </label>

                                <input
                                    type="number"
                                    name="DueDate"
                                    min="1"
                                    max="31"
                                    placeholder="Example: 5"
                                    value={
                                        form.DueDate
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                                <small>
                                    Enter the day of the month
                                    when rent is due.
                                </small>

                            </div>

                            {/* STATUS — ONLY CREATE */}
                            {!editingRental && (
                                <div className="rental-form-group">

                                    <label>
                                        Status
                                    </label>

                                    <select
                                        name="Status"
                                        value={
                                            form.Status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >
                                        <option value="Active">
                                            Active
                                        </option>

                                        <option value="Expired">
                                            Expired
                                        </option>

                                        <option value="Terminated">
                                            Terminated
                                        </option>
                                    </select>

                                </div>
                            )}

                            {/* ACTIONS */}
                            <div className="rental-modal-actions">

                                <button
                                    type="button"
                                    className="rental-secondary-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="rental-primary-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingRental
                                        ? "Renew Agreement"
                                        : "Create Agreement"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default RentalAgreements;
