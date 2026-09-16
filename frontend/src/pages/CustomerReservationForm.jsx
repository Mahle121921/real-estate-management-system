import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Home,
    Loader2,
    MapPin,
    Send,
    XCircle,
} from "lucide-react";

import "./CustomerReservationForm.css";

const API_BASE = "http://localhost:5000/api";

function CustomerReservationForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const propertyId = searchParams.get("propertyId");

    const [property, setProperty] = useState(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [reservationDate, setReservationDate] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [remarks, setRemarks] = useState("");

    const reservationDateRef = useRef(null);
    const expiryDateRef = useRef(null);

    const token = localStorage.getItem("token");

    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    // ==========================================
    // DATE HELPERS
    // ==========================================

    const getToday = () => {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const getDefaultExpiryDate = () => {
        const date = new Date();

        date.setDate(date.getDate() + 7);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (dateValue) => {
        if (!dateValue) return "-";

        const parts = String(dateValue).slice(0, 10).split("-");

        if (parts.length !== 3) {
            return dateValue;
        }

        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const day = Number(parts[2]);

        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const openDatePicker = (ref) => {
        if (ref.current?.showPicker) {
            ref.current.showPicker();
        } else {
            ref.current?.focus();
        }
    };

    // ==========================================
    // INITIAL DATE VALUES
    // ==========================================

    useEffect(() => {
        const today = getToday();

        setReservationDate(today);
        setExpiryDate(getDefaultExpiryDate());
    }, []);

    // ==========================================
    // LOAD PROPERTY
    // ==========================================

    useEffect(() => {
        const loadProperty = async () => {
            if (!propertyId) {
                setError("No property was selected.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await axios.get(
                    `${API_BASE}/properties/${propertyId}`,
                    config
                );

                setProperty(response.data);
            } catch (err) {
                console.error("Get property error:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load the selected property."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProperty();
    }, [propertyId]);

    // ==========================================
    // HANDLE RESERVATION
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!propertyId) {
            setError("No property was selected.");
            return;
        }

        if (!reservationDate) {
            setError("Please select a reservation date.");
            return;
        }

        if (!expiryDate) {
            setError("Please select an expiry date.");
            return;
        }

        if (expiryDate < reservationDate) {
            setError(
                "The expiry date cannot be earlier than the reservation date."
            );
            return;
        }

        if (!property) {
            setError("Property information is not available.");
            return;
        }

        if (property.Status !== "Available") {
            setError(
                `This property is currently ${property.Status}. Only available properties can be reserved.`
            );
            return;
        }

        try {
            setSubmitting(true);

            const response = await axios.post(
                `${API_BASE}/reservations`,
                {
                    propertyId: Number(propertyId),
                    reservationDate,
                    expiryDate,
                    remarks: remarks.trim(),
                },
                config
            );

            setSuccess(
                response.data?.message ||
                "Property reservation created successfully."
            );

            // Property is now Reserved.
            setProperty((prev) =>
                prev
                    ? {
                          ...prev,
                          Status: "Reserved",
                      }
                    : prev
            );

            // Go to My Reservations after a short delay.
            setTimeout(() => {
                navigate("/customer/reservations");
            }, 1200);
        } catch (err) {
            console.error("Create reservation error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to create the reservation. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="customer-reservation-form-page">
                <div className="reservation-form-loading">
                    <Loader2 className="reservation-spinner" size={36} />

                    <p>Loading property information...</p>
                </div>
            </div>
        );
    }

    // ==========================================
    // ERROR / NO PROPERTY
    // ==========================================

    if (!propertyId || !property) {
        return (
            <div className="customer-reservation-form-page">
                <div className="reservation-form-error-card">
                    <div className="reservation-error-icon">
                        <XCircle size={42} />
                    </div>

                    <h2>Property Not Found</h2>

                    <p>
                        {error ||
                            "The selected property could not be found."}
                    </p>

                    <Link
                        to="/customer/properties"
                        className="reservation-primary-btn"
                    >
                        <Home size={18} />
                        Browse Properties
                    </Link>
                </div>
            </div>
        );
    }

    const isAvailable = property.Status === "Available";

    // ==========================================
    // MAIN PAGE
    // ==========================================

    return (
        <div className="customer-reservation-form-page">

            {/* ==========================================
                HEADER
            ========================================== */}

            <div className="reservation-form-header">
                <div>
                    <Link
                        to={`/customer/properties/${property.PropertyID}`}
                        className="reservation-back-link"
                    >
                        <ArrowLeft size={18} />
                        Back to Property
                    </Link>

                    <h1>Reserve Property</h1>

                    <p>
                        Complete the form below to reserve this property.
                    </p>
                </div>

                <Link
                    to="/customer/reservations"
                    className="view-reservations-btn"
                >
                    <Calendar size={18} />
                    My Reservations
                </Link>
            </div>

            {/* ==========================================
                ALERTS
            ========================================== */}

            {error && (
                <div className="reservation-alert reservation-alert-error">
                    <XCircle size={20} />

                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="reservation-alert reservation-alert-success">
                    <CheckCircle2 size={20} />

                    <span>{success}</span>
                </div>
            )}

            <div className="reservation-form-layout">

                {/* ==========================================
                    PROPERTY SUMMARY
                ========================================== */}

                <div className="reservation-property-card">

                    <div className="reservation-property-image">
                        {property.ImagePath ? (
                            <img
                                src={
                                    property.ImagePath.startsWith("http")
                                        ? property.ImagePath
                                        : `http://localhost:5173/${property.ImagePath.replace(
                                              /^\/+/,
                                              ""
                                          )}`
                                }
                                alt={property.PropertyName}
                            />
                        ) : (
                            <div className="reservation-no-image">
                                <Home size={48} />
                                <span>No Image</span>
                            </div>
                        )}

                        <span
                            className={`reservation-status ${
                                property.Status?.toLowerCase()
                            }`}
                        >
                            {property.Status}
                        </span>
                    </div>

                    <div className="reservation-property-content">

                        <h2>{property.PropertyName}</h2>

                        <div className="reservation-property-location">
                            <MapPin size={17} />

                            <span>
                                {property.Location ||
                                    property.Address ||
                                    "Location not specified"}
                            </span>
                        </div>

                        <div className="reservation-property-details">

                            <div className="reservation-detail-item">
                                <span className="detail-label">
                                    Property Type
                                </span>

                                <strong>
                                    {property.PropertyType || "-"}
                                </strong>
                            </div>

                            <div className="reservation-detail-item">
                                <span className="detail-label">
                                    Price
                                </span>

                                <strong className="reservation-price">
                                    {property.SalePrice
                                        ? `ETB ${Number(
                                              property.SalePrice
                                          ).toLocaleString()}`
                                        : property.RentPrice
                                        ? `ETB ${Number(
                                              property.RentPrice
                                          ).toLocaleString()}`
                                        : "Price not specified"}
                                </strong>
                            </div>

                        </div>

                        {property.Description && (
                            <div className="reservation-description">
                                <span className="detail-label">
                                    Description
                                </span>

                                <p>{property.Description}</p>
                            </div>
                        )}

                    </div>
                </div>

                {/* ==========================================
                    RESERVATION FORM
                ========================================== */}

                <div className="reservation-form-card">

                    <div className="reservation-form-card-header">
                        <div className="reservation-form-title-icon">
                            <Calendar size={22} />
                        </div>

                        <div>
                            <h2>Reservation Details</h2>

                            <p>
                                Select the dates for your property
                                reservation.
                            </p>
                        </div>
                    </div>

                    {!isAvailable && (
                        <div className="property-unavailable-message">
                            <XCircle size={20} />

                            <div>
                                <strong>Property Not Available</strong>

                                <p>
                                    This property is currently{" "}
                                    <strong>{property.Status}</strong> and
                                    cannot be reserved.
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        {/* Reservation Date */}

                        <div className="reservation-form-group">

                            <label htmlFor="reservationDate">
                                Reservation Date
                                <span className="required">*</span>
                            </label>

                            <div className="date-input-wrapper">

                                <Calendar
                                    size={19}
                                    className="date-input-icon"
                                />

                                <input
                                    ref={reservationDateRef}
                                    id="reservationDate"
                                    type="date"
                                    value={reservationDate}
                                    min={getToday()}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        setReservationDate(value);

                                        if (
                                            expiryDate &&
                                            expiryDate < value
                                        ) {
                                            setExpiryDate(value);
                                        }
                                    }}
                                    disabled={
                                        submitting || !isAvailable
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    className="date-picker-button"
                                    onClick={() =>
                                        openDatePicker(
                                            reservationDateRef
                                        )
                                    }
                                    disabled={
                                        submitting || !isAvailable
                                    }
                                    aria-label="Open reservation date picker"
                                >
                                    <Calendar size={18} />
                                </button>

                            </div>

                            <small>
                                Date you want to reserve the property.
                            </small>

                        </div>

                        {/* Expiry Date */}

                        <div className="reservation-form-group">

                            <label htmlFor="expiryDate">
                                Reservation Expiry Date
                                <span className="required">*</span>
                            </label>

                            <div className="date-input-wrapper">

                                <Calendar
                                    size={19}
                                    className="date-input-icon"
                                />

                                <input
                                    ref={expiryDateRef}
                                    id="expiryDate"
                                    type="date"
                                    value={expiryDate}
                                    min={
                                        reservationDate || getToday()
                                    }
                                    onChange={(e) =>
                                        setExpiryDate(e.target.value)
                                    }
                                    disabled={
                                        submitting || !isAvailable
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    className="date-picker-button"
                                    onClick={() =>
                                        openDatePicker(expiryDateRef)
                                    }
                                    disabled={
                                        submitting || !isAvailable
                                    }
                                    aria-label="Open expiry date picker"
                                >
                                    <Calendar size={18} />
                                </button>

                            </div>

                            <small>
                                Reservation will remain active until this
                                date.
                            </small>

                        </div>

                        {/* Date Summary */}

                        <div className="reservation-date-summary">

                            <div>
                                <span>Reservation Date</span>

                                <strong>
                                    {formatDisplayDate(
                                        reservationDate
                                    )}
                                </strong>
                            </div>

                            <div className="summary-arrow">→</div>

                            <div>
                                <span>Expiry Date</span>

                                <strong>
                                    {formatDisplayDate(expiryDate)}
                                </strong>
                            </div>

                        </div>

                        {/* Remarks */}

                        <div className="reservation-form-group">

                            <label htmlFor="remarks">
                                Remarks
                                <span className="optional">
                                    Optional
                                </span>
                            </label>

                            <textarea
                                id="remarks"
                                value={remarks}
                                onChange={(e) =>
                                    setRemarks(e.target.value)
                                }
                                placeholder="Add any additional information or special request..."
                                rows={5}
                                maxLength={500}
                                disabled={
                                    submitting || !isAvailable
                                }
                            />

                            <div className="textarea-footer">
                                <small>
                                    You can provide additional information
                                    about your reservation.
                                </small>

                                <span>
                                    {remarks.length}/500
                                </span>
                            </div>

                        </div>

                        {/* Submit */}

                        <button
                            type="submit"
                            className="submit-reservation-btn"
                            disabled={submitting || !isAvailable}
                        >
                            {submitting ? (
                                <>
                                    <Loader2
                                        size={19}
                                        className="reservation-spinner"
                                    />

                                    Creating Reservation...
                                </>
                            ) : (
                                <>
                                    <Send size={19} />

                                    Reserve This Property
                                </>
                            )}
                        </button>

                        <Link
                            to="/customer/reservations"
                            className="cancel-reservation-link"
                        >
                            Cancel and return to My Reservations
                        </Link>

                    </form>
                </div>
            </div>
        </div>
    );
}

export default CustomerReservationForm;