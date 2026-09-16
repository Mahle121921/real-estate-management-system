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
    Check,
    Ban,
    Edit3,
} from "lucide-react";

import "./OwnerAppointments.css";

function OwnerAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [actionLoading, setActionLoading] = useState(null);

    const [showRescheduleModal, setShowRescheduleModal] =
        useState(false);

    const [selectedAppointment, setSelectedAppointment] =
        useState(null);

    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");

    const token = localStorage.getItem("token");

    const getConfig = () => ({
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const fetchAppointments = useCallback(async () => {
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

            const config = getConfig();

            // Get the logged-in owner's real OwnerID
            const ownerResponse = await axios.get(
                "http://localhost:5000/api/owners/me",
                config
            );

            const owner = ownerResponse.data.owner;

            if (!owner?.OwnerID) {
                setError("Owner profile was not found.");
                setAppointments([]);
                return;
            }

            const currentOwnerId = owner.OwnerID;

            const response = await axios.get(
                `http://localhost:5000/api/owners/${currentOwnerId}/appointments`,
                config
            );

            const data = response.data;

            if (Array.isArray(data?.appointments)) {
                setAppointments(data.appointments);
            } else if (Array.isArray(data?.data)) {
                setAppointments(data.data);
            } else if (Array.isArray(data)) {
                setAppointments(data);
            } else {
                setAppointments([]);
            }
        } catch (err) {
            console.error("Error loading appointments:", err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/";
                return;
            }

            setError(
                err.response?.data?.message ||
                    "Failed to load appointments."
            );
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

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

    const getAppointmentId = (appointment) =>
        appointment?.AppointmentID ||
        appointment?.appointmentID ||
        appointment?.appointmentId ||
        appointment?.id;

    const getStatus = (appointment) =>
        String(
            getValue(appointment, [
                "Status",
                "status",
                "AppointmentStatus",
                "appointmentStatus",
            ])
        );

    const formatDate = (date) => {
        if (!date || date === "-") return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString();
    };

    const formatTime = (time) => {
        if (!time || time === "-") return "-";

        const value = String(time);

        // Handles HH:mm:ss and HH:mm
        if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
            const [hour, minute] = value
                .split(":")
                .map(Number);

            const date = new Date();
            date.setHours(hour, minute, 0, 0);

            return date.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
            });
        }

        return value;
    };

    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    const getStatusClass = (status) => {
        const value = String(status || "").toLowerCase();

        if (value.includes("complete")) {
            return "completed";
        }

        if (value.includes("approve")) {
            return "approved";
        }

        if (value.includes("pending")) {
            return "pending";
        }

        if (
            value.includes("reject") ||
            value.includes("cancel")
        ) {
            return "cancelled";
        }

        return "default";
    };

    const getStatusIcon = (status) => {
        const value = String(status || "").toLowerCase();

        if (value.includes("complete")) {
            return <CheckCircle size={15} />;
        }

        if (value.includes("approve")) {
            return <CheckCircle size={15} />;
        }

        if (value.includes("pending")) {
            return <Clock size={15} />;
        }

        if (
            value.includes("cancel") ||
            value.includes("reject")
        ) {
            return <XCircle size={15} />;
        }

        return <AlertCircle size={15} />;
    };

    // --------------------------------------------------
    // SEARCH
    // --------------------------------------------------

    const filteredAppointments = appointments.filter(
        (appointment) => {
            const searchableText = [
                getValue(appointment, [
                    "PropertyName",
                    "propertyName",
                    "Property",
                    "property",
                ]),
                getValue(appointment, [
                    "CustomerName",
                    "customerName",
                    "Customer",
                    "customer",
                ]),
                getValue(appointment, [
                    "HandledByName",
                    "handledByName",
                    "HandledBy",
                    "handledBy",
                ]),
                getValue(appointment, [
                    "AppointmentDate",
                    "appointmentDate",
                ]),
                getValue(appointment, [
                    "AppointmentTime",
                    "appointmentTime",
                ]),
                getStatus(appointment),
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(
                searchTerm.trim().toLowerCase()
            );
        }
    );

    // --------------------------------------------------
    // SUMMARY COUNTS
    // --------------------------------------------------

    const pendingCount = appointments.filter(
        (appointment) => {
            const status = getStatus(appointment)
                .toLowerCase();

            return status.includes("pending");
        }
    ).length;

    const approvedCount = appointments.filter(
        (appointment) => {
            const status = getStatus(appointment)
                .toLowerCase();

            return status.includes("approve");
        }
    ).length;

    const completedCount = appointments.filter(
        (appointment) => {
            const status = getStatus(appointment)
                .toLowerCase();

            return status.includes("complete");
        }
    ).length;

    const rejectedCount = appointments.filter(
        (appointment) => {
            const status = getStatus(appointment)
                .toLowerCase();

            return (
                status.includes("reject") ||
                status.includes("cancel")
            );
        }
    ).length;

    // --------------------------------------------------
    // APPROVE
    // --------------------------------------------------

    const handleApprove = async (appointment) => {
        const appointmentId =
            getAppointmentId(appointment);

        if (!appointmentId) {
            alert("Appointment ID was not found.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to approve this appointment?"
        );

        if (!confirmed) return;

        try {
            setActionLoading(
                `approve-${appointmentId}`
            );

            await axios.patch(
                `http://localhost:5000/api/appointments/${appointmentId}/approve`,
                {},
                getConfig()
            );

            await fetchAppointments();
        } catch (err) {
            console.error(
                "Error approving appointment:",
                err
            );

            alert(
                err.response?.data?.message ||
                    "Failed to approve appointment."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // --------------------------------------------------
    // REJECT
    // --------------------------------------------------

    const handleReject = async (appointment) => {
        const appointmentId =
            getAppointmentId(appointment);

        if (!appointmentId) {
            alert("Appointment ID was not found.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to reject this appointment?"
        );

        if (!confirmed) return;

        try {
            setActionLoading(
                `reject-${appointmentId}`
            );

            await axios.patch(
                `http://localhost:5000/api/appointments/${appointmentId}/reject`,
                {},
                getConfig()
            );

            await fetchAppointments();
        } catch (err) {
            console.error(
                "Error rejecting appointment:",
                err
            );

            alert(
                err.response?.data?.message ||
                    "Failed to reject appointment."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // --------------------------------------------------
    // COMPLETE
    // --------------------------------------------------

    const handleComplete = async (appointment) => {
        const appointmentId =
            getAppointmentId(appointment);

        if (!appointmentId) {
            alert("Appointment ID was not found.");
            return;
        }

        const confirmed = window.confirm(
            "Mark this appointment as completed?"
        );

        if (!confirmed) return;

        try {
            setActionLoading(
                `complete-${appointmentId}`
            );

            await axios.patch(
                `http://localhost:5000/api/appointments/${appointmentId}/complete`,
                {},
                getConfig()
            );

            await fetchAppointments();
        } catch (err) {
            console.error(
                "Error completing appointment:",
                err
            );

            alert(
                err.response?.data?.message ||
                    "Failed to complete appointment."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // --------------------------------------------------
    // OPEN RESCHEDULE MODAL
    // --------------------------------------------------

    const openRescheduleModal = (appointment) => {
        const date = getValue(appointment, [
            "AppointmentDate",
            "appointmentDate",
        ]);

        const time = getValue(appointment, [
            "AppointmentTime",
            "appointmentTime",
        ]);

        let formattedDate = "";

        if (date && date !== "-") {
            const parsedDate = new Date(date);

            if (!Number.isNaN(parsedDate.getTime())) {
                const year = parsedDate.getFullYear();
                const month = String(
                    parsedDate.getMonth() + 1
                ).padStart(2, "0");
                const day = String(
                    parsedDate.getDate()
                ).padStart(2, "0");

                formattedDate = `${year}-${month}-${day}`;
            }
        }

        let formattedTime = "";

        if (time && time !== "-") {
            formattedTime = String(time).substring(
                0,
                5
            );
        }

        setSelectedAppointment(appointment);
        setRescheduleDate(formattedDate);
        setRescheduleTime(formattedTime);
        setShowRescheduleModal(true);
    };

    // --------------------------------------------------
    // RESCHEDULE
    // --------------------------------------------------

    const handleReschedule = async (e) => {
        e.preventDefault();

        if (!selectedAppointment) return;

        const appointmentId =
            getAppointmentId(selectedAppointment);

        if (!appointmentId) {
            alert("Appointment ID was not found.");
            return;
        }

        if (!rescheduleDate || !rescheduleTime) {
            alert(
                "Please select both a date and time."
            );
            return;
        }

        try {
            setActionLoading(
                `reschedule-${appointmentId}`
            );

            await axios.patch(
                `http://localhost:5000/api/appointments/${appointmentId}/reschedule`,
                {
                    AppointmentDate: rescheduleDate,
                    AppointmentTime: rescheduleTime,
                },
                getConfig()
            );

            setShowRescheduleModal(false);
            setSelectedAppointment(null);
            setRescheduleDate("");
            setRescheduleTime("");

            await fetchAppointments();
        } catch (err) {
            console.error(
                "Error rescheduling appointment:",
                err
            );

            alert(
                err.response?.data?.message ||
                    "Failed to reschedule appointment."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // --------------------------------------------------
    // ACTION BUTTONS
    // --------------------------------------------------

    const renderActions = (appointment) => {
        const status = getStatus(appointment)
            .toLowerCase();

        const appointmentId =
            getAppointmentId(appointment);

        const isLoading =
            actionLoading !== null &&
            actionLoading.endsWith(
                `-${appointmentId}`
            );

        if (status.includes("pending")) {
            return (
                <div className="appointment-actions">

                    <button
                        type="button"
                        className="appointment-action-btn approve-btn"
                        onClick={() =>
                            handleApprove(appointment)
                        }
                        disabled={isLoading}
                        title="Approve appointment"
                    >
                        {actionLoading ===
                        `approve-${appointmentId}` ? (
                            <RefreshCw
                                size={14}
                                className="spinning"
                            />
                        ) : (
                            <Check size={14} />
                        )}
                        Approve
                    </button>

                    <button
                        type="button"
                        className="appointment-action-btn reject-btn"
                        onClick={() =>
                            handleReject(appointment)
                        }
                        disabled={isLoading}
                        title="Reject appointment"
                    >
                        {actionLoading ===
                        `reject-${appointmentId}` ? (
                            <RefreshCw
                                size={14}
                                className="spinning"
                            />
                        ) : (
                            <Ban size={14} />
                        )}
                        Reject
                    </button>

                    <button
                        type="button"
                        className="appointment-action-btn reschedule-btn"
                        onClick={() =>
                            openRescheduleModal(
                                appointment
                            )
                        }
                        disabled={isLoading}
                        title="Reschedule appointment"
                    >
                        <Edit3 size={14} />
                        Reschedule
                    </button>

                </div>
            );
        }

        if (status.includes("approve")) {
            return (
                <div className="appointment-actions">

                    <button
                        type="button"
                        className="appointment-action-btn complete-btn"
                        onClick={() =>
                            handleComplete(
                                appointment
                            )
                        }
                        disabled={isLoading}
                        title="Complete appointment"
                    >
                        {actionLoading ===
                        `complete-${appointmentId}` ? (
                            <RefreshCw
                                size={14}
                                className="spinning"
                            />
                        ) : (
                            <CheckCircle size={14} />
                        )}
                        Complete
                    </button>

                    <button
                        type="button"
                        className="appointment-action-btn reschedule-btn"
                        onClick={() =>
                            openRescheduleModal(
                                appointment
                            )
                        }
                        disabled={isLoading}
                        title="Reschedule appointment"
                    >
                        <Edit3 size={14} />
                        Reschedule
                    </button>

                    <button
                        type="button"
                        className="appointment-action-btn reject-btn"
                        onClick={() =>
                            handleReject(appointment)
                        }
                        disabled={isLoading}
                        title="Reject appointment"
                    >
                        {actionLoading ===
                        `reject-${appointmentId}` ? (
                            <RefreshCw
                                size={14}
                                className="spinning"
                            />
                        ) : (
                            <Ban size={14} />
                        )}
                        Reject
                    </button>

                </div>
            );
        }

        return (
            <span className="appointment-no-action">
                —
            </span>
        );
    };

    return (
        <div className="owner-appointments-page">

            {/* HEADER */}
            <div className="owner-appointments-header">

                <div className="owner-appointments-title">
                    <CalendarDays size={28} />

                    <div>
                        <h1>Appointments</h1>

                        <p>
                            Manage and track appointments
                            for your properties.
                        </p>
                    </div>
                </div>

                <button
                    className="appointments-refresh-btn"
                    onClick={fetchAppointments}
                    disabled={loading}
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

            {/* SUMMARY */}
            <div className="appointments-summary">

                <div className="appointments-summary-card">
                    <div className="summary-icon">
                        <CalendarDays size={21} />
                    </div>

                    <div>
                        <span>
                            Total Appointments
                        </span>

                        <strong>
                            {appointments.length}
                        </strong>
                    </div>
                </div>

                <div className="appointments-summary-card">
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

                <div className="appointments-summary-card">
                    <div className="summary-icon approved-icon">
                        <CheckCircle size={21} />
                    </div>

                    <div>
                        <span>Approved</span>

                        <strong>
                            {approvedCount}
                        </strong>
                    </div>
                </div>

                <div className="appointments-summary-card">
                    <div className="summary-icon completed-icon">
                        <CheckCircle size={21} />
                    </div>

                    <div>
                        <span>Completed</span>

                        <strong>
                            {completedCount}
                        </strong>
                    </div>
                </div>

                <div className="appointments-summary-card">
                    <div className="summary-icon cancelled-icon">
                        <XCircle size={21} />
                    </div>

                    <div>
                        <span>Rejected</span>

                        <strong>
                            {rejectedCount}
                        </strong>
                    </div>
                </div>

            </div>

            {/* SEARCH */}
            <div className="appointments-toolbar">

                <div className="appointments-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search appointments..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(
                                e.target.value
                            )
                        }
                    />
                </div>

            </div>

            {/* CONTENT */}
            {loading ? (
                <div className="appointments-state">

                    <RefreshCw
                        className="spinning"
                        size={28}
                    />

                    <p>
                        Loading appointments...
                    </p>

                </div>
            ) : error ? (
                <div className="appointments-state error-state">

                    <AlertCircle size={32} />

                    <h3>
                        Unable to load appointments
                    </h3>

                    <p>{error}</p>

                    <button
                        className="appointments-retry-btn"
                        onClick={fetchAppointments}
                    >
                        Try Again
                    </button>

                </div>
            ) : filteredAppointments.length ===
              0 ? (
                <div className="appointments-state">

                    <CalendarDays size={40} />

                    <h3>
                        {searchTerm
                            ? "No matching appointments"
                            : "No appointments"}
                    </h3>

                    <p>
                        {searchTerm
                            ? "Try a different search term."
                            : "There are currently no appointments for your properties."}
                    </p>

                </div>
            ) : (
                <div className="appointments-table-container">

                    <table className="appointments-table">

                        <thead>
                            <tr>
                                <th>Property</th>
                                <th>Customer</th>
                                <th>Handled By</th>
                                <th>Appointment Date</th>
                                <th>Appointment Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {filteredAppointments.map(
                                (appointment, index) => {

                                    const property =
                                        getValue(
                                            appointment,
                                            [
                                                "PropertyName",
                                                "propertyName",
                                                "Property",
                                                "property",
                                            ]
                                        );

                                    const customer =
                                        getValue(
                                            appointment,
                                            [
                                                "CustomerName",
                                                "customerName",
                                                "Customer",
                                                "customer",
                                            ]
                                        );

                                    const handledBy =
                                        getValue(
                                            appointment,
                                            [
                                                "HandledByName",
                                                "handledByName",
                                                "HandledBy",
                                                "handledBy",
                                            ]
                                        );

                                    const appointmentDate =
                                        getValue(
                                            appointment,
                                            [
                                                "AppointmentDate",
                                                "appointmentDate",
                                            ]
                                        );

                                    const appointmentTime =
                                        getValue(
                                            appointment,
                                            [
                                                "AppointmentTime",
                                                "appointmentTime",
                                            ]
                                        );

                                    const status =
                                        getStatus(
                                            appointment
                                        );

                                    return (
                                        <tr
                                            key={
                                                getAppointmentId(
                                                    appointment
                                                ) ||
                                                index
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
                                                {customer}
                                            </td>

                                            <td>
                                                {handledBy}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    appointmentDate
                                                )}
                                            </td>

                                            <td>
                                                {formatTime(
                                                    appointmentTime
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    className={`appointment-status-badge ${getStatusClass(
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
                                                {renderActions(
                                                    appointment
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

            {/* RESCHEDULE MODAL */}
            {showRescheduleModal &&
                selectedAppointment && (
                    <div
                        className="appointment-modal-overlay"
                        onClick={(e) => {
                            if (
                                e.target ===
                                e.currentTarget
                            ) {
                                setShowRescheduleModal(
                                    false
                                );
                            }
                        }}
                    >

                        <div className="appointment-modal">

                            <div className="appointment-modal-header">

                                <div>
                                    <h2>
                                        Reschedule
                                        Appointment
                                    </h2>

                                    <p>
                                        Choose a new date
                                        and time.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="appointment-modal-close"
                                    onClick={() =>
                                        setShowRescheduleModal(
                                            false
                                        )
                                    }
                                >
                                    ×
                                </button>

                            </div>

                            <form
                                onSubmit={
                                    handleReschedule
                                }
                            >

                                <div className="appointment-form-group">

                                    <label>
                                        Appointment Date
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            rescheduleDate
                                        }
                                        onChange={(e) =>
                                            setRescheduleDate(
                                                e.target
                                                    .value
                                            )
                                        }
                                        required
                                    />

                                </div>

                                <div className="appointment-form-group">

                                    <label>
                                        Appointment Time
                                    </label>

                                    <input
                                        type="time"
                                        value={
                                            rescheduleTime
                                        }
                                        onChange={(e) =>
                                            setRescheduleTime(
                                                e.target
                                                    .value
                                            )
                                        }
                                        required
                                    />

                                </div>

                                <div className="appointment-modal-actions">

                                    <button
                                        type="button"
                                        className="appointment-modal-cancel"
                                        onClick={() =>
                                            setShowRescheduleModal(
                                                false
                                            )
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="appointment-modal-save"
                                        disabled={
                                            actionLoading !==
                                            null
                                        }
                                    >
                                        {actionLoading ? (
                                            <>
                                                <RefreshCw
                                                    size={
                                                        15
                                                    }
                                                    className="spinning"
                                                />

                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Check
                                                    size={
                                                        15
                                                    }
                                                />

                                                Save Changes
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

export default OwnerAppointments;