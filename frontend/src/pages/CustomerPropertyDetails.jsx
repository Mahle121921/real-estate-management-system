import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Bookmark,
    Building2,
    Calendar,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    MapPin,
    Ruler,
    BedDouble,
    Bath,
    Home,
    Image as ImageIcon,
    X,
ShoppingCart,
} from "lucide-react";
import "./CustomerPropertyDetails.css";

const API_BASE = "http://localhost:5000/api";

function CustomerPropertyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [property, setProperty] = useState(null);
    const [images, setImages] = useState([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const getConfig = useCallback(() => {
        const token = localStorage.getItem("token");
        return {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        };
    }, []);

    const getImageUrl = (img) => {
        if (!img) return "";

        // If string path
        if (typeof img === "string") {
            if (img.startsWith("http") || img.startsWith("data:")) return img;
            if (img.startsWith("/uploads/")) return `http://localhost:5000${img}`;
            if (img.startsWith("uploads/")) return `http://localhost:5000/${img}`;
            if (img.startsWith("/")) return `http://localhost:5000/uploads${img}`;
            return `http://localhost:5000/uploads/${img}`;
        }

        // If object
        const path =
            img.ImagePath ||
            img.imagePath ||
            img.ImageURL ||
            img.imageURL ||
            img.url ||
            img.URL ||
            "";

        if (!path) return "";
        if (path.startsWith("http") || path.startsWith("data:")) return path;
        if (path.startsWith("/uploads/")) return `http://localhost:5000${path}`;
        if (path.startsWith("uploads/")) return `http://localhost:5000/${path}`;
        if (path.startsWith("/")) return `http://localhost:5000/uploads${path}`;
        return `http://localhost:5000/uploads/${path}`;
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined || value === "") return "—";
        const n = Number(value);
        if (Number.isNaN(n)) return String(value);
        return `ETB ${n.toLocaleString()}`;
    };

    const loadProperty = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError("");

            const config = getConfig();

            // Main property details
            const response = await axios.get(
                `${API_BASE}/properties/${id}`,
                config
            );

            const data =
                response.data?.property ||
                response.data?.data ||
                response.data;

            setProperty(data || null);

            // Collect images from several possible sources
            let gallery = [];

            // 1) Property-level images from detail response
            const fromDetail =
                data?.images ||
                data?.Images ||
                data?.propertyImages ||
                data?.PropertyImages ||
                [];

            if (Array.isArray(fromDetail) && fromDetail.length > 0) {
                gallery = fromDetail;
            }

            // 2) Dedicated property images endpoint
            try {
                const imgRes = await axios.get(
                    `${API_BASE}/properties/${id}/images`,
                    config
                );
                const list =
                    imgRes.data?.images ||
                    imgRes.data?.data ||
                    (Array.isArray(imgRes.data) ? imgRes.data : []);
                if (Array.isArray(list) && list.length > 0) {
                    gallery = list;
                }
            } catch {
                // optional endpoint
            }

            // 3) Single main image fields
            if (gallery.length === 0) {
                const single =
                    data?.ImageURL ||
                    data?.imageURL ||
                    data?.ImagePath ||
                    data?.imagePath ||
                    data?.PropertyImage ||
                    data?.image;

                if (single) {
                    gallery = [{ ImagePath: single }];
                }
            }

            setImages(gallery);
            setActiveImageIndex(0);
        } catch (err) {
            console.error("Load property details error:", err);
            setError(
                err.response?.data?.message ||
                    "Failed to load property details."
            );
            setProperty(null);
        } finally {
            setLoading(false);
        }
    }, [id, getConfig]);

    useEffect(() => {
        loadProperty();
    }, [loadProperty]);

    const currentImageUrl =
        images.length > 0 ? getImageUrl(images[activeImageIndex]) : "";

    const goPrev = () => {
        if (images.length === 0) return;
        setActiveImageIndex((i) => (i === 0 ? images.length - 1 : i - 1));
    };

    const goNext = () => {
        if (images.length === 0) return;
        setActiveImageIndex((i) => (i === images.length - 1 ? 0 : i + 1));
    };

    if (loading) {
        return (
            <div className="cpd-page">
                <div className="cpd-loading">
                    <Loader2 size={32} className="spin" />
                    <p>Loading property details...</p>
                </div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="cpd-page">
                <div className="cpd-error">
                    <Building2 size={40} />
                    <h2>Property not found</h2>
                    <p>{error || "This property could not be loaded."}</p>
                    <Link to="/customer/properties" className="cpd-btn primary">
                        Back to Properties
                    </Link>
                </div>
            </div>
        );
    }

    const name =
        property.PropertyName || property.propertyName || "Property";
    const type =
        property.PropertyType || property.propertyType || "Property";
    const address =
        property.Address ||
        property.address ||
        property.Location ||
        "Address not available";
    const status =
        property.Status || property.status || property.ListingStatus || "Available";
    const description =
        property.Description || property.description || "No description provided.";
    const bedrooms = property.Bedrooms ?? property.bedrooms;
    const bathrooms = property.Bathrooms ?? property.bathrooms;
    const area = property.Area ?? property.area ?? property.Size;
    const salePrice = property.SalePrice ?? property.salePrice;
    const monthlyRent = property.MonthlyRent ?? property.monthlyRent;

    return (
        <div className="cpd-page">
            {/* Top bar */}
            <div className="cpd-topbar">
                <button
                    type="button"
                    className="cpd-back"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
<div className="cpd-actions">
   <button
    type="button"
    className="cpd-btn secondary"
    onClick={() =>
        navigate(`/customer/appointments/new/${id}`)
    }
>
    <CalendarDays size={18} />
    Schedule Appointment
</button>
                    {property.Status === "Available" && (
    <Link
        to={`/customer/purchase/${property.PropertyID}`}
        className="purchase-property-btn"
    >
        <ShoppingCart size={18} />
        Purchase Property
    </Link>
)}
                </div>
            </div>

            <div className="cpd-layout">
                {/* LEFT: Gallery */}
                <div className="cpd-gallery">
                    <div className="cpd-main-image">
                        {currentImageUrl ? (
                            <img
                                src={currentImageUrl}
                                alt={name}
                                onClick={() => setLightboxOpen(true)}
                            />
                        ) : (
                            <div className="cpd-no-image">
                                <ImageIcon size={48} />
                                <span>No images available</span>
                            </div>
                        )}

                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className="cpd-nav prev"
                                    onClick={goPrev}
                                >
                                    <ChevronLeft size={22} />
                                </button>
                                <button
                                    type="button"
                                    className="cpd-nav next"
                                    onClick={goNext}
                                >
                                    <ChevronRight size={22} />
                                </button>
                            </>
                        )}

                        <span className={`cpd-status ${String(status).toLowerCase()}`}>
                            {status}
                        </span>
                    </div>

                    {images.length > 1 && (
                        <div className="cpd-thumbs">
                            {images.map((img, index) => {
                                const url = getImageUrl(img);
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`cpd-thumb ${
                                            index === activeImageIndex ? "active" : ""
                                        }`}
                                        onClick={() => setActiveImageIndex(index)}
                                    >
                                        {url ? (
                                            <img src={url} alt={`View ${index + 1}`} />
                                        ) : (
                                            <ImageIcon size={18} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT: Info */}
                <div className="cpd-info">
                    <div className="cpd-type">{type}</div>
                    <h1>{name}</h1>

                    <div className="cpd-location">
                        <MapPin size={16} />
                        <span>{address}</span>
                    </div>

                    <div className="cpd-price-box">
                        {salePrice != null && salePrice !== "" && (
                            <div>
                                <span>Sale Price</span>
                                <strong>{formatCurrency(salePrice)}</strong>
                            </div>
                        )}
                        {monthlyRent != null && monthlyRent !== "" && (
                            <div>
                                <span>Monthly Rent</span>
                                <strong>{formatCurrency(monthlyRent)} / month</strong>
                            </div>
                        )}
                        {salePrice == null && monthlyRent == null && (
                            <div>
                                <span>Price</span>
                                <strong>Contact for price</strong>
                            </div>
                        )}
                    </div>

                    <div className="cpd-features">
                        {bedrooms != null && (
                            <div className="cpd-feature">
                                <BedDouble size={18} />
                                <span>{bedrooms} Bedrooms</span>
                            </div>
                        )}
                        {bathrooms != null && (
                            <div className="cpd-feature">
                                <Bath size={18} />
                                <span>{bathrooms} Bathrooms</span>
                            </div>
                        )}
                        {area != null && area !== "" && (
                            <div className="cpd-feature">
                                <Ruler size={18} />
                                <span>{area} m²</span>
                            </div>
                        )}
                        <div className="cpd-feature">
                            <Home size={18} />
                            <span>{type}</span>
                        </div>
                    </div>

                    <div className="cpd-section">
                        <h3>Description</h3>
                        <p>{description}</p>
                    </div>

                    <div className="cpd-actions">
                       <Link
    to={`/customer/appointments/new/${id}`}
    className="cpd-btn secondary full"
>
    <CalendarDays size={17} />
    Schedule Viewing
</Link>
                        <Link
                            to={`/customer/reservations?propertyId=${id}`}
                            className="cpd-btn primary full"
                        >
                            <CheckCircle2 size={17} />
                            Reserve This Property
                        </Link>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxOpen && currentImageUrl && (
                <div
                    className="cpd-lightbox"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        type="button"
                        className="cpd-lightbox-close"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={currentImageUrl}
                        alt={name}
                        onClick={(e) => e.stopPropagation()}
                    />
                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                className="cpd-lightbox-nav prev"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goPrev();
                                }}
                            >
                                <ChevronLeft size={28} />
                            </button>
                            <button
                                type="button"
                                className="cpd-lightbox-nav next"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goNext();
                                }}
                            >
                                <ChevronRight size={28} />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default CustomerPropertyDetails;