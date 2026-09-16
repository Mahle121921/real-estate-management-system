import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
    Building2,
    Search,
    Plus,
    Pencil,
    Trash2,
    Layers,
    DoorOpen,
    RefreshCw,
    X,
    MapPin,
    Home,
    AlertCircle,
} from "lucide-react";
import "./Buildings.css";

const API_URL = "http://localhost:5000/api";

const Buildings = () => {
    const navigate = useNavigate();

    const [buildings, setBuildings] = useState([]);
    const [properties, setProperties] = useState([]);

    const [loading, setLoading] = useState(true);
    const [propertiesLoading, setPropertiesLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchTerm, setSearchTerm] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingBuilding, setEditingBuilding] = useState(null);

    const [formData, setFormData] = useState({
        propertyId: "",
        buildingName: "",
    });

    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);

    const [deleteLoading, setDeleteLoading] = useState(null);

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");

    const currentUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, []);

    const userRole = String(
        currentUser?.role ||
        currentUser?.Role ||
        currentUser?.RoleName ||
        currentUser?.roleName ||
        ""
    )
        .trim()
        .toLowerCase();

    const isAdministrator = userRole === "administrator";

    const authConfig = useMemo(
        () => ({
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
        [token]
    );

    // ==========================================
    // FETCH BUILDINGS
    // ==========================================
    const fetchBuildings = useCallback(async () => {
        if (!token) {
            navigate("/");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/buildings`,
                authConfig
            );

            const data = response.data;

            if (Array.isArray(data)) {
                setBuildings(data);
            } else if (Array.isArray(data?.buildings)) {
                setBuildings(data.buildings);
            } else {
                setBuildings([]);
            }
        } catch (err) {
            console.error("Error fetching buildings:", err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                navigate("/");
                return;
            }

            if (err.response?.status === 403) {
                setError(
                    err.response?.data?.message ||
                    "You are not authorized to view buildings."
                );
                return;
            }

            setError(
                err.response?.data?.message ||
                "Failed to load buildings."
            );
        } finally {
            setLoading(false);
        }
    }, [authConfig, navigate, token]);

    // ==========================================
    // FETCH PROPERTIES FOR ADD BUILDING
    // ==========================================
    const fetchProperties = useCallback(async () => {
        if (!token) return;

        try {
            setPropertiesLoading(true);

            const response = await axios.get(
                `${API_URL}/properties`,
                authConfig
            );

            const data = response.data;

            if (Array.isArray(data)) {
                setProperties(data);
            } else if (Array.isArray(data?.properties)) {
                setProperties(data.properties);
            } else {
                setProperties([]);
            }
        } catch (err) {
            console.error("Error fetching properties:", err);

            setFormError(
                err.response?.data?.message ||
                "Failed to load properties."
            );
        } finally {
            setPropertiesLoading(false);
        }
    }, [authConfig, token]);

    useEffect(() => {
        fetchBuildings();
    }, [fetchBuildings]);

    // ==========================================
    // CLEAR MESSAGES
    // ==========================================
    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => {
            setSuccess("");
        }, 3500);

        return () => clearTimeout(timer);
    }, [success]);

    // ==========================================
    // SEARCH
    // ==========================================
    const filteredBuildings = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) {
            return buildings;
        }

        return buildings.filter((building) => {
            return (
                String(building.BuildingName || "")
                    .toLowerCase()
                    .includes(term) ||
                String(building.PropertyName || "")
                    .toLowerCase()
                    .includes(term) ||
                String(building.BuildingID || "")
                    .toLowerCase()
                    .includes(term)
            );
        });
    }, [buildings, searchTerm]);

    // ==========================================
    // OPEN ADD MODAL
    // ==========================================
    const openAddModal = async () => {
        setEditingBuilding(null);

        setFormData({
            propertyId: "",
            buildingName: "",
        });

        setFormError("");
        setError("");

        setShowModal(true);

        if (properties.length === 0) {
            await fetchProperties();
        }
    };

    // ==========================================
    // OPEN EDIT MODAL
    // ==========================================
    const openEditModal = (building) => {
        setEditingBuilding(building);

        setFormData({
            propertyId: String(building.PropertyID || ""),
            buildingName: building.BuildingName || "",
        });

        setFormError("");
        setError("");
        setShowModal(true);
    };

    // ==========================================
    // CLOSE MODAL
    // ==========================================
    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingBuilding(null);

        setFormData({
            propertyId: "",
            buildingName: "",
        });

        setFormError("");
    };

    // ==========================================
    // FORM CHANGE
    // ==========================================
    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (formError) {
            setFormError("");
        }
    };

    // ==========================================
    // SAVE BUILDING
    // ==========================================
    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");
        setError("");
        setSuccess("");

        const buildingName = formData.buildingName.trim();

        if (!buildingName) {
            setFormError("Building name is required.");
            return;
        }

        if (!editingBuilding && !formData.propertyId) {
            setFormError("Please select a property.");
            return;
        }

        try {
            setSaving(true);

            if (editingBuilding) {
                await axios.put(
                    `${API_URL}/buildings/${editingBuilding.BuildingID}`,
                    {
                        buildingName,
                    },
                    authConfig
                );

                setSuccess("Building updated successfully.");
            } else {
                await axios.post(
                    `${API_URL}/buildings`,
                    {
                        propertyId: Number(formData.propertyId),
                        buildingName,
                    },
                    authConfig
                );

                setSuccess("Building created successfully.");
            }

            closeModal();
            await fetchBuildings();
        } catch (err) {
            console.error("Error saving building:", err);

            setFormError(
                err.response?.data?.message ||
                "Failed to save building."
            );
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // DELETE BUILDING
    // ==========================================
    const handleDelete = async (building) => {
        const floorCount = Number(building.FloorCount || 0);
        const roomCount = Number(building.RoomCount || 0);

        let message =
            `Are you sure you want to delete "${building.BuildingName}"?`;

        if (floorCount > 0 || roomCount > 0) {
            message +=
                `\n\nThis building currently has ${floorCount} floor(s) and ${roomCount} room(s). ` +
                "The backend will prevent deletion while floors exist.";
        }

        if (!window.confirm(message)) {
            return;
        }

        try {
            setDeleteLoading(building.BuildingID);
            setError("");
            setSuccess("");

            await axios.delete(
                `${API_URL}/buildings/${building.BuildingID}`,
                authConfig
            );

            setSuccess("Building deleted successfully.");
            await fetchBuildings();
        } catch (err) {
            console.error("Error deleting building:", err);

            setError(
                err.response?.data?.message ||
                "Failed to delete building."
            );
        } finally {
            setDeleteLoading(null);
        }
    };

    // ==========================================
    // STATS
    // ==========================================
    const totalBuildings = buildings.length;

    const totalFloors = buildings.reduce(
        (total, building) =>
            total + Number(building.FloorCount || 0),
        0
    );

    const totalRooms = buildings.reduce(
        (total, building) =>
            total + Number(building.RoomCount || 0),
        0
    );

    return (
        <div className="buildings-page">
            {/* ==========================================
                PAGE HEADER
            ========================================== */}
            <div className="buildings-header">
                <div>
                    <div className="buildings-title-row">
                        <div className="buildings-title-icon">
                            <Building2 size={26} />
                        </div>

                        <div>
                            <h1>Buildings</h1>
                            <p>
                                Manage buildings and their floor structure
                            </p>
                        </div>
                    </div>
                </div>

                {isAdministrator && (
                    <button
                        type="button"
                        className="building-add-btn"
                        onClick={openAddModal}
                    >
                        <Plus size={18} />
                        Add Building
                    </button>
                )}
            </div>

            {/* ==========================================
                BREADCRUMB
            ========================================== */}
            <div className="building-breadcrumb">
                <Link to="/properties">
                    Properties
                </Link>

                <span>/</span>

                <span>Buildings</span>
            </div>

            {/* ==========================================
                ALERTS
            ========================================== */}
            {success && (
                <div className="building-alert building-alert-success">
                    <div className="building-alert-icon">
                        ✓
                    </div>

                    <span>{success}</span>

                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {error && (
                <div className="building-alert building-alert-error">
                    <AlertCircle size={18} />

                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* ==========================================
                STATISTICS
            ========================================== */}
            <div className="building-stat-grid">
                <div className="building-stat-card">
                    <div className="building-stat-icon">
                        <Building2 size={22} />
                    </div>

                    <div>
                        <span>Total Buildings</span>
                        <strong>{totalBuildings}</strong>
                    </div>
                </div>

                <div className="building-stat-card">
                    <div className="building-stat-icon">
                        <Layers size={22} />
                    </div>

                    <div>
                        <span>Total Floors</span>
                        <strong>{totalFloors}</strong>
                    </div>
                </div>

                <div className="building-stat-card">
                    <div className="building-stat-icon">
                        <DoorOpen size={22} />
                    </div>

                    <div>
                        <span>Total Rooms</span>
                        <strong>{totalRooms}</strong>
                    </div>
                </div>
            </div>

            {/* ==========================================
                TOOLBAR
            ========================================== */}
            <div className="buildings-toolbar">
                <div className="building-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search buildings or properties..."
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                    />

                    {searchTerm && (
                        <button
                            type="button"
                            className="building-search-clear"
                            onClick={() => setSearchTerm("")}
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>

                <button
                    type="button"
                    className="building-refresh-btn"
                    onClick={fetchBuildings}
                    disabled={loading}
                >
                    <RefreshCw
                        size={17}
                        className={loading ? "building-spin" : ""}
                    />

                    Refresh
                </button>
            </div>

            {/* ==========================================
                BUILDINGS TABLE
            ========================================== */}
            <div className="buildings-card">
                <div className="buildings-card-header">
                    <div>
                        <h2>All Buildings</h2>
                        <p>
                            {filteredBuildings.length} building
                            {filteredBuildings.length !== 1 ? "s" : ""}
                            {" "}found
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="building-loading">
                        <RefreshCw
                            size={28}
                            className="building-spin"
                        />

                        <span>Loading buildings...</span>
                    </div>
                ) : filteredBuildings.length === 0 ? (
                    <div className="building-empty">
                        <div className="building-empty-icon">
                            <Building2 size={34} />
                        </div>

                        <h3>
                            {searchTerm
                                ? "No buildings found"
                                : "No buildings yet"}
                        </h3>

                        <p>
                            {searchTerm
                                ? "Try changing your search term."
                                : "Add a building to start managing your property structure."}
                        </p>

                        {!searchTerm && isAdministrator && (
                            <button
                                type="button"
                                className="building-empty-btn"
                                onClick={openAddModal}
                            >
                                <Plus size={17} />
                                Add Building
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="building-table-wrapper">
                        <table className="building-table">
                            <thead>
                                <tr>
                                    <th>Building</th>
                                    <th>Property</th>
                                    <th>Floors</th>
                                    <th>Rooms</th>
                                    <th>Structure</th>
                                    {isAdministrator && (
                                        <th>Actions</th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {filteredBuildings.map((building) => {
                                    const floorCount = Number(
                                        building.FloorCount ??
                                        building.ActualFloorCount ??
                                        0
                                    );

                                    const roomCount = Number(
                                        building.RoomCount || 0
                                    );

                                    return (
                                        <tr
                                            key={building.BuildingID}
                                        >
                                            <td>
                                                <div className="building-name-cell">
                                                    <div className="building-row-icon">
                                                        <Building2
                                                            size={19}
                                                        />
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {
                                                                building.BuildingName
                                                            }
                                                        </strong>

                                                        <span>
                                                            Building #
                                                            {
                                                                building.BuildingID
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="building-property-cell">
                                                    <Home size={16} />

                                                    <div>
                                                        <strong>
                                                            {
                                                                building.PropertyName ||
                                                                "Unknown Property"
                                                            }
                                                        </strong>

                                                        <span>
                                                            Property #
                                                            {
                                                                building.PropertyID
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="building-count-badge">
                                                    <Layers size={15} />
                                                    {floorCount}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="building-count-badge">
                                                    <DoorOpen size={15} />
                                                    {roomCount}
                                                </span>
                                            </td>

                                            <td>
                                                <Link
                                                    to={`/floors?buildingId=${building.BuildingID}`}
                                                    className="manage-structure-btn"
                                                >
                                                    <Layers size={16} />
                                                    Manage Floors
                                                </Link>
                                            </td>

                                            {isAdministrator && (
                                                <td>
                                                    <div className="building-actions">
                                                        <button
                                                            type="button"
                                                            className="building-action-edit"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    building
                                                                )
                                                            }
                                                            title="Edit building"
                                                        >
                                                            <Pencil
                                                                size={16}
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="building-action-delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    building
                                                                )
                                                            }
                                                            disabled={
                                                                deleteLoading ===
                                                                building.BuildingID
                                                            }
                                                            title="Delete building"
                                                        >
                                                            {deleteLoading ===
                                                            building.BuildingID ? (
                                                                <RefreshCw
                                                                    size={16}
                                                                    className="building-spin"
                                                                />
                                                            ) : (
                                                                <Trash2
                                                                    size={16}
                                                                />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ==========================================
                ADD / EDIT MODAL
            ========================================== */}
            {showModal && (
                <div
                    className="building-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div className="building-modal">
                        <div className="building-modal-header">
                            <div className="building-modal-title">
                                <div className="building-modal-icon">
                                    <Building2 size={21} />
                                </div>

                                <div>
                                    <h2>
                                        {editingBuilding
                                            ? "Edit Building"
                                            : "Add Building"}
                                    </h2>

                                    <p>
                                        {editingBuilding
                                            ? "Update the building information."
                                            : "Create a new building under a property."}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="building-modal-close"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            className="building-form"
                            onSubmit={handleSubmit}
                        >
                            {formError && (
                                <div className="building-form-error">
                                    <AlertCircle size={17} />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {!editingBuilding && (
                                <div className="building-form-group">
                                    <label htmlFor="propertyId">
                                        Property
                                        <span>*</span>
                                    </label>

                                    <select
                                        id="propertyId"
                                        name="propertyId"
                                        value={formData.propertyId}
                                        onChange={handleChange}
                                        disabled={
                                            saving ||
                                            propertiesLoading
                                        }
                                    >
                                        <option value="">
                                            {propertiesLoading
                                                ? "Loading properties..."
                                                : "Select property"}
                                        </option>

                                        {properties.map(
                                            (property) => (
                                                <option
                                                    key={
                                                        property.PropertyID
                                                    }
                                                    value={
                                                        property.PropertyID
                                                    }
                                                >
                                                    {
                                                        property.PropertyName
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                    {!propertiesLoading &&
                                        properties.length === 0 && (
                                            <small>
                                                No properties are
                                                available.
                                            </small>
                                        )}
                                </div>
                            )}

                            {editingBuilding && (
                                <div className="building-form-group">
                                    <label>
                                        Property
                                    </label>

                                    <div className="building-readonly-property">
                                        <Home size={17} />

                                        <div>
                                            <strong>
                                                {
                                                    editingBuilding.PropertyName
                                                }
                                            </strong>

                                            <span>
                                                Property #
                                                {
                                                    editingBuilding.PropertyID
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="building-form-group">
                                <label htmlFor="buildingName">
                                    Building Name
                                    <span>*</span>
                                </label>

                                <input
                                    id="buildingName"
                                    name="buildingName"
                                    type="text"
                                    maxLength={150}
                                    placeholder="e.g. PentHouse Building"
                                    value={formData.buildingName}
                                    onChange={handleChange}
                                    disabled={saving}
                                    autoFocus
                                />

                                <small>
                                    Maximum 150 characters.
                                </small>
                            </div>

                            {!editingBuilding && (
                                <div className="building-form-info">
                                    <Layers size={17} />

                                    <p>
                                        Floors will be added separately
                                        after the building is created.
                                    </p>
                                </div>
                            )}

                            <div className="building-modal-footer">
                                <button
                                    type="button"
                                    className="building-cancel-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="building-save-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw
                                                size={17}
                                                className="building-spin"
                                            />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={17} />
                                            {editingBuilding
                                                ? "Save Changes"
                                                : "Create Building"}
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
};

export default Buildings;
