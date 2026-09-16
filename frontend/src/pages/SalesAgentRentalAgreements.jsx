
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    DollarSign,
    Edit3,
    Eye,
    FileText,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    UserRound,
    X,
    XCircle
} from "lucide-react";

import "./SalesAgentRentalAgreements.css";

const API_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

const getErrorMessage = (error, fallback) => {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        fallback
    );
};

const formatCurrency = (value) => {
    const number = Number(value || 0);

    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
};

const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
        return date;
    }

    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const emptyForm = {
    PropertyID: "",
    CustomerID: "",
    MonthlyRent: "",
    StartDate: "",
    EndDate: "",
    DueDate: 1,
    Status: "Active"
};

export default function SalesAgentRentalAgreements() {
    const [rentals, setRentals] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [properties, setProperties] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showRenew, setShowRenew] = useState(false);

    const [selectedRental, setSelectedRental] = useState(null);
    const [editingRental, setEditingRental] = useState(null);

    const [form, setForm] = useState(emptyForm);

    const [renewForm, setRenewForm] = useState({
        EndDate: "",
        MonthlyRent: "",
        DueDate: 1
    });

    const [page, setPage] = useState(1);

    const rowsPerPage = 8;

    // ============================================================
    // AXIOS CONFIG
    // ============================================================

    const authConfig = useMemo(() => {
        const token = getToken();

        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    }, []);

    // ============================================================
    // LOAD DATA
    // ============================================================

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
const [rentalResponse, customerResponse, propertyResponse] =
    await Promise.all([
        axios.get(
            `${API_URL}/rentals`,
            authConfig
        ),
        axios.get(
            `${API_URL}/customers`,
            authConfig
        ),
        axios.get(
            `${API_URL}/properties`,
            authConfig
        )
    ]);

console.log("========== RENTAL API RESPONSE ==========");
console.log("Status:", rentalResponse.status);
console.log("Data:", rentalResponse.data);
console.log("==========================================");

const rentalData =
    Array.isArray(rentalResponse.data)
        ? rentalResponse.data
        : rentalResponse.data?.rentals ||
          rentalResponse.data?.data ||
          rentalResponse.data?.rentalAgreements ||
          [];

console.log("Rental records:", rentalData);

setRentals(rentalData);

            setCustomers(
                Array.isArray(customerResponse.data)
                    ? customerResponse.data
                    : customerResponse.data?.customers || []
            );

            setProperties(
                Array.isArray(propertyResponse.data)
                    ? propertyResponse.data
                    : propertyResponse.data?.properties || []
            );
        } catch (err) {
            console.error("Load rental data error:", err);

            setError(
                getErrorMessage(
                    err,
                    "Failed to load rental agreement data."
                )
            );
        } finally {
            setLoading(false);
        }
    }, [authConfig]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ============================================================
    // FORM HANDLERS
    // ============================================================

    const handleFormChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleRenewChange = (event) => {
        const { name, value } = event.target;

        setRenewForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // ============================================================
    // OPEN CREATE
    // ============================================================

    const openCreateForm = () => {
        setEditingRental(null);

        setForm({
            ...emptyForm,
            Status: "Active"
        });

        setError("");
        setSuccess("");
        setShowForm(true);
    };

    // ============================================================
    // OPEN EDIT
    // ============================================================

    const openEditForm = (rental) => {
        setEditingRental(rental);

        setForm({
            PropertyID: rental.PropertyID || "",
            CustomerID: rental.CustomerID || "",
            MonthlyRent: rental.MonthlyRent || "",
            StartDate: rental.StartDate
                ? String(rental.StartDate).substring(0, 10)
                : "",
            EndDate: rental.EndDate
                ? String(rental.EndDate).substring(0, 10)
                : "",
            DueDate: rental.DueDate || 1,
            Status: rental.Status || "Active"
        });

        setError("");
        setSuccess("");
        setShowForm(true);
    };

    // ============================================================
    // CREATE / UPDATE
    // ============================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (
            !form.PropertyID ||
            !form.CustomerID ||
            !form.MonthlyRent ||
            !form.StartDate ||
            !form.EndDate ||
            !form.DueDate
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        if (Number(form.MonthlyRent) <= 0) {
            setError("Monthly rent must be greater than zero.");
            return;
        }

        if (
            Number(form.DueDate) < 1 ||
            Number(form.DueDate) > 31
        ) {
            setError("Due date must be between 1 and 31.");
            return;
        }

        if (
            new Date(form.EndDate) <=
            new Date(form.StartDate)
        ) {
            setError("End date must be after start date.");
            return;
        }

        try {
            setSaving(true);

            if (editingRental) {
                await axios.put(
                    `${API_URL}/rentals/${editingRental.RentalID}`,
                    {
                        CustomerID: Number(form.CustomerID),
                        MonthlyRent: Number(form.MonthlyRent),
                        StartDate: form.StartDate,
                        EndDate: form.EndDate,
                        DueDate: Number(form.DueDate),
                        Status: form.Status
                    },
                    authConfig
                );

                setSuccess(
                    "Rental agreement updated successfully."
                );
            } else {
                await axios.post(
                    `${API_URL}/rentals`,
                    {
                        PropertyID: Number(form.PropertyID),
                        CustomerID: Number(form.CustomerID),
                        MonthlyRent: Number(form.MonthlyRent),
                        StartDate: form.StartDate,
                        EndDate: form.EndDate,
                        DueDate: Number(form.DueDate),
                        Status: form.Status
                    },
                    authConfig
                );

                setSuccess(
                    "Rental agreement created successfully."
                );
            }

            setShowForm(false);
            setEditingRental(null);
            setForm(emptyForm);

            await loadData();
        } catch (err) {
            console.error("Save rental error:", err);

            setError(
                getErrorMessage(
                    err,
                    "Failed to save rental agreement."
                )
            );
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // VIEW
    // ============================================================

    const openDetails = (rental) => {
        setSelectedRental(rental);
        setShowDetails(true);
    };

    // ============================================================
    // RENEW
    // ============================================================

    const openRenew = (rental) => {
        setSelectedRental(rental);

        setRenewForm({
            EndDate: rental.EndDate
                ? String(rental.EndDate).substring(0, 10)
                : "",
            MonthlyRent: rental.MonthlyRent || "",
            DueDate: rental.DueDate || 1
        });

        setError("");
        setSuccess("");
        setShowRenew(true);
    };

    const handleRenew = async (event) => {
        event.preventDefault();

        if (!renewForm.EndDate) {
            setError("New end date is required.");
            return;
        }

        if (
            renewForm.MonthlyRent &&
            Number(renewForm.MonthlyRent) <= 0
        ) {
            setError("Monthly rent must be greater than zero.");
            return;
        }

        if (
            Number(renewForm.DueDate) < 1 ||
            Number(renewForm.DueDate) > 31
        ) {
            setError("Due date must be between 1 and 31.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            await axios.patch(
                `${API_URL}/rentals/${selectedRental.RentalID}/renew`,
                {
                    EndDate: renewForm.EndDate,
                    MonthlyRent: renewForm.MonthlyRent
                        ? Number(renewForm.MonthlyRent)
                        : undefined,
                    DueDate: Number(renewForm.DueDate)
                },
                authConfig
            );

            setShowRenew(false);
            setSelectedRental(null);

            setSuccess(
                "Rental agreement renewed successfully."
            );

            await loadData();
        } catch (err) {
            console.error("Renew rental error:", err);

            setError(
                getErrorMessage(
                    err,
                    "Failed to renew rental agreement."
                )
            );
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // TERMINATE
    // ============================================================

    const handleTerminate = async (rental) => {
        const confirmed = window.confirm(
            `Are you sure you want to terminate the rental agreement for ${rental.PropertyName}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await axios.patch(
                `${API_URL}/rentals/${rental.RentalID}/terminate`,
                {},
                authConfig
            );

            setSuccess(
                "Rental agreement terminated successfully."
            );

            if (
                selectedRental?.RentalID === rental.RentalID
            ) {
                setShowDetails(false);
                setSelectedRental(null);
            }

            await loadData();
        } catch (err) {
            console.error("Terminate rental error:", err);

            setError(
                getErrorMessage(
                    err,
                    "Failed to terminate rental agreement."
                )
            );
        }
    };

    // ============================================================
    // FILTER
    // ============================================================

    const filteredRentals = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return rentals.filter((rental) => {
            const matchesSearch =
                !keyword ||
                String(rental.RentalID || "")
                    .toLowerCase()
                    .includes(keyword) ||
                String(rental.PropertyName || "")
                    .toLowerCase()
                    .includes(keyword) ||
                String(rental.CustomerName || "")
                    .toLowerCase()
                    .includes(keyword) ||
                String(rental.HandledByName || "")
                    .toLowerCase()
                    .includes(keyword);

            const matchesStatus =
                statusFilter === "All" ||
                rental.Status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [rentals, search, statusFilter]);

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredRentals.length / rowsPerPage)
    );

    const currentPage = Math.min(page, totalPages);

    const paginatedRentals = filteredRentals.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // ============================================================
    // STATISTICS
    // ============================================================

    const stats = useMemo(() => {
        const active = rentals.filter(
            (rental) => rental.Status === "Active"
        ).length;

        const expired = rentals.filter(
            (rental) => rental.Status === "Expired"
        ).length;

        const terminated = rentals.filter(
            (rental) => rental.Status === "Terminated"
        ).length;

        const monthlyRent = rentals
            .filter((rental) => rental.Status === "Active")
            .reduce(
                (total, rental) =>
                    total + Number(rental.MonthlyRent || 0),
                0
            );

        return {
            total: rentals.length,
            active,
            expired,
            terminated,
            monthlyRent
        };
    }, [rentals]);

    // ============================================================
    // AVAILABLE PROPERTIES
    // ============================================================

    const availableProperties = useMemo(() => {
        return properties.filter(
            (property) => property.Status === "Available"
        );
    }, [properties]);

    // ============================================================
    // STATUS BADGE
    // ============================================================

    const getStatusClass = (status) => {
        if (status === "Active") return "rental-status active";
        if (status === "Expired") return "rental-status expired";
        if (status === "Terminated") {
            return "rental-status terminated";
        }

        return "rental-status";
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="sales-rental-page">
            <div className="sales-rental-container">

                {/* HEADER */}

                <div className="sales-rental-header">
                    <div>
                        <div className="sales-rental-title-row">
                            <div className="sales-rental-title-icon">
                                <FileText size={25} />
                            </div>

                            <div>
                                <h1>Rental Agreements</h1>
                                <p>
                                    Create and manage property rental
                                    agreements.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="sales-rental-header-actions">
                        <button
                            type="button"
                            className="rental-refresh-btn"
                            onClick={loadData}
                            disabled={loading}
                            title="Refresh"
                        >
                            <RefreshCw
                                size={18}
                                className={
                                    loading
                                        ? "rental-spin"
                                        : ""
                                }
                            />
                        </button>

                        <button
                            type="button"
                            className="rental-primary-btn"
                            onClick={openCreateForm}
                        >
                            <Plus size={18} />
                            Create Rental
                        </button>
                    </div>
                </div>

                {/* ALERTS */}

                {error && (
                    <div className="rental-alert rental-alert-error">
                        <AlertCircle size={19} />
                        <span>{error}</span>

                        <button
                            type="button"
                            onClick={() => setError("")}
                        >
                            <X size={17} />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="rental-alert rental-alert-success">
                        <CheckCircle2 size={19} />
                        <span>{success}</span>

                        <button
                            type="button"
                            onClick={() => setSuccess("")}
                        >
                            <X size={17} />
                        </button>
                    </div>
                )}

                {/* STATISTICS */}

                <div className="rental-stat-grid">

                    <div className="rental-stat-card">
                        <div className="rental-stat-icon total">
                            <FileText size={21} />
                        </div>

                        <div>
                            <span>Total Agreements</span>
                            <strong>{stats.total}</strong>
                        </div>
                    </div>

                    <div className="rental-stat-card">
                        <div className="rental-stat-icon active">
                            <CheckCircle2 size={21} />
                        </div>

                        <div>
                            <span>Active Rentals</span>
                            <strong>{stats.active}</strong>
                        </div>
                    </div>

                    <div className="rental-stat-card">
                        <div className="rental-stat-icon expired">
                            <Clock size={21} />
                        </div>

                        <div>
                            <span>Expired</span>
                            <strong>{stats.expired}</strong>
                        </div>
                    </div>

                    <div className="rental-stat-card">
                        <div className="rental-stat-icon terminated">
                            <XCircle size={21} />
                        </div>

                        <div>
                            <span>Terminated</span>
                            <strong>{stats.terminated}</strong>
                        </div>
                    </div>

                    <div className="rental-stat-card rental-income-card">
                        <div className="rental-stat-icon income">
                            <DollarSign size={21} />
                        </div>

                        <div>
                            <span>Active Monthly Rent</span>
                            <strong>
                                {formatCurrency(
                                    stats.monthlyRent
                                )}{" "}
                                ETB
                            </strong>
                        </div>
                    </div>
                </div>

                {/* FILTERS */}

                <div className="rental-filter-card">

                    <div className="rental-search-box">
                        <Search size={19} />

                        <input
                            type="text"
                            placeholder="Search by customer, property, agreement ID..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                        className="rental-status-filter"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Expired">Expired</option>
                        <option value="Terminated">
                            Terminated
                        </option>
                    </select>
                </div>

                {/* TABLE */}

                <div className="rental-table-card">

                    {loading ? (
                        <div className="rental-loading">
                            <Loader2
                                size={32}
                                className="rental-spin"
                            />
                            <p>
                                Loading rental agreements...
                            </p>
                        </div>
                    ) : paginatedRentals.length === 0 ? (
                        <div className="rental-empty">
                            <div className="rental-empty-icon">
                                <FileText size={32} />
                            </div>

                            <h3>
                                No rental agreements found
                            </h3>

                            <p>
                                {search || statusFilter !== "All"
                                    ? "Try changing your search or filter."
                                    : "Create your first rental agreement to get started."}
                            </p>

                            {!search &&
                                statusFilter === "All" && (
                                    <button
                                        type="button"
                                        className="rental-primary-btn"
                                        onClick={openCreateForm}
                                    >
                                        <Plus size={18} />
                                        Create Rental
                                    </button>
                                )}
                        </div>
                    ) : (
                        <>
                            <div className="rental-table-wrapper">
                                <table className="rental-table">
                                    <thead>
                                        <tr>
                                            <th>Agreement</th>
                                            <th>Customer</th>
                                            <th>Property</th>
                                            <th>Monthly Rent</th>
                                            <th>Rental Period</th>
                                            <th>Due Day</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {paginatedRentals.map(
                                            (rental) => (
                                                <tr
                                                    key={
                                                        rental.RentalID
                                                    }
                                                >
                                                    <td>
                                                        <div className="rental-id">
                                                            #
                                                            {
                                                                rental.RentalID
                                                            }
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="rental-person">
                                                            <div className="rental-avatar">
                                                                <UserRound
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            </div>

                                                            <div>
                                                                <strong>
                                                                    {
                                                                        rental.CustomerName
                                                                    }
                                                                </strong>

                                                                <span>
                                                                    {
                                                                        rental.CustomerPhone
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="rental-property">
                                                            <strong>
                                                                {
                                                                    rental.PropertyName
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    rental.PropertyType
                                                                }
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {
                                                                formatCurrency(
                                                                    rental.MonthlyRent
                                                                )
                                                            }{" "}
                                                            ETB
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        <div className="rental-period">
                                                            <span>
                                                                {formatDate(
                                                                    rental.StartDate
                                                                )}
                                                            </span>

                                                            <span className="period-arrow">
                                                                →
                                                            </span>

                                                            <span>
                                                                {formatDate(
                                                                    rental.EndDate
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        Day{" "}
                                                        {
                                                            rental.DueDate
                                                        }
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={getStatusClass(
                                                                rental.Status
                                                            )}
                                                        >
                                                            {rental.Status ===
                                                                "Active" && (
                                                                <CheckCircle2
                                                                    size={
                                                                        14
                                                                    }
                                                                />
                                                            )}

                                                            {rental.Status ===
                                                                "Expired" && (
                                                                <Clock
                                                                    size={
                                                                        14
                                                                    }
                                                                />
                                                            )}

                                                            {rental.Status ===
                                                                "Terminated" && (
                                                                <XCircle
                                                                    size={
                                                                        14
                                                                    }
                                                                />
                                                            )}

                                                            {
                                                                rental.Status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="rental-actions">

                                                            <button
                                                                type="button"
                                                                className="rental-action-btn view"
                                                                onClick={() =>
                                                                    openDetails(
                                                                        rental
                                                                    )
                                                                }
                                                                title="View"
                                                            >
                                                                <Eye
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            </button>

                                                            {rental.Status ===
                                                                "Active" && (
                                                                <button
                                                                    type="button"
                                                                    className="rental-action-btn edit"
                                                                    onClick={() =>
                                                                        openEditForm(
                                                                            rental
                                                                        )
                                                                    }
                                                                    title="Edit"
                                                                >
                                                                    <Edit3
                                                                        size={
                                                                            17
                                                                        }
                                                                    />
                                                                </button>
                                                            )}

                                                            {rental.Status !==
                                                                "Active" && (
                                                                <button
                                                                    type="button"
                                                                    className="rental-action-btn renew"
                                                                    onClick={() =>
                                                                        openRenew(
                                                                            rental
                                                                        )
                                                                    }
                                                                    title="Renew"
                                                                >
                                                                    <RefreshCw
                                                                        size={
                                                                            17
                                                                        }
                                                                    />
                                                                </button>
                                                            )}

                                                            {rental.Status ===
                                                                "Active" && (
                                                                <button
                                                                    type="button"
                                                                    className="rental-action-btn terminate"
                                                                    onClick={() =>
                                                                        handleTerminate(
                                                                            rental
                                                                        )
                                                                    }
                                                                    title="Terminate"
                                                                >
                                                                    <XCircle
                                                                        size={
                                                                            17
                                                                        }
                                                                    />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* PAGINATION */}

                            <div className="rental-pagination">

                                <span>
                                    Showing{" "}
                                    <strong>
                                        {filteredRentals.length ===
                                        0
                                            ? 0
                                            : (currentPage - 1) *
                                                  rowsPerPage +
                                              1}
                                    </strong>{" "}
                                    to{" "}
                                    <strong>
                                        {Math.min(
                                            currentPage *
                                                rowsPerPage,
                                            filteredRentals.length
                                        )}
                                    </strong>{" "}
                                    of{" "}
                                    <strong>
                                        {filteredRentals.length}
                                    </strong>
                                </span>

                                <div className="rental-pagination-buttons">

                                    <button
                                        type="button"
                                        disabled={
                                            currentPage === 1
                                        }
                                        onClick={() =>
                                            setPage(
                                                (previous) =>
                                                    previous - 1
                                            )
                                        }
                                    >
                                        <ChevronLeft
                                            size={17}
                                        />
                                    </button>

                                    <span>
                                        {currentPage} /{" "}
                                        {totalPages}
                                    </span>

                                    <button
                                        type="button"
                                        disabled={
                                            currentPage ===
                                            totalPages
                                        }
                                        onClick={() =>
                                            setPage(
                                                (previous) =>
                                                    previous + 1
                                            )
                                        }
                                    >
                                        <ChevronRight
                                            size={17}
                                        />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ======================================================
                CREATE / EDIT MODAL
            ====================================================== */}

            {showForm && (
                <div className="rental-modal-overlay">
                    <div className="rental-modal">

                        <div className="rental-modal-header">
                            <div>
                                <h2>
                                    {editingRental
                                        ? "Edit Rental Agreement"
                                        : "Create Rental Agreement"}
                                </h2>

                                <p>
                                    {editingRental
                                        ? "Update the rental agreement details."
                                        : "Enter the details for the new rental agreement."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowForm(false)
                                }
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form
                            className="rental-form"
                            onSubmit={handleSubmit}
                        >

                            {!editingRental && (
                                <div className="rental-form-group">
                                    <label>
                                        Property{" "}
                                        <span>*</span>
                                    </label>

                                    <select
                                        name="PropertyID"
                                        value={form.PropertyID}
                                        onChange={
                                            handleFormChange
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select available property
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
                                                    }{" "}
                                                    —{" "}
                                                    {
                                                        property.PropertyType
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                    {availableProperties.length ===
                                        0 && (
                                        <small className="rental-help-error">
                                            No available properties
                                            are currently available
                                            for rental.
                                        </small>
                                    )}
                                </div>
                            )}

                            {editingRental && (
                                <div className="rental-selected-property">
                                    <div className="rental-selected-icon">
                                        <FileText size={19} />
                                    </div>

                                    <div>
                                        <span>
                                            Property
                                        </span>

                                        <strong>
                                            {
                                                editingRental.PropertyName
                                            }
                                        </strong>
                                    </div>
                                </div>
                            )}

                            <div className="rental-form-group">
                                <label>
                                    Customer{" "}
                                    <span>*</span>
                                </label>

                                <select
                                    name="CustomerID"
                                    value={form.CustomerID}
                                    onChange={
                                        handleFormChange
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
                                                {customer.PhoneNumber
                                                    ? ` — ${customer.PhoneNumber}`
                                                    : ""}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="rental-form-grid">

                                <div className="rental-form-group">
                                    <label>
                                        Monthly Rent (ETB){" "}
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="number"
                                        name="MonthlyRent"
                                        value={
                                            form.MonthlyRent
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        min="0.01"
                                        step="0.01"
                                        placeholder="15000"
                                        required
                                    />
                                </div>

                                <div className="rental-form-group">
                                    <label>
                                        Due Day{" "}
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="number"
                                        name="DueDate"
                                        value={form.DueDate}
                                        onChange={
                                            handleFormChange
                                        }
                                        min="1"
                                        max="31"
                                        placeholder="1"
                                        required
                                    />

                                    <small>
                                        Day of the month when
                                        rent is due.
                                    </small>
                                </div>

                                <div className="rental-form-group">
                                    <label>
                                        Start Date{" "}
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="date"
                                        name="StartDate"
                                        value={
                                            form.StartDate
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        required
                                    />
                                </div>

                                <div className="rental-form-group">
                                    <label>
                                        End Date{" "}
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="date"
                                        name="EndDate"
                                        value={form.EndDate}
                                        onChange={
                                            handleFormChange
                                        }
                                        required
                                    />
                                </div>

                                <div className="rental-form-group">
                                    <label>Status</label>

                                    <select
                                        name="Status"
                                        value={form.Status}
                                        onChange={
                                            handleFormChange
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
                            </div>

                            <div className="rental-modal-footer">

                                <button
                                    type="button"
                                    className="rental-cancel-btn"
                                    onClick={() =>
                                        setShowForm(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="rental-primary-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="rental-spin"
                                            />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2
                                                size={18}
                                            />
                                            {editingRental
                                                ? "Update Agreement"
                                                : "Create Agreement"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ======================================================
                DETAILS MODAL
            ====================================================== */}

            {showDetails && selectedRental && (
                <div className="rental-modal-overlay">
                    <div className="rental-modal rental-details-modal">

                        <div className="rental-modal-header">
                            <div>
                                <h2>
                                    Rental Agreement #
                                    {
                                        selectedRental.RentalID
                                    }
                                </h2>

                                <p>
                                    Rental agreement details
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowDetails(false);
                                    setSelectedRental(null);
                                }}
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <div className="rental-details-body">

                            <div className="rental-details-status">
                                <span
                                    className={getStatusClass(
                                        selectedRental.Status
                                    )}
                                >
                                    {selectedRental.Status}
                                </span>
                            </div>

                            <div className="rental-detail-grid">

                                <div className="rental-detail-item">
                                    <span>Customer</span>
                                    <strong>
                                        {
                                            selectedRental.CustomerName
                                        }
                                    </strong>
                                </div>

                                <div className="rental-detail-item">
                                    <span>Customer Phone</span>
                                    <strong>
                                        {
                                            selectedRental.CustomerPhone ||
                                            "-"
                                        }
                                    </strong>
                                </div>

                                <div className="rental-detail-item">
                                    <span>Customer Email</span>
                                    <strong>
                                        {
                                            selectedRental.CustomerEmail ||
                                            "-"
                                        }
                                    </strong>
                                </div>

                                <div className="rental-detail-item">
                                    <span>Property</span>
                                    <strong>
                                        {
                                            selectedRental.PropertyName
                                        }
                                    </strong>
                                </div>

                                <div className="rental-detail-item">
                                    <span>Property Type</span>
                                    <strong>
                                        {
                                            selectedRental.PropertyType
                                        }
                                    </strong>
                                </div>

                                <div className="rental-detail-item">
                                    <span>Monthly Rent</span>
                                    <strong>
                                        {formatCurrency(
                                            selectedRental.MonthlyRent
                                        )}{" "}
                                        ETB
                                    </strong>
                                </div>

                                <div className="rental-detail-item">
                                    <span>Start Date</span>
                                    <strong>
                                        {formatDate(
                                            selectedRental.StartDate
                                        )}
                                    </strong>
                                </div>

                                <div className="rental-detail-item">
                                    <span>End Date</span>
                                    <strong>
                                        {formatDate(
                                            selectedRental.EndDate
                                        )}
                                    </strong>
                                </div>

                                <div className="rental-detail-item">
                                    <span>Rent Due Day</span>
                                    <strong>
                                        Day{" "}
                                        {
                                            selectedRental.DueDate
                                        }
                                    </strong>
                                </div>

                                <div className="rental-detail-item">
                                    <span>Handled By</span>
                                    <strong>
                                        {
                                            selectedRental.HandledByName
                                        }
                                    </strong>
                                </div>

                            </div>
                        </div>

                        <div className="rental-modal-footer">

                            <button
                                type="button"
                                className="rental-cancel-btn"
                                onClick={() => {
                                    setShowDetails(false);
                                    setSelectedRental(null);
                                }}
                            >
                                Close
                            </button>

                            {selectedRental.Status ===
                                "Active" && (
                                <>
                                    <button
                                        type="button"
                                        className="rental-secondary-btn"
                                        onClick={() => {
                                            setShowDetails(false);
                                            openEditForm(
                                                selectedRental
                                            );
                                        }}
                                    >
                                        <Edit3 size={17} />
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        className="rental-danger-btn"
                                        onClick={() =>
                                            handleTerminate(
                                                selectedRental
                                            )
                                        }
                                    >
                                        <XCircle size={17} />
                                        Terminate
                                    </button>
                                </>
                            )}

                            {selectedRental.Status !==
                                "Active" && (
                                <button
                                    type="button"
                                    className="rental-primary-btn"
                                    onClick={() => {
                                        setShowDetails(false);
                                        openRenew(
                                            selectedRental
                                        );
                                    }}
                                >
                                    <RefreshCw size={17} />
                                    Renew
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================
                RENEW MODAL
            ====================================================== */}

            {showRenew && selectedRental && (
                <div className="rental-modal-overlay">
                    <div className="rental-modal">

                        <div className="rental-modal-header">
                            <div>
                                <h2>
                                    Renew Rental Agreement
                                </h2>

                                <p>
                                    Extend the rental period for{" "}
                                    <strong>
                                        {
                                            selectedRental.PropertyName
                                        }
                                    </strong>
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowRenew(false)
                                }
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form
                            className="rental-form"
                            onSubmit={handleRenew}
                        >

                            <div className="rental-renew-summary">
                                <div>
                                    <span>
                                        Current End Date
                                    </span>

                                    <strong>
                                        {formatDate(
                                            selectedRental.EndDate
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Current Monthly Rent
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            selectedRental.MonthlyRent
                                        )}{" "}
                                        ETB
                                    </strong>
                                </div>
                            </div>

                            <div className="rental-form-group">
                                <label>
                                    New End Date{" "}
                                    <span>*</span>
                                </label>

                                <input
                                    type="date"
                                    name="EndDate"
                                    value={
                                        renewForm.EndDate
                                    }
                                    onChange={
                                        handleRenewChange
                                    }
                                    required
                                />
                            </div>

                            <div className="rental-form-grid">

                                <div className="rental-form-group">
                                    <label>
                                        Monthly Rent
                                    </label>

                                    <input
                                        type="number"
                                        name="MonthlyRent"
                                        value={
                                            renewForm.MonthlyRent
                                        }
                                        onChange={
                                            handleRenewChange
                                        }
                                        min="0.01"
                                        step="0.01"
                                    />
                                </div>

                                <div className="rental-form-group">
                                    <label>
                                        Due Day
                                    </label>

                                    <input
                                        type="number"
                                        name="DueDate"
                                        value={
                                            renewForm.DueDate
                                        }
                                        onChange={
                                            handleRenewChange
                                        }
                                        min="1"
                                        max="31"
                                    />
                                </div>
                            </div>

                            <div className="rental-modal-footer">

                                <button
                                    type="button"
                                    className="rental-cancel-btn"
                                    onClick={() =>
                                        setShowRenew(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="rental-primary-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="rental-spin"
                                            />
                                            Renewing...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw
                                                size={18}
                                            />
                                            Renew Agreement
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