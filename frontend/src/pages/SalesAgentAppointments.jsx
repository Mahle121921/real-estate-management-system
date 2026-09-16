import { useEffect, useState } from "react";
import axios from "axios";
import {
    CalendarDays,
    Clock3,
    UserRound,
    Building2,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Plus,
    Search,
    X
} from "lucide-react";

import "./SalesAgentAppointments.css";

function SalesAgentAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [properties, setProperties] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [formData, setFormData] = useState({
        CustomerID: "",
        PropertyID: "",
        AppointmentDate: "",
        AppointmentTime: ""
    });

    const token = localStorage.getItem("token");

    const axiosConfig = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    // =====================================================
    // LOAD DATA
    // =====================================================

    const loadAppointments = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                "http://localhost:5000/api/appointments",
                axiosConfig
            );

            setAppointments(response.data.appointments || []);
        } catch (err) {
            console.error("Load appointments error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load appointments"
            );
        } finally {
            setLoading(false);
        }
    };

    const loadCustomers = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/customers",
                axiosConfig
            );

            setCustomers(
                response.data.customers ||
                response.data.data ||
                []
            );
        } catch (err) {
            console.error("Load customers error:", err);
        }
    };

    const loadProperties = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/properties",
                axiosConfig
            );

            setProperties(
                response.data.properties ||
                response.data.data ||
                []
            );
        } catch (err) {
            console.error("Load properties error:", err);
        }
    };

    useEffect(() => {
        loadAppointments();
        loadCustomers();
        loadProperties();
    }, []);

    // =====================================================
    // FORM
    // =====================================================

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const openCreateModal = () => {
        setEditingAppointment(null);

        setFormData({
            CustomerID: "",
            PropertyID: "",
            AppointmentDate: "",
            AppointmentTime: ""
        });

        setShowModal(true);
    };

    const openEditModal = (appointment) => {
        setEditingAppointment(appointment);

        setFormData({
            CustomerID: appointment.CustomerID,
            PropertyID: appointment.PropertyID,
            AppointmentDate: appointment.AppointmentDate?.split("T")[0] || "",
            AppointmentTime: appointment.AppointmentTime?.slice(0, 5) || ""
        });

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAppointment(null);
    };

    // =====================================================
    // CREATE / RESCHEDULE
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");

            if (editingAppointment) {
                await axios.patch(
                    `http://localhost:5000/api/appointments/${editingAppointment.AppointmentID}/reschedule`,
                    {
                        AppointmentDate: formData.AppointmentDate,
                        AppointmentTime: formData.AppointmentTime
                    },
                    axiosConfig
                );

                alert("Appointment rescheduled successfully.");
            } else {
                await axios.post(
                    "http://localhost:5000/api/appointments",
                    {
                        CustomerID: Number(formData.CustomerID),
                        PropertyID: Number(formData.PropertyID),
                        AppointmentDate: formData.AppointmentDate,
                        AppointmentTime: formData.AppointmentTime
                    },
                    axiosConfig
                );

                alert("Appointment scheduled successfully.");
            }

            closeModal();
            loadAppointments();

        } catch (err) {
            console.error("Appointment save error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to save appointment"
            );
        }
    };

    // =====================================================
    // APPROVE
    // =====================================================

    const approveAppointment = async (id) => {
        if (!window.confirm("Approve this appointment?")) {
            return;
        }

        try {
            await axios.patch(
                `http://localhost:5000/api/appointments/${id}/approve`,
                {},
                axiosConfig
            );

            loadAppointments();
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Failed to approve appointment"
            );
        }
    };

    // =====================================================
    // REJECT
    // =====================================================

    const rejectAppointment = async (id) => {
        if (!window.confirm("Reject this appointment?")) {
            return;
        }

        try {
            await axios.patch(
                `http://localhost:5000/api/appointments/${id}/reject`,
                {},
                axiosConfig
            );

            loadAppointments();
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Failed to reject appointment"
            );
        }
    };

    // =====================================================
    // COMPLETE
    // =====================================================

    const completeAppointment = async (id) => {
        if (!window.confirm("Mark this appointment as completed?")) {
            return;
        }

        try {
            await axios.patch(
                `http://localhost:5000/api/appointments/${id}/complete`,
                {},
                axiosConfig
            );

            loadAppointments();
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Failed to complete appointment"
            );
        }
    };

    // =====================================================
    // FILTER
    // =====================================================

    const filteredAppointments = appointments.filter((appointment) => {
        const search = searchTerm.toLowerCase();

        const matchesSearch =
            appointment.CustomerName?.toLowerCase().includes(search) ||
            appointment.PropertyName?.toLowerCase().includes(search);

        const matchesStatus =
            statusFilter === "All" ||
            appointment.Status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // =====================================================
    // STATUS BADGE
    // =====================================================

    const getStatusClass = (status) => {
        switch (status) {
            case "Pending":
                return "status-pending";

            case "Approved":
                return "status-approved";

            case "Rejected":
                return "status-rejected";

            case "Completed":
                return "status-completed";

            default:
                return "";
        }
    };

    return (
        <div className="sales-agent-appointments">

            {/* HEADER */}
            <div className="appointments-header">

                <div>
                    <h1>Appointments</h1>

                    <p>
                        Schedule and manage customer property appointments
                    </p>
                </div>

                <button
                    className="schedule-btn"
                    onClick={openCreateModal}
                >
                    <Plus size={18} />
                    Schedule Appointment
                </button>

            </div>

            {/* ERROR */}
            {error && (
                <div className="appointment-error">
                    {error}
                </div>
            )}

            {/* SUMMARY */}
            <div className="appointment-summary">

                <div className="summary-card">
                    <CalendarDays size={22} />
                    <div>
                        <span>Total</span>
                        <strong>{appointments.length}</strong>
                    </div>
                </div>

                <div className="summary-card">
                    <Clock3 size={22} />
                    <div>
                        <span>Pending</span>
                        <strong>
                            {
                                appointments.filter(
                                    (a) => a.Status === "Pending"
                                ).length
                            }
                        </strong>
                    </div>
                </div>

                <div className="summary-card">
                    <CheckCircle2 size={22} />
                    <div>
                        <span>Approved</span>
                        <strong>
                            {
                                appointments.filter(
                                    (a) => a.Status === "Approved"
                                ).length
                            }
                        </strong>
                    </div>
                </div>

                <div className="summary-card">
                    <CheckCircle2 size={22} />
                    <div>
                        <span>Completed</span>
                        <strong>
                            {
                                appointments.filter(
                                    (a) => a.Status === "Completed"
                                ).length
                            }
                        </strong>
                    </div>
                </div>

            </div>

            {/* FILTER BAR */}
            <div className="appointment-toolbar">

                <div className="search-box">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search customer or property..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value)
                    }
                >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Completed">Completed</option>
                </select>

            </div>

            {/* TABLE */}
            <div className="appointments-table-container">

                {loading ? (
                    <div className="appointments-loading">
                        Loading appointments...
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="appointments-empty">
                        <CalendarDays size={40} />
                        <h3>No appointments found</h3>
                        <p>
                            Schedule an appointment to get started.
                        </p>
                    </div>
                ) : (
                    <table className="appointments-table">

                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Property</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {filteredAppointments.map((appointment) => (

                                <tr key={appointment.AppointmentID}>

                                    <td>
                                        <div className="customer-cell">
                                            <UserRound size={18} />

                                            <span>
                                                {appointment.CustomerName}
                                            </span>
                                        </div>
                                    </td>

                                    <td>
                                        <div className="property-cell">
                                            <Building2 size={18} />

                                            <span>
                                                {appointment.PropertyName}
                                            </span>
                                        </div>
                                    </td>

                                    <td>
                                        {appointment.AppointmentDate
                                            ? new Date(
                                                appointment.AppointmentDate
                                            ).toLocaleDateString()
                                            : "-"}
                                    </td>

                                    <td>
                                        {appointment.AppointmentTime
                                            ? appointment.AppointmentTime.slice(0, 5)
                                            : "-"}
                                    </td>

                                    <td>
                                        <span
                                            className={`status-badge ${getStatusClass(
                                                appointment.Status
                                            )}`}
                                        >
                                            {appointment.Status}
                                        </span>
                                    </td>

                                    <td>

                                        <div className="action-buttons">

                                            {appointment.Status === "Pending" && (
                                                <>
                                                    <button
                                                        className="action-btn approve"
                                                        title="Approve"
                                                        onClick={() =>
                                                            approveAppointment(
                                                                appointment.AppointmentID
                                                            )
                                                        }
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>

                                                    <button
                                                        className="action-btn reject"
                                                        title="Reject"
                                                        onClick={() =>
                                                            rejectAppointment(
                                                                appointment.AppointmentID
                                                            )
                                                        }
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}

                                            {appointment.Status === "Approved" && (
                                                <button
                                                    className="action-btn complete"
                                                    title="Complete"
                                                    onClick={() =>
                                                        completeAppointment(
                                                            appointment.AppointmentID
                                                        )
                                                    }
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            )}

                                            {appointment.Status !== "Completed" &&
                                                appointment.Status !== "Rejected" && (
                                                    <button
                                                        className="action-btn reschedule"
                                                        title="Reschedule"
                                                        onClick={() =>
                                                            openEditModal(
                                                                appointment
                                                            )
                                                        }
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                )}

                                        </div>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>
                )}

            </div>

            {/* MODAL */}
            {showModal && (

                <div className="modal-overlay">

                    <div className="appointment-modal">

                        <div className="modal-header">

                            <div>
                                <h2>
                                    {editingAppointment
                                        ? "Reschedule Appointment"
                                        : "Schedule Appointment"}
                                </h2>

                                <p>
                                    Enter appointment information
                                </p>
                            </div>

                            <button
                                className="close-modal"
                                onClick={closeModal}
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <form onSubmit={handleSubmit}>

                            {!editingAppointment && (
                                <>
                                    <div className="form-group">

                                        <label>
                                            Customer
                                        </label>

                                        <select
                                            name="CustomerID"
                                            value={formData.CustomerID}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">
                                                Select customer
                                            </option>

                                            {customers.map((customer) => (
                                                <option
                                                    key={customer.CustomerID}
                                                    value={customer.CustomerID}
                                                >
                                                    {customer.FullName}
                                                </option>
                                            ))}

                                        </select>

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Property
                                        </label>

                                        <select
                                            name="PropertyID"
                                            value={formData.PropertyID}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">
                                                Select property
                                            </option>

                                            {properties
                                                .filter(
                                                    (property) =>
                                                        property.Status !== "Sold"
                                                )
                                                .map((property) => (
                                                    <option
                                                        key={property.PropertyID}
                                                        value={property.PropertyID}
                                                    >
                                                        {property.PropertyName}
                                                    </option>
                                                ))}
                                        </select>

                                    </div>
                                </>
                            )}

                            <div className="form-group">

                                <label>
                                    Appointment Date
                                </label>

                                <input
                                    type="date"
                                    name="AppointmentDate"
                                    value={formData.AppointmentDate}
                                    onChange={handleInputChange}
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Appointment Time
                                </label>

                                <input
                                    type="time"
                                    name="AppointmentTime"
                                    value={formData.AppointmentTime}
                                    onChange={handleInputChange}
                                    required
                                />

                            </div>

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-btn"
                                >
                                    {editingAppointment
                                        ? "Reschedule"
                                        : "Schedule Appointment"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default SalesAgentAppointments; 