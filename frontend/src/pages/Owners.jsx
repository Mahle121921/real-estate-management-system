import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    AlertCircle,
    Building2,
    Edit,
    Eye,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Search,
    ShieldCheck,
    UserRound,
    X
} from "lucide-react";

import "./Owners.css";

const API_URL = "http://localhost:5000/api";

function Owners() {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");

    const [selectedOwner, setSelectedOwner] = useState(null);
    const [ownerProperties, setOwnerProperties] = useState([]);
    const [loadingProperties, setLoadingProperties] = useState(false);

    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        address: "",
        idType: "",
        idNumber: ""
    });

    const token = localStorage.getItem("token");

    const axiosConfig = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    // =====================================================
    // LOAD OWNERS
    // =====================================================

    const fetchOwners = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/owners`,
                axiosConfig
            );

            setOwners(response.data.owners || []);
        } catch (err) {
            console.error("Get owners error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load property owners."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOwners();
    }, []);

    // =====================================================
    // SEARCH
    // =====================================================

    const filteredOwners = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        if (!search) {
            return owners;
        }

        return owners.filter((owner) =>
            [
                owner.FullName,
                owner.Email,
                owner.PhoneNumber,
                owner.Address,
                owner.IDNumber
            ]
                .filter(Boolean)
                .some((value) =>
                    String(value).toLowerCase().includes(search)
                )
        );
    }, [owners, searchTerm]);

    // =====================================================
    // VIEW OWNER
    // =====================================================

    const handleViewOwner = async (owner) => {
        setSelectedOwner(owner);
        setShowViewModal(true);
        setOwnerProperties([]);
        setLoadingProperties(true);

        try {
            const response = await axios.get(
                `${API_URL}/owners/${owner.OwnerID}/properties`,
                axiosConfig
            );

            setOwnerProperties(response.data.properties || []);
        } catch (err) {
            console.error("Get owner properties error:", err);

            setOwnerProperties([]);
        } finally {
            setLoadingProperties(false);
        }
    };

    // =====================================================
    // OPEN EDIT
    // =====================================================

    const handleEditOwner = (owner) => {
        setSelectedOwner(owner);

        setFormData({
            fullName: owner.FullName || "",
            email: owner.Email || "",
            phoneNumber: owner.PhoneNumber || "",
            address: owner.Address || "",
            idType: owner.IDType || "",
            idNumber: owner.IDNumber || ""
        });

        setFormError("");
        setShowEditModal(true);
    };

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // =====================================================
    // UPDATE OWNER
    // =====================================================

    const handleUpdateOwner = async (e) => {
        e.preventDefault();

        setFormError("");

        if (!formData.fullName.trim()) {
            setFormError("Full name is required.");
            return;
        }

        if (!formData.email.trim()) {
            setFormError("Email is required.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(formData.email)) {
            setFormError("Please enter a valid email address.");
            return;
        }

        try {
            setSaving(true);

            const response = await axios.put(
                `${API_URL}/owners/${selectedOwner.OwnerID}`,
                formData,
                axiosConfig
            );

            const updatedOwner = response.data.owner;

            setOwners((previousOwners) =>
                previousOwners.map((owner) =>
                    owner.OwnerID === updatedOwner.OwnerID
                        ? updatedOwner
                        : owner
                )
            );

            setSelectedOwner(updatedOwner);
            setShowEditModal(false);
        } catch (err) {
            console.error("Update owner error:", err);

            setFormError(
                err.response?.data?.message ||
                "Failed to update owner."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // CLOSE MODALS
    // =====================================================

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedOwner(null);
        setOwnerProperties([]);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setSelectedOwner(null);
        setFormError("");
    };

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalOwners = owners.length;

    const activeOwners = owners.filter(
        (owner) =>
            String(owner.Status || "").toLowerCase() === "active"
    ).length;

    const inactiveOwners = owners.filter(
        (owner) =>
            String(owner.Status || "").toLowerCase() === "inactive"
    ).length;

    return (
        <div className="owners-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="owners-header">
                <div>
                    <div className="owners-title-row">
                        <div className="owners-title-icon">
                            <UserRound size={25} />
                        </div>

                        <div>
                            <h1>Property Owners</h1>

                            <p>
                                Manage and view registered property owners
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="owners-alert">
                    <AlertCircle size={20} />

                    <span>{error}</span>

                    <button onClick={fetchOwners}>
                        Retry
                    </button>
                </div>
            )}

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="owners-stats">

                <div className="owner-stat-card">
                    <div className="owner-stat-icon">
                        <UserRound size={22} />
                    </div>

                    <div>
                        <span>Total Owners</span>
                        <strong>{totalOwners}</strong>
                    </div>
                </div>

                <div className="owner-stat-card">
                    <div className="owner-stat-icon active">
                        <ShieldCheck size={22} />
                    </div>

                    <div>
                        <span>Active Owners</span>
                        <strong>{activeOwners}</strong>
                    </div>
                </div>

                <div className="owner-stat-card">
                    <div className="owner-stat-icon inactive">
                        <AlertCircle size={22} />
                    </div>

                    <div>
                        <span>Inactive Owners</span>
                        <strong>{inactiveOwners}</strong>
                    </div>
                </div>

            </div>

            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="owners-toolbar">

                <div className="owners-search">
                    <Search size={19} />

                    <input
                        type="text"
                        placeholder="Search owners..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                    />
                </div>

                <div className="owners-result-count">
                    {filteredOwners.length} owner
                    {filteredOwners.length !== 1 ? "s" : ""}
                </div>

            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="owners-card">

                {loading ? (
                    <div className="owners-loading">
                        <Loader2
                            size={32}
                            className="owners-spinner"
                        />

                        <p>Loading property owners...</p>
                    </div>
                ) : filteredOwners.length === 0 ? (
                    <div className="owners-empty">
                        <UserRound size={45} />

                        <h3>
                            {searchTerm
                                ? "No owners found"
                                : "No property owners available"}
                        </h3>

                        <p>
                            {searchTerm
                                ? "Try changing your search."
                                : "There are currently no registered property owners."}
                        </p>
                    </div>
                ) : (
                    <div className="owners-table-wrapper">

                        <table className="owners-table">

                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Owner</th>
                                    <th>Contact</th>
                                    <th>Address</th>
                                    <th>ID Information</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredOwners.map((owner, index) => (
                                    <tr key={owner.OwnerID}>

                                        <td>
                                            <span className="owner-number">
                                                {index + 1}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="owner-person">

                                                <div className="owner-avatar">
                                                    <UserRound size={19} />
                                                </div>

                                                <div>
                                                    <strong>
                                                        {owner.FullName}
                                                    </strong>

                                                    <small>
                                                        Owner ID:{" "}
                                                        {owner.OwnerID}
                                                    </small>
                                                </div>

                                            </div>
                                        </td>

                                        <td>
                                            <div className="owner-contact">

                                                {owner.Email && (
                                                    <div>
                                                        <Mail size={15} />
                                                        <span>
                                                            {owner.Email}
                                                        </span>
                                                    </div>
                                                )}

                                                {owner.PhoneNumber && (
                                                    <div>
                                                        <Phone size={15} />
                                                        <span>
                                                            {owner.PhoneNumber}
                                                        </span>
                                                    </div>
                                                )}

                                            </div>
                                        </td>

                                        <td>
                                            <div className="owner-address">

                                                <MapPin size={16} />

                                                <span>
                                                    {owner.Address ||
                                                        "Not provided"}
                                                </span>

                                            </div>
                                        </td>

                                        <td>
                                            <div className="owner-id">

                                                <strong>
                                                    {owner.IDType ||
                                                        "Not provided"}
                                                </strong>

                                                <span>
                                                    {owner.IDNumber ||
                                                        "Not provided"}
                                                </span>

                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={`owner-status ${
                                                    String(
                                                        owner.Status || ""
                                                    ).toLowerCase() ===
                                                    "active"
                                                        ? "active"
                                                        : "inactive"
                                                }`}
                                            >
                                                {owner.Status || "Unknown"}
                                            </span>
                                        </td>

                                        <td>

                                            <div className="owner-actions">

                                                <button
                                                    className="owner-action-btn view"
                                                    onClick={() =>
                                                        handleViewOwner(owner)
                                                    }
                                                    title="View owner"
                                                >
                                                    <Eye size={17} />
                                                </button>

                                                <button
                                                    className="owner-action-btn edit"
                                                    onClick={() =>
                                                        handleEditOwner(owner)
                                                    }
                                                    title="Edit owner"
                                                >
                                                    <Edit size={17} />
                                                </button>

                                            </div>

                                        </td>

                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* =================================================
                VIEW OWNER MODAL
            ================================================= */}

            {showViewModal && selectedOwner && (
                <div
                    className="owners-modal-overlay"
                    onClick={closeViewModal}
                >

                    <div
                        className="owners-modal owner-view-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="owners-modal-header">

                            <div>
                                <h2>Owner Details</h2>

                                <p>
                                    Property owner information
                                </p>
                            </div>

                            <button
                                className="owners-modal-close"
                                onClick={closeViewModal}
                            >
                                <X size={21} />
                            </button>

                        </div>

                        <div className="owner-details">

                            <div className="owner-profile-box">

                                <div className="owner-large-avatar">
                                    <UserRound size={30} />
                                </div>

                                <div>
                                    <h3>
                                        {selectedOwner.FullName}
                                    </h3>

                                    <span>
                                        Owner ID:{" "}
                                        {selectedOwner.OwnerID}
                                    </span>
                                </div>

                            </div>

                            <div className="owner-detail-grid">

                                <div className="owner-detail-item">
                                    <Mail size={18} />
                                    <div>
                                        <small>Email</small>
                                        <strong>
                                            {selectedOwner.Email ||
                                                "Not provided"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="owner-detail-item">
                                    <Phone size={18} />
                                    <div>
                                        <small>Phone</small>
                                        <strong>
                                            {selectedOwner.PhoneNumber ||
                                                "Not provided"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="owner-detail-item">
                                    <MapPin size={18} />
                                    <div>
                                        <small>Address</small>
                                        <strong>
                                            {selectedOwner.Address ||
                                                "Not provided"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="owner-detail-item">
                                    <ShieldCheck size={18} />
                                    <div>
                                        <small>Status</small>
                                        <strong>
                                            {selectedOwner.Status ||
                                                "Unknown"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="owner-detail-item">
                                    <UserRound size={18} />
                                    <div>
                                        <small>ID Type</small>
                                        <strong>
                                            {selectedOwner.IDType ||
                                                "Not provided"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="owner-detail-item">
                                    <ShieldCheck size={18} />
                                    <div>
                                        <small>ID Number</small>
                                        <strong>
                                            {selectedOwner.IDNumber ||
                                                "Not provided"}
                                        </strong>
                                    </div>
                                </div>

                            </div>

                            {/* OWNER PROPERTIES */}

                            <div className="owner-properties-section">

                                <div className="owner-section-title">
                                    <Building2 size={20} />

                                    <div>
                                        <h3>Owned Properties</h3>

                                        <span>
                                            Properties registered under
                                            this owner
                                        </span>
                                    </div>

                                </div>

                                {loadingProperties ? (
                                    <div className="owner-properties-loading">
                                        <Loader2
                                            size={24}
                                            className="owners-spinner"
                                        />

                                        <span>
                                            Loading properties...
                                        </span>
                                    </div>
                                ) : ownerProperties.length === 0 ? (
                                    <div className="owner-no-properties">
                                        <Building2 size={30} />

                                        <p>
                                            No properties found for this
                                            owner.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="owner-property-list">

                                        {ownerProperties.map(
                                            (property) => (
                                                <div
                                                    className="owner-property-item"
                                                    key={
                                                        property.PropertyID
                                                    }
                                                >

                                                    <div>
                                                        <strong>
                                                            {
                                                                property.PropertyName
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                property.PropertyType
                                                            }
                                                        </span>

                                                        <small>
                                                            {
                                                                property.Address
                                                            }
                                                        </small>
                                                    </div>

                                                    <span
                                                        className={`property-status ${
                                                            String(
                                                                property.Status ||
                                                                    ""
                                                            ).toLowerCase()
                                                        }`}
                                                    >
                                                        {property.Status}
                                                    </span>

                                                </div>
                                            )
                                        )}

                                    </div>
                                )}

                            </div>

                        </div>

                        <div className="owners-modal-footer">

                            <button
                                className="owners-secondary-btn"
                                onClick={closeViewModal}
                            >
                                Close
                            </button>

                            <button
                                className="owners-primary-btn"
                                onClick={() => {
                                    closeViewModal();
                                    handleEditOwner(selectedOwner);
                                }}
                            >
                                <Edit size={17} />
                                Edit Owner
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* =================================================
                EDIT OWNER MODAL
            ================================================= */}

            {showEditModal && selectedOwner && (
                <div
                    className="owners-modal-overlay"
                    onClick={closeEditModal}
                >

                    <div
                        className="owners-modal owner-edit-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="owners-modal-header">

                            <div>
                                <h2>Edit Property Owner</h2>

                                <p>
                                    Update owner information
                                </p>
                            </div>

                            <button
                                className="owners-modal-close"
                                onClick={closeEditModal}
                            >
                                <X size={21} />
                            </button>

                        </div>

                        <form
                            className="owner-edit-form"
                            onSubmit={handleUpdateOwner}
                        >

                            {formError && (
                                <div className="owners-form-error">
                                    <AlertCircle size={18} />
                                    <span>{formError}</span>
                                </div>
                            )}

                            <div className="owner-form-grid">

                                <div className="owner-form-group full">
                                    <label>
                                        Full Name
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                    />
                                </div>

                                <div className="owner-form-group">
                                    <label>
                                        Email
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter email"
                                    />
                                </div>

                                <div className="owner-form-group">
                                    <label>
                                        Phone Number
                                    </label>

                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div className="owner-form-group full">
                                    <label>
                                        Address
                                    </label>

                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Enter owner address"
                                        rows="3"
                                    />
                                </div>

                                <div className="owner-form-group">
                                    <label>
                                        ID Type
                                    </label>

                                    <select
                                        name="idType"
                                        value={formData.idType}
                                        onChange={handleChange}
                                    >
                                        <option value="">
                                            Select ID type
                                        </option>

                                        <option value="National ID">
                                            National ID
                                        </option>

                                        <option value="Passport">
                                            Passport
                                        </option>

                                        <option value="Kebele ID">
                                            Kebele ID
                                        </option>
                                    </select>
                                </div>

                                <div className="owner-form-group">
                                    <label>
                                        ID Number
                                    </label>

                                    <input
                                        type="text"
                                        name="idNumber"
                                        value={formData.idNumber}
                                        onChange={handleChange}
                                        placeholder="Enter ID number"
                                    />
                                </div>

                            </div>

                            <div className="owners-modal-footer">

                                <button
                                    type="button"
                                    className="owners-secondary-btn"
                                    onClick={closeEditModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="owners-primary-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2
                                                size={17}
                                                className="owners-spinner"
                                            />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Edit size={17} />
                                            Save Changes
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Owners;