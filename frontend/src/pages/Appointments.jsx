import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Eye,
    Loader2,
    RefreshCw,
    Search,
    X,
    XCircle
} from "lucide-react";

import "./Appointments.css";

const API_URL = "http://localhost:5000/api/appointments";

function Appointments() {
    const [appointments, setAppointments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [selectedAppointment, setSelectedAppointment] = useState(null);

    const [showViewModal, setShowViewModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);

    const [appointmentDate, setAppointmentDate] = useState("");
    const [appointmentTime, setAppointmentTime] = useState("");

    // =====================================================
    // AUTH CONFIG
    // =====================================================

    const getConfig = () => {
        const token = localStorage.getItem("token");

        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    };

    // =====================================================
    // LOAD APPOINTMENTS
    // =====================================================

    const loadAppointments = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                API_URL,
                getConfig()
            );

            console.log(
                "APPOINTMENTS API RESPONSE:",
                response.data
            );

            setAppointments(
                response.data.appointments || []
            );

        } catch (err) {
            console.error(
                "Load appointments error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load appointments."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    // =====================================================
    // CLEAR MESSAGES
    // =====================================================

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    // =====================================================
    // VIEW APPOINTMENT
    // =====================================================

    const handleView = (appointment) => {
        clearMessages();

        setSelectedAppointment(appointment);
        setShowViewModal(true);
    };

    // =====================================================
    // APPROVE APPOINTMENT
    // =====================================================

    const handleApprove = async (appointment) => {
        const confirmed = window.confirm(
            `Approve appointment #${appointment.AppointmentID}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);
            clearMessages();

            await axios.patch(
                `${API_URL}/${appointment.AppointmentID}/approve`,
                {},
                getConfig()
            );

            setSuccess(
                `Appointment #${appointment.AppointmentID} approved successfully.`
            );

            await loadAppointments();

        } catch (err) {
            console.error(
                "Approve appointment error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to approve appointment."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =====================================================
    // REJECT APPOINTMENT
    // =====================================================

    const handleReject = async (appointment) => {
        const confirmed = window.confirm(
            `Reject appointment #${appointment.AppointmentID}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);
            clearMessages();

            await axios.patch(
                `${API_URL}/${appointment.AppointmentID}/reject`,
                {},
                getConfig()
            );

            setSuccess(
                `Appointment #${appointment.AppointmentID} rejected successfully.`
            );

            await loadAppointments();

        } catch (err) {
            console.error(
                "Reject appointment error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to reject appointment."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =====================================================
    // OPEN RESCHEDULE
    // =====================================================

    const handleOpenReschedule = (appointment) => {
        clearMessages();

        setSelectedAppointment(appointment);

        setAppointmentDate(
            appointment.AppointmentDate
                ? String(appointment.AppointmentDate).substring(0, 10)
                : ""
        );

        setAppointmentTime(
            appointment.AppointmentTime
                ? String(appointment.AppointmentTime).substring(0, 5)
                : ""
        );

        setShowRescheduleModal(true);
    };

    // =====================================================
    // RESCHEDULE APPOINTMENT
    // =====================================================

    const handleReschedule = async (e) => {
        e.preventDefault();

        if (!selectedAppointment) {
            return;
        }

        if (!appointmentDate || !appointmentTime) {
            setError(
                "Appointment date and time are required."
            );
            return;
        }

        try {
            setActionLoading(true);
            clearMessages();

            await axios.patch(
                `${API_URL}/${selectedAppointment.AppointmentID}/reschedule`,
                {
                    AppointmentDate: appointmentDate,
                    AppointmentTime: appointmentTime
                },
                getConfig()
            );

            setSuccess(
                `Appointment #${selectedAppointment.AppointmentID} rescheduled successfully.`
            );

            closeModals();

            await loadAppointments();

        } catch (err) {
            console.error(
                "Reschedule appointment error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to reschedule appointment."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =====================================================
    // COMPLETE APPOINTMENT
    // =====================================================

    const handleComplete = async (appointment) => {
        const confirmed = window.confirm(
            `Mark appointment #${appointment.AppointmentID} as completed?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);
            clearMessages();

            await axios.patch(
                `${API_URL}/${appointment.AppointmentID}/complete`,
                {},
                getConfig()
            );

            setSuccess(
                `Appointment #${appointment.AppointmentID} completed successfully.`
            );

            await loadAppointments();

        } catch (err) {
            console.error(
                "Complete appointment error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to complete appointment."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =====================================================
    // CLOSE MODALS
    // =====================================================

    const closeModals = () => {
        setShowViewModal(false);
        setShowRescheduleModal(false);
        setSelectedAppointment(null);
        setAppointmentDate("");
        setAppointmentTime("");
    };

    // =====================================================
    // FILTER APPOINTMENTS
    // =====================================================

    const filteredAppointments = useMemo(() => {
        return appointments.filter((appointment) => {
            const search = searchTerm
                .toLowerCase()
                .trim();

            const matchesSearch =
                !search ||
                String(
                    appointment.AppointmentID
                ).includes(search) ||
                appointment.CustomerName
                    ?.toLowerCase()
                    .includes(search) ||
                appointment.PropertyName
                    ?.toLowerCase()
                    .includes(search) ||
                appointment.HandledByName
                    ?.toLowerCase()
                    .includes(search);

            const matchesStatus =
                statusFilter === "All" ||
                appointment.Status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [
        appointments,
        searchTerm,
        statusFilter
    ]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const stats = useMemo(() => {
        return {
            total: appointments.length,

            pending: appointments.filter(
                (a) => a.Status === "Pending"
            ).length,

            approved: appointments.filter(
                (a) => a.Status === "Approved"
            ).length,

            completed: appointments.filter(
                (a) => a.Status === "Completed"
            ).length,

            rejected: appointments.filter(
                (a) => a.Status === "Rejected"
            ).length
        };
    }, [appointments]);

    // =====================================================
    // STATUS BADGE
    // =====================================================

    const getStatusBadge = (status) => {
        switch (status) {
            case "Pending":
                return (
                    <span className="appointment-status pending">
                        <Clock3 size={14} />
                        Pending
                    </span>
                );

            case "Approved":
                return (
                    <span className="appointment-status approved">
                        <CheckCircle2 size={14} />
                        Approved
                    </span>
                );

            case "Rejected":
                return (
                    <span className="appointment-status rejected">
                        <XCircle size={14} />
                        Rejected
                    </span>
                );

            case "Completed":
                return (
                    <span className="appointment-status completed">
                        <CheckCircle2 size={14} />
                        Completed
                    </span>
                );

            default:
                return (
                    <span className="appointment-status">
                        {status}
                    </span>
                );
        }
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const dateString = String(date).substring(
            0,
            10
        );

        const parsedDate = new Date(
            `${dateString}T00:00:00`
        );

        if (Number.isNaN(parsedDate.getTime())) {
            return dateString;
        }

        return parsedDate.toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    };

    // =====================================================
    // FORMAT TIME
    // =====================================================

    const formatTime = (time) => {
        if (!time) {
            return "-";
        }

        const value = String(time).substring(
            0,
            5
        );

        const [hours, minutes] = value.split(":");

        const date = new Date();

        date.setHours(
            Number(hours),
            Number(minutes),
            0,
            0
        );

        return date.toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="appointments-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="appointments-header">

                <div>
                    <div className="appointments-title">
                        <CalendarDays size={28} />

                        <div>
                            <h1>Appointments</h1>

                            <p>
                                Manage customer property
                                appointments
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    className="appointment-refresh"
                    onClick={loadAppointments}
                    disabled={loading}
                >
                    <RefreshCw
                        size={17}
                        className={
                            loading
                                ? "spin"
                                : ""
                        }
                    />

                    Refresh
                </button>

            </div>

            {/* =================================================
                MESSAGES
            ================================================= */}

            {error && (
                <div className="appointment-alert error">
                    <AlertCircle size={18} />

                    <span>{error}</span>

                    <button
                        onClick={() =>
                            setError("")
                        }
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {success && (
                <div className="appointment-alert success">
                    <CheckCircle2 size={18} />

                    <span>{success}</span>

                    <button
                        onClick={() =>
                            setSuccess("")
                        }
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="appointment-stats">

                <div className="appointment-stat">
                    <div className="stat-icon">
                        <CalendarDays size={20} />
                    </div>

                    <div>
                        <span>Total</span>
                        <strong>{stats.total}</strong>
                    </div>
                </div>

                <div className="appointment-stat">
                    <div className="stat-icon">
                        <Clock3 size={20} />
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>{stats.pending}</strong>
                    </div>
                </div>

                <div className="appointment-stat">
                    <div className="stat-icon">
                        <CheckCircle2 size={20} />
                    </div>

                    <div>
                        <span>Approved</span>
                        <strong>{stats.approved}</strong>
                    </div>
                </div>

                <div className="appointment-stat">
                    <div className="stat-icon">
                        <CheckCircle2 size={20} />
                    </div>

                    <div>
                        <span>Completed</span>
                        <strong>{stats.completed}</strong>
                    </div>
                </div>

                <div className="appointment-stat">
                    <div className="stat-icon">
                        <XCircle size={20} />
                    </div>

                    <div>
                        <span>Rejected</span>
                        <strong>{stats.rejected}</strong>
                    </div>
                </div>

            </div>

            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="appointments-toolbar">

                <div className="appointment-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search customer, property or ID..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(
                                e.target.value
                            )
                        }
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(
                            e.target.value
                        )
                    }
                    className="appointment-filter"
                >
                    <option value="All">
                        All Statuses
                    </option>

                    <option value="Pending">
                        Pending
                    </option>

                    <option value="Approved">
                        Approved
                    </option>

                    <option value="Completed">
                        Completed
                    </option>

                    <option value="Rejected">
                        Rejected
                    </option>
                </select>

            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="appointments-card">

                {loading ? (
                    <div className="appointments-loading">
                        <Loader2
                            size={30}
                            className="spin"
                        />

                        <p>
                            Loading appointments...
                        </p>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="appointments-empty">
                        <CalendarDays size={42} />

                        <h3>
                            No appointments found
                        </h3>

                        <p>
                            There are no appointments
                            matching your search.
                        </p>
                    </div>
                ) : (
                    <div className="appointments-table-wrapper">

                        <table className="appointments-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Customer</th>
                                    <th>Property</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Handled By</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredAppointments.map(
                                    (appointment) => (
                                        <tr
                                            key={
                                                appointment.AppointmentID
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    #
                                                    {
                                                        appointment.AppointmentID
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <div className="customer-cell">
                                                    <div className="customer-avatar">
                                                        {
                                                            appointment.CustomerName
                                                                ?.charAt(
                                                                    0
                                                                )
                                                                ?.toUpperCase()
                                                        }
                                                    </div>

                                                    <span>
                                                        {
                                                            appointment.CustomerName
                                                        }
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                {
                                                    appointment.PropertyName
                                                }
                                            </td>

                                            <td>
                                                {formatDate(
                                                    appointment.AppointmentDate
                                                )}
                                            </td>

                                            <td>
                                                {formatTime(
                                                    appointment.AppointmentTime
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    appointment.HandledByName
                                                }
                                            </td>

                                            <td>
                                                {getStatusBadge(
                                                    appointment.Status
                                                )}
                                            </td>

                                            <td>

                                                <div className="appointment-actions">

                                                    {/* VIEW */}
                                                    <button
                                                        type="button"
                                                        className="appointment-action view"
                                                        title="View appointment"
                                                        onClick={() =>
                                                            handleView(
                                                                appointment
                                                            )
                                                        }
                                                    >
                                                        <Eye
                                                            size={16}
                                                        />

                                                        <span>
                                                            View
                                                        </span>
                                                    </button>

                                                    {/* PENDING ACTIONS */}
                                                    {appointment.Status ===
                                                        "Pending" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="appointment-action approve"
                                                                    title="Approve appointment"
                                                                    onClick={() =>
                                                                        handleApprove(
                                                                            appointment
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        actionLoading
                                                                    }
                                                                >
                                                                    <CheckCircle2
                                                                        size={
                                                                            16
                                                                        }
                                                                    />

                                                                    <span>
                                                                        Approve
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="appointment-action reject"
                                                                    title="Reject appointment"
                                                                    onClick={() =>
                                                                        handleReject(
                                                                            appointment
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        actionLoading
                                                                    }
                                                                >
                                                                    <XCircle
                                                                        size={
                                                                            16
                                                                        }
                                                                    />

                                                                    <span>
                                                                        Reject
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="appointment-action reschedule"
                                                                    title="Reschedule appointment"
                                                                    onClick={() =>
                                                                        handleOpenReschedule(
                                                                            appointment
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        actionLoading
                                                                    }
                                                                >
                                                                    <Clock3
                                                                        size={
                                                                            16
                                                                        }
                                                                    />

                                                                    <span>
                                                                        Reschedule
                                                                    </span>
                                                                </button>
                                                            </>
                                                        )}

                                                    {/* APPROVED ACTIONS */}
                                                    {appointment.Status ===
                                                        "Approved" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="appointment-action reschedule"
                                                                    title="Reschedule appointment"
                                                                    onClick={() =>
                                                                        handleOpenReschedule(
                                                                            appointment
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        actionLoading
                                                                    }
                                                                >
                                                                    <Clock3
                                                                        size={
                                                                            16
                                                                        }
                                                                    />

                                                                    <span>
                                                                        Reschedule
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="appointment-action complete"
                                                                    title="Complete appointment"
                                                                    onClick={() =>
                                                                        handleComplete(
                                                                            appointment
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        actionLoading
                                                                    }
                                                                >
                                                                    <CheckCircle2
                                                                        size={
                                                                            16
                                                                        }
                                                                    />

                                                                    <span>
                                                                        Complete
                                                                    </span>
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

            {/* =================================================
                VIEW MODAL
            ================================================= */}

            {showViewModal &&
                selectedAppointment && (
                    <div className="appointment-overlay">

                        <div className="appointment-modal">

                            <div className="appointment-modal-header">

                                <div>
                                    <h2>
                                        Appointment Details
                                    </h2>

                                    <p>
                                        Appointment #
                                        {
                                            selectedAppointment.AppointmentID
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={
                                        closeModals
                                    }
                                >
                                    <X size={20} />
                                </button>

                            </div>

                            <div className="appointment-modal-body">

                                <div className="detail-grid">

                                    <div className="detail-item">
                                        <span>
                                            Customer
                                        </span>

                                        <strong>
                                            {
                                                selectedAppointment.CustomerName
                                            }
                                        </strong>
                                    </div>

                                    <div className="detail-item">
                                        <span>
                                            Property
                                        </span>

                                        <strong>
                                            {
                                                selectedAppointment.PropertyName
                                            }
                                        </strong>
                                    </div>

                                    <div className="detail-item">
                                        <span>
                                            Appointment Date
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedAppointment.AppointmentDate
                                            )}
                                        </strong>
                                    </div>

                                    <div className="detail-item">
                                        <span>
                                            Appointment Time
                                        </span>

                                        <strong>
                                            {formatTime(
                                                selectedAppointment.AppointmentTime
                                            )}
                                        </strong>
                                    </div>

                                    <div className="detail-item">
                                        <span>
                                            Handled By
                                        </span>

                                        <strong>
                                            {
                                                selectedAppointment.HandledByName
                                            }
                                        </strong>
                                    </div>

                                    <div className="detail-item">
                                        <span>
                                            Status
                                        </span>

                                        <div>
                                            {getStatusBadge(
                                                selectedAppointment.Status
                                            )}
                                        </div>
                                    </div>

                                </div>

                            </div>

                            <div className="appointment-modal-footer">

                                <button
                                    type="button"
                                    className="modal-button secondary"
                                    onClick={
                                        closeModals
                                    }
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>
                )}

            {/* =================================================
                RESCHEDULE MODAL
            ================================================= */}

            {showRescheduleModal &&
                selectedAppointment && (
                    <div className="appointment-overlay">

                        <div className="appointment-modal small">

                            <div className="appointment-modal-header">

                                <div>
                                    <h2>
                                        Reschedule Appointment
                                    </h2>

                                    <p>
                                        Appointment #
                                        {
                                            selectedAppointment.AppointmentID
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={
                                        closeModals
                                    }
                                >
                                    <X size={20} />
                                </button>

                            </div>

                            <form
                                onSubmit={
                                    handleReschedule
                                }
                            >

                                <div className="appointment-modal-body">

                                    <div className="appointment-field">

                                        <label>
                                            Appointment Date
                                        </label>

                                        <input
                                            type="date"
                                            value={
                                                appointmentDate
                                            }
                                            onChange={(e) =>
                                                setAppointmentDate(
                                                    e.target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                actionLoading
                                            }
                                            required
                                        />

                                    </div>

                                    <div className="appointment-field">

                                        <label>
                                            Appointment Time
                                        </label>

                                        <input
                                            type="time"
                                            value={
                                                appointmentTime
                                            }
                                            onChange={(e) =>
                                                setAppointmentTime(
                                                    e.target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                actionLoading
                                            }
                                            required
                                        />

                                    </div>

                                </div>

                                <div className="appointment-modal-footer">

                                    <button
                                        type="button"
                                        className="modal-button secondary"
                                        onClick={
                                            closeModals
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="modal-button primary"
                                        disabled={
                                            actionLoading
                                        }
                                    >
                                        {actionLoading ? (
                                            <>
                                                <Loader2
                                                    size={
                                                        16
                                                    }
                                                    className="spin"
                                                />

                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
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

export default Appointments;