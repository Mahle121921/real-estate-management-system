import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    Home,
    Loader2,
    MapPin,
    RefreshCw,
    XCircle,
} from "lucide-react";

import "./CustomerRentals.css";

const API_BASE = "http://localhost:5000/api";

function CustomerRentals() {
    const navigate = useNavigate();

    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        loadRentals();
    }, []);

    // ============================================================
    // LOAD MY RENTALS
    // ============================================================

    const loadRentals = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_BASE}/rentals/my`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("My rentals response:", response.data);

            const rentalList =
                response.data?.rentals ||
                response.data?.data ||
                [];

            setRentals(
                Array.isArray(rentalList)
                    ? rentalList
                    : []
            );

        } catch (err) {
            console.error("Load my rentals error:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to load your rental agreements."
            );
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // FORMAT DATE
    // ============================================================

    const formatDate = (date) => {
        if (!date) return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString();
    };

    // ============================================================
    // FORMAT MONEY
    // ============================================================

    const formatMoney = (amount) => {
        const number = Number(amount);

        if (Number.isNaN(number)) {
            return "ETB 0.00";
        }

        return `ETB ${number.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // ============================================================
    // STATUS ICON
    // ============================================================

    const getStatusIcon = (status) => {
        const normalizedStatus = String(
            status || ""
        ).toLowerCase();

        if (normalizedStatus === "active") {
            return <CheckCircle2 size={17} />;
        }

        if (normalizedStatus === "expired") {
            return <Clock3 size={17} />;
        }

        if (normalizedStatus === "terminated") {
            return <XCircle size={17} />;
        }

        return <Clock3 size={17} />;
    };

    // ============================================================
    // STATUS CLASS
    // ============================================================

    const getStatusClass = (status) => {
        return String(status || "Unknown")
            .toLowerCase()
            .replace(/\s+/g, "-");
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="customer-rentals-page">
                <div className="customer-rentals-loading">
                    <Loader2
                        size={42}
                        className="spin"
                    />

                    <h2>Loading Your Rentals</h2>

                    <p>
                        Please wait while we retrieve your
                        rental agreements.
                    </p>
                </div>
            </div>
        );
    }

    // ============================================================
    // MAIN PAGE
    // ============================================================

    return (
        <div className="customer-rentals-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <header className="customer-rentals-header">

                <div className="rentals-header-left">

                    <button
                        className="rentals-back-button"
                        onClick={() =>
                            navigate("/customer-dashboard")
                        }
                    >
                        <ArrowLeft size={18} />
                        Dashboard
                    </button>

                    <div className="rentals-title-section">

                        <div className="rentals-title-icon">
                            <Home size={25} />
                        </div>

                        <div>
                            <h1>My Rentals</h1>

                            <p>
                                View and manage your rental
                                agreements.
                            </p>
                        </div>

                    </div>

                </div>

                <button
                    className="rentals-refresh-button"
                    onClick={loadRentals}
                    disabled={loading}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>

            </header>

            <main className="customer-rentals-content">

                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (
                    <div className="rentals-alert error">

                        <XCircle size={20} />

                        <div>
                            <strong>
                                Unable to load rentals
                            </strong>

                            <p>{error}</p>
                        </div>

                        <button onClick={loadRentals}>
                            Try Again
                        </button>

                    </div>
                )}

                {/* ==================================================
                    SUMMARY
                ================================================== */}

                <div className="rentals-summary-grid">

                    <div className="rental-summary-card">

                        <div className="summary-icon">
                            <Home size={21} />
                        </div>

                        <div>
                            <span>
                                Total Rentals
                            </span>

                            <strong>
                                {rentals.length}
                            </strong>
                        </div>

                    </div>

                    <div className="rental-summary-card">

                        <div className="summary-icon">
                            <CheckCircle2 size={21} />
                        </div>

                        <div>
                            <span>
                                Active Rentals
                            </span>

                            <strong>
                                {
                                    rentals.filter(
                                        (rental) =>
                                            String(
                                                rental.Status
                                            ).toLowerCase() ===
                                            "active"
                                    ).length
                                }
                            </strong>
                        </div>

                    </div>

                    <div className="rental-summary-card">

                        <div className="summary-icon">
                            <CreditCard size={21} />
                        </div>

                        <div>
                            <span>
                                Monthly Rent
                            </span>

                            <strong>
                                {formatMoney(
                                    rentals
                                        .filter(
                                            (rental) =>
                                                String(
                                                    rental.Status
                                                ).toLowerCase() ===
                                                "active"
                                        )
                                        .reduce(
                                            (
                                                total,
                                                rental
                                            ) =>
                                                total +
                                                Number(
                                                    rental.MonthlyRent ||
                                                        0
                                                ),
                                            0
                                        )
                                )}
                            </strong>
                        </div>

                    </div>

                </div>

                {/* ==================================================
                    NO RENTALS
                ================================================== */}

                {rentals.length === 0 ? (
                    <section className="no-rentals-card">

                        <div className="no-rentals-icon">
                            <Home size={42} />
                        </div>

                        <h2>
                            You Don't Have Any Rentals Yet
                        </h2>

                        <p>
                            You currently have no rental
                            agreements. Browse available
                            properties and find a property
                            that is right for you.
                        </p>

                        <Link
                            to="/customer/properties"
                            className="browse-properties-button"
                        >
                            <Building2 size={18} />
                            Browse Properties
                        </Link>

                    </section>
                ) : (

                    /* ==================================================
                       RENTAL LIST
                    ================================================== */

                    <section className="rentals-section">

                        <div className="rentals-section-header">

                            <div>
                                <h2>
                                    Rental Agreements
                                </h2>

                                <p>
                                    Your current and previous
                                    rental agreements.
                                </p>
                            </div>

                            <span className="rental-count">
                                {rentals.length}{" "}
                                {rentals.length === 1
                                    ? "Agreement"
                                    : "Agreements"}
                            </span>

                        </div>

                        <div className="rentals-list">

                            {rentals.map((rental) => (

                                <article
                                    className="rental-card"
                                    key={rental.RentalID}
                                >

                                    {/* ==================================================
                                        CARD HEADER
                                    ================================================== */}

                                    <div className="rental-card-header">

                                        <div className="rental-property-heading">

                                            <div className="rental-property-icon">
                                                <Building2
                                                    size={24}
                                                />
                                            </div>

                                            <div>

                                                <span className="rental-label">
                                                    Rental Agreement #
                                                    {
                                                        rental.RentalID
                                                    }
                                                </span>

                                                <h3>
                                                    {
                                                        rental.PropertyName ||
                                                        "Property"
                                                    }
                                                </h3>

                                                {rental.PropertyType && (
                                                    <span className="property-type">
                                                        {
                                                            rental.PropertyType
                                                        }
                                                    </span>
                                                )}

                                            </div>

                                        </div>

                                        <div
                                            className={`rental-status-badge ${getStatusClass(
                                                rental.Status
                                            )}`}
                                        >
                                            {getStatusIcon(
                                                rental.Status
                                            )}

                                            {rental.Status ||
                                                "Unknown"}
                                        </div>

                                    </div>

                                    {/* ==================================================
                                        PROPERTY INFO
                                    ================================================== */}

                                    <div className="rental-property-info">

                                        {rental.Location && (
                                            <div className="rental-info-item">

                                                <MapPin
                                                    size={17}
                                                />

                                                <div>
                                                    <span>
                                                        Location
                                                    </span>

                                                    <strong>
                                                        {
                                                            rental.Location
                                                        }
                                                    </strong>
                                                </div>

                                            </div>
                                        )}

                                        {rental.Address && (
                                            <div className="rental-info-item">

                                                <MapPin
                                                    size={17}
                                                />

                                                <div>
                                                    <span>
                                                        Address
                                                    </span>

                                                    <strong>
                                                        {
                                                            rental.Address
                                                        }
                                                    </strong>
                                                </div>

                                            </div>
                                        )}

                                    </div>

                                    {/* ==================================================
                                        RENTAL DETAILS
                                    ================================================== */}

                                    <div className="rental-details-grid">

                                        <div className="rental-detail">

                                            <CreditCard
                                                size={18}
                                            />

                                            <div>
                                                <span>
                                                    Monthly Rent
                                                </span>

                                                <strong>
                                                    {formatMoney(
                                                        rental.MonthlyRent
                                                    )}
                                                </strong>
                                            </div>

                                        </div>

                                        <div className="rental-detail">

                                            <CalendarDays
                                                size={18}
                                            />

                                            <div>
                                                <span>
                                                    Start Date
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        rental.StartDate
                                                    )}
                                                </strong>
                                            </div>

                                        </div>

                                        <div className="rental-detail">

                                            <CalendarDays
                                                size={18}
                                            />

                                            <div>
                                                <span>
                                                    End Date
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        rental.EndDate
                                                    )}
                                                </strong>
                                            </div>

                                        </div>

                                        <div className="rental-detail">

                                            <Clock3
                                                size={18}
                                            />

                                            <div>
                                                <span>
                                                    Payment Due
                                                </span>

                                                <strong>
                                                    Day{" "}
                                                    {
                                                        rental.DueDate
                                                    }{" "}
                                                    of every month
                                                </strong>
                                            </div>

                                        </div>

                                    </div>

                                    {/* ==================================================
                                        FOOTER
                                    ================================================== */}

                                    <div className="rental-card-footer">

                                        <div className="manual-payment-note">

                                            <CreditCard
                                                size={17}
                                            />

                                            <span>
                                                Rent payments are
                                                handled manually.
                                            </span>

                                        </div>

                                        <Link
                                            to={`/customer/rental/${rental.PropertyID}`}
                                            className="view-property-button"
                                        >
                                            <Building2
                                                size={17}
                                            />
                                            View Property
                                        </Link>

                                    </div>

                                </article>

                            ))}

                        </div>

                    </section>
                )}

            </main>

        </div>
    );
}

export default CustomerRentals;