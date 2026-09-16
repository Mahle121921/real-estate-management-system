import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft,
    Building2,
    User,
    MapPin,
    DollarSign,
    Home,
    FileText,
    Save,
    X,
    Loader2,
    CheckCircle,
    AlertCircle
} from "lucide-react";

import "./AdminAddProperty.css";

function AdminAddProperty() {
    const navigate = useNavigate();

    const [owners, setOwners] = useState([]);
    const [loadingOwners, setLoadingOwners] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        ownerId: "",
        propertyName: "",
        propertyType: "",
        address: "",
        salePrice: "",
        monthlyRent: "",
        status: "Available",
        description: ""
    });

    // ==========================================
    // CHECK ADMINISTRATOR ACCESS
    // ==========================================
    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            navigate("/", { replace: true });
            return;
        }

        try {
            const user = JSON.parse(storedUser);
            const role = user?.role || user?.Role;

            if (role !== "Administrator") {
                navigate("/", { replace: true });
            }
        } catch (err) {
            console.error("Invalid stored user:", err);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            navigate("/", { replace: true });
        }
    }, [navigate]);

    // ==========================================
    // LOAD OWNERS
    // ==========================================
    useEffect(() => {
        const fetchOwners = async () => {
            try {
                setLoadingOwners(true);
                setError("");

                const token = localStorage.getItem("token");

                if (!token) {
                    navigate("/", { replace: true });
                    return;
                }

                const response = await axios.get(
                    "http://localhost:5000/api/owners",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.data.success) {
                    setOwners(response.data.owners || []);
                } else {
                    setError(
                        response.data.message ||
                        "Failed to load property owners."
                    );
                }
            } catch (err) {
                console.error("Get owners error:", err);

                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/", { replace: true });
                    return;
                }

                setError(
                    err.response?.data?.message ||
                    "Failed to load property owners."
                );
            } finally {
                setLoadingOwners(false);
            }
        };

        fetchOwners();
    }, [navigate]);

    // ==========================================
    // HANDLE INPUT
    // ==========================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        if (error) {
            setError("");
        }

        if (message) {
            setMessage("");
        }
    };

    // ==========================================
    // SUBMIT PROPERTY
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!formData.ownerId) {
            setError("Please select a property owner.");
            return;
        }

        if (!formData.propertyName.trim()) {
            setError("Property name is required.");
            return;
        }

        if (!formData.propertyType) {
            setError("Please select a property type.");
            return;
        }

        if (!formData.address.trim()) {
            setError("Property address is required.");
            return;
        }

        if (
            formData.salePrice !== "" &&
            Number(formData.salePrice) < 0
        ) {
            setError("Sale price cannot be negative.");
            return;
        }

        if (
            formData.monthlyRent !== "" &&
            Number(formData.monthlyRent) < 0
        ) {
            setError("Monthly rent cannot be negative.");
            return;
        }

        try {
            setSubmitting(true);

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/", { replace: true });
                return;
            }

            const payload = {
                ownerId: Number(formData.ownerId),
                propertyName: formData.propertyName.trim(),
                propertyType: formData.propertyType,
                address: formData.address.trim(),
                salePrice:
                    formData.salePrice === ""
                        ? null
                        : Number(formData.salePrice),
                monthlyRent:
                    formData.monthlyRent === ""
                        ? null
                        : Number(formData.monthlyRent),
                status: formData.status,
                description: formData.description.trim() || null
            };

            const response = await axios.post(
                "http://localhost:5000/api/properties",
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.data.success) {
                setMessage(
                    response.data.message ||
                    "Property created successfully."
                );

                setFormData({
                    ownerId: "",
                    propertyName: "",
                    propertyType: "",
                    address: "",
                    salePrice: "",
                    monthlyRent: "",
                    status: "Available",
                    description: ""
                });

                setTimeout(() => {
                    navigate("/properties");
                }, 1200);
            } else {
                setError(
                    response.data.message ||
                    "Failed to create property."
                );
            }
        } catch (err) {
            console.error("Create property error:", err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/", { replace: true });
                return;
            }

            setError(
                err.response?.data?.message ||
                "Failed to create property. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="admin-add-property-page">

            {/* ==========================================
                HEADER
            ========================================== */}
            <div className="admin-add-property-header">

                <div className="admin-add-property-header-left">
                    <Link
                        to="/properties"
                        className="back-to-properties"
                    >
                        <ArrowLeft size={18} />
                        Back to Properties
                    </Link>

                    <div className="page-title-section">
                        <div className="page-title-icon">
                            <Building2 size={26} />
                        </div>

                        <div>
                            <h1>Add Property</h1>
                            <p>
                                Register a new property in the system
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* ==========================================
                ALERTS
            ========================================== */}
            {error && (
                <div className="admin-property-alert error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {message && (
                <div className="admin-property-alert success">
                    <CheckCircle size={20} />
                    <span>{message}</span>
                </div>
            )}

            {/* ==========================================
                FORM
            ========================================== */}
            <form
                className="admin-add-property-form"
                onSubmit={handleSubmit}
            >

                {/* PROPERTY OWNERSHIP */}
                <section className="property-form-section">

                    <div className="section-heading">
                        <div className="section-icon">
                            <User size={20} />
                        </div>

                        <div>
                            <h2>Ownership</h2>
                            <p>Select the owner of this property</p>
                        </div>
                    </div>

                    <div className="form-grid">

                        <div className="form-group full-width">
                            <label htmlFor="ownerId">
                                Property Owner
                                <span className="required">*</span>
                            </label>

                            <div className="input-with-icon">
                                <User size={18} />

                                <select
                                    id="ownerId"
                                    name="ownerId"
                                    value={formData.ownerId}
                                    onChange={handleChange}
                                    disabled={loadingOwners || submitting}
                                    required
                                >
                                    <option value="">
                                        {loadingOwners
                                            ? "Loading owners..."
                                            : "Select property owner"}
                                    </option>

                                    {owners.map((owner) => (
                                        <option
                                            key={owner.OwnerID}
                                            value={owner.OwnerID}
                                        >
                                            {owner.FullName ||
                                                owner.OwnerName ||
                                                `Owner #${owner.OwnerID}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {owners.length === 0 && !loadingOwners && (
                                <small className="field-warning">
                                    No property owners were found.
                                    Please create an Owner account first.
                                </small>
                            )}
                        </div>

                    </div>

                </section>

                {/* BASIC PROPERTY INFORMATION */}
                <section className="property-form-section">

                    <div className="section-heading">
                        <div className="section-icon">
                            <Building2 size={20} />
                        </div>

                        <div>
                            <h2>Property Information</h2>
                            <p>Enter the basic property details</p>
                        </div>
                    </div>

                    <div className="form-grid">

                        <div className="form-group">
                            <label htmlFor="propertyName">
                                Property Name
                                <span className="required">*</span>
                            </label>

                            <div className="input-with-icon">
                                <Home size={18} />

                                <input
                                    id="propertyName"
                                    type="text"
                                    name="propertyName"
                                    placeholder="e.g. Sunshine Villa"
                                    value={formData.propertyName}
                                    onChange={handleChange}
                                    disabled={submitting}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="propertyType">
                                Property Type
                                <span className="required">*</span>
                            </label>

                            <div className="input-with-icon">
                                <Building2 size={18} />

                                <select
                                    id="propertyType"
                                    name="propertyType"
                                    value={formData.propertyType}
                                    onChange={handleChange}
                                    disabled={submitting}
                                    required
                                >
                                    <option value="">
                                        Select property type
                                    </option>
                                    <option value="Villa">
                                        Villa
                                    </option>
                                    <option value="Apartment">
                                        Apartment
                                    </option>
                                    <option value="Commercial Building">
                                        Commercial Building
                                    </option>
                                    <option value="Residential House">
                                        Residential House
                                    </option>
                                    <option value="Other">
                                        Other
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="address">
                                Address
                                <span className="required">*</span>
                            </label>

                            <div className="input-with-icon">
                                <MapPin size={18} />

                                <input
                                    id="address"
                                    type="text"
                                    name="address"
                                    placeholder="Enter property address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    disabled={submitting}
                                    required
                                />
                            </div>
                        </div>

                    </div>

                </section>

                {/* FINANCIAL INFORMATION */}
                <section className="property-form-section">

                    <div className="section-heading">
                        <div className="section-icon">
                            <DollarSign size={20} />
                        </div>

                        <div>
                            <h2>Financial Information</h2>
                            <p>
                                Enter the property's sale and rental prices
                            </p>
                        </div>
                    </div>

                    <div className="form-grid">

                        <div className="form-group">
                            <label htmlFor="salePrice">
                                Sale Price
                            </label>

                            <div className="input-with-icon">
                                <DollarSign size={18} />

                                <input
                                    id="salePrice"
                                    type="number"
                                    name="salePrice"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.salePrice}
                                    onChange={handleChange}
                                    disabled={submitting}
                                />
                            </div>

                            <small>
                                Leave empty if the property is not for sale.
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="monthlyRent">
                                Monthly Rent
                            </label>

                            <div className="input-with-icon">
                                <DollarSign size={18} />

                                <input
                                    id="monthlyRent"
                                    type="number"
                                    name="monthlyRent"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.monthlyRent}
                                    onChange={handleChange}
                                    disabled={submitting}
                                />
                            </div>

                            <small>
                                Leave empty if the property is not for rent.
                            </small>
                        </div>

                    </div>

                </section>

                {/* STATUS AND DESCRIPTION */}
                <section className="property-form-section">

                    <div className="section-heading">
                        <div className="section-icon">
                            <FileText size={20} />
                        </div>

                        <div>
                            <h2>Status & Description</h2>
                            <p>
                                Set the current property status and add
                                additional information
                            </p>
                        </div>
                    </div>

                    <div className="form-grid">

                        <div className="form-group">
                            <label htmlFor="status">
                                Property Status
                            </label>

                            <div className="input-with-icon">
                                <Building2 size={18} />

                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    disabled={submitting}
                                >
                                    <option value="Available">
                                        Available
                                    </option>
                                    <option value="Reserved">
                                        Reserved
                                    </option>
                                    <option value="Sold">
                                        Sold
                                    </option>
                                    <option value="Rented">
                                        Rented
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="description">
                                Description
                            </label>

                            <textarea
                                id="description"
                                name="description"
                                rows="5"
                                placeholder="Enter property description..."
                                value={formData.description}
                                onChange={handleChange}
                                disabled={submitting}
                            />
                        </div>

                    </div>

                </section>

                {/* FORM ACTIONS */}
                <div className="form-actions">

                    <Link
                        to="/properties"
                        className="cancel-property-btn"
                    >
                        <X size={18} />
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        className="save-property-btn"
                        disabled={submitting || loadingOwners}
                    >
                        {submitting ? (
                            <>
                                <Loader2
                                    size={18}
                                    className="spin"
                                />
                                Creating Property...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Create Property
                            </>
                        )}
                    </button>

                </div>

            </form>
        </div>
    );
}

export default AdminAddProperty;

