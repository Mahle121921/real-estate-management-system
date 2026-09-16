
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    CheckCircle2,
    CreditCard,
    Home,
    Loader2,
    MapPin,
    Send,
    XCircle,
} from "lucide-react";

import "./CustomerRental.css";

const API_BASE = "http://localhost:5000/api";

function CustomerRental() {
    const { propertyId } = useParams();
    const navigate = useNavigate();

    const [property, setProperty] = useState(null);

    const [monthlyRent, setMonthlyRent] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [dueDate, setDueDate] = useState("1");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const token = localStorage.getItem("token");

    const today = new Date().toISOString().split("T")[0];

    useEffect(() => {
        loadProperty();
    }, [propertyId]);

    // ============================================================
    // LOAD PROPERTY
    // ============================================================

    const loadProperty = async () => {
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
                response.data?.property ||
                response.data?.data ||
                response.data;

            setProperty(propertyData);

            setStartDate(today);

            // Default rental period = 1 month
            const defaultEndDate = new Date();
            defaultEndDate.setMonth(
                defaultEndDate.getMonth() + 1
            );

            setEndDate(
                defaultEndDate.toISOString().split("T")[0]
            );

        } catch (err) {
            console.error("Load rental property error:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to load property information."
            );
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // SUBMIT RENTAL
    // ============================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!property) {
            setError("Property information is not available.");
            return;
        }

        if (!monthlyRent) {
            setError("Please enter the monthly rent.");
            return;
        }

        if (Number(monthlyRent) <= 0) {
            setError("Monthly rent must be greater than zero.");
            return;
        }

        if (!startDate || !endDate) {
            setError(
                "Please select both rental start and end dates."
            );
            return;
        }

        if (new Date(endDate) <= new Date(startDate)) {
            setError(
                "Rental end date must be after the start date."
            );
            return;
        }

        if (
            Number(dueDate) < 1 ||
            Number(dueDate) > 31
        ) {
            setError(
                "Monthly due day must be between 1 and 31."
            );
            return;
        }

        if (property.Status !== "Available") {
            setError(
                `This property is currently ${property.Status} and cannot be rented.`
            );
            return;
        }

        try {
            setSubmitting(true);

            const response = await axios.post(
                `${API_BASE}/rentals/customer`,
                {
                    PropertyID: Number(propertyId),
                    MonthlyRent: Number(monthlyRent),
                    StartDate: startDate,
                    EndDate: endDate,
                    DueDate: Number(dueDate),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(
                "Customer rental response:",
                response.data
            );

            setSuccess(
                "Your rental agreement has been created successfully."
            );

            setProperty((prev) =>
                prev
                    ? {
                          ...prev,
                          Status: "Rented",
                      }
                    : prev
            );

            setTimeout(() => {
                navigate("/customer/rentals");
            }, 1500);

        } catch (err) {
            console.error(
                "Create customer rental error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to create rental agreement. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="customer-rental-page">
                <div className="rental-loading">
                    <Loader2
                        size={42}
                        className="spin"
                    />

                    <p>
                        Loading property information...
                    </p>
                </div>
            </div>
        );
    }

    // ============================================================
    // PROPERTY NOT FOUND
    // ============================================================

    if (!property) {
        return (
            <div className="customer-rental-page">
                <div className="rental-error-page">
                    <XCircle size={50} />

                    <h2>Property Not Found</h2>

                    <p>
                        The property you are trying to rent
                        could not be found.
                    </p>

                    <Link
                        to="/customer/properties"
                        className="rental-back-btn"
                    >
                        <ArrowLeft size={18} />
                        Browse Properties
                    </Link>
                </div>
            </div>
        );
    }

    // ============================================================
    // MAIN
    // ============================================================

    return (
        <div className="customer-rental-page">

            {/* HEADER */}
            <header className="customer-rental-header">
                <div>
                    <Link
                        to="/customer/properties"
                        className="rental-back-link"
                    >
                        <ArrowLeft size={18} />
                        Back to Properties
                    </Link>

                    <h1>Rent Property</h1>

                    <p>
                        Create a rental agreement for this
                        property.
                    </p>
                </div>
            </header>

            <main className="customer-rental-content">

                {/* ==========================================
                    PROPERTY INFORMATION
                ========================================== */}

                <section className="rental-property-card">

                    <div className="property-card-header">

                        <div className="property-icon">
                            <Building2 size={25} />
                        </div>

                        <div>
                            <span className="property-label">
                                Selected Property
                            </span>

                            <h2>
                                {property.PropertyName ||
                                    "Property"}
                            </h2>
                        </div>

                    </div>

                    <div className="property-status-row">

                        <span
                            className={`rental-status ${String(
                                property.Status || ""
                            )
                                .toLowerCase()
                                .replace(
                                    /\s+/g,
                                    "-"
                                )}`}
                        >
                            {property.Status}
                        </span>

                    </div>

                    <div className="property-info-list">

                        {property.Location && (
                            <div className="property-info-item">
                                <MapPin size={18} />

                                <div>
                                    <span>
                                        Location
                                    </span>

                                    <strong>
                                        {property.Location}
                                    </strong>
                                </div>
                            </div>
                        )}

                        {property.Address && (
                            <div className="property-info-item">
                                <MapPin size={18} />

                                <div>
                                    <span>
                                        Address
                                    </span>

                                    <strong>
                                        {property.Address}
                                    </strong>
                                </div>
                            </div>
                        )}

                        {property.PropertyType && (
                            <div className="property-info-item">
                                <Home size={18} />

                                <div>
                                    <span>
                                        Property Type
                                    </span>

                                    <strong>
                                        {property.PropertyType}
                                    </strong>
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="rental-notice">

                        <CreditCard size={19} />

                        <div>
                            <strong>
                                Manual Payment
                            </strong>

                            <p>
                                Rental payments are handled
                                manually through an authorized
                                administrator or sales agent.
                            </p>
                        </div>

                    </div>

                </section>

                {/* ==========================================
                    RENTAL FORM
                ========================================== */}

                <section className="rental-form-card">

                    <div className="rental-form-heading">

                        <div className="form-heading-icon">
                            <CalendarDays size={22} />
                        </div>

                        <div>
                            <h2>
                                Rental Details
                            </h2>

                            <p>
                                Enter the rental period and
                                monthly payment information.
                            </p>
                        </div>

                    </div>

                    {/* ERROR */}

                    {error && (
                        <div className="rental-alert error">
                            <XCircle size={19} />
                            <span>
                                {error}
                            </span>
                        </div>
                    )}

                    {/* SUCCESS */}

                    {success && (
                        <div className="rental-alert success">
                            <CheckCircle2 size={19} />
                            <span>
                                {success}
                            </span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        {/* MONTHLY RENT */}

                        <div className="rental-field">

                            <label htmlFor="monthlyRent">
                                Monthly Rent
                            </label>

                            <div className="input-with-icon">

                                <CreditCard size={18} />

                                <input
                                    id="monthlyRent"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={monthlyRent}
                                    onChange={(e) =>
                                        setMonthlyRent(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter monthly rent"
                                    required
                                />

                            </div>

                        </div>

                        {/* DATES */}

                        <div className="rental-date-grid">

                            <div className="rental-field">

                                <label htmlFor="startDate">
                                    Rental Start Date
                                </label>

                                <div className="input-with-icon">

                                    <CalendarDays size={18} />

                                    <input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        min={today}
                                        onChange={(e) =>
                                            setStartDate(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>

                            </div>

                            <div className="rental-field">

                                <label htmlFor="endDate">
                                    Rental End Date
                                </label>

                                <div className="input-with-icon">

                                    <CalendarDays size={18} />

                                    <input
                                        id="endDate"
                                        type="date"
                                        value={endDate}
                                        min={
                                            startDate ||
                                            today
                                        }
                                        onChange={(e) =>
                                            setEndDate(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>

                            </div>

                        </div>

                        {/* DUE DAY */}

                        <div className="rental-field">

                            <label htmlFor="dueDate">
                                Monthly Payment Due Day
                            </label>

                            <div className="input-with-icon">

                                <CalendarDays size={18} />

                                <input
                                    id="dueDate"
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={dueDate}
                                    onChange={(e) =>
                                        setDueDate(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Example: 1"
                                    required
                                />

                            </div>

                            <small className="field-help">
                                Enter the day of each month
                                when the rent payment is due.
                            </small>

                        </div>

                        {/* FOOTER */}

                        <div className="rental-form-footer">

                            <Link
                                to="/customer/properties"
                                className="rental-cancel-btn"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                className="rental-submit-btn"
                                disabled={
                                    submitting ||
                                    property.Status !==
                                        "Available"
                                }
                            >
                                {submitting ? (
                                    <>
                                        <Loader2
                                            size={18}
                                            className="spin"
                                        />

                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />

                                        Create Rental Agreement
                                    </>
                                )}
                            </button>

                        </div>

                    </form>

                </section>

            </main>
        </div>
    );
}

export default CustomerRental;
