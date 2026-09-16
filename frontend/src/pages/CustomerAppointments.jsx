import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
    CalendarDays,
    Clock,
    MapPin,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Plus,
    ArrowLeft,
    User,
    Loader2,
} from "lucide-react";

import "./CustomerAppointments.css";

const API_BASE = "http://localhost:5000/api";

function CustomerAppointments() {
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_BASE}/appointments/my`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setAppointments(response.data.appointments || []);
        } catch (err) {
            console.error("Get customer appointments error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load your appointments."
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (time) => {
        if (!time) return "-";

        const parts = String(time).split(":");

        if (parts.length < 2) {
            return time;
        }

        const hour = parseInt(parts[0], 10);
        const minute = parts[1];

        const suffix = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;

        return `${displayHour}:${minute} ${suffix}`;
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Pending":
                return "status-pending";

            case "Approved":
                return "status-approved";

            case "Completed":
                return "status-completed";

            case "Rejected":
                return "status-rejected";

            default:
                return "status-default";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Pending":
                return <AlertCircle size={16} />;

            case "Approved":
                return <CheckCircle size={16} />;

            case "Completed":
                return <CheckCircle size={16} />;

            case "Rejected":
                return <XCircle size={16} />;

            default:
                return <CalendarDays size={16} />;
        }
    };

    const pendingCount = appointments.filter(
        (item) => item.Status === "Pending"
    ).length;

    const approvedCount = appointments.filter(
        (item) => item.Status === "Approved"
    ).length;

    const completedCount = appointments.filter(
        (item) => item.Status === "Completed"
    ).length;

    const rejectedCount = appointments.filter(
        (item) => item.Status === "Rejected"
    ).length;

    if (loading) {
        return (
            <div className="customer-appointments-page">
                <div className="appointments-loading">
                    <Loader2 className="loading-spinner" size={38} />
                    <p>Loading your appointments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-appointments-page">

            {/* ================= HEADER ================= */}
            <div className="appointments-header">

                <div className="header-left">

                    <button
                        className="back-button"
                        onClick={() => navigate("/customer-dashboard")}
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div>
                        <h1>My Appointments</h1>
                        <p>
                            View and manage your property appointments
                        </p>
                    </div>

                </div>

                <button
                    className="schedule-button"
                    onClick={() =>
                        navigate("/customer/properties")
                    }
                >
                    <Plus size={18} />
                    Schedule Appointment
                </button>

            </div>

            {/* ================= ERROR ================= */}
            {error && (
                <div className="appointment-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>

                    <button onClick={fetchAppointments}>
                        Try Again
                    </button>
                </div>
            )}

            {/* ================= STATISTICS ================= */}
            <div className="appointment-stats">

                <div className="appointment-stat-card">
                    <div className="stat-icon total-icon">
                        <CalendarDays size={22} />
                    </div>

                    <div>
                        <span>Total</span>
                        <strong>{appointments.length}</strong>
                    </div>
                </div>

                <div className="appointment-stat-card">
                    <div className="stat-icon pending-icon">
                        <AlertCircle size={22} />
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>{pendingCount}</strong>
                    </div>
                </div>

                <div className="appointment-stat-card">
                    <div className="stat-icon approved-icon">
                        <CheckCircle size={22} />
                    </div>

                    <div>
                        <span>Approved</span>
                        <strong>{approvedCount}</strong>
                    </div>
                </div>

                <div className="appointment-stat-card">
                    <div className="stat-icon completed-icon">
                        <CheckCircle size={22} />
                    </div>

                    <div>
                        <span>Completed</span>
                        <strong>{completedCount}</strong>
                    </div>
                </div>

                <div className="appointment-stat-card">
                    <div className="stat-icon rejected-icon">
                        <XCircle size={22} />
                    </div>

                    <div>
                        <span>Rejected</span>
                        <strong>{rejectedCount}</strong>
                    </div>
                </div>

            </div>

            {/* ================= CONTENT ================= */}
            <div className="appointments-content">

                <div className="section-heading">
                    <div>
                        <h2>Appointment History</h2>
                        <p>
                            All appointments associated with your account
                        </p>
                    </div>

                    <button
                        className="refresh-button"
                        onClick={fetchAppointments}
                    >
                        <RefreshCw size={17} />
                        Refresh
                    </button>
                </div>

                {appointments.length === 0 ? (

                    <div className="empty-appointments">

                        <div className="empty-icon">
                            <CalendarDays size={42} />
                        </div>

                        <h3>No Appointments Yet</h3>

                        <p>
                            You have not scheduled any property
                            appointments yet.
                        </p>

                        <button
                            className="empty-action"
                            onClick={() =>
                                navigate("/customer/properties")
                            }
                        >
                            <Plus size={18} />
                            Browse Properties
                        </button>

                    </div>

                ) : (

                    <div className="appointments-list">

                        {appointments.map((appointment) => (

                            <div
                                className="appointment-card"
                                key={appointment.AppointmentID}
                            >

                                {/* TOP */}
                                <div className="appointment-card-top">

                                    <div className="appointment-title">

                                        <div className="appointment-main-icon">
                                            <CalendarDays size={22} />
                                        </div>

                                        <div>
                                            <h3>
                                                {appointment.PropertyName}
                                            </h3>

                                            <span>
                                                Appointment #
                                                {appointment.AppointmentID}
                                            </span>
                                        </div>

                                    </div>

                                    <div
                                        className={`appointment-status ${getStatusClass(
                                            appointment.Status
                                        )}`}
                                    >
                                        {getStatusIcon(
                                            appointment.Status
                                        )}

                                        {appointment.Status}
                                    </div>

                                </div>

                                {/* DETAILS */}
                                <div className="appointment-details">

                                    <div className="detail-item">

                                        <CalendarDays size={18} />

                                        <div>
                                            <span>Date</span>
                                            <strong>
                                                {formatDate(
                                                    appointment.AppointmentDate
                                                )}
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="detail-item">

                                        <Clock size={18} />

                                        <div>
                                            <span>Time</span>
                                            <strong>
                                                {formatTime(
                                                    appointment.AppointmentTime
                                                )}
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="detail-item">

                                        <MapPin size={18} />

                                        <div>
                                            <span>Property</span>
                                            <strong>
                                                {appointment.PropertyName}
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="detail-item">

                                        <User size={18} />

                                        <div>
                                            <span>Handled By</span>
                                            <strong>
                                                {appointment.HandledByName ||
                                                    "Not assigned"}
                                            </strong>
                                        </div>

                                    </div>

                                </div>

                                {/* ACTIONS */}
                                <div className="appointment-actions">

                                    <Link
                                        to={`/customer/properties/${appointment.PropertyID}`}
                                        className="view-property-button"
                                    >
                                        <MapPin size={17} />
                                        View Property
                                    </Link>

                                    {(appointment.Status === "Pending" ||
                                        appointment.Status === "Approved") && (
                                        <button
                                            className="reschedule-button"
                                            onClick={() =>
                                                navigate(
                                                    `/customer/appointments/${appointment.AppointmentID}/reschedule`
                                                )
                                            }
                                        >
                                            <RefreshCw size={17} />
                                            Reschedule
                                        </button>
                                    )}

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>
    );
}

export default CustomerAppointments;