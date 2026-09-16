import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
    CalendarDays,
    Search,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    Ban,
} from "lucide-react";

import "./OwnerReservations.css";

function OwnerReservations() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    const token = localStorage.getItem("token");

    // ==========================================
    // FETCH OWNER RESERVATIONS
    // ==========================================
    const fetchReservations = useCallback(async () => {
        if (!token) {
            setError(
                "Authentication token was not found. Please log in again."
            );
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            // IMPORTANT:
            // The backend identifies the Owner from the JWT.
            // Do not send OwnerID from the frontend for authorization.
            const response = await axios.get(
                "http://localhost:5000/api/reservations/owner",
                config
            );

            const data = response.data;

            if (Array.isArray(data?.reservations)) {
                setReservations(data.reservations);
            } else if (Array.isArray(data?.data)) {
                setReservations(data.data);
            } else if (Array.isArray(data)) {
                setReservations(data);
            } else {
                setReservations([]);
            }
        } catch (err) {
            console.error(
                "Error loading owner reservations:",
                err
            );

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/";
                return;
            }

            setError(
                err.response?.data?.message ||
                    "Failed to load reservations."
            );
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    // ==========================================
    // GET VALUE
    // ==========================================
    const getValue = (item, keys) => {
        for (const key of keys) {
            if (
                item?.[key] !== undefined &&
                item?.[key] !== null &&
                item?.[key] !== ""
            ) {
                return item[key];
            }
        }

        return "-";
    };

    // ==========================================
    // GET RESERVATION ID
    // ==========================================
    const getReservationId = (reservation) => {
        return getValue(reservation, [
            "ReservationID",
            "reservationID",
            "reservationId",
            "id",
        ]);
    };

    // ==========================================
    // GET STATUS
    // ==========================================
    const getStatus = (reservation) => {
        return String(
            getValue(reservation, [
                "ReservationStatus",
                "reservationStatus",
                "Status",
                "status",
            ])
        );
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================
    const formatDate = (date) => {
        if (!date || date === "-") {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString();
    };

    // ==========================================
    // STATUS CLASS
    // ==========================================
    const getStatusClass = (status) => {
        const value = String(status || "").toLowerCase();

        if (value.includes("confirm")) {
            return "confirmed";
        }

        if (value.includes("active")) {
            return "active";
        }

        if (value.includes("pending")) {
            return "pending";
        }

        if (
            value.includes("cancel") ||
            value.includes("reject") ||
            value.includes("expired")
        ) {
            return "cancelled";
        }

        return "default";
    };

    // ==========================================
    // STATUS ICON
    // ==========================================
    const getStatusIcon = (status) => {
        const value = String(status || "").toLowerCase();

        if (value.includes("confirm")) {
            return <CheckCircle size={15} />;
        }

        if (value.includes("active")) {
            return <CheckCircle size={15} />;
        }

        if (value.includes("pending")) {
            return <Clock size={15} />;
        }

        if (
            value.includes("cancel") ||
            value.includes("reject") ||
            value.includes("expired")
        ) {
            return <XCircle size={15} />;
        }

        return <AlertCircle size={15} />;
    };

    // ==========================================
    // UPDATE RESERVATION STATUS
    // ==========================================
    const updateStatus = async (reservation, newStatus) => {
        const reservationId =
            getReservationId(reservation);

        if (!reservationId || reservationId === "-") {
            setError("Reservation ID could not be determined.");
            return;
        }

        if (
            newStatus === "Canceled" &&
            !window.confirm(
                "Are you sure you want to cancel this reservation?"
            )
        ) {
            return;
        }

        try {
            setActionLoading(
                `${reservationId}-${newStatus}`
            );
            setError("");

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            await axios.patch(
                `http://localhost:5000/api/reservations/${reservationId}/status`,
                {
                    status: newStatus,
                },
                config
            );

            // Refresh so the Owner sees the latest
            // reservation status and handled-by user.
            await fetchReservations();
        } catch (err) {
            console.error(
                "Reservation status update error:",
                err
            );

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/";
                return;
            }

            setError(
                err.response?.data?.message ||
                    `Failed to ${newStatus.toLowerCase()} reservation.`
            );
        } finally {
            setActionLoading(null);
        }
    };

    // ==========================================
    // SEARCH
    // ==========================================
    const filteredReservations =
        reservations.filter((reservation) => {
            const searchableText = [
                getValue(reservation, [
                    "PropertyName",
                    "propertyName",
                    "Property",
                    "property",
                ]),
                getValue(reservation, [
                    "CustomerName",
                    "customerName",
                    "Customer",
                    "customer",
                ]),
                getValue(reservation, [
                    "HandledByName",
                    "handledByName",
                    "HandledBy",
                    "handledBy",
                ]),
                getStatus(reservation),
                getValue(reservation, [
                    "Remarks",
                    "remarks",
                ]),
                getValue(reservation, [
                    "ReservationDate",
                    "reservationDate",
                ]),
                getValue(reservation, [
                    "ExpiryDate",
                    "expiryDate",
                ]),
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(
                searchTerm.toLowerCase()
            );
        });

    // ==========================================
    // SUMMARY COUNTS
    // ==========================================
    const pendingCount = reservations.filter(
        (reservation) =>
            getStatus(reservation)
                .toLowerCase()
                .includes("pending")
    ).length;

    const confirmedCount = reservations.filter(
        (reservation) =>
            getStatus(reservation)
                .toLowerCase()
                .includes("confirm")
    ).length;

    const cancelledCount = reservations.filter(
        (reservation) => {
            const status =
                getStatus(reservation).toLowerCase();

            return (
                status.includes("cancel") ||
                status.includes("expired")
            );
        }
    ).length;

    // ==========================================
    // RENDER ACTIONS
    // ==========================================
    const renderActions = (reservation) => {
        const status = getStatus(reservation)
            .toLowerCase();

        const reservationId =
            getReservationId(reservation);

        const confirming =
            actionLoading ===
            `${reservationId}-Confirmed`;

        const cancelling =
            actionLoading ===
            `${reservationId}-Canceled`;

        // ------------------------------------------
        // PENDING
        // ------------------------------------------
        if (status.includes("pending")) {
            return (
                <div className="reservation-actions">
                    <button
                        type="button"
                        className="reservation-action-btn confirm-btn"
                        onClick={() =>
                            updateStatus(
                                reservation,
                                "Confirmed"
                            )
                        }
                        disabled={
                            confirming ||
                            cancelling ||
                            actionLoading !== null
                        }
                        title="Confirm reservation"
                    >
                        {confirming ? (
                            <RefreshCw
                                size={14}
                                className="spinning"
                            />
                        ) : (
                            <CheckCircle size={14} />
                        )}
                        Confirm
                    </button>

                    <button
                        type="button"
                        className="reservation-action-btn cancel-btn"
                        onClick={() =>
                            updateStatus(
                                reservation,
                                "Canceled"
                            )
                        }
                        disabled={
                            confirming ||
                            cancelling ||
                            actionLoading !== null
                        }
                        title="Cancel reservation"
                    >
                        {cancelling ? (
                            <RefreshCw
                                size={14}
                                className="spinning"
                            />
                        ) : (
                            <XCircle size={14} />
                        )}
                        Cancel
                    </button>
                </div>
            );
        }

        // ------------------------------------------
        // ACTIVE
        // ------------------------------------------
        if (status.includes("active")) {
            return (
                <div className="reservation-actions">
                    <button
                        type="button"
                        className="reservation-action-btn confirm-btn"
                        onClick={() =>
                            updateStatus(
                                reservation,
                                "Confirmed"
                            )
                        }
                        disabled={
                            confirming ||
                            cancelling ||
                            actionLoading !== null
                        }
                    >
                        {confirming ? (
                            <RefreshCw
                                size={14}
                                className="spinning"
                            />
                        ) : (
                            <CheckCircle size={14} />
                        )}
                        Confirm
                    </button>

                    <button
                        type="button"
                        className="reservation-action-btn cancel-btn"
                        onClick={() =>
                            updateStatus(
                                reservation,
                                "Canceled"
                            )
                        }
                        disabled={
                            confirming ||
                            cancelling ||
                            actionLoading !== null
                        }
                    >
                        {cancelling ? (
                            <RefreshCw
                                size={14}
                                className="spinning"
                            />
                        ) : (
                            <XCircle size={14} />
                        )}
                        Cancel
                    </button>
                </div>
            );
        }

        // ------------------------------------------
        // CONFIRMED
        // ------------------------------------------
        if (status.includes("confirm")) {
            return (
                <button
                    type="button"
                    className="reservation-action-btn cancel-btn"
                    onClick={() =>
                        updateStatus(
                            reservation,
                            "Canceled"
                        )
                    }
                    disabled={
                        cancelling ||
                        actionLoading !== null
                    }
                >
                    {cancelling ? (
                        <RefreshCw
                            size={14}
                            className="spinning"
                        />
                    ) : (
                        <XCircle size={14} />
                    )}
                    Cancel
                </button>
            );
        }

        // ------------------------------------------
        // CANCELED / EXPIRED
        // ------------------------------------------
        return (
            <span className="reservation-no-action">
                <Ban size={14} />
                No action
            </span>
        );
    };

    return (
        <div className="owner-reservations-page">

            {/* ======================================
                HEADER
            ====================================== */}
            <div className="owner-reservations-header">
                <div className="owner-reservations-title">
                    <CalendarDays size={28} />

                    <div>
                        <h1>Reservations</h1>

                        <p>
                            Manage and track reservations
                            for your properties.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="reservation-refresh-btn"
                    onClick={fetchReservations}
                    disabled={
                        loading ||
                        actionLoading !== null
                    }
                >
                    <RefreshCw
                        size={17}
                        className={
                            loading
                                ? "spinning"
                                : ""
                        }
                    />
                    Refresh
                </button>
            </div>

            {/* ======================================
                ERROR MESSAGE
            ====================================== */}
            {error && !loading && (
                <div className="reservation-inline-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError("")}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* ======================================
                SUMMARY CARDS
            ====================================== */}
            <div className="reservation-summary">

                <div className="reservation-summary-card">
                    <div className="summary-icon">
                        <CalendarDays size={21} />
                    </div>

                    <div>
                        <span>
                            Total Reservations
                        </span>

                        <strong>
                            {reservations.length}
                        </strong>
                    </div>
                </div>

                <div className="reservation-summary-card">
                    <div className="summary-icon pending-icon">
                        <Clock size={21} />
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>
                            {pendingCount}
                        </strong>
                    </div>
                </div>

                <div className="reservation-summary-card">
                    <div className="summary-icon confirmed-icon">
                        <CheckCircle size={21} />
                    </div>

                    <div>
                        <span>Confirmed</span>
                        <strong>
                            {confirmedCount}
                        </strong>
                    </div>
                </div>

                <div className="reservation-summary-card">
                    <div className="summary-icon cancelled-icon">
                        <XCircle size={21} />
                    </div>

                    <div>
                        <span>Cancelled</span>
                        <strong>
                            {cancelledCount}
                        </strong>
                    </div>
                </div>

            </div>

            {/* ======================================
                SEARCH
            ====================================== */}
            <div className="reservation-toolbar">
                <div className="reservation-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search property, customer, status..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(
                                e.target.value
                            )
                        }
                    />
                </div>
            </div>

            {/* ======================================
                LOADING
            ====================================== */}
            {loading ? (
                <div className="reservation-state">
                    <RefreshCw
                        className="spinning"
                        size={28}
                    />

                    <p>
                        Loading reservations...
                    </p>
                </div>
            ) : error &&
              reservations.length === 0 ? (
                <div className="reservation-state error-state">
                    <AlertCircle size={32} />

                    <h3>
                        Unable to load reservations
                    </h3>

                    <p>{error}</p>

                    <button
                        type="button"
                        className="reservation-retry-btn"
                        onClick={fetchReservations}
                    >
                        Try Again
                    </button>
                </div>
            ) : filteredReservations.length === 0 ? (
                <div className="reservation-state">
                    <CalendarDays size={40} />

                    <h3>
                        {searchTerm
                            ? "No matching reservations"
                            : "No reservations"}
                    </h3>

                    <p>
                        {searchTerm
                            ? "Try a different search term."
                            : "There are currently no reservations for your properties."}
                    </p>
                </div>
            ) : (
                /* ==================================
                   TABLE
                ================================== */
                <div className="reservation-table-container">
                    <table className="reservation-table">

                        <thead>
                            <tr>
                                <th>Property</th>
                                <th>Customer</th>
                                <th>Handled By</th>
                                <th>Reservation Date</th>
                                <th>Expiry Date</th>
                                <th>Status</th>
                                <th>Remarks</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredReservations.map(
                                (reservation, index) => {

                                    const property =
                                        getValue(
                                            reservation,
                                            [
                                                "PropertyName",
                                                "propertyName",
                                                "Property",
                                                "property",
                                            ]
                                        );

                                    const customer =
                                        getValue(
                                            reservation,
                                            [
                                                "CustomerName",
                                                "customerName",
                                                "Customer",
                                                "customer",
                                            ]
                                        );

                                    const handledBy =
                                        getValue(
                                            reservation,
                                            [
                                                "HandledByName",
                                                "handledByName",
                                                "HandledBy",
                                                "handledBy",
                                            ]
                                        );

                                    const reservationDate =
                                        getValue(
                                            reservation,
                                            [
                                                "ReservationDate",
                                                "reservationDate",
                                            ]
                                        );

                                    const expiryDate =
                                        getValue(
                                            reservation,
                                            [
                                                "ExpiryDate",
                                                "expiryDate",
                                            ]
                                        );

                                    const status =
                                        getStatus(
                                            reservation
                                        );

                                    const remarks =
                                        getValue(
                                            reservation,
                                            [
                                                "Remarks",
                                                "remarks",
                                            ]
                                        );

                                    const reservationId =
                                        getReservationId(
                                            reservation
                                        );

                                    return (
                                        <tr
                                            key={
                                                reservationId !==
                                                "-"
                                                    ? reservationId
                                                    : index
                                            }
                                        >
                                            <td>
                                                <div className="property-cell">
                                                    <div className="property-icon">
                                                        <CalendarDays
                                                            size={
                                                                16
                                                            }
                                                        />
                                                    </div>

                                                    <strong>
                                                        {
                                                            property
                                                        }
                                                    </strong>
                                                </div>
                                            </td>

                                            <td>
                                                {
                                                    customer
                                                }
                                            </td>

                                            <td>
                                                {
                                                    handledBy
                                                }
                                            </td>

                                            <td>
                                                {formatDate(
                                                    reservationDate
                                                )}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    expiryDate
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    className={`status-badge ${getStatusClass(
                                                        status
                                                    )}`}
                                                >
                                                    {getStatusIcon(
                                                        status
                                                    )}

                                                    {
                                                        status
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="reservation-remarks">
                                                    {
                                                        remarks
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {renderActions(
                                                    reservation
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }
                            )}
                        </tbody>

                    </table>
                </div>
            )}
        </div>
    );
}

export default OwnerReservations;
