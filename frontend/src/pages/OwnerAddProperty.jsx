import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Building2,
    DollarSign,
    Image as ImageIcon,
    File,
    Upload,
    ChevronLeft
} from "lucide-react";

import "./OwnerAddProperty.css";

function OwnerAddProperty() {
    const navigate = useNavigate();

    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : {};

    const token = localStorage.getItem("token");

    const [form, setForm] = useState({
        title: "",
        address: "",
        propertyType: "Residential House",
        description: "",
        price: "",
        monthlyRent: "",
        status: "Available"
    });

    const [photos, setPhotos] = useState([]);
    const [documents, setDocuments] = useState([]);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    // ==========================================
    // HANDLE FORM CHANGES
    // ==========================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // ==========================================
    // PHOTO UPLOAD
    // ==========================================
    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files || []);

        setPhotos((prev) => [
            ...prev,
            ...files
        ]);
    };

    // ==========================================
    // DOCUMENT UPLOAD
    // ==========================================
    const handleDocumentUpload = (e) => {
        const files = Array.from(e.target.files || []);

        setDocuments((prev) => [
            ...prev,
            ...files
        ]);
    };

    // ==========================================
    // REGISTER PROPERTY
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            navigate("/", { replace: true });
            return;
        }

        // -----------------------------
        // FRONTEND VALIDATION
        // -----------------------------
        if (!form.title.trim()) {
            setMessage("Property name is required.");
            setMessageType("error");
            return;
        }

        if (!form.address.trim()) {
            setMessage("Property address is required.");
            setMessageType("error");
            return;
        }

        if (!form.price) {
            setMessage("Sale price is required.");
            setMessageType("error");
            return;
        }

        if (Number(form.price) < 0) {
            setMessage("Sale price cannot be negative.");
            setMessageType("error");
            return;
        }

        if (
            form.monthlyRent &&
            Number(form.monthlyRent) < 0
        ) {
            setMessage("Monthly rent cannot be negative.");
            setMessageType("error");
            return;
        }

        setLoading(true);
        setMessage("");
        setMessageType("");

        try {
            const propertyData = {
                propertyName: form.title.trim(),

                propertyType: form.propertyType,

                address: form.address.trim(),

                salePrice: form.price
                    ? Number(form.price)
                    : null,

                monthlyRent: form.monthlyRent
                    ? Number(form.monthlyRent)
                    : null,

                status: form.status,

                description: form.description.trim()
                    ? form.description.trim()
                    : null
            };

            console.log(
                "Registering property:",
                propertyData
            );

            const response = await axios.post(
                "http://localhost:5000/api/properties",
                propertyData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log(
                "Property registration response:",
                response.data
            );

            setMessage(
                response.data?.message ||
                "Property registered successfully!"
            );

            setMessageType("success");

            // Give the user time to see success message
            setTimeout(() => {
                navigate("/owner/properties");
            }, 1200);

        } catch (error) {
            console.error(
                "Register property error:",
                error
            );

            // -----------------------------
            // AUTHORIZATION ERROR
            // -----------------------------
            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                navigate("/", {
                    replace: true
                });

                return;
            }

            setMessage(
                error.response?.data?.message ||
                "Failed to register property. Please try again."
            );

            setMessageType("error");

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="oap-container">

            {/* ==========================================
                MAIN CONTENT
            ========================================== */}
            <main className="oap-main">

                {/* ==========================================
                    HEADER
                ========================================== */}
                <header className="oap-header">

                    <div className="oap-welcome">
                        <span className="welcome">
                            Welcome Back!
                        </span>

                        <span className="system">
                            Property management system
                        </span>
                    </div>

                    <div className="oap-user-chip">

                        <div className="oap-avatar">
                            {(
                                user?.FullName ||
                                user?.fullName ||
                                "O"
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="oap-user-info">
                            <strong>
                                {user?.FullName ||
                                    user?.fullName ||
                                    "Owner"}
                            </strong>

                            <span>
                                Property Owner
                            </span>
                        </div>

                    </div>

                </header>

                {/* ==========================================
                    CONTENT
                ========================================== */}
                <div className="oap-content">

                    <Link
                        to="/owner/properties"
                        className="back-link"
                    >
                        <ChevronLeft size={16} />
                        Back to My Properties
                    </Link>

                    <div className="page-heading">

                        <div>
                            <h1 className="page-title">
                                Register My Property
                            </h1>

                            <p className="page-subtitle">
                                Add a new property to your portfolio.
                            </p>
                        </div>

                    </div>

                    {/* ==========================================
                        MESSAGE
                    ========================================== */}
                    {message && (
                        <div
                            className={`message ${
                                messageType === "success"
                                    ? "success"
                                    : "error"
                            }`}
                        >
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="form-grid">

                            {/* ==========================================
                                LEFT COLUMN
                            ========================================== */}
                            <div className="form-left">

                                {/* PROPERTY DETAILS */}
                                <div className="card">

                                    <h3>
                                        <Building2 size={18} />
                                        Property & Location Details
                                    </h3>

                                    <div className="form-group">

                                        <label>
                                            Property Name
                                        </label>

                                        <input
                                            type="text"
                                            name="title"
                                            placeholder="Enter property name"
                                            value={form.title}
                                            onChange={handleChange}
                                            required
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Address
                                        </label>

                                        <input
                                            type="text"
                                            name="address"
                                            placeholder="Enter complete property address"
                                            value={form.address}
                                            onChange={handleChange}
                                            required
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Property Type
                                        </label>

                                        <select
                                            name="propertyType"
                                            value={form.propertyType}
                                            onChange={handleChange}
                                        >
                                            <option value="Residential House">
                                                Residential House
                                            </option>

                                            <option value="Apartment">
                                                Apartment
                                            </option>

                                            <option value="Villa">
                                                Villa
                                            </option>

                                            <option value="Commercial Building">
                                                Commercial Building
                                            </option>

                                            <option value="Other">
                                                Other
                                            </option>
                                        </select>

                                    </div>

                                    <div className="owner-info">

                                        <span>
                                            Registered under:
                                        </span>

                                        <strong>
                                            {user?.FullName ||
                                                user?.fullName ||
                                                "Current Owner"}
                                        </strong>

                                    </div>

                                </div>

                                {/* PRICING */}
                                <div className="card">

                                    <h3>
                                        <DollarSign size={18} />
                                        Pricing & Status
                                    </h3>

                                    <div className="form-row">

                                        <div className="form-group">

                                            <label>
                                                Sale Price (ETB)
                                            </label>

                                            <input
                                                type="number"
                                                name="price"
                                                placeholder="Enter sale price"
                                                min="0"
                                                step="0.01"
                                                value={form.price}
                                                onChange={handleChange}
                                                required
                                            />

                                        </div>

                                        <div className="form-group">

                                            <label>
                                                Monthly Rent (ETB)
                                            </label>

                                            <input
                                                type="number"
                                                name="monthlyRent"
                                                placeholder="Enter monthly rent"
                                                min="0"
                                                step="0.01"
                                                value={form.monthlyRent}
                                                onChange={handleChange}
                                            />

                                        </div>

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Status
                                        </label>

                                        <select
                                            name="status"
                                            value={form.status}
                                            onChange={handleChange}
                                        >
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

                                    <div className="status-legend">

                                        <span>
                                            <i className="dot green"></i>
                                            Available
                                        </span>

                                        <span>
                                            <i className="dot orange"></i>
                                            Reserved
                                        </span>

                                        <span>
                                            <i className="dot blue"></i>
                                            Rented
                                        </span>

                                        <span>
                                            <i className="dot red"></i>
                                            Sold
                                        </span>

                                    </div>

                                </div>

                            </div>

                            {/* ==========================================
                                RIGHT COLUMN
                            ========================================== */}
                            <div className="form-right">

                                {/* DESCRIPTION */}
                                <div className="card">

                                    <h3>
                                        <Building2 size={18} />
                                        Property Description
                                    </h3>

                                    <div className="form-group">

                                        <label>
                                            Description
                                        </label>

                                        <textarea
                                            name="description"
                                            placeholder="Enter property description..."
                                            rows={7}
                                            value={form.description}
                                            onChange={handleChange}
                                        />

                                    </div>

                                </div>

                                {/* MEDIA */}
                                <div className="card">

                                    <h3>
                                        <ImageIcon size={18} />
                                        Media & Attachments
                                    </h3>

                                    <div className="upload-zone">

                                        <Upload size={28} />

                                        <p>
                                            Upload property photos
                                            and supporting documents.
                                        </p>

                                        <div className="upload-buttons">

                                            <label className="upload-btn">

                                                <Upload size={16} />

                                                Upload Photos

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    hidden
                                                    onChange={
                                                        handlePhotoUpload
                                                    }
                                                />

                                            </label>

                                            <label className="upload-btn">

                                                <File size={16} />

                                                Upload Documents

                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.jpg,.png"
                                                    multiple
                                                    hidden
                                                    onChange={
                                                        handleDocumentUpload
                                                    }
                                                />

                                            </label>

                                        </div>

                                    </div>

                                    {/* FILE LIST */}
                                    {(photos.length > 0 ||
                                        documents.length > 0) && (
                                        <div className="file-list">

                                            {photos.map(
                                                (file, index) => (
                                                    <div
                                                        key={`photo-${index}`}
                                                        className="file-item"
                                                    >
                                                        📷 {file.name}
                                                    </div>
                                                )
                                            )}

                                            {documents.map(
                                                (file, index) => (
                                                    <div
                                                        key={`doc-${index}`}
                                                        className="file-item"
                                                    >
                                                        📄 {file.name}
                                                    </div>
                                                )
                                            )}

                                        </div>
                                    )}

                                    <p className="upload-note">
                                        File uploads are currently
                                        displayed for selection only.
                                        They will be connected to the
                                        property media/document API
                                        separately.
                                    </p>

                                </div>

                            </div>

                        </div>

                        {/* ==========================================
                            ACTION BUTTONS
                        ========================================== */}
                        <div className="form-actions">

                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() =>
                                    navigate("/owner/properties")
                                }
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="btn-register"
                                disabled={loading}
                            >
                                {loading
                                    ? "Registering..."
                                    : "Register Property"}
                            </button>

                        </div>

                    </form>

                </div>

            </main>

        </div>
    );
}

export default OwnerAddProperty;