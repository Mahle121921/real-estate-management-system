import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    CalendarCheck,
    Settings,
    Search,
    Bell,
    Trash2,
    Filter,
    Columns,
    CheckCircle,
    XCircle,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import "./Reservations.css";

function Reservations() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        customerId: "",
        propertyId: "",
        reservationDate: "",
        expiryDate: "",
        reservationStatus: "Pending",
        remarks: "",
    });

    // ==========================================
    // API CONFIG
    // ==========================================

    const API_URL = "http://localhost:5000/api/reservations";

    // ==========================================
    // GET TOKEN
    // ==========================================

    const getToken = () => {
        return localStorage.getItem("token");
    };

    // ==========================================
    // GET CURRENT USER
    // ==========================================

    const getCurrentUser = () => {
        try {
            const user = localStorage.getItem("user");

            if (!user) {
                return null;
            }

            return JSON.parse(user);
        } catch (error) {
            console.error("Unable to read user:", error);
            return null;
        }
    };


// ==========================================
// LOAD RESERVATIONS FROM DATABASE
// ==========================================

const fetchReservations = async () => {
    try {
        setLoading(true);
        setError("");

        const token = getToken();

        const response = await axios.get(API_URL, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.data.success) {
            setReservations(response.data.reservations || []);
        } else {
            setError(
                response.data.message ||
                "Failed to load reservations"
            );
        }
    } catch (error) {
        console.error("Fetch reservations error:", error);

        if (error.response?.status === 401) {
            setError(
                "Your session has expired. Please login again."
            );
        } else if (error.response?.status === 403) {
            setError(
                "You are not authorized to view reservations."
            );
        } else {
            setError(
                error.response?.data?.message ||
                "Unable to connect to the reservation server."
            );
        }
    } finally {
        setLoading(false);
    }
};

// ==========================================
// LOAD DATA WHEN PAGE OPENS
// ==========================================

useEffect(() => {
    let cancelled = false;

    const loadReservations = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            const response = await axios.get(API_URL, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (cancelled) return;

            if (response.data.success) {
                setReservations(
                    response.data.reservations || []
                );
            } else {
                setError(
                    response.data.message ||
                    "Failed to load reservations"
                );
            }
        } catch (error) {
            if (cancelled) return;

            console.error(
                "Fetch reservations error:",
                error
            );

            if (error.response?.status === 401) {
                setError(
                    "Your session has expired. Please login again."
                );
            } else if (error.response?.status === 403) {
                setError(
                    "You are not authorized to view reservations."
                );
            } else {
                setError(
                    error.response?.data?.message ||
                    "Unable to connect to the reservation server."
                );
            }
        } finally {
            if (!cancelled) {
                setLoading(false);
            }
        }
    };

    loadReservations();

    return () => {
        cancelled = true;
    };
}, []);


    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ==========================================
    // CREATE RESERVATION
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !form.customerId ||
            !form.propertyId ||
            !form.reservationDate ||
            !form.expiryDate
        ) {
            setError(
                "Customer, property, reservation date, and expiry date are required."
            );
            return;
        }

        if (
            new Date(form.expiryDate) <
            new Date(form.reservationDate)
        ) {
            setError(
                "Expiry date cannot be before reservation date."
            );
            return;
        }

        const currentUser = getCurrentUser();

        if (!currentUser) {
            setError(
                "Current user information was not found. Please login again."
            );
            return;
        }

        /*
         * Your database uses HandledBy.
         * We take the logged-in user's UserID.
         */

        const handledBy =
            currentUser.UserID ||
            currentUser.userId ||
            currentUser.id;

        if (!handledBy) {
            setError(
                "Could not determine the logged-in user's ID."
            );
            return;
        }

        try {
            setSubmitting(true);

            const token = getToken();

            const response = await axios.post(
                API_URL,
                {
                    customerId: Number(form.customerId),
                    propertyId: Number(form.propertyId),
                    HandledBy: Number(handledBy),
                    reservationDate: form.reservationDate,
                    expiryDate: form.expiryDate,
                    reservationStatus:
                        form.reservationStatus,
                    remarks: form.remarks || null,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.success) {
                setSuccess(
                    "Reservation created successfully."
                );

                setForm({
                    customerId: "",
                    propertyId: "",
                    reservationDate: "",
                    expiryDate: "",
                    reservationStatus: "Pending",
                    remarks: "",
                });

                await fetchReservations();
            }
        } catch (error) {
            console.error("Create reservation error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to create reservation."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ==========================================
    // CANCEL RESERVATION
    // ==========================================

    const handleCancel = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this reservation?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            const token = getToken();

            const response = await axios.patch(
                `${API_URL}/${id}/cancel`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                setSuccess(
                    "Reservation canceled successfully."
                );

                await fetchReservations();
            }
        } catch (error) {
            console.error(
                "Cancel reservation error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to cancel reservation."
            );
        }
    };

    // ==========================================
    // SEARCH
    // ==========================================

    const filteredReservations = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) {
            return reservations;
        }

        return reservations.filter((reservation) => {
            return (
                String(
                    reservation.ReservationID
                )
                    .toLowerCase()
                    .includes(term) ||
                String(
                    reservation.CustomerName || ""
                )
                    .toLowerCase()
                    .includes(term) ||
                String(
                    reservation.PropertyName || ""
                )
                    .toLowerCase()
                    .includes(term) ||
                String(
                    reservation.ReservationStatus || ""
                )
                    .toLowerCase()
                    .includes(term) ||
                String(
                    reservation.Remarks || ""
                )
                    .toLowerCase()
                    .includes(term)
            );
        });
    }, [reservations, search]);

    // ==========================================
    // OVERVIEW
    // ==========================================

    const overview = useMemo(() => {
        return {
            active: reservations.filter(
                (r) =>
                    r.ReservationStatus === "Active" ||
                    r.ReservationStatus === "Pending"
            ).length,

            confirmed: reservations.filter(
                (r) =>
                    r.ReservationStatus === "Confirmed"
            ).length,

            cancelled: reservations.filter(
                (r) =>
                    r.ReservationStatus === "Canceled" ||
                    r.ReservationStatus === "Cancelled"
            ).length,
        };
    }, [reservations]);

    // ==========================================
    // STATUS CHART
    // ==========================================

    const typeSplitData = useMemo(() => {
        return [
            {
                name: "Pending",
                value: reservations.filter(
                    (r) =>
                        r.ReservationStatus ===
                        "Pending"
                ).length,
            },
            {
                name: "Confirmed",
                value: reservations.filter(
                    (r) =>
                        r.ReservationStatus ===
                        "Confirmed"
                ).length,
            },
            {
                name: "Canceled",
                value: reservations.filter(
                    (r) =>
                        r.ReservationStatus ===
                        "Canceled" ||
                        r.ReservationStatus ===
                        "Cancelled"
                ).length,
            },
        ];
    }, [reservations]);

    // ==========================================
    // STATUS CLASS
    // ==========================================

    const getStatusClass = (status) => {
        switch (status) {
            case "Confirmed":
                return "status-confirmed";

            case "Pending":
                return "status-pending";

            case "Canceled":
            case "Cancelled":
                return "status-cancelled";

            case "Expired":
                return "status-expired";

            case "Active":
                return "status-confirmed";

            default:
                return "";
        }
    };

    // ==========================================
    // DATE FORMAT
    // ==========================================

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const value = new Date(date);

        if (Number.isNaN(value.getTime())) {
            return date;
        }

        return value.toLocaleDateString();
    };

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <div className="res-container">

            <main className="res-main">

                {/* HEADER */}

                <header className="res-header">

                    <div className="res-welcome">
                        <span className="welcome">
                            Welcome Back!
                        </span>

                        <span className="system">
                            Property management system
                        </span>
                    </div>

                    <div className="res-header-right">

                        <div className="res-search">
                            <Search size={16} />

                            <input
                                type="text"
                                placeholder="Search reservations..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <button
                            type="button"
                            className="res-icon-btn notification"
                            title="Notifications"
                        >
                            <Bell size={18} />

                            <span className="badge">
                                3
                            </span>
                        </button>

                        <button
                            type="button"
                            className="res-icon-btn"
                            title="Settings"
                        >
                            <Settings size={18} />
                        </button>

                    </div>

                </header>

                {/* CONTENT */}

                <div className="res-content">

                    <h1 className="page-title">
                        Reservation Page
                    </h1>

                    {/* SUCCESS */}

                    {success && (
                        <div className="reservation-message success-message">
                            <CheckCircle size={18} />
                            {success}
                        </div>
                    )}

                    {/* ERROR */}

                    {error && (
                        <div className="reservation-message error-message">
                            <XCircle size={18} />
                            {error}
                        </div>
                    )}

                    {/* TOP ROW */}

                    <div className="top-row">

                        {/* QUICK OVERVIEW */}

                        <div className="card overview-card">

                            <h3>
                                Reservations: Quick Overview
                            </h3>

                            <div className="overview-grid">

                                <div className="overview-item">

                                    <div className="ov-label">
                                        Active Reservations
                                    </div>

                                    <div className="ov-value">
                                        {overview.active}

                                        <span className="badge pending">
                                            Pending
                                        </span>
                                    </div>

                                </div>

                                <div className="overview-item">

                                    <div className="ov-label">
                                        Confirmed Reservations
                                    </div>

                                    <div className="ov-value">

                                        {overview.confirmed}

                                        <span className="icon-circle green">
                                            <CalendarCheck
                                                size={14}
                                            />
                                        </span>

                                    </div>

                                </div>

                                <div className="overview-item">

                                    <div className="ov-label">
                                        Cancelled Reservations
                                    </div>

                                    <div className="ov-value">

                                        {overview.cancelled}

                                        <span className="icon-circle red">
                                            ✕
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* CHART */}

                        <div className="card chart-card">

                            <h3>
                                Reservation Status
                            </h3>

                            <ResponsiveContainer
                                width="100%"
                                height={140}
                            >

                                <BarChart
                                    data={typeSplitData}
                                    barSize={28}
                                >

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="name"
                                        tick={{
                                            fontSize: 12
                                        }}
                                    />

                                    <YAxis
                                        allowDecimals={false}
                                        tick={{
                                            fontSize: 12
                                        }}
                                    />

                                    <Tooltip />

                                    <Bar
                                        dataKey="value"
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0
                                        ]}
                                    />

                                </BarChart>

                            </ResponsiveContainer>

                        </div>

                    </div>

                    {/* MIDDLE ROW */}

                    <div className="middle-row">

                        {/* CREATE RESERVATION */}

                        <div className="card form-card">

                            <h3>
                                Create New Reservation
                            </h3>

                            <form
                                onSubmit={handleSubmit}
                            >

                                <div className="form-grid">

                                    <div className="form-left">

                                        {/* CUSTOMER */}

                                        <div className="form-group">

                                            <label>
                                                Customer
                                            </label>

                                            <select
                                                name="customerId"
                                                value={
                                                    form.customerId
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            >

                                                <option value="">
                                                    Select Customer
                                                </option>

                                                {[
                                                    ...new Map(
                                                        reservations.map(
                                                            (
                                                                reservation
                                                            ) => [
                                                                reservation.CustomerID,
                                                                reservation.CustomerName
                                                            ]
                                                        )
                                                    ).entries()
                                                ].map(
                                                    ([
                                                        id,
                                                        name
                                                    ]) => (
                                                        <option
                                                            key={id}
                                                            value={id}
                                                        >
                                                            {name}
                                                        </option>
                                                    )
                                                )}

                                            </select>

                                        </div>

                                        {/* PROPERTY */}

                                        <div className="form-group">

                                            <label>
                                                Property
                                            </label>

                                            <select
                                                name="propertyId"
                                                value={
                                                    form.propertyId
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            >

                                                <option value="">
                                                    Select Property
                                                </option>

                                                {[
                                                    ...new Map(
                                                        reservations.map(
                                                            (
                                                                reservation
                                                            ) => [
                                                                reservation.PropertyID,
                                                                reservation.PropertyName
                                                            ]
                                                        )
                                                    ).entries()
                                                ].map(
                                                    ([
                                                        id,
                                                        name
                                                    ]) => (
                                                        <option
                                                            key={id}
                                                            value={id}
                                                        >
                                                            {name}
                                                        </option>
                                                    )
                                                )}

                                            </select>

                                        </div>

                                        {/* RESERVATION DATE */}

                                        <div className="form-group">

                                            <label>
                                                Reservation Date
                                            </label>

                                            <input
                                                type="date"
                                                name="reservationDate"
                                                value={
                                                    form.reservationDate
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                        </div>

                                        {/* EXPIRY DATE */}

                                        <div className="form-group">

                                            <label>
                                                Expiry Date
                                            </label>

                                            <input
                                                type="date"
                                                name="expiryDate"
                                                value={
                                                    form.expiryDate
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                        </div>

                                        {/* STATUS */}

                                        <div className="form-group">

                                            <label>
                                                Reservation Status
                                            </label>

                                            <select
                                                name="reservationStatus"
                                                value={
                                                    form.reservationStatus
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            >

                                                <option value="Pending">
                                                    Pending
                                                </option>

                                                <option value="Confirmed">
                                                    Confirmed
                                                </option>

                                                <option value="Active">
                                                    Active
                                                </option>

                                                <option value="Canceled">
                                                    Canceled
                                                </option>

                                                <option value="Expired">
                                                    Expired
                                                </option>

                                            </select>

                                        </div>

                                        {/* REMARKS */}

                                        <div className="form-group">

                                            <label>
                                                Remarks
                                            </label>

                                            <input
                                                type="text"
                                                name="remarks"
                                                value={
                                                    form.remarks
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Optional remarks"
                                            />

                                        </div>

                                        {/* BUTTON */}

                                        <div className="form-actions">

                                            <button
                                                type="button"
                                                className="btn-outline"
                                                onClick={() =>
                                                    setForm({
                                                        customerId:
                                                            "",
                                                        propertyId:
                                                            "",
                                                        reservationDate:
                                                            "",
                                                        expiryDate:
                                                            "",
                                                        reservationStatus:
                                                            "Pending",
                                                        remarks:
                                                            "",
                                                    })
                                                }
                                            >
                                                Clear
                                            </button>

                                            <button
                                                type="submit"
                                                className="btn-primary"
                                                disabled={
                                                    submitting
                                                }
                                            >
                                                {submitting
                                                    ? "Saving..."
                                                    : "Submit Reservation"}
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </form>

                        </div>

                        {/* DATABASE SUMMARY */}

                        <div className="card calendar-card">

                            <div className="calendar-header">

                                <h3>
                                    Reservation Information
                                </h3>

                            </div>

                            <div className="database-info">

                                <div className="info-item">
                                    <span>
                                        Total Reservations
                                    </span>

                                    <strong>
                                        {reservations.length}
                                    </strong>
                                </div>

                                <div className="info-item">
                                    <span>
                                        Pending
                                    </span>

                                    <strong>
                                        {
                                            reservations.filter(
                                                (r) =>
                                                    r.ReservationStatus ===
                                                    "Pending"
                                            ).length
                                        }
                                    </strong>
                                </div>

                                <div className="info-item">
                                    <span>
                                        Confirmed
                                    </span>

                                    <strong>
                                        {
                                            reservations.filter(
                                                (r) =>
                                                    r.ReservationStatus ===
                                                    "Confirmed"
                                            ).length
                                        }
                                    </strong>
                                </div>

                                <div className="info-item">
                                    <span>
                                        Expired
                                    </span>

                                    <strong>
                                        {
                                            reservations.filter(
                                                (r) =>
                                                    r.ReservationStatus ===
                                                    "Expired"
                                            ).length
                                        }
                                    </strong>
                                </div>

                                <div className="info-note">
                                    Reservation information is
                                    loaded directly from the
                                    MariaDB database.
                                </div>

                            </div>

                        </div>

                    </div>

                    {/* RESERVATIONS TABLE */}

                    <div className="card table-card">

                        <div className="table-header">

                            <div>
                                <h3>
                                    Recent and Status-tracked Reservations
                                </h3>

                                {!loading && (
                                    <small>
                                        {filteredReservations.length}{" "}
                                        reservation
                                        {filteredReservations.length !==
                                        1
                                            ? "s"
                                            : ""}
                                    </small>
                                )}
                            </div>

                            <div className="table-actions">

                                <button
                                    type="button"
                                    className="icon-btn"
                                    title="Filter"
                                >
                                    <Filter size={16} />
                                </button>

                                <button
                                    type="button"
                                    className="icon-btn"
                                    title="Columns"
                                >
                                    <Columns size={16} />
                                </button>

                            </div>

                        </div>

                        <div className="table-wrapper">

                            {loading ? (
                                <div className="loading">
                                    Loading reservations...
                                </div>
                            ) : filteredReservations.length ===
                              0 ? (
                                <div className="empty-state">
                                    No reservations found.
                                </div>
                            ) : (

                                <table>

                                    <thead>

                                        <tr>

                                            <th>
                                                Date
                                            </th>

                                            <th>
                                                Reservation ID
                                            </th>

                                            <th>
                                                Customer
                                            </th>

                                            <th>
                                                Property
                                            </th>

                                            <th>
                                                Start Date
                                            </th>

                                            <th>
                                                End Date
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Handled By
                                            </th>

                                            <th>
                                                Action
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {filteredReservations.map(
                                            (
                                                reservation
                                            ) => (

                                                <tr
                                                    key={
                                                        reservation.ReservationID
                                                    }
                                                >

                                                    <td>
                                                        {formatDate(
                                                            reservation.ReservationDate
                                                        )}
                                                    </td>

                                                    <td>
                                                        #
                                                        {
                                                            reservation.ReservationID
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            reservation.CustomerName
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            reservation.PropertyName
                                                        }
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            reservation.ReservationDate
                                                        )}
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            reservation.ExpiryDate
                                                        )}
                                                    </td>

                                                    <td>

                                                        <span
                                                            className={`status-badge ${getStatusClass(
                                                                reservation.ReservationStatus
                                                            )}`}
                                                        >
                                                            {
                                                                reservation.ReservationStatus
                                                            }
                                                        </span>

                                                    </td>

                                                    <td>
                                                        {
                                                            reservation.HandledByName
                                                        }
                                                    </td>

                                                    <td>

                                                        {reservation.ReservationStatus !==
                                                            "Canceled" &&
                                                            reservation.ReservationStatus !==
                                                                "Cancelled" && (
                                                                <button
                                                                    type="button"
                                                                    className="delete-btn"
                                                                    title="Cancel Reservation"
                                                                    onClick={() =>
                                                                        handleCancel(
                                                                            reservation.ReservationID
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                </button>
                                                            )}

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            )}

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default Reservations;