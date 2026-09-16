import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Loader2,
    XCircle,
} from "lucide-react";

import "./CustomerReservations.css";

const API_BASE = "http://localhost:5000/api";

function CustomerReservations() {
    const [reservations, setReservations] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const token = localStorage.getItem("token");

    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    // ==================================================
    // FORMAT DATE
    // ==================================================

    const formatDisplayDate = (dateValue) => {
        if (!dateValue) return "—";

        const value = String(dateValue).slice(0, 10);
        const parts = value.split("-");

        if (parts.length === 3) {
            const year = Number(parts[0]);
            const month = Number(parts[1]);
            const day = Number(parts[2]);

            const date = new Date(year, month - 1, day);

            if (!Number.isNaN(date.getTime())) {
                return date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            }
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // ==================================================
    // LOAD MY RESERVATIONS
    // ==================================================

    const loadReservations = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_BASE}/reservations/my`,
                config
            );

            const data =
                response.data?.reservations ||
                response.data?.data ||
                (Array.isArray(response.data)
                    ? response.data
                    : []);

            setReservations(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Load reservations error:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to load your reservations."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReservations();
    }, []);

    // ==================================================
    // CANCEL RESERVATION
    // ==================================================

    const handleCancel = async (reservationId) => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this reservation?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await axios.patch(
                `${API_BASE}/reservations/${reservationId}/cancel`,
                {},
                config
            );

            setSuccess(
                "Reservation cancelled successfully."
            );

            await loadReservations();
        } catch (err) {
            console.error(
                "Cancel reservation error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to cancel reservation."
            );
        }
    };

    // ==================================================
    // PROPERTY NAME
    // ==================================================

    const getPropertyName = (reservation) => {
        return (
            reservation.PropertyName ||
            reservation.propertyName ||
            reservation.Property ||
            "Property"
        );
    };

    // ==================================================
    // PROPERTY LOCATION
    // ==================================================

    const getPropertyLocation = (reservation) => {
        return (
            reservation.Address ||
            reservation.address ||
            reservation.Location ||
            reservation.location ||
            "Location not available"
        );
    };

    // ==================================================
    // STATUS CLASS
    // ==================================================

    const getStatusClass = (status) => {
        return String(status || "Pending")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-");
    };

    // ==================================================
    // CAN CANCEL?
    // ==================================================

    const canCancelReservation = (status) => {
        const normalizedStatus = String(status || "")
            .trim()
            .toLowerCase();

        return ![
            "canceled",
            "cancelled",
            "expired",
            "completed",
        ].includes(normalizedStatus);
    };

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div className="customer-reservations-page">
                <div className="reservation-loading">
                    <Loader2
                        size={36}
                        className="spin"
                    />

                    <p>
                        Loading your reservations...
                    </p>
                </div>
            </div>
        );
    }

    // ==================================================
    // PAGE
    // ==================================================

    return (
        <div className="customer-reservations-page">

            {/* ==========================================
                HEADER
            ========================================== */}

            <div className="reservation-header">

                <div className="reservation-header-left">

                    <Link
                        to="/customer-dashboard"
                        className="back-link"
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </Link>

                    <h1>
                        My Reservations
                    </h1>

                    <p>
                        View and manage your property reservations.
                    </p>

                </div>

                <Link
                    to="/customer/properties"
                    className="reservation-browse-btn"
                >
                    Browse Properties
                </Link>

            </div>

            {/* ==========================================
                ALERTS
            ========================================== */}

            {error && (
                <div className="reservation-alert error">
                    <XCircle size={20} />

                    <span>
                        {error}
                    </span>
                </div>
            )}

            {success && (
                <div className="reservation-alert success">
                    <CheckCircle2 size={20} />

                    <span>
                        {success}
                    </span>
                </div>
            )}

            {/* ==========================================
                RESERVATION CONTENT
            ========================================== */}

            <div className="my-reservations-section">

                <div className="section-heading">

                    <div>
                        <h2>
                            Reservation History
                        </h2>

                        <p>
                            All reservations you have made.
                        </p>
                    </div>

                    <div className="reservation-count">
                        {reservations.length}{" "}
                        {reservations.length === 1
                            ? "Reservation"
                            : "Reservations"}
                    </div>

                </div>

                {/* ======================================
                    NO RESERVATIONS
                ====================================== */}

                {reservations.length === 0 ? (
                    <div className="no-reservations">

                        <div className="empty-reservation-icon">
                            <CalendarDays size={40} />
                        </div>

                        <h3>
                            No Reservations Yet
                        </h3>

                        <p>
                            You haven't reserved any properties yet.
                            Browse available properties to make a
                            reservation.
                        </p>

                        <Link
                            to="/customer/properties"
                            className="reservation-btn primary"
                        >
                            Browse Properties
                        </Link>

                    </div>
                ) : (

                    /* ==================================
                       RESERVATIONS LIST
                    ================================== */

                    <div className="reservations-list">

                        {reservations.map((reservation) => {

                            const reservationId =
                                reservation.ReservationID ||
                                reservation.reservationID ||
                                reservation.id;

                            const status =
                                reservation.ReservationStatus ||
                                reservation.reservationStatus ||
                                reservation.Status ||
                                "Pending";

                            const reservationDate =
                                reservation.ReservationDate ||
                                reservation.reservationDate;

                            const expiryDate =
                                reservation.ExpiryDate ||
                                reservation.expiryDate;

                            return (
                                <div
                                    className="reservation-card"
                                    key={reservationId}
                                >

                                    {/* PROPERTY */}

                                    <div className="reservation-card-main">

                                        <div className="reservation-property-icon">
                                            <CalendarDays size={22} />
                                        </div>

                                        <div className="reservation-property-info">

                                            <h3>
                                                {getPropertyName(
                                                    reservation
                                                )}
                                            </h3>

                                            <p>
                                                {getPropertyLocation(
                                                    reservation
                                                )}
                                            </p>

                                            <span>
                                                Reservation #
                                                {reservationId}
                                            </span>

                                        </div>

                                    </div>

                                    {/* DATES */}

                                    <div className="reservation-dates">

                                        <div>
                                            <span>
                                                Reserved
                                            </span>

                                            <strong>
                                                {formatDisplayDate(
                                                    reservationDate
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Expires
                                            </span>

                                            <strong>
                                                {formatDisplayDate(
                                                    expiryDate
                                                )}
                                            </strong>
                                        </div>

                                    </div>

                                    {/* STATUS */}

                                    <span
                                        className={`reservation-status ${getStatusClass(
                                            status
                                        )}`}
                                    >
                                        {status}
                                    </span>

                                    {/* CANCEL */}

                                    {canCancelReservation(status) && (
                                        <button
                                            type="button"
                                            className="cancel-reservation-btn"
                                            onClick={() =>
                                                handleCancel(
                                                    reservationId
                                                )
                                            }
                                        >
                                            <XCircle size={16} />

                                            Cancel
                                        </button>
                                    )}

                                </div>
                            );
                        })}

                    </div>
                )}

            </div>
        </div>
    );
}

export default CustomerReservations;