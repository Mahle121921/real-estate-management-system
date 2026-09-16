import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
    Building2,
    CalendarCheck,
    CreditCard,
    Home,
    LogOut,
    Search,
    MapPin,
    Eye,
    Loader2
} from "lucide-react";

import "./CustomerProperties.css";

const API_BASE = "http://localhost:5000/api";

function CustomerProperties() {
    const navigate = useNavigate();

    const [properties, setProperties] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");

    const getConfig = useCallback(() => ({
        headers: {
            Authorization: `Bearer ${token}`
        }
    }), [token]);

    const loadProperties = useCallback(async (search = "") => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_BASE}/properties/search`,
                {
                    ...getConfig(),
                    params: search.trim()
                        ? { q: search.trim() }
                        : {}
                }
            );

            setProperties(
                response.data.properties || []
            );

        } catch (err) {
            console.error(
                "Load customer properties error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load available properties."
            );
        } finally {
            setLoading(false);
        }
    }, [getConfig]);

    useEffect(() => {
        loadProperties();
    }, [loadProperties]);

    const handleSearch = (e) => {
        e.preventDefault();
        loadProperties(searchTerm);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <div className="customer-properties-page">

            {/* ================= SIDEBAR ================= */}

            <aside className="customer-sidebar">

                <div className="customer-sidebar-logo">
                    <Building2 size={30} />

                    <div>
                        <h2>REAL ESTATE</h2>
                        <span>
                            PROPERTY SALES, RENTAL
                            <br />
                            & MANAGEMENT SYSTEM
                        </span>
                    </div>
                </div>

                <nav className="customer-sidebar-nav">

                    <Link to="/customer-dashboard">
                        <Home size={19} />
                        Dashboard
                    </Link>

                    <Link
                        to="/properties"
                        className="active"
                    >
                        <Building2 size={19} />
                        Browse Properties
                    </Link>

                    <Link to="/customer/reservations">
                        <CalendarCheck size={19} />
                        My Reservations
                    </Link>

                    <Link to="/customer/appointments">
                        <CalendarCheck size={19} />
                        Appointments
                    </Link>

                    <Link to="/customer/payments">
                        <CreditCard size={19} />
                        Payments
                    </Link>

                </nav>

                <button
                    className="customer-logout-button"
                    onClick={handleLogout}
                >
                    <LogOut size={19} />
                    Logout
                </button>

            </aside>

            {/* ================= MAIN CONTENT ================= */}

            <main className="customer-properties-main">

                <header className="customer-properties-header">

                    <div>
                        <h1>Browse Available Properties</h1>

                        <p>
                            Search and explore properties
                            available for sale or rent.
                        </p>
                    </div>

                    <div className="customer-welcome">
                        Welcome, {user?.fullName || user?.FullName || "Customer"}
                    </div>

                </header>

                {/* ================= SEARCH ================= */}

                <section className="property-search-section">

                    <form
                        className="property-search-form"
                        onSubmit={handleSearch}
                    >

                        <div className="property-search-input">

                            <Search size={20} />

                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                }
                                placeholder="Search by property name, type, location..."
                            />

                        </div>

                        <button
                            type="submit"
                            className="property-search-button"
                        >
                            <Search size={18} />
                            Search
                        </button>

                    </form>

                </section>

                {/* ================= RESULTS ================= */}

                <section className="property-results-section">

                    <div className="property-results-header">

                        <h2>
                            Available Properties
                        </h2>

                        <span>
                            {properties.length} properties found
                        </span>

                    </div>

                    {loading ? (

                        <div className="property-loading">
                            <Loader2
                                size={30}
                                className="loading-icon"
                            />
                            <p>
                                Loading available properties...
                            </p>
                        </div>

                    ) : error ? (

                        <div className="property-error">
                            {error}
                        </div>

                    ) : properties.length === 0 ? (

                        <div className="property-empty">

                            <Building2 size={45} />

                            <h3>
                                No properties found
                            </h3>

                            <p>
                                Try another search term or
                                check again later.
                            </p>

                        </div>

                    ) : (

                        <div className="customer-property-grid">

                            {properties.map((property) => (

                                <div
                                    className="customer-property-card"
                                    key={property.PropertyID}
                                >

                                    <div className="property-card-icon">
                                        <Building2 size={38} />
                                    </div>

                                    <div className="property-card-content">

                                        <div className="property-card-title-row">

                                            <h3>
                                                {property.PropertyName}
                                            </h3>

                                            <span className="available-badge">
                                                Available
                                            </span>

                                        </div>

                                        <div className="property-card-info">

                                            <p>
                                                <Building2 size={16} />
                                                {property.PropertyType}
                                            </p>

                                            <p>
                                                <MapPin size={16} />
                                                {property.Address}
                                            </p>

                                        </div>

                                        <div className="property-card-prices">

                                            {property.SalePrice && (
                                                <div>
                                                    <span>
                                                        Sale Price
                                                    </span>

                                                    <strong>
                                                        ETB{" "}
                                                        {Number(
                                                            property.SalePrice
                                                        ).toLocaleString()}
                                                    </strong>
                                                </div>
                                            )}

                                            {property.MonthlyRent && (
                                                <div>
                                                    <span>
                                                        Monthly Rent
                                                    </span>

                                                    <strong>
                                                        ETB{" "}
                                                        {Number(
                                                            property.MonthlyRent
                                                        ).toLocaleString()}
                                                        /month
                                                    </strong>
                                                </div>
                                            )}

                                        </div>

                                        {property.Description && (
                                            <p className="property-description">
                                                {property.Description}
                                            </p>
                                        )}
<Link
    to={`/customer/properties/${property.PropertyID}`}
    className="view-property-button"
>
                                            <Eye size={17} />
                                            View Details
                                        </Link>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}

export default CustomerProperties;