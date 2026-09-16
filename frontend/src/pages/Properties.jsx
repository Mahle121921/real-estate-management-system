import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
    Building2,
    Search,
    MapPin,
    User,
    Eye,
    Plus,
} from "lucide-react";

import "./Properties.css";

function Properties() {
    const [properties, setProperties] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

 // ==========================================
// GET PROPERTY IMAGE
// ==========================================
const getPropertyImage = (imagePath, propertyType) => {

    // Use actual uploaded image from database
    if (imagePath) {
        const cleanPath = imagePath
            .replace(/^\/+/, "")
            .replace(/^uploads[\\/]/i, "")
            .replace(/\\/g, "/");

        return `http://localhost:5000/uploads/${cleanPath}`;
    }

    // Fallback image if no uploaded image exists
    switch (propertyType) {
        case "Commercial Building":
            return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80";

        case "Apartment":
            return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80";

        case "Villa":
            return "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=80";

        case "Residential House":
            return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80";

        default:
            return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80";
    }
};
    // ==========================================
    // FORMAT PRICE
    // ==========================================
    const formatPrice = (price) => {
        if (price === null || price === undefined || price === "") {
            return "Price not available";
        }

        return `ETB ${Number(price).toLocaleString()}`;
    };

    // ==========================================
    // FETCH PROPERTIES
    // ==========================================
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                setLoading(true);
                setError("");

                const token = localStorage.getItem("token");

                if (!token) {
                    setError("You are not logged in.");
                    return;
                }

                const response = await axios.get(
                    "http://localhost:5000/api/properties",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data.success) {
                    setProperties(response.data.properties || []);
                } else {
                    setError(
                        response.data.message ||
                        "Failed to retrieve properties"
                    );
                }

            } catch (err) {
                console.error("Get properties error:", err);

                setError(
                    err.response?.data?.message ||
                    "Failed to load properties. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    // ==========================================
    // SEARCH / FILTER
    // ==========================================
    const filteredProperties = properties.filter((property) => {
        const searchTerm = search.toLowerCase();

        return (
            property.PropertyName?.toLowerCase().includes(searchTerm) ||
            property.OwnerName?.toLowerCase().includes(searchTerm) ||
            property.PropertyType?.toLowerCase().includes(searchTerm) ||
            property.Address?.toLowerCase().includes(searchTerm) ||
            property.Status?.toLowerCase().includes(searchTerm)
        );
    });

    // ==========================================
    // PAGE
    // ==========================================
    return (
        <div className="properties-page">

            {/* PAGE HEADER */}
            <div className="properties-header">

                <div>
                    <h1>Properties</h1>

                    <p>
                        Manage and view all registered properties
                    </p>
                </div>

              <Link
    to="/properties/add"
    className="add-property-btn"
>
    <Plus size={18} />
    Add Property
</Link>

            </div>

            {/* SEARCH */}
            <div className="properties-toolbar">

                <div className="property-search">

                    <Search size={19} />

                    <input
                        type="text"
                        placeholder="Search properties, owners, type or location..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                </div>

                <div className="property-count">
                    {filteredProperties.length} Properties
                </div>

            </div>

            {/* ERROR */}
            {error && (
                <div className="properties-error">
                    {error}
                </div>
            )}

            {/* LOADING */}
            {loading && (
                <div className="properties-message">
                    Loading properties...
                </div>
            )}

            {/* EMPTY */}
            {!loading &&
                !error &&
                filteredProperties.length === 0 && (
                    <div className="properties-message">
                        {search
                            ? "No properties match your search."
                            : "No properties found."}
                    </div>
                )}

            {/* PROPERTY GRID */}
            {!loading &&
                filteredProperties.length > 0 && (
                    <div className="property-grid">

                        {filteredProperties.map((property) => (

                            <div
                                className="property-card"
                                key={property.PropertyID}
                            >

                                {/* IMAGE */}
                                <div className="property-image">
<img
    src={getPropertyImage(
        property.ImagePath,
        property.PropertyType
    )}
    alt={property.PropertyName}
/>

                                    <span
                                        className={`property-status ${property.Status
                                            ?.toLowerCase()
                                            .replace(/\s+/g, "-")}`}
                                    >
                                        {property.Status}
                                    </span>

                                </div>

                                {/* CONTENT */}
                                <div className="property-card-content">

                                    <h2>
                                        {property.PropertyName}
                                    </h2>

                                    {/* LOCATION */}
                                    <div className="property-location">

                                        <MapPin size={15} />

                                        <span>
                                            {property.Address}
                                        </span>

                                    </div>

                                    {/* TYPE */}
                                    <div className="property-type">

                                        <Building2 size={15} />

                                        <span>
                                            {property.PropertyType}
                                        </span>

                                    </div>

                                    {/* OWNER */}
                                    <div className="property-owner">

                                        <User size={15} />

                                        <span>
                                            Owner: {property.OwnerName}
                                        </span>

                                    </div>

                                    {/* PRICE */}
                                    <div className="property-price">

                                        {property.SalePrice
                                            ? formatPrice(
                                                property.SalePrice
                                            )
                                            : property.MonthlyRent
                                                ? `${formatPrice(
                                                    property.MonthlyRent
                                                )} / month`
                                                : "Price not available"}

                                    </div>

                                    {/* VIEW DETAILS */}
                                    <Link
                                        to={`/properties/${property.PropertyID}`}
                                        className="view-property-btn"
                                    >
                                        <Eye size={17} />
                                        View Details
                                    </Link>

                                </div>

                            </div>

                        ))}

                    </div>
                )}

        </div>
    );
}

export default Properties;