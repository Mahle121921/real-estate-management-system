import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
    Home,
    Building2,
    DollarSign,
    Wrench,
    Calendar,
    CalendarCheck,
    FileText,
    ShoppingCart,
    CreditCard,
    BarChart3,
    Settings,
    Search,
    Mail,
    Bell,
    ChevronDown,
    ChevronLeft,
    Plus,
    Eye,
    Edit,
    RefreshCw,
    MapPin,
} from "lucide-react";

import "./OwnerProperties.css";

function OwnerProperties() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    let user = {};

    try {
        user = storedUser ? JSON.parse(storedUser) : {};
    } catch (error) {
        console.error("Failed to parse stored user:", error);
        user = {};
    }

    const userName =
        user?.FullName ||
        user?.fullName ||
        user?.name ||
        "Owner User";

    const [owner, setOwner] = useState(null);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
     
    // =====================================================
// PROPERTY IMAGE UPLOAD
// =====================================================

const [selectedProperty, setSelectedProperty] = useState(null);
const [selectedImage, setSelectedImage] = useState(null);
const [imageCaption, setImageCaption] = useState("");
const [uploadingImage, setUploadingImage] = useState(false);
const [imageUploadError, setImageUploadError] = useState("");
const [imageUploadSuccess, setImageUploadSuccess] = useState("");

const imageInputRef = useRef(null);

    // =====================================================
    // AXIOS CONFIG
    // =====================================================

    const config = useMemo(
        () => ({
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
        [token]
    );

    // =====================================================
    // FETCH OWNER + PROPERTIES
    // =====================================================

    const fetchOwnerProperties = useCallback(async () => {
        if (!token) {
            navigate("/", { replace: true });
            return null;
        }

        const ownerResponse = await axios.get(
            "http://localhost:5000/api/owners/me",
            config
        );

        const ownerData =
            ownerResponse.data?.owner ||
            ownerResponse.data?.data;

        if (!ownerData?.OwnerID) {
            throw new Error("Owner profile was not found.");
        }

        const propertiesResponse = await axios.get(
            `http://localhost:5000/api/owners/${ownerData.OwnerID}/properties`,
            config
        );

        const propertyData =
            propertiesResponse.data?.properties ||
            propertiesResponse.data?.data ||
            [];

        return {
            owner: ownerData,
            properties: Array.isArray(propertyData)
                ? propertyData
                : [],
        };
    }, [token, navigate, config]);

    // =====================================================
    // ERROR HANDLER
    // =====================================================

    const handleLoadError = useCallback(
        (err) => {
            console.error("Owner properties error:", err);

            if (!err.response) {
                setError(
                    "Cannot connect to the backend server. Make sure your Node.js server is running on port 5000."
                );
                return;
            }

            if (
                err.response.status === 401 ||
                err.response.status === 403
            ) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                navigate("/", { replace: true });
                return;
            }

            setError(
                err.response.data?.message ||
                    `Server error (${err.response.status}).`
            );
        },
        [navigate]
    );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const result = await fetchOwnerProperties();

                if (cancelled || !result) {
                    return;
                }

                setOwner(result.owner);
                setProperties(result.properties);
            } catch (err) {
                if (!cancelled) {
                    handleLoadError(err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [fetchOwnerProperties, handleLoadError]);

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            setError("");

            const result = await fetchOwnerProperties();

            if (!result) {
                return;
            }

            setOwner(result.owner);
            setProperties(result.properties);
        } catch (err) {
            handleLoadError(err);
        } finally {
            setRefreshing(false);
        }
    };

// =====================================================
// UPLOAD PROPERTY IMAGE
// =====================================================

const handleImageUpload = async (e) => {
    e.preventDefault();

    if (!selectedProperty?.id) {
        setImageUploadError("Property was not selected.");
        return;
    }

    if (!selectedImage) {
        setImageUploadError("Please select an image.");
        return;
    }

    try {
        setUploadingImage(true);
        setImageUploadError("");
        setImageUploadSuccess("");

        const formData = new FormData();

        formData.append("image", selectedImage);

        formData.append(
            "caption",
            imageCaption.trim() ||
                `Image of ${selectedProperty.name}`
        );

        const response = await axios.post(
            `http://localhost:5000/api/properties/${selectedProperty.id}/images`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log(
            "Property image uploaded:",
            response.data
        );

        setImageUploadSuccess(
            "Property image uploaded successfully."
        );

        setSelectedImage(null);
        setImageCaption("");

        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }

        // Close modal after a short delay
        setTimeout(() => {
            setSelectedProperty(null);
            setImageUploadSuccess("");
        }, 1200);

        // Refresh properties
        await handleRefresh();

    } catch (err) {
        console.error(
            "Property image upload error:",
            err
        );

        setImageUploadError(
            err.response?.data?.message ||
                "Failed to upload property image."
        );
    } finally {
        setUploadingImage(false);
    }
};

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/", { replace: true });
    };

    // =====================================================
    // FILTER PROPERTIES
    // =====================================================

    const filteredProperties = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return properties.filter((property) => {
            const name =
                property.PropertyName ||
                property.propertyName ||
                "";

            const type =
                property.PropertyType ||
                property.propertyType ||
                "";

            const address =
                property.Address ||
                property.address ||
                "";

            const status =
                property.Status ||
                property.status ||
                "";

            const matchesSearch =
                !search ||
                name.toLowerCase().includes(search) ||
                type.toLowerCase().includes(search) ||
                address.toLowerCase().includes(search);

            const matchesStatus =
                statusFilter === "All" ||
                status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [properties, searchTerm, statusFilter]);

    // =====================================================
    // SUMMARY
    // =====================================================

    const summary = useMemo(() => {
        const getStatus = (property) =>
            property.Status || property.status;

        return {
            total: properties.length,

            available: properties.filter(
                (property) =>
                    getStatus(property) === "Available"
            ).length,

            reserved: properties.filter(
                (property) =>
                    getStatus(property) === "Reserved"
            ).length,

            rented: properties.filter(
                (property) =>
                    getStatus(property) === "Rented"
            ).length,

            sold: properties.filter(
                (property) =>
                    getStatus(property) === "Sold"
            ).length,
        };
    }, [properties]);

    // =====================================================
    // HELPERS
    // =====================================================

    const formatMoney = (value) => {
        if (
            value === null ||
            value === undefined ||
            value === "" ||
            Number(value) === 0
        ) {
            return "—";
        }

        return `${Number(value).toLocaleString()} ETB`;
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Available":
                return "available";

            case "Reserved":
                return "reserved";

            case "Rented":
                return "rented";

            case "Sold":
                return "sold";

            default:
                return "";
        }
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="op-loading-page">
                <div className="op-spinner"></div>
                <p>Loading your properties...</p>
            </div>
        );
    }

    // =====================================================
// OPEN IMAGE UPLOAD
// =====================================================

const openImageUpload = (property) => {
    const id =
        property.PropertyID ||
        property.propertyID ||
        property.id;

    const name =
        property.PropertyName ||
        property.propertyName ||
        "Property";

    setSelectedProperty({
        id,
        name,
    });

    setSelectedImage(null);
    setImageCaption("");
    setImageUploadError("");
    setImageUploadSuccess("");

    if (imageInputRef.current) {
        imageInputRef.current.value = "";
    }
};

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="op-container">

            {/* ==================================================
                MAIN CONTENT
                Sidebar is provided by the global Layout.
            ================================================== */}

            <main className="op-main">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <header className="op-header">

                    <div className="op-welcome">
                        <span className="op-welcome-title">
                            Welcome Back!
                        </span>

                        <span className="op-welcome-subtitle">
                            Real Estate Management System
                        </span>
                    </div>

                    <div className="op-header-right">

                        {/* SEARCH */}

                        <div className="op-search">
                            <Search size={16} />

                            <input
                                type="text"
                                placeholder="Search properties..."
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                }
                            />
                        </div>

                        {/* MAIL */}

                        <button
                            type="button"
                            className="op-icon-btn"
                            aria-label="Messages"
                        >
                            <Mail size={18} />
                        </button>

                        {/* NOTIFICATIONS */}

                        <button
                            type="button"
                            className="op-icon-btn op-notification"
                            aria-label="Notifications"
                        >
                            <Bell size={18} />
                            <span>3</span>
                        </button>

                        {/* USER */}

                        <div className="op-user-chip">

                            <div className="op-avatar">
                                {userName
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div className="op-user-info">
                                <strong>{userName}</strong>
                                <small>Property Owner</small>
                            </div>

                            <ChevronDown size={14} />

                        </div>

                    </div>

                </header>

                {/* ==================================================
                    CONTENT
                ================================================== */}

                <div className="op-content">

                    {/* BACK */}

                    <Link
                        to="/owner-dashboard"
                        className="op-back-link"
                    >
                        <ChevronLeft size={16} />
                        Back to Dashboard
                    </Link>

                    {/* ==================================================
                        PAGE HEADER
                    ================================================== */}

                    <div className="op-page-header">

                        <div>
                            <h1>My Properties</h1>

                            <p>
                                View and manage properties that belong to you.
                            </p>
                        </div>

                        <div className="op-page-actions">

                            <button
                                type="button"
                                className="op-refresh-btn"
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                <RefreshCw
                                    size={17}
                                    className={
                                        refreshing
                                            ? "op-spin"
                                            : ""
                                    }
                                />

                                {refreshing
                                    ? "Refreshing..."
                                    : "Refresh"}
                            </button>

                            <Link
                                to="/owner/properties/add"
                                className="op-add-btn"
                            >
                                <Plus size={18} />
                                Add Property
                            </Link>

                        </div>

                    </div>

                    {/* ==================================================
                        ERROR
                    ================================================== */}

                    {error && (
                        <div className="op-error">
                            {error}
                        </div>
                    )}

                    {/* ==================================================
                        SUMMARY CARDS
                    ================================================== */}

                    <div className="op-summary-grid">

                        <div className="op-summary-card">
                            <div className="op-summary-icon total">
                                <Building2 size={21} />
                            </div>

                            <div>
                                <span>Total Properties</span>
                                <strong>{summary.total}</strong>
                            </div>
                        </div>

                        <div className="op-summary-card">
                            <div className="op-summary-icon available">
                                <Building2 size={21} />
                            </div>

                            <div>
                                <span>Available</span>
                                <strong>{summary.available}</strong>
                            </div>
                        </div>

                        <div className="op-summary-card">
                            <div className="op-summary-icon reserved">
                                <CalendarCheck size={21} />
                            </div>

                            <div>
                                <span>Reserved</span>
                                <strong>{summary.reserved}</strong>
                            </div>
                        </div>

                        <div className="op-summary-card">
                            <div className="op-summary-icon rented">
                                <Home size={21} />
                            </div>

                            <div>
                                <span>Rented</span>
                                <strong>{summary.rented}</strong>
                            </div>
                        </div>

                        <div className="op-summary-card">
                            <div className="op-summary-icon sold">
                                <DollarSign size={21} />
                            </div>

                            <div>
                                <span>Sold</span>
                                <strong>{summary.sold}</strong>
                            </div>
                        </div>

                    </div>

                    {/* ==================================================
                        PROPERTY SECTION
                    ================================================== */}

                    <section className="op-properties-section">

                        <div className="op-section-header">

                            <div>
                                <h2>My Property Portfolio</h2>

                                <p>
                                    {filteredProperties.length}{" "}
                                    {filteredProperties.length === 1
                                        ? "property"
                                        : "properties"}{" "}
                                    found
                                </p>
                            </div>

                            <div className="op-filter">

                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="All">
                                        All Status
                                    </option>

                                    <option value="Available">
                                        Available
                                    </option>

                                    <option value="Reserved">
                                        Reserved
                                    </option>

                                    <option value="Rented">
                                        Rented
                                    </option>

                                    <option value="Sold">
                                        Sold
                                    </option>
                                </select>

                            </div>

                        </div>

                        {/* ==================================================
                            EMPTY
                        ================================================== */}

                        {filteredProperties.length === 0 ? (
                            <div className="op-empty">

                                <div className="op-empty-icon">
                                    <Building2 size={34} />
                                </div>

                                <h3>
                                    {properties.length === 0
                                        ? "No properties yet"
                                        : "No properties found"}
                                </h3>

                                <p>
                                    {properties.length === 0
                                        ? "Register your first property to start managing your portfolio."
                                        : "Try changing your search or status filter."}
                                </p>

                                {properties.length === 0 && (
                                    <Link
                                        to="/owner/properties/add"
                                        className="op-add-btn"
                                    >
                                        <Plus size={18} />
                                        Add Your First Property
                                    </Link>
                                    
                                )}

                            </div>
                            
                        ) : (

                            /* ==================================================
                               PROPERTY GRID
                            ================================================== */

                            <div className="op-property-grid">

                                {filteredProperties.map(
                                    (property) => {

                                        const id =
                                            property.PropertyID ||
                                            property.propertyID ||
                                            property.id;

                                        const name =
                                            property.PropertyName ||
                                            property.propertyName ||
                                            "Unnamed Property";

                                        const type =
                                            property.PropertyType ||
                                            property.propertyType ||
                                            "Property";

                                        const address =
                                            property.Address ||
                                            property.address ||
                                            "Address not available";

                                        const salePrice =
                                            property.SalePrice ??
                                            property.salePrice;

                                        const monthlyRent =
                                            property.MonthlyRent ??
                                            property.monthlyRent;

                                        const status =
                                            property.Status ||
                                            property.status ||
                                            "Available";

                                        return (
                                            <article
                                                className="op-property-card"
                                                key={id}
                                            >

                                                {/* IMAGE */}
<div className="op-property-image">
    <div className="op-property-building">
        {property.ImagePath ? (
            <img
                src={`http://localhost:5000/${String(
                    property.ImagePath
                ).replace(/^\/+/, "")}`}
                alt={name}
                onError={(e) => {
                    e.currentTarget.style.display = "none";

                    const fallback =
                        e.currentTarget.nextElementSibling;

                    if (fallback) {
                        fallback.style.display = "flex";
                    }
                }}
            />
        ) : null}

        <div
            className="op-property-no-image"
            style={{
                display: property.ImagePath ? "none" : "flex",
            }}
        >
            <Building2 size={42} />
        </div>
    </div>

    <div
        className={`op-property-status ${getStatusClass(status)}`}
    >
        <span>{status}</span>
    </div>
</div>

                                                {/* BODY */}

                                                <div className="op-property-body">

                                                    <div className="op-property-heading">

                                                        <div>

                                                            <span className="op-property-type">
                                                                {type}
                                                            </span>

                                                            <h3>
                                                                {name}
                                                            </h3>

                                                        </div>

                                                    </div>

                                                    {/* ADDRESS */}

                                                    <div className="op-property-address">

                                                        <MapPin
                                                            size={15}
                                                        />

                                                        <span>
                                                            {address}
                                                        </span>

                                                    </div>

                                                    {/* PRICES */}

                                                    <div className="op-property-prices">

                                                        <div>
                                                            <span>
                                                                Sale Price
                                                            </span>

                                                            <strong>
                                                                {formatMoney(
                                                                    salePrice
                                                                )}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>
                                                                Monthly Rent
                                                            </span>

                                                            <strong>
                                                                {formatMoney(
                                                                    monthlyRent
                                                                )}
                                                            </strong>
                                                        </div>

                                                    </div>

                                                    {/* ACTIONS */}
<div className="op-card-actions">
    <button
        type="button"
        className="op-view-btn"
        onClick={() =>
            navigate(`/properties/${id}`)
        }
    >
        <Eye size={16} />
        View Details
    </button>

    <button
        type="button"
        className="op-edit-btn"
        onClick={() =>
            navigate(`/properties/${id}`)
        }
    >
        <Edit size={16} />
        Edit
    </button>

    <button
        type="button"
        className="op-edit-btn"
        onClick={() => openImageUpload(property)}
    >
        <Building2 size={16} />
        Upload Image
    </button>
</div>

                                                </div>

                                            </article>
                                        );
                                    }
                                )}

                            </div>
                        )}

                    </section>

                    {/* ==================================================
                        PROPERTY STRUCTURE LINK
                    ================================================== */}

                   <section className="op-structure-card">

    <div className="op-structure-icon">
        <Building2 size={25} />
    </div>

    <div className="op-structure-content">
        <h2>
            Manage Property Structure
        </h2>

        <p>
            Manage buildings, floors, and rooms
            belonging to your properties.
        </p>
    </div>

   <Link
    to="/owner/property-structure"
    className="op-structure-btn"
>
    <Building2 size={17} />
    Property Structure
</Link>

</section>

                    {/* ==================================================
                        OWNER FOOTER
                    ================================================== */}

                    <div className="op-owner-footer">

                        <Building2 size={18} />

                        <span>
                            Properties registered under:
                        </span>

                        <strong>
                            {owner?.FullName ||
                                owner?.fullName ||
                                userName}
                        </strong>

                        <span className="op-owner-role">
                            Property Owner
                        </span>

                    </div>

                </div>
{/* ==================================================
    PROPERTY IMAGE UPLOAD MODAL
================================================== */}

{selectedProperty && (
    <div className="op-modal-overlay">

        <div className="op-image-modal">

            <div className="op-modal-header">

                <div>
                    <h2>Upload Property Image</h2>

                    <p>
                        {selectedProperty.name}
                    </p>
                </div>

                <button
                    type="button"
                    className="op-modal-close"
                    onClick={() =>
                        setSelectedProperty(null)
                    }
                >
                    ×
                </button>

            </div>

            <form
                onSubmit={handleImageUpload}
                className="op-image-form"
            >

                <label>
                    Property Image
                </label>

                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) =>
                        setSelectedImage(
                            e.target.files?.[0] || null
                        )
                    }
                />

                {selectedImage && (
                    <p className="op-selected-file">
                        Selected: {selectedImage.name}
                    </p>
                )}

                <label>
                    Caption
                </label>

                <input
                    type="text"
                    placeholder="Example: Front view of property"
                    value={imageCaption}
                    onChange={(e) =>
                        setImageCaption(
                            e.target.value
                        )
                    }
                />

                {imageUploadError && (
                    <div className="op-upload-error">
                        {imageUploadError}
                    </div>
                )}

                {imageUploadSuccess && (
                    <div className="op-upload-success">
                        {imageUploadSuccess}
                    </div>
                )}

                <div className="op-modal-actions">

                    <button
                        type="button"
                        className="op-cancel-btn"
                        onClick={() =>
                            setSelectedProperty(null)
                        }
                        disabled={uploadingImage}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="op-upload-submit"
                        disabled={
                            uploadingImage ||
                            !selectedImage
                        }
                    >
                        {uploadingImage
                            ? "Uploading..."
                            : "Upload Image"}
                    </button>

                </div>

            </form>

        </div>

    </div>
)}
            </main>

        </div>
    );
}

export default OwnerProperties;