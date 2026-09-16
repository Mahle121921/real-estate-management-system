import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import {
    Home,
    LayoutDashboard,
    Users,
    Building2,
    UserCircle,
    Calendar,
    ShoppingCart,
    FileText,
    CalendarCheck,
    ClipboardList,
    BarChart3,
    Shield,
    Settings,
    LogOut,
    Search,
    Mail,
    Bell,
    ChevronDown,
    MapPin,
    Bookmark,
    CalendarPlus,
    CheckCircle2,
    Building,
    ChevronLeft,
} from "lucide-react";

import "./PropertyDetails.css";

function PropertyDetails() {
    const { id } = useParams();

const [property, setProperty] = useState(null);
const [loading, setLoading] = useState(true);
const [showReservationForm, setShowReservationForm] = useState(false);
const [reservationDate, setReservationDate] = useState("");
const [expiryDate, setExpiryDate] = useState("");
const [customerId, setCustomerId] = useState("");
const [customers, setCustomers] = useState([]);
const [customersLoading, setCustomersLoading] = useState(false);
const [reservationMessage, setReservationMessage] = useState("");
const [reservationError, setReservationError] = useState("");
const [reserving, setReserving] = useState(false);
const [error, setError] = useState("");
const user = JSON.parse(localStorage.getItem("user") || "{}");

// ==========================================
// FETCH PROPERTY
// ==========================================
useEffect(() => {
    const fetchProperty = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            const response = await axios.get(
                `http://localhost:5000/api/properties/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setProperty(response.data.property);
        } catch (err) {
            console.error("Failed to fetch property:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load property"
            );
        } finally {
            setLoading(false);
        }
    };

    fetchProperty();
}, [id]);

// ==========================================
// FETCH CUSTOMERS
// ==========================================
useEffect(() => {
    const fetchCustomers = async () => {
        try {
            setCustomersLoading(true);

            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5000/api/customers",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setCustomers(response.data.customers || []);
        } catch (err) {
            console.error("Failed to fetch customers:", err);

            setReservationError(
                err.response?.data?.message ||
                "Failed to load customers"
            );
        } finally {
            setCustomersLoading(false);
        }
    };

    fetchCustomers();
}, []);
    // ==========================================
    // LOGOUT
    // ==========================================
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/";
    };
    const handleReserve = async () => {
  setReservationMessage("");
  setReservationError("");

  if (!customerId || !reservationDate || !expiryDate) {
    setReservationError(
      "Customer ID, reservation date, and expiry date are required."
    );
    return;
  }

  if (new Date(expiryDate) < new Date(reservationDate)) {
    setReservationError(
      "Expiry date cannot be before reservation date."
    );
    return;
  }

  try {
    setReserving(true);

    const token = localStorage.getItem("token");

    const response = await axios.post(
    "http://localhost:5000/api/reservations",
    {
        customerId: Number(customerId),
        propertyId: Number(id),
        HandledBy: Number(user.userId || user.UserID),
        reservationDate,
        expiryDate,
        reservationStatus: "Pending",
        remarks: "Reservation created from Property Details"
    },
    {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
);

    setReservationMessage(
      response.data.message || "Reservation created successfully."
    );

    setShowReservationForm(false);

  } catch (err) {
    console.error("Reservation error:", err);

    setReservationError(
      err.response?.data?.message ||
      "Failed to create reservation."
    );
  } finally {
    setReserving(false);
  }
};

    // ==========================================
    // SIDEBAR
    // ==========================================
    const menuItems = [
        { name: "Home", icon: <Home size={18} /> },
        { name: "Dashboard", icon: <LayoutDashboard size={18} /> },
        { name: "Owners", icon: <Users size={18} />, hasSub: true },
        {
            name: "Properties",
            icon: <Building2 size={18} />,
            hasSub: true,
            active: true,
        },
        { name: "Buildings", icon: <Building size={18} /> },
        { name: "Users", icon: <UserCircle size={18} />, hasSub: true },
        { name: "Events", icon: <Calendar size={18} /> },
        { name: "Reservations", icon: <CalendarCheck size={18} /> },
        {
            name: "Sales",
            icon: <ShoppingCart size={18} />,
            hasSub: true,
        },
        { name: "Rentals", icon: <FileText size={18} /> },
        { name: "Customers", icon: <Users size={18} /> },
        { name: "Appointments", icon: <Calendar size={18} /> },
        { name: "Applications", icon: <ClipboardList size={18} /> },
        {
            name: "Reports",
            icon: <BarChart3 size={18} />,
            hasSub: true,
        },
        { name: "Activity Log", icon: <Shield size={18} /> },
        { name: "Settings", icon: <Settings size={18} /> },
    ];

    // ==========================================
    // LOADING
    // ==========================================
    if (loading) {
        return (
            <div className="property-details-message">
                Loading property...
            </div>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================
    if (error) {
        return (
            <div className="property-details-message error">
                {error}
            </div>
        );
    }

    // ==========================================
    // PROPERTY NOT FOUND
    // ==========================================
    if (!property) {
        return (
            <div className="property-details-message">
                Property not found.
            </div>
        );
    }

    // ==========================================
    // FORMAT PRICE
    // ==========================================
    const salePrice = property.SalePrice
        ? `${Number(property.SalePrice).toLocaleString()} ETB`
        : "Not available";

    const monthlyRent = property.MonthlyRent
        ? `${Number(property.MonthlyRent).toLocaleString()} ETB / month`
        : "Not available";

    return (
        <div className="pd-container">

            {/* ==========================================
                SIDEBAR
            ========================================== */}
            <aside className="pd-sidebar">

                <div className="pd-logo">
                    <Building2 size={28} />

                    <div>
                        <h2>REAL ESTATE</h2>
                        <p>
                            PROPERTY SALES, RENTAL & MANAGEMENT SYSTEM
                        </p>
                    </div>
                </div>

                <nav className="pd-nav">

                    {menuItems.map((item) => (
                        <div
                            key={item.name}
                            className={`pd-menu-item ${
                                item.active ? "active" : ""
                            }`}
                        >
                            <span className="pd-menu-icon">
                                {item.icon}
                            </span>

                            <span>{item.name}</span>

                            {item.hasSub && (
                                <ChevronDown
                                    size={14}
                                    className="chevron"
                                />
                            )}
                        </div>
                    ))}

                </nav>

                <button
                    className="pd-logout"
                    onClick={handleLogout}
                >
                    <LogOut size={18} />
                    Logout
                </button>

            </aside>

            {/* ==========================================
                MAIN
            ========================================== */}
            <main className="pd-main">

                {/* ==========================================
                    HEADER
                ========================================== */}
                <header className="pd-header">

                    <div className="pd-welcome">
                        <span className="welcome-text">
                            Welcome!
                        </span>

                        <span className="system-name">
                            Property management system
                        </span>
                    </div>

                    <div className="pd-header-right">

                        <div className="pd-search">
                            <Search size={16} />

                            <input
                                placeholder="Search properties, customers, reservations..."
                            />
                        </div>

                        <button className="pd-icon-btn">
                            <Mail size={18} />
                        </button>

                        <button className="pd-icon-btn notification">
                            <Bell size={18} />

                            <span className="badge">
                                3
                            </span>
                        </button>

                        <div className="pd-user">

                            <div className="pd-avatar">
                                {user?.fullName
                                    ?.charAt(0)
                                    ?.toUpperCase() || "A"}
                            </div>

                            <ChevronDown size={16} />

                        </div>

                    </div>

                </header>

                {/* ==========================================
                    CONTENT
                ========================================== */}
                <div className="pd-content">

                    {/* BACK */}
                    <Link
                        to="/properties"
                        className="back-link"
                    >
                        <ChevronLeft size={16} />
                        Back to Properties
                    </Link>

                    {/* ==========================================
                        PROPERTY HEADER
                    ========================================== */}
                    <div className="property-header">

                        <div className="property-title-row">

                            <div>

                                <h1>
                                    {property.PropertyName}
                                </h1>

                                <div className="location">
                                    <MapPin size={16} />

                                    {property.Address}
                                </div>

                            </div>

                            <span
                                className={`status-badge ${property.Status
                                    ?.toLowerCase()
                                    .replace(" ", "-")}`}
                            >
                                {property.Status}
                            </span>

                        </div>

                        {/* PRICE */}
                        <div className="price-section">

                            <div className="main-price">
                                {salePrice}
                            </div>

                            <div className="monthly-rent">
                                Monthly Rent:{" "}
                                {monthlyRent}
                            </div>

                        </div>
<div className="action-buttons">

    {/* SUCCESS MESSAGE */}
    {reservationMessage && (
        <p className="reservation-success">
            {reservationMessage}
        </p>
    )}

    {/* RESERVATION FORM */}
    {showReservationForm && (
        <div className="reservation-form">

            <h3>Reserve Property</h3>

<div className="form-group">
    <label>Customer</label>

    <select
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
        disabled={customersLoading}
    >
        <option value="">
            {customersLoading
                ? "Loading customers..."
                : "Select customer"}
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

            {/* RESERVATION DATE */}
            <div className="form-group">
                <label>Reservation Date</label>

                <input
                    type="date"
                    value={reservationDate}
                    onChange={(e) =>
                        setReservationDate(e.target.value)
                    }
                />
            </div>

            {/* EXPIRY DATE */}
            <div className="form-group">
                <label>Expiry Date</label>

                <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) =>
                        setExpiryDate(e.target.value)
                    }
                />
            </div>

            {/* ERROR MESSAGE */}
            {reservationError && (
                <p className="reservation-error">
                    {reservationError}
                </p>
            )}

            {/* FORM BUTTONS */}
            <div className="reservation-form-actions">

                <button
                    className="btn-confirm-reservation"
                    onClick={handleReserve}
                    disabled={reserving}
                >
                    {reserving
                        ? "Reserving..."
                        : "Confirm Reservation"}
                </button>

                <button
                    className="btn-cancel-reservation"
                    onClick={() => {
                        setShowReservationForm(false);
                        setReservationError("");
                    }}
                    disabled={reserving}
                >
                    Cancel
                </button>

            </div>

        </div>
    )}

    {/* RESERVE BUTTON */}
    {property.Status === "Available" && (
        <button
            className="btn-reserve"
            onClick={() => {
                setShowReservationForm(true);
                setReservationMessage("");
                setReservationError("");
            }}
        >
            <Bookmark size={16} />
            Reserve Property
        </button>
    )}

    {/* APPOINTMENT BUTTON */}
    <button className="btn-appointment">
        <CalendarPlus size={16} />
        Schedule Appointment
    </button>

</div>

                        {/* META */}
                        <div className="meta-badges">

                            <div className="meta-item">
                                <FileText size={14} />

                                Property ID:{" "}
                                {property.PropertyID}
                            </div>

                            <div className="meta-item">
                                <Building size={14} />

                                Property Type:{" "}
                                {property.PropertyType}
                            </div>

                            <div className="meta-item">
                                <Users size={14} />

                                Owner:{" "}
                                {property.OwnerName}
                            </div>

                        </div>

                    </div>

                    {/* ==========================================
                        DETAILS GRID
                    ========================================== */}
                    <div className="details-grid">

                        {/* STATUS */}
                        <div className="detail-card">

                            <div className="detail-card-icon">
                                <CheckCircle2 size={22} />
                            </div>

                            <div>
                                <span>
                                    Property Status
                                </span>

                                <strong>
                                    {property.Status}
                                </strong>
                            </div>

                        </div>

                        {/* PROPERTY TYPE */}
                        <div className="detail-card">

                            <div className="detail-card-icon">
                                <Building size={22} />
                            </div>

                            <div>
                                <span>
                                    Property Type
                                </span>

                                <strong>
                                    {property.PropertyType}
                                </strong>
                            </div>

                        </div>

                        {/* OWNER */}
                        <div className="detail-card">

                            <div className="detail-card-icon">
                                <Users size={22} />
                            </div>

                            <div>
                                <span>
                                    Owner
                                </span>

                                <strong>
                                    {property.OwnerName}
                                </strong>
                            </div>

                        </div>

                        {/* SALE PRICE */}
                        <div className="detail-card">

                            <div className="detail-card-icon">
                                <ShoppingCart size={22} />
                            </div>

                            <div>
                                <span>
                                    Sale Price
                                </span>

                                <strong>
                                    {salePrice}
                                </strong>
                            </div>

                        </div>

                    </div>

                    {/* ==========================================
                        PROPERTY INFORMATION
                    ========================================== */}
                    <div className="property-info-grid">

                        {/* LEFT */}
                        <div className="info-panel">

                            <h2>
                                Property Information
                            </h2>

                            <div className="info-row">

                                <span>
                                    Property ID
                                </span>

                                <strong>
                                    {property.PropertyID}
                                </strong>

                            </div>

                            <div className="info-row">

                                <span>
                                    Property Name
                                </span>

                                <strong>
                                    {property.PropertyName}
                                </strong>

                            </div>

                            <div className="info-row">

                                <span>
                                    Property Type
                                </span>

                                <strong>
                                    {property.PropertyType}
                                </strong>

                            </div>

                            <div className="info-row">

                                <span>
                                    Owner
                                </span>

                                <strong>
                                    {property.OwnerName}
                                </strong>

                            </div>

                            <div className="info-row">

                                <span>
                                    Address
                                </span>

                                <strong>
                                    {property.Address}
                                </strong>

                            </div>

                            <div className="info-row">

                                <span>
                                    Sale Price
                                </span>

                                <strong>
                                    {salePrice}
                                </strong>

                            </div>

                            <div className="info-row">

                                <span>
                                    Monthly Rent
                                </span>

                                <strong>
                                    {monthlyRent}
                                </strong>

                            </div>

                            <div className="info-row">

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {property.Status}
                                </strong>

                            </div>

                        </div>

                        {/* RIGHT */}
                        <div className="description-panel">

                            <h2>
                                Property Description
                            </h2>

                            <p>
                                {property.Description ||
                                    "No description available."}
                            </p>

                        </div>

                    </div>

                    {/* ==========================================
                        LOCATION
                    ========================================== */}
                    <div className="location-panel">

                        <h2>
                            <MapPin size={20} />
                            Property Location
                        </h2>

                        <p>
                            {property.Address}
                        </p>

                        <div className="map-placeholder">

                            <MapPin size={40} />

                            <span>
                                Map location
                            </span>

                            <small>
                                {property.Address}
                            </small>

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default PropertyDetails;