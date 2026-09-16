import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    Clock,
    MapPin,
    Send,
    Loader2,
    AlertCircle,
    CheckCircle,
} from "lucide-react";

import "./CustomerAppointmentForm.css";

const API_BASE = "http://localhost:5000/api";

function CustomerAppointmentForm() {
    const navigate = useNavigate();
    const { propertyId } = useParams();

    const token = localStorage.getItem("token");

    const [property, setProperty] = useState(null);

    const [formData, setFormData] = useState({
        AppointmentDate: "",
        AppointmentTime: "",
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =====================================================
    // LOAD PROPERTY
    // =====================================================

    useEffect(() => {
        if (!propertyId) {
            setError("Property ID is missing.");
            setLoading(false);
            return;
        }

        fetchProperty();
    }, [propertyId]);

    const fetchProperty = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_BASE}/properties/${propertyId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const propertyData =
                response.data.property ||
                response.data.data ||
                response.data;

            setProperty(propertyData);
        } catch (err) {
            console.error("Get property error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load property information."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // HANDLE INPUT
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // =====================================================
    // SUBMIT APPOINTMENT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!formData.AppointmentDate) {
            setError("Please select an appointment date.");
            return;
        }

        if (!formData.AppointmentTime) {
            setError("Please select an appointment time.");
            return;
        }

        // Prevent selecting a past date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selectedDate = new Date(
            `${formData.AppointmentDate}T00:00:00`
        );

        if (selectedDate < today) {
            setError("Appointment date cannot be in the past.");
            return;
        }

        try {
            setSubmitting(true);

            const response = await axios.post(
                `${API_BASE}/appointments`,
                {
                    PropertyID: Number(propertyId),
                    AppointmentDate: formData.AppointmentDate,
                    AppointmentTime: formData.AppointmentTime,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setSuccess(
                response.data.message ||
                "Appointment requested successfully."
            );

            setTimeout(() => {
                navigate("/customer/appointments");
            }, 1500);

        } catch (err) {
            console.error("Create appointment error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to schedule appointment."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="customer-appointment-form-page">
                <div className="appointment-form-loading">
                    <Loader2
                        size={40}
                        className="appointment-loading-spinner"
                    />
                    <p>Loading property information...</p>
                </div>
            </div>
        );
    }

    // =====================================================
    // ERROR WITHOUT PROPERTY
    // =====================================================

    if (!property) {
        return (
            <div className="customer-appointment-form-page">

                <div className="appointment-form-error-page">
                    <AlertCircle size={45} />

                    <h2>Property Not Found</h2>

                    <p>
                        {error || "The requested property could not be found."}
                    </p>

                    <button
                        onClick={() =>
                            navigate("/customer/properties")
                        }
                    >
                        <ArrowLeft size={18} />
                        Back to Properties
                    </button>
                </div>

            </div>
        );
    }

    // =====================================================
    // PROPERTY STATUS
    // =====================================================

    const isSold = property.Status === "Sold";

    return (
        <div className="customer-appointment-form-page">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="appointment-form-header">

                <button
                    className="appointment-back-button"
                    onClick={() =>
                        navigate(
                            `/customer/properties/${propertyId}`
                        )
                    }
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                <div>
                    <h1>Schedule Appointment</h1>
                    <p>
                        Request a visit for the selected property
                    </p>
                </div>

            </div>

            {/* =====================================================
                ERROR
            ===================================================== */}

            {error && (
                <div className="appointment-form-alert error-alert">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* =====================================================
                SUCCESS
            ===================================================== */}

            {success && (
                <div className="appointment-form-alert success-alert">
                    <CheckCircle size={20} />
                    <span>{success}</span>
                </div>
            )}

            <div className="appointment-form-layout">

                {/* =================================================
                    PROPERTY INFORMATION
                ================================================= */}

                <div className="appointment-property-card">

                    <div className="property-card-icon">
                        <MapPin size={28} />
                    </div>

                    <h2>{property.PropertyName}</h2>

                    {property.PropertyType && (
                        <div className="property-type">
                            {property.PropertyType}
                        </div>
                    )}

                    {property.Address && (
                        <div className="property-address">
                            <MapPin size={17} />
                            <span>{property.Address}</span>
                        </div>
                    )}

                    <div
                        className={`property-status ${
                            isSold
                                ? "sold-status"
                                : "available-status"
                        }`}
                    >
                        {isSold ? "Sold" : property.Status}
                    </div>

                    {isSold ? (
                        <div className="sold-message">
                            <AlertCircle size={18} />
                            <span>
                                Appointments cannot be scheduled
                                for sold properties.
                            </span>
                        </div>
                    ) : (
                        <div className="property-info-message">
                            <CalendarDays size={18} />
                            <span>
                                Select your preferred date and time.
                                Your request will remain pending until
                                it is approved by the responsible staff.
                            </span>
                        </div>
                    )}

                </div>

                {/* =================================================
                    FORM
                ================================================= */}

                <div className="appointment-form-card">

                    <div className="form-card-header">
                        <CalendarDays size={24} />

                        <div>
                            <h2>Appointment Details</h2>
                            <p>
                                Choose when you would like to visit
                                this property.
                            </p>
                        </div>
                    </div>

                    {isSold ? (

                        <div className="form-disabled-message">
                            <AlertCircle size={25} />

                            <p>
                                This property is sold, so an appointment
                                cannot be scheduled.
                            </p>

                            <button
                                onClick={() =>
                                    navigate(
                                        "/customer/properties"
                                    )
                                }
                            >
                                Browse Other Properties
                            </button>
                        </div>

                    ) : (

                        <form onSubmit={handleSubmit}>

                            {/* DATE */}

                            <div className="form-group">

                                <label htmlFor="AppointmentDate">
                                    <CalendarDays size={16} />
                                    Appointment Date
                                </label>

                                <input
                                    id="AppointmentDate"
                                    type="date"
                                    name="AppointmentDate"
                                    value={formData.AppointmentDate}
                                    onChange={handleChange}
                                    min={
                                        new Date()
                                            .toISOString()
                                            .split("T")[0]
                                    }
                                    required
                                />

                                <small>
                                    Select a future date for your
                                    property visit.
                                </small>

                            </div>

                            {/* TIME */}

                            <div className="form-group">

                                <label htmlFor="AppointmentTime">
                                    <Clock size={16} />
                                    Appointment Time
                                </label>

                                <input
                                    id="AppointmentTime"
                                    type="time"
                                    name="AppointmentTime"
                                    value={formData.AppointmentTime}
                                    onChange={handleChange}
                                    required
                                />

                                <small>
                                    Choose your preferred visiting time.
                                </small>

                            </div>

                            {/* INFORMATION */}

                            <div className="appointment-notice">

                                <AlertCircle size={18} />

                                <div>
                                    <strong>
                                        Important
                                    </strong>

                                    <p>
                                        Your appointment will first be
                                        submitted as <b>Pending</b>.
                                        An administrator, owner, or sales
                                        agent must approve it.
                                    </p>
                                </div>

                            </div>

                            {/* BUTTONS */}

                            <div className="form-actions">

                                <button
                                    type="button"
                                    className="cancel-appointment-button"
                                    onClick={() =>
                                        navigate(
                                            `/customer/properties/${propertyId}`
                                        )
                                    }
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="submit-appointment-button"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="button-spinner"
                                            />
                                            Scheduling...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Schedule Appointment
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    )}

                </div>

            </div>

        </div>
    );
}

export default CustomerAppointmentForm;