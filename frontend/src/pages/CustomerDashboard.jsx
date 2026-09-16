import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import {
    Home,
    Building2,
    CalendarCheck,
    Calendar,
    CreditCard,
    Search,
    Bell,
    LogOut,
    MapPin,
    Bookmark,
    ChevronRight,
    Loader2,
    ShoppingCart,
    FileText
} from "lucide-react";

import "./CustomerDashboard.css";

const API_BASE = "http://localhost:5000/api";
// ==========================================
// CUSTOMER MENU
// ==========================================
const menuItems = [
    {
        name: "Dashboard",
        path: "/customer-dashboard",
        icon: <Home size={18} />,
    },
    {
        name: "Browse Properties",
        path: "/customer/properties",
        icon: <Building2 size={18} />,
    },
    {
        name: "My Reservations",
        path: "/customer/reservations",
        icon: <CalendarCheck size={18} />,
    },
    {
        name: "My Purchases",
        path: "/customer/purchases",
        icon: <ShoppingCart size={18} />,
    },
    {
        name: "My Rentals",
        path: "/customer/rentals",
        icon: <FileText size={18} />,
    },
    {
        name: "Appointments",
        path: "/customer/appointments",
        icon: <Calendar size={18} />,
    },
    {
        name: "Payments",
        path: "/customer/payments",
        icon: <CreditCard size={18} />,
    },
];

function CustomerDashboard() {
    const location = useLocation();

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [stats, setStats] = useState({
        availableProperties: 0,
        myReservations: 0,
        upcomingAppointments: 0,
        recentPayments: 0,
    });

    const [reservations, setReservations] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [featuredProperties, setFeaturedProperties] = useState([]);

    /* ==========================================
       AUTH CONFIG
    ========================================== */

    const getConfig = useCallback(() => {
        const token = localStorage.getItem("token");

        return {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        };
    }, []);

    /* ==========================================
       LOGOUT
    ========================================== */

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/";
    };

    /* ==========================================
       EXTRACT API LIST
    ========================================== */

    const extractList = (response, key) => {
        if (!response) {
            return [];
        }

        const data = response.data;

        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.[key])) {
            return data[key];
        }

        if (Array.isArray(data?.data)) {
            return data.data;
        }

        return [];
    };

    /* ==========================================
       LOAD DASHBOARD
    ========================================== */

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const config = getConfig();

            const [
                propertiesResult,
                reservationsResult,
                appointmentsResult,
                paymentsResult,
            ] = await Promise.allSettled([
                axios.get(
                    `${API_BASE}/properties/search`,
                    config
                ),

                axios.get(
                    `${API_BASE}/reservations/my`,
                    config
                ),

                axios.get(
                    `${API_BASE}/appointments/my`,
                    config
                ),

                axios.get(
                    `${API_BASE}/payments/my`,
                    config
                ),
            ]);

            /* ======================================
               AVAILABLE PROPERTIES
            ====================================== */

            const properties =
                propertiesResult.status === "fulfilled"
                    ? extractList(
                          propertiesResult.value,
                          "properties"
                      )
                    : [];

            // Only Available properties are displayed
            const availableProperties =
                properties.filter((property) => {
                    const status =
                        property.Status ||
                        property.status ||
                        property.ListingStatus ||
                        "";

                    return (
                        String(status).toLowerCase() ===
                        "available"
                    );
                });

            /* ======================================
               RESERVATIONS
            ====================================== */

            const reservationList =
                reservationsResult.status === "fulfilled"
                    ? extractList(
                          reservationsResult.value,
                          "reservations"
                      )
                    : [];

            /* ======================================
               APPOINTMENTS
            ====================================== */

            const appointmentList =
                appointmentsResult.status === "fulfilled"
                    ? extractList(
                          appointmentsResult.value,
                          "appointments"
                      )
                    : [];

            /* ======================================
               PAYMENTS
            ====================================== */

            const paymentList =
                paymentsResult.status === "fulfilled"
                    ? extractList(
                          paymentsResult.value,
                          "payments"
                      )
                    : [];

            /* ======================================
               UPCOMING APPOINTMENTS
            ====================================== */

const upcomingAppointments =
    appointmentList.filter((appointment) => {
        const status = String(
            appointment.Status ||
                appointment.status ||
                ""
        ).toLowerCase();

        return [
            "pending",
            "approved",
        ].includes(status);
    });
            /* ======================================
               UPDATE STATE
            ====================================== */

            setStats({
                availableProperties:
                    availableProperties.length,

                myReservations:
                    reservationList.length,

                upcomingAppointments:
                    upcomingAppointments.length,

                recentPayments:
                    paymentList.length,
            });

            setFeaturedProperties(
                availableProperties.slice(0, 4)
            );

            setReservations(
                reservationList.slice(0, 5)
            );

            setAppointments(
                appointmentList.slice(0, 5)
            );

            setPayments(
                paymentList.slice(0, 5)
            );

            /* ======================================
               ONLY SHOW ERROR IF EVERYTHING FAILED
            ====================================== */

            const allFailed = [
                propertiesResult,
                reservationsResult,
                appointmentsResult,
                paymentsResult,
            ].every(
                (result) =>
                    result.status === "rejected"
            );

            if (allFailed) {
                setError(
                    "Unable to load customer dashboard data."
                );
            }
        } catch (err) {
            console.error(
                "Customer dashboard error:",
                err
            );

            setError(
                "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    }, [getConfig]);

    /* ==========================================
       LOAD DATA
    ========================================== */

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    /* ==========================================
       FORMAT CURRENCY
    ========================================== */

    const formatCurrency = (value) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "—";
        }

        const number = Number(value);

        if (Number.isNaN(number)) {
            return String(value);
        }

        return `ETB ${number.toLocaleString()}`;
    };

    /* ==========================================
       FORMAT DATE
    ========================================== */

    const formatDate = (value) => {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString();
    };

    /* ==========================================
       FORMAT TIME
    ========================================== */

    const formatTime = (value) => {
        if (!value) {
            return "—";
        }

        return String(value).substring(0, 5);
    };

    /* ==========================================
       PROPERTY IMAGE
    ========================================== */

    const getPropertyImage = (property) => {
        return (
            property.ImageURL ||
            property.imageURL ||
            property.ImagePath ||
            property.imagePath ||
            property.PropertyImage ||
            property.propertyImage ||
            property.Image ||
            property.image ||
            null
        );
    };

    /* ==========================================
       PROPERTY PRICE
    ========================================== */

const getPropertyPrice = (property) => {
    const salePrice =
        property.SalePrice ??
        property.salePrice;

    const monthlyRent =
        property.MonthlyRent ??
        property.monthlyRent;

    if (
        salePrice !== null &&
        salePrice !== undefined &&
        salePrice !== ""
    ) {
        return formatCurrency(salePrice);
    }

    if (
        monthlyRent !== null &&
        monthlyRent !== undefined &&
        monthlyRent !== ""
    ) {
        return `${formatCurrency(monthlyRent)} / month`;
    }

    return "Price not available";
};

    /* ==========================================
       LOADING
    ========================================== */

    if (loading) {
        return (
            <div className="customer-dashboard-loading">
                <Loader2
                    size={34}
                    className="loading-spinner"
                />

                <p>
                    Loading your dashboard...
                </p>
            </div>
        );
    }

    /* ==========================================
       PAGE
    ========================================== */

    return (
        <div className="customer-dashboard">

            {/* ======================================
                SIDEBAR
            ====================================== */}

            <aside className="customer-sidebar">

                {/* LOGO */}
                <div className="customer-logo">

                    <div className="customer-logo-icon">
                        <Building2 size={25} />
                    </div>

                    <div className="customer-logo-text">
                        <h2>REAL ESTATE</h2>

                        <span>
                            PROPERTY SALES, RENTAL
                            <br />
                            & MANAGEMENT SYSTEM
                        </span>
                    </div>

                </div>

                {/* NAVIGATION */}
                <nav className="customer-navigation">

                    <div className="customer-nav-title">
                        CUSTOMER MENU
                    </div>

                    {menuItems.map((item) => {

                        const isActive =
                            location.pathname ===
                            item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={
                                    isActive
                                        ? "customer-nav-item active"
                                        : "customer-nav-item"
                                }
                            >
                                <span className="nav-icon">
                                    {item.icon}
                                </span>

                                <span>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}

                </nav>

                {/* SIDEBAR BOTTOM */}
                <div className="customer-sidebar-bottom">

                    <div className="customer-sidebar-user">

                        <div className="sidebar-user-avatar">
                            {(
                                user.FullName ||
                                user.fullName ||
                                user.Name ||
                                "C"
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="sidebar-user-info">
                            <strong>
                                {user.FullName ||
                                    user.fullName ||
                                    user.Name ||
                                    "Customer"}
                            </strong>

                            <span>
                                Customer
                            </span>
                        </div>

                    </div>

                    <button
                        type="button"
                        className="customer-logout"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>

                </div>

            </aside>

            {/* ======================================
                MAIN CONTENT
            ====================================== */}

            <main className="customer-main">

                {/* HEADER */}
                <header className="customer-header">

                    <div className="customer-header-title">

                        <h1>
                            Customer Dashboard
                        </h1>

                        <p>
                            Welcome back,{" "}
                            <strong>
                                {user.FullName ||
                                    user.fullName ||
                                    user.Name ||
                                    "Customer"}
                            </strong>
                        </p>

                    </div>

                    <div className="customer-header-actions">

                        <button
                            type="button"
                            className="notification-button"
                            title="Notifications"
                        >
                            <Bell size={20} />

                            <span className="notification-dot"></span>
                        </button>

                        <div className="customer-user">

                            <div className="customer-user-avatar">
                                {(
                                    user.FullName ||
                                    user.fullName ||
                                    user.Name ||
                                    "C"
                                )
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div>
                                <strong>
                                    {user.FullName ||
                                        user.fullName ||
                                        user.Name ||
                                        "Customer"}
                                </strong>

                                <span>
                                    Customer
                                </span>
                            </div>

                        </div>

                    </div>

                </header>

                {/* ERROR */}

                {error && (
                    <div className="customer-dashboard-error">
                        {error}
                    </div>
                )}

                {/* ==================================
                    STAT CARDS
                ================================== */}

                <section className="customer-stats">

                    <div className="customer-stat-card">

                        <div className="customer-stat-icon">
                            <Building2 size={23} />
                        </div>

                        <div>
                            <span>
                                Available Properties
                            </span>

                            <strong>
                                {stats.availableProperties}
                            </strong>
                        </div>

                    </div>

                    <div className="customer-stat-card">

                        <div className="customer-stat-icon">
                            <CalendarCheck size={23} />
                        </div>

                        <div>
                            <span>
                                My Reservations
                            </span>

                            <strong>
                                {stats.myReservations}
                            </strong>
                        </div>

                    </div>

                    <div className="customer-stat-card">

                        <div className="customer-stat-icon">
                            <Calendar size={23} />
                        </div>

                        <div>
                            <span>
                                Upcoming Appointments
                            </span>

                            <strong>
                                {stats.upcomingAppointments}
                            </strong>
                        </div>

                    </div>

                    <div className="customer-stat-card">

                        <div className="customer-stat-icon">
                            <CreditCard size={23} />
                        </div>

                        <div>
                            <span>
                                Payment Records
                            </span>

                            <strong>
                                {stats.recentPayments}
                            </strong>
                        </div>

                    </div>

                </section>

                {/* ==================================
                    AVAILABLE PROPERTIES
                ================================== */}

                <section className="customer-section">

                    <div className="customer-section-header">

                        <div>
                            <div className="section-title-row">

                                <h2>
                                    Available Properties
                                </h2>

                                <span className="available-count">
                                    {featuredProperties.length}
                                </span>

                            </div>

                            <p>
                                Browse properties currently
                                available for sale or rental.
                            </p>
                        </div>

                        <Link
                            to="/customer/properties"
                            className="section-view-all"
                        >
                            View All
                            <ChevronRight size={16} />
                        </Link>

                    </div>

                    {featuredProperties.length === 0 ? (

                        <div className="customer-empty-state">

                            <div className="empty-icon">
                                <Building2 size={38} />
                            </div>

                            <h3>
                                No available properties
                            </h3>

                            <p>
                                There are currently no
                                available properties to
                                display.
                            </p>

                        </div>

                    ) : (

                        <div className="customer-property-grid">

                            {featuredProperties.map(
                                (property) => {

                                    const image =
                                        getPropertyImage(
                                            property
                                        );

                                    const propertyId =
                                        property.PropertyID ||
                                        property.propertyId ||
                                        property.id;

                                    return (
                                        <div
                                            className="customer-property-card"
                                            key={propertyId}
                                        >

                                            {/* IMAGE */}

                                            <div className="customer-property-image">

                                                {image ? (

                                                    <img
                                                        src={image}
                                                        alt={
                                                            property.PropertyName ||
                                                            "Property"
                                                        }
                                                    />

                                                ) : (

                                                    <div className="no-property-image">

                                                        <Building2
                                                            size={40}
                                                        />

                                                        <span>
                                                            No image
                                                            available
                                                        </span>

                                                    </div>

                                                )}

                                                <span className="property-status">
                                                    Available
                                                </span>

                                            </div>

                                            {/* CONTENT */}

                                            <div className="customer-property-content">

                                                <div className="property-type-label">
                                                    {property.PropertyType ||
                                                        "Property"}
                                                </div>

                                                <h3>
                                                    {property.PropertyName ||
                                                        property.propertyName ||
                                                        "Property"}
                                                </h3>

                                                <div className="property-location">

                                                    <MapPin
                                                        size={15}
                                                    />

                                                    <span>
                                                        {property.Address ||
                                                            property.address ||
                                                            "Address not available"}
                                                    </span>

                                                </div>

                                                <div className="property-card-bottom">

                                                    <div className="property-price">

                                                        <span>
                                                            Price
                                                        </span>

                                                        <strong>
                                                            {getPropertyPrice(
                                                                property
                                                            )}
                                                        </strong>

                                                    </div>

                                                   <div className="property-action-buttons">
    <Link
        to={`/customer/appointments?propertyId=${property.PropertyID}`}
        className="schedule-btn"
    >
        <CalendarCheck size={18} />
        Schedule Viewing
    </Link>

  <Link
    to={`/customer/reservations/new?propertyId=${property.PropertyID}`}
    className="reserve-btn"
>
    <Bookmark size={18} />
    Reserve This Property
</Link>

    {property.Status === "Available" && (
        <Link
            to={`/customer/purchase/${property.PropertyID}`}
            className="purchase-btn"
        >
            <ShoppingCart size={18} />
            Purchase Property
        </Link>
    )}
</div>
                                                        
                                                  

                                                </div>

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    )}

                </section>

                {/* ==================================
                    LOWER CONTENT
                ================================== */}

                <div className="customer-dashboard-columns">

                    {/* RESERVATIONS */}

                    <section className="customer-panel">

                        <div className="customer-panel-header">

                            <div>
                                <h2>
                                    My Reservations
                                </h2>

                                <p>
                                    Your recent property
                                    reservations.
                                </p>
                            </div>

                            <Link
                                to="/customer/reservations"
                                className="panel-link"
                            >
                                View All
                            </Link>

                        </div>

                        {reservations.length === 0 ? (

                            <div className="panel-empty">

                                <div className="panel-empty-icon">
                                    <CalendarCheck size={27} />
                                </div>

                                <p>
                                    You have no
                                    reservations yet.
                                </p>

                            </div>

                        ) : (

                            <div className="customer-list">

                                {reservations.map(
                                    (reservation) => (

                                        <div
                                            className="customer-list-item"
                                            key={
                                                reservation.ReservationID
                                            }
                                        >

                                            <div className="list-item-icon">
                                                <CalendarCheck
                                                    size={18}
                                                />
                                            </div>

                                            <div className="list-item-content">

                                                <strong>
                                                    {reservation.PropertyName ||
                                                        "Property"}
                                                </strong>

                                                <span>
                                                    Reservation date:{" "}
                                                    {formatDate(
                                                        reservation.ReservationDate
                                                    )}
                                                </span>

                                            </div>

                                            <span
                                                className={`status-badge ${String(
                                                    reservation.ReservationStatus ||
                                                        ""
                                                ).toLowerCase()}`}
                                            >
                                                {reservation.ReservationStatus ||
                                                    "Pending"}
                                            </span>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </section>

                    {/* APPOINTMENTS */}

                    <section className="customer-panel">

                        <div className="customer-panel-header">

                            <div>
                                <h2>
                                    Appointments
                                </h2>

                                <p>
                                    Your scheduled
                                    appointments.
                                </p>
                            </div>

                            <Link
                                to="/customer/appointments"
                                className="panel-link"
                            >
                                View All
                            </Link>

                        </div>

                        {appointments.length === 0 ? (

                            <div className="panel-empty">

                                <div className="panel-empty-icon">
                                    <Calendar size={27} />
                                </div>

                                <p>
                                    You have no
                                    appointments yet.
                                </p>

                            </div>

                        ) : (

                            <div className="customer-list">

                                {appointments.map(
                                    (appointment) => (

                                        <div
                                            className="customer-list-item"
                                            key={
                                                appointment.AppointmentID
                                            }
                                        >

                                            <div className="list-item-icon">
                                                <Calendar
                                                    size={18}
                                                />
                                            </div>

                                            <div className="list-item-content">

                                                <strong>
                                                    {appointment.PropertyName ||
                                                        "Property"}
                                                </strong>

                                                <span>
                                                    {formatDate(
                                                        appointment.AppointmentDate
                                                    )}{" "}
                                                    at{" "}
                                                    {formatTime(
                                                        appointment.AppointmentTime
                                                    )}
                                                </span>

                                            </div>

                                            <span
                                                className={`status-badge ${String(
                                                    appointment.Status ||
                                                        ""
                                                ).toLowerCase()}`}
                                            >
                                                {appointment.Status ||
                                                    "Pending"}
                                            </span>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </section>

                </div>

                {/* ==================================
                    PAYMENTS
                ================================== */}

                <section className="customer-panel customer-payments-panel">

                    <div className="customer-panel-header">

                        <div>
                            <h2>
                                Recent Payments
                            </h2>

                            <p>
                                Your latest payment
                                records.
                            </p>
                        </div>

                        <Link
                            to="/customer/payments"
                            className="panel-link"
                        >
                            View All
                        </Link>

                    </div>

                    {payments.length === 0 ? (

                        <div className="panel-empty">

                            <div className="panel-empty-icon">
                                <CreditCard size={27} />
                            </div>

                            <p>
                                You have no payment
                                records yet.
                            </p>

                        </div>

                    ) : (

                        <div className="payment-list">

                            {payments.map(
                                (payment) => (

                                    <div
                                        className="payment-item"
                                        key={
                                            payment.PaymentID
                                        }
                                    >

                                        <div className="payment-icon">
                                            <CreditCard
                                                size={18}
                                            />
                                        </div>

                                        <div className="payment-details">

                                            <strong>
                                                {payment.SalePropertyName ||
                                                    payment.RentalPropertyName ||
                                                    "Property Payment"}
                                            </strong>

                                            <span>
                                                {formatDate(
                                                    payment.PaymentDate
                                                )}{" "}
                                                •{" "}
                                                {payment.PaymentMethod ||
                                                    "Payment"}
                                            </span>

                                        </div>

                                        <div className="payment-amount">
                                            {formatCurrency(
                                                payment.Amount
                                            )}
                                        </div>

                                        <span
                                            className={`status-badge ${String(
                                                payment.PaymentStatus ||
                                                    ""
                                            ).toLowerCase()}`}
                                        >
                                            {payment.PaymentStatus ||
                                                "Pending"}
                                        </span>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </section>

                {/* ==================================
                    QUICK ACTIONS
                ================================== */}

                <section className="customer-quick-actions">

                    <Link
                        to="/customer/properties"
                        className="quick-action-card"
                    >
                        <div className="quick-action-icon">
                            <Search size={21} />
                        </div>

                        <div>
                            <strong>
                                Browse Properties
                            </strong>

                            <span>
                                Find a property to buy
                                or rent.
                            </span>
                        </div>

                        <ChevronRight size={18} />
                    </Link>

                    <Link
                        to="/customer/appointments"
                        className="quick-action-card"
                    >
                        <div className="quick-action-icon">
                            <Calendar size={21} />
                        </div>

                        <div>
                            <strong>
                                Schedule Appointment
                            </strong>

                            <span>
                                Arrange a property
                                viewing.
                            </span>
                        </div>

                        <ChevronRight size={18} />
                    </Link>

                    <Link
                        to="/customer/payments"
                        className="quick-action-card"
                    >
                        <div className="quick-action-icon">
                            <CreditCard size={21} />
                        </div>

                        <div>
                            <strong>
                                Payment History
                            </strong>

                            <span>
                                View your payment
                                records.
                            </span>
                        </div>

                        <ChevronRight size={18} />
                    </Link>

                </section>

            </main>
        </div>
    );
}

export default CustomerDashboard;