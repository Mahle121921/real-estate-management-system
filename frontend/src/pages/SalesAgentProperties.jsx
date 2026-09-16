import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import {
    Users,
    Building2,
    CalendarCheck,
    ShoppingCart,
    Bell,
    UserPlus,
    ArrowRight,
    TrendingUp,
    Clock3,
    BriefcaseBusiness,
    FileText,
    RefreshCw,
    Search,
    X,
    Home,
    MapPin,
    DollarSign,
    Eye,
    UserRound
} from "lucide-react";

import "./SalesAgentProperties.css";

const API_URL = "http://localhost:5000/api";

function SalesAgentProperties() {
    const [properties, setProperties] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [propertyType, setPropertyType] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedProperty, setSelectedProperty] = useState(null);

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");

    // ==========================================
    // LOAD AVAILABLE PROPERTIES
    // ==========================================
    const loadProperties = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/properties`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = response.data;

            if (data.success) {
              setProperties(data.properties || []);
}else {
                setError(data.message || "Failed to load properties.");
            }
        } catch (err) {
            console.error("Load properties error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load properties. Please check the server."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            loadProperties();
        } else {
            setLoading(false);
            setError("You are not logged in.");
        }
    }, [token]);

    // ==========================================
    // PROPERTY TYPES
    // ==========================================
    const propertyTypes = useMemo(() => {
        const types = properties
            .map((property) => property.PropertyType)
            .filter(Boolean);

        return ["All", ...new Set(types)];
    }, [properties]);

    // ==========================================
// UPDATE PROPERTY STATUS
// ==========================================
const updatePropertyStatus = async (propertyId, newStatus) => {
    try {
        setError("");

        const response = await axios.patch(
            `${API_URL}/properties/${propertyId}/status`,
            {
                status: newStatus
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data.success) {
            await loadProperties();

            setSelectedProperty((current) =>
                current
                    ? {
                        ...current,
                        Status: newStatus
                    }
                    : null
            );
        } else {
            setError(
                response.data.message ||
                "Failed to update property status."
            );
        }

    } catch (err) {
        console.error("Update property status error:", err);

        setError(
            err.response?.data?.message ||
            "Unable to update property status."
        );
    }
};
    // ==========================================
    // FILTER PROPERTIES
    // ==========================================
    const filteredProperties = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return properties.filter((property) => {
            const matchesSearch =
                !search ||
                String(property.PropertyName || "")
                    .toLowerCase()
                    .includes(search) ||
                String(property.PropertyType || "")
                    .toLowerCase()
                    .includes(search) ||
                String(property.Address || "")
                    .toLowerCase()
                    .includes(search) ||
                String(property.Description || "")
                    .toLowerCase()
                    .includes(search);

            const matchesType =
                propertyType === "All" ||
                property.PropertyType === propertyType;

            return matchesSearch && matchesType;
        });
    }, [properties, searchTerm, propertyType]);

    // ==========================================
    // FORMAT PRICE
    // ==========================================
    const formatPrice = (price) => {
        if (price === null || price === undefined || price === "") {
            return "Price not specified";
        }

        return `${Number(price).toLocaleString()} ETB`;
    };

    return (
        <div className="sales-properties-page">

            {/* ==========================================
                HEADER
            ========================================== */}
            <div className="sales-properties-header">
                <div>
                    <div className="sales-properties-title-row">
                        <div className="sales-properties-title-icon">
                            <Building2 size={25} />
                        </div>

                        <div>
                            <h1>Available Properties</h1>
                            <p>
                                Search and find properties available for sale
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="refresh-properties-btn"
                    onClick={loadProperties}
                    disabled={loading}
                >
                    <RefreshCw
                        size={17}
                        className={loading ? "spinning" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* ==========================================
                SEARCH / FILTER
            ========================================== */}
            <div className="property-search-panel">

                <div className="property-search-box">
                    <Search size={20} />

                    <input
                        type="text"
                        placeholder="Search by property name, type, address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {searchTerm && (
                        <button
                            className="clear-search-btn"
                            onClick={() => setSearchTerm("")}
                        >
                            <X size={17} />
                        </button>
                    )}
                </div>

                <div className="property-type-filter">
                    <label>Property Type</label>

                    <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                    >
                        {propertyTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ==========================================
                SUMMARY
            ========================================== */}
            <div className="property-results-summary">
                <div>
                    <strong>{filteredProperties.length}</strong>
                    <span> available properties</span>
                </div>

                {(searchTerm || propertyType !== "All") && (
                    <button
                        onClick={() => {
                            setSearchTerm("");
                            setPropertyType("All");
                        }}
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* ==========================================
                ERROR
            ========================================== */}
            {error && (
                <div className="property-error">
                    <strong>Unable to load properties</strong>
                    <p>{error}</p>

                    <button onClick={loadProperties}>
                        Try Again
                    </button>
                </div>
            )}

            {/* ==========================================
                LOADING
            ========================================== */}
            {loading && (
                <div className="property-loading">
                    <RefreshCw size={30} className="spinning" />
                    <p>Loading available properties...</p>
                </div>
            )}

            {/* ==========================================
                EMPTY
            ========================================== */}
            {!loading &&
                !error &&
                filteredProperties.length === 0 && (
                    <div className="property-empty">
                        <div className="property-empty-icon">
                            <Building2 size={38} />
                        </div>

                        <h2>No available properties found</h2>

                        <p>
                            Try another search term or select a different
                            property type.
                        </p>
                    </div>
                )}

            {/* ==========================================
                PROPERTY GRID
            ========================================== */}
            {!loading &&
                !error &&
                filteredProperties.length > 0 && (
                    <div className="sales-property-grid">
                        {filteredProperties.map((property) => (
                            <div
                                className="sales-property-card"
                                key={property.PropertyID}
                            >
                                <div className="property-card-top">
                                    <div className="property-card-icon">
                                        <Home size={23} />
                                    </div>
<span className={`status-badge status-${String(property.Status || "Available").toLowerCase()}`}>
    {property.Status}
</span>
                                </div>
                                <div className="property-status-control">
    <label>Property Status</label>

    <select
        value={property.Status || "Available"}
        onChange={(e) =>
            updatePropertyStatus(
                property.PropertyID,
                e.target.value
            )
        }
    >
        <option value="Available">Available</option>
        <option value="Reserved">Reserved</option>
        <option value="Sold">Sold</option>
        <option value="Rented">Rented</option>
    </select>
</div>

                                <div className="property-card-body">
                                    <span className="property-type">
                                        {property.PropertyType}
                                    </span>

                                    <h2>
                                        {property.PropertyName}
                                    </h2>

                                    <div className="property-location">
                                        <MapPin size={16} />
                                        <span>
                                            {property.Address ||
                                                "Address not specified"}
                                        </span>
                                    </div>
<Link
    to="/sales/rental-agreements"
    className="sales-agent-action rental-action"
>
    <div className="action-icon">
        <FileText size={25} />
    </div>

    <div className="action-content">
        <span className="action-number">
            05
        </span>

        <h3>
            Rental Agreements
        </h3>

        <p>
            Create and manage customer rental agreements.
        </p>
    </div>

    <ArrowRight
        className="action-arrow"
        size={20}
    />
</Link>
                                    <div className="property-price">
                                        <DollarSign size={18} />

                                        <div>
                                            <small>Sale Price</small>
                                            <strong>
                                                {formatPrice(
                                                    property.SalePrice
                                                )}
                                            </strong>
                                        </div>
                                    </div>

                                    {property.Description && (
                                        <p className="property-description">
                                            {property.Description}
                                        </p>
                                    )}

                                    <button
                                        className="view-property-btn"
                                        onClick={() =>
                                            setSelectedProperty(property)
                                        }
                                    >
                                        <Eye size={17} />
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            {/* ==========================================
                PROPERTY DETAILS MODAL
            ========================================== */}
            {selectedProperty && (
                <div
                    className="property-modal-overlay"
                    onClick={() => setSelectedProperty(null)}
                >
                    <div
                        className="property-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="property-modal-header">
                            <div>
                                <span>Property Details</span>
                                <h2>
                                    {selectedProperty.PropertyName}
                                </h2>
                            </div>

                            <button
                                className="property-modal-close"
                                onClick={() =>
                                    setSelectedProperty(null)
                                }
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="property-modal-content">

                            <div className="modal-status-row">
                                <span className="available-badge">
                                    {selectedProperty.Status}
                                </span>

                                <span className="modal-property-type">
                                    {selectedProperty.PropertyType}
                                </span>
                            </div>

                            <div className="modal-detail">
                                <MapPin size={19} />
                                <div>
                                    <small>Address</small>
                                    <strong>
                                        {selectedProperty.Address ||
                                            "Not specified"}
                                    </strong>
                                </div>
                            </div>

                            <div className="modal-detail">
                                <DollarSign size={19} />
                                <div>
                                    <small>Sale Price</small>
                                    <strong>
                                        {formatPrice(
                                            selectedProperty.SalePrice
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <div className="modal-detail">
                                <UserRound size={19} />
                                <div>
                                    <small>Property Owner</small>
                                    <strong>
                                        {selectedProperty.OwnerName ||
                                            "Not specified"}
                                    </strong>
                                </div>
                            </div>

                            {selectedProperty.Description && (
                                <div className="modal-description">
                                    <small>Description</small>
                                    <p>
                                        {selectedProperty.Description}
                                    </p>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    className="modal-close-btn"
                                    onClick={() =>
                                        setSelectedProperty(null)
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    className="modal-reservation-btn"
                                    onClick={() => {
                                        alert(
                                            "Reservation functionality will be connected next."
                                        );
                                    }}
                                >
                                    Continue to Reservation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SalesAgentProperties;
