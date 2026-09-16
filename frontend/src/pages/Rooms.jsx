
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    BedDouble,
    Building2,
    CheckCircle,
    Edit,
    DoorOpen,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    X,
    AlertCircle,
    Layers,
} from "lucide-react";
import "./Rooms.css";

const API = "http://localhost:5000/api";

const ROOM_TYPES = [
    "Bedroom",
    "Living Room",
    "Kitchen",
    "Bathroom",
    "Office",
    "Shop",
    "Studio",
    "Other",
];

const ROOM_STATUSES = [
    "Available",
    "Reserved",
    "Sold",
    "Rented",
];

const emptyForm = {
    roomNumber: "",
    roomType: "Bedroom",
    area: "",
    price: "",
};

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
};

const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    "";

const getUserRole = (user) =>
    String(
        user?.role ||
        user?.Role ||
        user?.RoleName ||
        user?.roleName ||
        ""
    )
        .trim()
        .toLowerCase();

const Rooms = () => {
    const [searchParams] = useSearchParams();

    const floorId = searchParams.get("floorId");

    const [currentUser] = useState(getStoredUser);

    const [floor, setFloor] = useState(null);
    const [rooms, setRooms] = useState([]);

    const [loading, setLoading] = useState(true);
    const [floorLoading, setFloorLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchTerm, setSearchTerm] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);

    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const [deletingId, setDeletingId] = useState(null);
    const [statusUpdatingId, setStatusUpdatingId] = useState(null);

    const userRole = getUserRole(currentUser);
    const isAdministrator = userRole === "administrator";

    const authConfig = useMemo(() => {
        const token = getToken();

        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    }, []);

    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        window.location.href = "/";
    }, []);

    const fetchFloor = useCallback(async () => {
        if (!floorId) {
            setFloor(null);
            return;
        }

        try {
            setFloorLoading(true);

            const response = await axios.get(
                `${API}/floors/${floorId}`,
                authConfig
            );

            setFloor(
                response.data?.floor ||
                response.data ||
                null
            );
        } catch (err) {
            if (err.response?.status === 401) {
                handleUnauthorized();
                return;
            }

            setError(
                err.response?.data?.message ||
                "Failed to load floor information."
            );
        } finally {
            setFloorLoading(false);
        }
    }, [floorId, authConfig, handleUnauthorized]);

    const fetchRooms = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API}/rooms`,
                authConfig
            );

            const data = response.data;

            let roomList = [];

            if (Array.isArray(data)) {
                roomList = data;
            } else if (Array.isArray(data?.rooms)) {
                roomList = data.rooms;
            }

            if (floorId) {
                roomList = roomList.filter(
                    (room) =>
                        Number(room.FloorID ?? room.floorId) ===
                        Number(floorId)
                );
            }

            setRooms(roomList);
        } catch (err) {
            if (err.response?.status === 401) {
                handleUnauthorized();
                return;
            }

            setError(
                err.response?.data?.message ||
                "Failed to load rooms."
            );
        } finally {
            setLoading(false);
        }
    }, [floorId, authConfig, handleUnauthorized]);

    useEffect(() => {
        fetchRooms();
        fetchFloor();
    }, [fetchRooms, fetchFloor]);

    const filteredRooms = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        if (!query) {
            return rooms;
        }

        return rooms.filter((room) => {
            const roomNumber = String(
                room.RoomNumber ?? ""
            ).toLowerCase();

            const roomType = String(
                room.RoomType ?? ""
            ).toLowerCase();

            const status = String(
                room.Status ?? ""
            ).toLowerCase();

            const buildingName = String(
                room.BuildingName ?? ""
            ).toLowerCase();

            const propertyName = String(
                room.PropertyName ?? ""
            ).toLowerCase();

            return (
                roomNumber.includes(query) ||
                roomType.includes(query) ||
                status.includes(query) ||
                buildingName.includes(query) ||
                propertyName.includes(query)
            );
        });
    }, [rooms, searchTerm]);

    const stats = useMemo(() => {
        const total = rooms.length;

        const available = rooms.filter(
            (room) => room.Status === "Available"
        ).length;

        const reserved = rooms.filter(
            (room) => room.Status === "Reserved"
        ).length;

        const sold = rooms.filter(
            (room) => room.Status === "Sold"
        ).length;

        const rented = rooms.filter(
            (room) => room.Status === "Rented"
        ).length;

        return {
            total,
            available,
            reserved,
            sold,
            rented,
        };
    }, [rooms]);

    const openAddModal = () => {
        setEditingRoom(null);
        setForm(emptyForm);
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    const openEditModal = (room) => {
        setEditingRoom(room);

        setForm({
            roomNumber: room.RoomNumber ?? "",
            roomType: room.RoomType ?? "Bedroom",
            area: room.Area ?? "",
            price: room.Price ?? "",
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingRoom(null);
        setForm(emptyForm);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!floorId) {
            setError(
                "Please select a floor before creating a room."
            );
            return;
        }

        const roomNumber = form.roomNumber.trim();

        if (!roomNumber) {
            setError("Room number is required.");
            return;
        }

        if (!form.roomType) {
            setError("Room type is required.");
            return;
        }

        if (
            form.area !== "" &&
            (Number.isNaN(Number(form.area)) ||
                Number(form.area) < 0)
        ) {
            setError("Area must be a valid non-negative number.");
            return;
        }

        if (
            form.price !== "" &&
            (Number.isNaN(Number(form.price)) ||
                Number(form.price) < 0)
        ) {
            setError("Price must be a valid non-negative number.");
            return;
        }

        try {
            setSaving(true);

            if (editingRoom) {
                await axios.put(
                    `${API}/rooms/${editingRoom.RoomID}`,
                    {
                        roomNumber,
                        roomType: form.roomType,
                        area:
                            form.area === ""
                                ? null
                                : Number(form.area),
                        price:
                            form.price === ""
                                ? null
                                : Number(form.price),
                    },
                    authConfig
                );

                setSuccess("Room updated successfully.");
            } else {
                await axios.post(
                    `${API}/rooms`,
                    {
                        floorId: Number(floorId),
                        roomNumber,
                        roomType: form.roomType,
                        area:
                            form.area === ""
                                ? null
                                : Number(form.area),
                        price:
                            form.price === ""
                                ? null
                                : Number(form.price),
                    },
                    authConfig
                );

                setSuccess("Room created successfully.");
            }

            setShowModal(false);
            setEditingRoom(null);
            setForm(emptyForm);

            await fetchRooms();
        } catch (err) {
            if (err.response?.status === 401) {
                handleUnauthorized();
                return;
            }

            setError(
                err.response?.data?.message ||
                "Failed to save room."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (room) => {
        const roomId = room.RoomID;

        const confirmed = window.confirm(
            `Are you sure you want to delete Room ${room.RoomNumber}?`
        );

        if (!confirmed) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            setDeletingId(roomId);

            await axios.delete(
                `${API}/rooms/${roomId}`,
                authConfig
            );

            setSuccess(
                `Room ${room.RoomNumber} deleted successfully.`
            );

            await fetchRooms();
        } catch (err) {
            if (err.response?.status === 401) {
                handleUnauthorized();
                return;
            }

            setError(
                err.response?.data?.message ||
                "Failed to delete room."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const handleStatusChange = async (room, status) => {
        if (room.Status === status) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            setStatusUpdatingId(room.RoomID);

            await axios.patch(
                `${API}/rooms/${room.RoomID}/status`,
                { status },
                authConfig
            );

            setSuccess(
                `Room ${room.RoomNumber} status changed to ${status}.`
            );

            await fetchRooms();
        } catch (err) {
            if (err.response?.status === 401) {
                handleUnauthorized();
                return;
            }

            setError(
                err.response?.data?.message ||
                "Failed to update room status."
            );
        } finally {
            setStatusUpdatingId(null);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Available":
                return "status-available";

            case "Reserved":
                return "status-reserved";

            case "Sold":
                return "status-sold";

            case "Rented":
                return "status-rented";

            default:
                return "status-default";
        }
    };

    return (
        <div className="rooms-page">
            <div className="rooms-header">
                <div>
                    <div className="rooms-breadcrumb">
                        <Link to="/buildings">
                            Buildings
                        </Link>

                        <span>/</span>

                        <Link
                            to={
                                floor?.BuildingID
                                    ? `/floors?buildingId=${floor.BuildingID}`
                                    : "/floors"
                            }
                        >
                            Floors
                        </Link>

                        <span>/</span>

                        <span>Rooms</span>
                    </div>

                    <h1>
                        <DoorOpen size={30} />
                        Rooms Management
                    </h1>

                    <p>
                        Manage rooms within a selected floor.
                    </p>
                </div>

                <div className="rooms-header-actions">
                    <button
                        type="button"
                        className="refresh-btn"
                        onClick={fetchRooms}
                        disabled={loading}
                    >
                        <RefreshCw
                            size={18}
                            className={
                                loading
                                    ? "spin"
                                    : ""
                            }
                        />
                        Refresh
                    </button>

                    {isAdministrator && floorId && (
                        <button
                            type="button"
                            className="add-room-btn"
                            onClick={openAddModal}
                        >
                            <Plus size={18} />
                            Add Room
                        </button>
                    )}
                </div>
            </div>

            {floorId && (
                <div className="room-location-card">
                    <div className="location-icon">
                        <Layers size={24} />
                    </div>

                    <div className="location-content">
                        {floorLoading ? (
                            <span>
                                Loading floor information...
                            </span>
                        ) : floor ? (
                            <>
                                <strong>
                                    Floor {floor.FloorNumber}
                                </strong>

                                <span>
                                    {floor.BuildingName ||
                                        "Building"}{" "}
                                    •{" "}
                                    {floor.PropertyName ||
                                        "Property"}
                                </span>
                            </>
                        ) : (
                            <span>
                                Floor information unavailable
                            </span>
                        )}
                    </div>

                    <Link
                        to={
                            floor?.BuildingID
                                ? `/floors?buildingId=${floor.BuildingID}`
                                : "/floors"
                        }
                        className="back-floor-btn"
                    >
                        <ArrowLeft size={17} />
                        Back to Floors
                    </Link>
                </div>
            )}

            {!floorId && (
                <div className="select-floor-warning">
                    <AlertCircle size={20} />

                    <div>
                        <strong>No floor selected</strong>
                        <p>
                            Open Rooms from a floor's
                            "Manage Rooms" button to manage
                            rooms for that floor.
                        </p>
                    </div>
                </div>
            )}

            {error && (
                <div className="rooms-alert error">
                    <AlertCircle size={18} />
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                    >
                        <X size={17} />
                    </button>
                </div>
            )}

            {success && (
                <div className="rooms-alert success">
                    <CheckCircle size={18} />
                    <span>{success}</span>

                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                    >
                        <X size={17} />
                    </button>
                </div>
            )}

            <div className="rooms-stats">
                <div className="room-stat-card">
                    <div className="room-stat-icon total">
                        <DoorOpen size={22} />
                    </div>

                    <div>
                        <span>Total Rooms</span>
                        <strong>{stats.total}</strong>
                    </div>
                </div>

                <div className="room-stat-card">
                    <div className="room-stat-icon available">
                        <CheckCircle size={22} />
                    </div>

                    <div>
                        <span>Available</span>
                        <strong>{stats.available}</strong>
                    </div>
                </div>

                <div className="room-stat-card">
                    <div className="room-stat-icon reserved">
                        <BedDouble size={22} />
                    </div>

                    <div>
                        <span>Reserved</span>
                        <strong>{stats.reserved}</strong>
                    </div>
                </div>

                <div className="room-stat-card">
                    <div className="room-stat-icon sold">
                        <Building2 size={22} />
                    </div>

                    <div>
                        <span>Sold</span>
                        <strong>{stats.sold}</strong>
                    </div>
                </div>

                <div className="room-stat-card">
                    <div className="room-stat-icon rented">
                        <RefreshCw size={22} />
                    </div>

                    <div>
                        <span>Rented</span>
                        <strong>{stats.rented}</strong>
                    </div>
                </div>
            </div>

            <div className="rooms-content-card">
                <div className="rooms-toolbar">
                    <div>
                        <h2>
                            {floor
                                ? `Rooms on Floor ${floor.FloorNumber}`
                                : "All Rooms"}
                        </h2>

                        <p>
                            {filteredRooms.length} room
                            {filteredRooms.length !== 1
                                ? "s"
                                : ""}{" "}
                            found
                        </p>
                    </div>

                    <div className="room-search">
                        <Search size={18} />

                        <input
                            type="text"
                            placeholder="Search rooms..."
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="rooms-loading">
                        <RefreshCw
                            size={28}
                            className="spin"
                        />
                        <span>
                            Loading rooms...
                        </span>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="rooms-empty">
                        <DoorOpen size={48} />

                        <h3>
                            {searchTerm
                                ? "No rooms found"
                                : "No rooms yet"}
                        </h3>

                        <p>
                            {searchTerm
                                ? "Try changing your search."
                                : floorId
                                ? "Create the first room for this floor."
                                : "Select a floor to manage its rooms."}
                        </p>

                        {isAdministrator &&
                            floorId &&
                            !searchTerm && (
                                <button
                                    type="button"
                                    className="add-room-empty-btn"
                                    onClick={openAddModal}
                                >
                                    <Plus size={18} />
                                    Add First Room
                                </button>
                            )}
                    </div>
                ) : (
                    <div className="rooms-table-wrapper">
                        <table className="rooms-table">
                            <thead>
                                <tr>
                                    <th>Room</th>
                                    <th>Type</th>
                                    <th>Area</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    {isAdministrator && (
                                        <th>Actions</th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {filteredRooms.map((room) => (
                                    <tr
                                        key={room.RoomID}
                                    >
                                        <td>
                                            <div className="room-number">
                                                <div className="room-number-icon">
                                                    <DoorOpen
                                                        size={18}
                                                    />
                                                </div>

                                                <div>
                                                    <strong>
                                                        Room{" "}
                                                        {
                                                            room.RoomNumber
                                                        }
                                                    </strong>

                                                    <span>
                                                        ID #
                                                        {
                                                            room.RoomID
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="room-type">
                                                {
                                                    room.RoomType
                                                }
                                            </span>
                                        </td>

                                        <td>
                                            {room.Area !==
                                                null &&
                                            room.Area !==
                                                undefined &&
                                            room.Area !==
                                                ""
                                                ? `${room.Area} m²`
                                                : "—"}
                                        </td>

                                        <td>
                                            {room.Price !==
                                                null &&
                                            room.Price !==
                                                undefined &&
                                            room.Price !==
                                                ""
                                                ? Number(
                                                      room.Price
                                                  ).toLocaleString(
                                                      undefined,
                                                      {
                                                          minimumFractionDigits: 2,
                                                          maximumFractionDigits: 2,
                                                      }
                                                  )
                                                : "—"}
                                        </td>

                                        <td>
                                            {isAdministrator ? (
                                                <select
                                                    className={`status-select ${getStatusClass(
                                                        room.Status
                                                    )}`}
                                                    value={
                                                        room.Status ||
                                                        "Available"
                                                    }
                                                    disabled={
                                                        statusUpdatingId ===
                                                        room.RoomID
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleStatusChange(
                                                            room,
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                >
                                                    {ROOM_STATUSES.map(
                                                        (
                                                            status
                                                        ) => (
                                                            <option
                                                                key={
                                                                    status
                                                                }
                                                                value={
                                                                    status
                                                                }
                                                            >
                                                                {
                                                                    status
                                                                }
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            ) : (
                                                <span
                                                    className={`room-status ${getStatusClass(
                                                        room.Status
                                                    )}`}
                                                >
                                                    {
                                                        room.Status
                                                    }
                                                </span>
                                            )}
                                        </td>

                                        {isAdministrator && (
                                            <td>
                                                <div className="room-actions">
                                                    <button
                                                        type="button"
                                                        className="icon-action edit"
                                                        title="Edit room"
                                                        onClick={() =>
                                                            openEditModal(
                                                                room
                                                            )
                                                        }
                                                    >
                                                        <Edit
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="icon-action delete"
                                                        title="Delete room"
                                                        disabled={
                                                            deletingId ===
                                                            room.RoomID
                                                        }
                                                        onClick={() =>
                                                            handleDelete(
                                                                room
                                                            )
                                                        }
                                                    >
                                                        {deletingId ===
                                                        room.RoomID ? (
                                                            <RefreshCw
                                                                size={
                                                                    17
                                                                }
                                                                className="spin"
                                                            />
                                                        ) : (
                                                            <Trash2
                                                                size={
                                                                    17
                                                                }
                                                            />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div
                    className="room-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div className="room-modal">
                        <div className="room-modal-header">
                            <div>
                                <div className="modal-icon">
                                    <DoorOpen size={22} />
                                </div>

                                <div>
                                    <h2>
                                        {editingRoom
                                            ? "Edit Room"
                                            : "Add Room"}
                                    </h2>

                                    <p>
                                        {editingRoom
                                            ? `Update Room ${editingRoom.RoomNumber}`
                                            : floor
                                            ? `Add a room to Floor ${floor.FloorNumber}`
                                            : "Create a new room"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeModal}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            className="room-form"
                            onSubmit={handleSubmit}
                        >
                            {error && (
                                <div className="form-error">
                                    <AlertCircle
                                        size={17}
                                    />
                                    {error}
                                </div>
                            )}

                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="roomNumber">
                                        Room Number{" "}
                                        <span>*</span>
                                    </label>

                                    <input
                                        id="roomNumber"
                                        name="roomNumber"
                                        type="text"
                                        value={
                                            form.roomNumber
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. 501"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="roomType">
                                        Room Type{" "}
                                        <span>*</span>
                                    </label>

                                    <select
                                        id="roomType"
                                        name="roomType"
                                        value={
                                            form.roomType
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    >
                                        {ROOM_TYPES.map(
                                            (type) => (
                                                <option
                                                    key={
                                                        type
                                                    }
                                                    value={
                                                        type
                                                    }
                                                >
                                                    {type}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="area">
                                        Area (m²)
                                    </label>

                                    <input
                                        id="area"
                                        name="area"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            form.area
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. 35"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="price">
                                        Price
                                    </label>

                                    <input
                                        id="price"
                                        name="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            form.price
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. 250000"
                                    />
                                </div>
                            </div>

                            <div className="room-form-info">
                                <Layers size={17} />

                                <span>
                                    {floor
                                        ? `Property: ${
                                              floor.PropertyName ||
                                              "—"
                                          } • Building: ${
                                              floor.BuildingName ||
                                              "—"
                                          } • Floor: ${
                                              floor.FloorNumber
                                          }`
                                        : "No floor selected"}
                                </span>
                            </div>

                            <div className="room-modal-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-room-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw
                                                size={17}
                                                className="spin"
                                            />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle
                                                size={17}
                                            />
                                            {editingRoom
                                                ? "Update Room"
                                                : "Create Room"}
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

export default Rooms;

