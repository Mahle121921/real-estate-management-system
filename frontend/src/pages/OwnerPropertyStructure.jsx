import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Building2,
    ChevronDown,
    ChevronRight,
    DoorOpen,
    Edit,
    Image as ImageIcon,
    Layers,
    MapPin,
    Plus,
    RefreshCw,
    Trash2,
    Upload,
    X,
} from "lucide-react";

import "./OwnerPropertyStructure.css";

function OwnerPropertyStructure() {
    const navigate = useNavigate();

    // =========================================================
    // AUTHENTICATION
    // =========================================================

    const token = localStorage.getItem("token");

    const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const userRole =
        storedUser?.role ||
        storedUser?.Role ||
        storedUser?.RoleName ||
        storedUser?.roleName ||
        "";

    const normalizedRole = String(userRole)
        .trim()
        .toLowerCase();

    const isAdministrator =
        normalizedRole === "administrator";

    const isOwner =
        normalizedRole === "owner";

    const userName =
        storedUser?.fullName ||
        storedUser?.FullName ||
        storedUser?.name ||
        storedUser?.Name ||
        "User";

    const canManageStructure =
        isOwner || isAdministrator;

    // =========================================================
    // STATE
    // =========================================================

    const [owner, setOwner] = useState(null);

    const [properties, setProperties] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [floors, setFloors] = useState([]);
    const [rooms, setRooms] = useState([]);

    const [selectedPropertyId, setSelectedPropertyId] =
        useState("");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [expandedBuildings, setExpandedBuildings] =
        useState({});

    const [expandedFloors, setExpandedFloors] =
        useState({});

    // =========================================================
    // BUILDING MODAL
    // =========================================================

    const [buildingModalOpen, setBuildingModalOpen] =
        useState(false);

    const [buildingModalType, setBuildingModalType] =
        useState("");

    const [editingBuilding, setEditingBuilding] =
        useState(null);

    const [buildingName, setBuildingName] =
        useState("");

    const [savingBuilding, setSavingBuilding] =
        useState(false);

    // =========================================================
    // FLOOR MODAL
    // =========================================================

    const [floorModalOpen, setFloorModalOpen] =
        useState(false);

    const [floorModalType, setFloorModalType] =
        useState("");

    const [editingFloor, setEditingFloor] =
        useState(null);

    const [selectedBuildingForFloor, setSelectedBuildingForFloor] =
        useState(null);

    const [floorNumber, setFloorNumber] =
        useState("");

    const [savingFloor, setSavingFloor] =
        useState(false);

    // =========================================================
    // ROOM MODAL
    // =========================================================

    const [roomModalOpen, setRoomModalOpen] =
        useState(false);

    const [roomModalType, setRoomModalType] =
        useState("");

    const [editingRoom, setEditingRoom] =
        useState(null);

    const [selectedFloorForRoom, setSelectedFloorForRoom] =
        useState(null);

    const [roomNumber, setRoomNumber] =
        useState("");

    const [roomType, setRoomType] =
        useState("");

    const [roomStatus, setRoomStatus] =
        useState("Available");

    const [savingRoom, setSavingRoom] =
        useState(false);

    // =========================================================
    // ROOM IMAGE MODAL
    // =========================================================

    const [imageModalOpen, setImageModalOpen] =
        useState(false);

    const [selectedRoomForImages, setSelectedRoomForImages] =
        useState(null);

    const [roomImages, setRoomImages] =
        useState([]);

    const [loadingImages, setLoadingImages] =
        useState(false);

    const [uploadingImage, setUploadingImage] =
        useState(false);

    const [selectedImageFile, setSelectedImageFile] =
        useState(null);

    // =========================================================
    // AXIOS CONFIG
    // =========================================================

    const config = useMemo(
        () => ({
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }),
        [token]
    );

    // =========================================================
    // ID HELPERS
    // =========================================================

    const getId = (item, ...keys) => {
        for (const key of keys) {
            if (
                item?.[key] !== undefined &&
                item?.[key] !== null
            ) {
                return item[key];
            }
        }

        return null;
    };

    const getPropertyId = (property) =>
        getId(
            property,
            "PropertyID",
            "propertyID",
            "propertyId",
            "id"
        );

    const getBuildingId = (building) =>
        getId(
            building,
            "BuildingID",
            "buildingID",
            "buildingId",
            "id"
        );

    const getFloorId = (floor) =>
        getId(
            floor,
            "FloorID",
            "floorID",
            "floorId",
            "id"
        );

    const getRoomId = (room) =>
        getId(
            room,
            "RoomID",
            "roomID",
            "roomId",
            "id"
        );

    const getBuildingPropertyId = (building) =>
        getId(
            building,
            "PropertyID",
            "propertyID",
            "propertyId"
        );

    const getFloorBuildingId = (floor) =>
        getId(
            floor,
            "BuildingID",
            "buildingID",
            "buildingId"
        );

    const getRoomFloorId = (room) =>
        getId(
            room,
            "FloorID",
            "floorID",
            "floorId"
        );

    // =========================================================
    // IMAGE URL HELPER
    // =========================================================
const getImageUrl = (image) => {
    const imagePath =
        image?.ImagePath ||
        image?.imagePath ||
        image?.ImageURL ||
        image?.imageURL ||
        image?.url ||
        image?.URL ||
        "";

    if (!imagePath) {
        return "";
    }

    // Already a full URL
    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("data:")
    ) {
        return imagePath;
    }

    // Already starts with /uploads
    if (imagePath.startsWith("/uploads/")) {
        return `http://localhost:5000${imagePath}`;
    }

    // Starts with uploads/ (no leading slash)
    if (imagePath.startsWith("uploads/")) {
        return `http://localhost:5000/${imagePath}`;
    }

    // Starts with /rooms or /something
    if (imagePath.startsWith("/")) {
        return `http://localhost:5000/uploads${imagePath}`;
    }

    // Relative like: rooms/room-5-xxx.png
    return `http://localhost:5000/uploads/${imagePath}`;
};
    // =========================================================
    // FETCH OWNER
    // =========================================================

    const fetchOwner = useCallback(async () => {
        if (!isOwner) {
            return null;
        }

        const response = await axios.get(
            "http://localhost:5000/api/owners/me",
            config
        );

        const ownerData =
            response.data?.owner ||
            response.data?.data ||
            response.data;

        if (!ownerData) {
            throw new Error(
                "Owner information was not returned by the server."
            );
        }

        const ownerId =
            ownerData.OwnerID ||
            ownerData.ownerID ||
            ownerData.ownerId;

        if (!ownerId) {
            throw new Error(
                "Owner ID is missing from the owner information."
            );
        }

        const normalizedOwner = {
            ...ownerData,
            OwnerID: ownerId,
        };

        setOwner(normalizedOwner);

        return normalizedOwner;
    }, [config, isOwner]);

    // =========================================================
    // FETCH PROPERTIES
    // =========================================================

    const fetchProperties = useCallback(
        async (ownerData) => {
            let response;

            if (isAdministrator) {
                response = await axios.get(
                    "http://localhost:5000/api/properties",
                    config
                );
            } else if (isOwner) {
                const ownerId =
                    ownerData?.OwnerID ||
                    ownerData?.ownerID ||
                    ownerData?.ownerId;

                if (!ownerId) {
                    throw new Error(
                        "Owner ID is missing."
                    );
                }

                response = await axios.get(
                    `http://localhost:5000/api/owners/${ownerId}/properties`,
                    config
                );
            } else {
                setProperties([]);
                return [];
            }

            const list =
                response.data?.properties ||
                response.data?.data ||
                (Array.isArray(response.data)
                    ? response.data
                    : []);

            const safeList =
                Array.isArray(list)
                    ? list
                    : [];

            setProperties(safeList);

            return safeList;
        },
        [
            config,
            isAdministrator,
            isOwner,
        ]
    );

    // =========================================================
    // FETCH BUILDINGS
    // =========================================================

    const fetchBuildings = useCallback(async () => {
        const response = await axios.get(
            "http://localhost:5000/api/buildings",
            config
        );

        const data =
            response.data?.buildings ||
            response.data?.data ||
            (Array.isArray(response.data)
                ? response.data
                : []);

        setBuildings(
            Array.isArray(data)
                ? data
                : []
        );

        return Array.isArray(data)
            ? data
            : [];
    }, [config]);

    // =========================================================
    // FETCH FLOORS
    // =========================================================

    const fetchFloors = useCallback(async () => {
        const response = await axios.get(
            "http://localhost:5000/api/floors",
            config
        );

        const data =
            response.data?.floors ||
            response.data?.data ||
            (Array.isArray(response.data)
                ? response.data
                : []);

        setFloors(
            Array.isArray(data)
                ? data
                : []
        );

        return Array.isArray(data)
            ? data
            : [];
    }, [config]);

    // =========================================================
    // FETCH ROOMS
    // =========================================================

    const fetchRooms = useCallback(async () => {
        const response = await axios.get(
            "http://localhost:5000/api/rooms",
            config
        );

        const data =
            response.data?.rooms ||
            response.data?.data ||
            (Array.isArray(response.data)
                ? response.data
                : []);

        setRooms(
            Array.isArray(data)
                ? data
                : []
        );

        return Array.isArray(data)
            ? data
            : [];
    }, [config]);

    // =========================================================
    // LOAD EVERYTHING
    // =========================================================

    const loadStructure = useCallback(
        async () => {
            if (!token) {
                navigate("/", {
                    replace: true,
                });

                return;
            }

            setError("");

            let ownerData = null;

            if (isOwner) {
                ownerData =
                    await fetchOwner();
            }

            const propertyList =
                await fetchProperties(
                    ownerData
                );

            await Promise.all([
                fetchBuildings(),
                fetchFloors(),
                fetchRooms(),
            ]);

            if (propertyList.length > 0) {
                const firstPropertyId =
                    getPropertyId(
                        propertyList[0]
                    );

                setSelectedPropertyId(
                    String(firstPropertyId)
                );
            } else {
                setSelectedPropertyId("");
            }
        },
        [
            token,
            navigate,
            isOwner,
            fetchOwner,
            fetchProperties,
            fetchBuildings,
            fetchFloors,
            fetchRooms,
        ]
    );

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                await loadStructure();
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "Property structure loading error:",
                    err
                );

                if (!err.response) {
                    setError(
                        "Cannot connect to the backend server. Make sure the Node.js server is running on port 5000."
                    );
                } else {
                    setError(
                        err.response?.data?.message ||
                            err.message ||
                            `Server error (${err.response.status}).`
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [loadStructure]);

    // =========================================================
    // REFRESH
    // =========================================================

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            setError("");

            await loadStructure();
        } catch (err) {
            console.error(
                "Refresh property structure error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Failed to refresh property structure."
            );
        } finally {
            setRefreshing(false);
        }
    };

    // =========================================================
    // SELECTED PROPERTY
    // =========================================================

    const selectedProperty =
        properties.find(
            (property) =>
                String(
                    getPropertyId(property)
                ) ===
                String(selectedPropertyId)
        );

    // =========================================================
    // BUILDINGS FOR SELECTED PROPERTY
    // =========================================================

    const propertyBuildings =
        buildings.filter(
            (building) =>
                String(
                    getBuildingPropertyId(
                        building
                    )
                ) ===
                String(selectedPropertyId)
        );

    // =========================================================
    // TOGGLE BUILDING
    // =========================================================

    const toggleBuilding = (
        buildingId
    ) => {
        setExpandedBuildings(
            (previous) => ({
                ...previous,
                [buildingId]:
                    !previous[buildingId],
            })
        );
    };

    // =========================================================
    // TOGGLE FLOOR
    // =========================================================

    const toggleFloor = (
        floorId
    ) => {
        setExpandedFloors(
            (previous) => ({
                ...previous,
                [floorId]:
                    !previous[floorId],
            })
        );
    };

    // =========================================================
    // BUILDING CRUD
    // =========================================================

    const openAddBuilding = () => {
        if (!selectedPropertyId) {
            setError(
                "Please select a property first."
            );

            return;
        }

        setError("");
        setEditingBuilding(null);
        setBuildingName("");
        setBuildingModalType("add");
        setBuildingModalOpen(true);
    };

    const openEditBuilding = (
        building
    ) => {
        const buildingId =
            getBuildingId(building);

        if (!buildingId) {
            setError(
                "Building ID could not be found."
            );

            return;
        }

        const currentName =
            building.BuildingName ||
            building.buildingName ||
            "";

        setError("");
        setEditingBuilding(building);
        setBuildingName(currentName);
        setBuildingModalType("edit");
        setBuildingModalOpen(true);
    };

    const closeBuildingModal = () => {
        if (savingBuilding) {
            return;
        }

        setBuildingModalOpen(false);
        setBuildingModalType("");
        setEditingBuilding(null);
        setBuildingName("");
    };

    const handleSaveBuilding = async (
        event
    ) => {
        event.preventDefault();

        const name =
            buildingName.trim();

        if (!name) {
            setError(
                "Building name is required."
            );

            return;
        }

        try {
            setSavingBuilding(true);
            setError("");

            if (
                buildingModalType ===
                "add"
            ) {
                await axios.post(
                    "http://localhost:5000/api/buildings",
                    {
                        propertyId:
                            Number(
                                selectedPropertyId
                            ),
                        buildingName:
                            name,
                    },
                    config
                );
            }

            if (
                buildingModalType ===
                "edit"
            ) {
                const buildingId =
                    getBuildingId(
                        editingBuilding
                    );

                if (!buildingId) {
                    throw new Error(
                        "Building ID is missing."
                    );
                }

                await axios.put(
                    `http://localhost:5000/api/buildings/${buildingId}`,
                    {
                        buildingName:
                            name,
                    },
                    config
                );
            }

            closeBuildingModal();

            await fetchBuildings();
        } catch (err) {
            console.error(
                "Save building error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Failed to save building."
            );
        } finally {
            setSavingBuilding(false);
        }
    };

    const handleDeleteBuilding =
        async (building) => {
            const buildingId =
                getBuildingId(building);

            if (!buildingId) {
                setError(
                    "Building ID could not be found."
                );

                return;
            }

            const name =
                building.BuildingName ||
                building.buildingName ||
                `Building ${buildingId}`;

            const confirmed =
                window.confirm(
                    `Are you sure you want to delete "${name}"?\n\n` +
                    `A building normally cannot be deleted if it contains floors.`
                );

            if (!confirmed) {
                return;
            }

            try {
                setError("");

                await axios.delete(
                    `http://localhost:5000/api/buildings/${buildingId}`,
                    config
                );

                await Promise.all([
                    fetchBuildings(),
                    fetchFloors(),
                    fetchRooms(),
                ]);

                setExpandedBuildings(
                    (previous) => {
                        const updated = {
                            ...previous,
                        };

                        delete updated[
                            buildingId
                        ];

                        return updated;
                    }
                );
            } catch (err) {
                console.error(
                    "Delete building error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                        err.message ||
                        "Failed to delete building."
                );
            }
        };

    // =========================================================
    // FLOOR CRUD
    // =========================================================

    const openAddFloor = (
        building
    ) => {
        const buildingId =
            getBuildingId(building);

        if (!buildingId) {
            setError(
                "Building ID could not be found."
            );

            return;
        }

        setError("");
        setEditingFloor(null);
        setSelectedBuildingForFloor(
            building
        );
        setFloorNumber("");
        setFloorModalType("add");
        setFloorModalOpen(true);
    };

    const openEditFloor = (
        floor
    ) => {
        const floorId =
            getFloorId(floor);

        if (!floorId) {
            setError(
                "Floor ID could not be found."
            );

            return;
        }

        const currentFloor =
            floor.FloorNumber ??
            floor.floorNumber ??
            "";

        setError("");
        setEditingFloor(floor);
        setFloorNumber(
            String(currentFloor)
        );
        setSelectedBuildingForFloor(
            null
        );
        setFloorModalType("edit");
        setFloorModalOpen(true);
    };

    const closeFloorModal = () => {
        if (savingFloor) {
            return;
        }

        setFloorModalOpen(false);
        setFloorModalType("");
        setEditingFloor(null);
        setSelectedBuildingForFloor(
            null
        );
        setFloorNumber("");
    };

    const handleSaveFloor = async (
        event
    ) => {
        event.preventDefault();

        const value =
            String(
                floorNumber
            ).trim();

        if (!value) {
            setError(
                "Floor number/name is required."
            );

            return;
        }

        try {
            setSavingFloor(true);
            setError("");

            if (
                floorModalType ===
                "add"
            ) {
                const buildingId =
                    getBuildingId(
                        selectedBuildingForFloor
                    );

                if (!buildingId) {
                    throw new Error(
                        "Building ID is missing."
                    );
                }

                await axios.post(
                    "http://localhost:5000/api/floors",
                    {
                        buildingId:
                            Number(
                                buildingId
                            ),
                        floorNumber:
                            value,
                    },
                    config
                );
            }

            if (
                floorModalType ===
                "edit"
            ) {
                const floorId =
                    getFloorId(
                        editingFloor
                    );

                if (!floorId) {
                    throw new Error(
                        "Floor ID is missing."
                    );
                }

                await axios.put(
                    `http://localhost:5000/api/floors/${floorId}`,
                    {
                        floorNumber:
                            value,
                    },
                    config
                );
            }

            closeFloorModal();

            await fetchFloors();
        } catch (err) {
            console.error(
                "Save floor error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Failed to save floor."
            );
        } finally {
            setSavingFloor(false);
        }
    };

    const handleDeleteFloor =
        async (floor) => {
            const floorId =
                getFloorId(floor);

            if (!floorId) {
                setError(
                    "Floor ID could not be found."
                );

                return;
            }

            const floorName =
                floor.FloorNumber ??
                floor.floorNumber ??
                `Floor ${floorId}`;

            const confirmed =
                window.confirm(
                    `Are you sure you want to delete "${floorName}"?\n\n` +
                    `The floor should be empty before deletion.`
                );

            if (!confirmed) {
                return;
            }

            try {
                setError("");

                await axios.delete(
                    `http://localhost:5000/api/floors/${floorId}`,
                    config
                );

                await Promise.all([
                    fetchFloors(),
                    fetchRooms(),
                ]);

                setExpandedFloors(
                    (previous) => {
                        const updated = {
                            ...previous,
                        };

                        delete updated[
                            floorId
                        ];

                        return updated;
                    }
                );
            } catch (err) {
                console.error(
                    "Delete floor error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                        err.message ||
                        "Failed to delete floor."
                );
            }
        };

    // =========================================================
    // ROOM CRUD
    // =========================================================

    const openAddRoom = (
        floor
    ) => {
        const floorId =
            getFloorId(floor);

        if (!floorId) {
            setError(
                "Floor ID could not be found."
            );

            return;
        }

        setError("");
        setEditingRoom(null);
        setSelectedFloorForRoom(
            floor
        );
        setRoomNumber("");
        setRoomType("");
        setRoomStatus(
            "Available"
        );
        setRoomModalType("add");
        setRoomModalOpen(true);
    };

    const openEditRoom = (
        room
    ) => {
        const roomId =
            getRoomId(room);

        if (!roomId) {
            setError(
                "Room ID could not be found."
            );

            return;
        }

        setError("");
        setEditingRoom(room);
        setSelectedFloorForRoom(
            null
        );

        setRoomNumber(
            room.RoomNumber ||
                room.roomNumber ||
                ""
        );

        setRoomType(
            room.RoomType ||
                room.roomType ||
                ""
        );

        setRoomStatus(
            room.Status ||
                room.status ||
                "Available"
        );

        setRoomModalType("edit");
        setRoomModalOpen(true);
    };

    const closeRoomModal = () => {
        if (savingRoom) {
            return;
        }

        setRoomModalOpen(false);
        setRoomModalType("");
        setEditingRoom(null);
        setSelectedFloorForRoom(
            null
        );
        setRoomNumber("");
        setRoomType("");
        setRoomStatus("Available");
    };

   const handleSaveRoom = async (event) => {
    event.preventDefault();

    const number = roomNumber.trim();
    const type = roomType.trim();

    if (!number) {
        setError("Room number is required.");
        return;
    }

    if (!type) {
        setError("Room type is required.");
        return;
    }

    try {
        setSavingRoom(true);
        setError("");

        if (roomModalType === "add") {
            const floorId = getFloorId(selectedFloorForRoom);

            if (!floorId) {
                throw new Error("Floor ID is missing.");
            }

            await axios.post(
                "http://localhost:5000/api/rooms",
                {
                    floorId: Number(floorId),
                    FloorID: Number(floorId),
                    roomNumber: number,
                    RoomNumber: number,
                    roomType: type,
                    RoomType: type,
                    status: roomStatus,
                    Status: roomStatus,
                },
                config
            );
        }

        if (roomModalType === "edit") {
            const roomId = getRoomId(editingRoom);

            if (!roomId) {
                throw new Error("Room ID is missing.");
            }

            await axios.put(
                `http://localhost:5000/api/rooms/${roomId}`,
                {
                    roomNumber: number,
                    RoomNumber: number,
                    roomType: type,
                    RoomType: type,
                    status: roomStatus,
                    Status: roomStatus,
                },
                config
            );
        }

        closeRoomModal();
        await fetchRooms();
    } catch (err) {
        console.error("Save room error:", err);
        setError(
            err.response?.data?.message ||
                err.message ||
                "Failed to save room."
        );
    } finally {
        setSavingRoom(false);
    }
};

    const handleDeleteRoom =
        async (room) => {
            const roomId =
                getRoomId(room);

            if (!roomId) {
                setError(
                    "Room ID could not be found."
                );

                return;
            }

            const roomName =
                room.RoomNumber ||
                room.roomNumber ||
                `Room ${roomId}`;

            const confirmed =
                window.confirm(
                    `Are you sure you want to delete "${roomName}"?\n\n` +
                    `All room images may also be removed depending on your database rules.`
                );

            if (!confirmed) {
                return;
            }

            try {
                setError("");

                await axios.delete(
                    `http://localhost:5000/api/rooms/${roomId}`,
                    config
                );

                await fetchRooms();
            } catch (err) {
                console.error(
                    "Delete room error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                        err.message ||
                        "Failed to delete room."
                );
            }
        };
// =========================================================
// ROOM IMAGES
// =========================================================

const fetchRoomImages = async (roomId) => {
    try {
        setLoadingImages(true);
        setError("");

        // Try primary path first, then fallback
        let response;
        try {
            response = await axios.get(
                `http://localhost:5000/api/rooms/${roomId}/images`,
                config
            );
        } catch (primaryErr) {
            if (primaryErr.response?.status === 404) {
                response = await axios.get(
                    `http://localhost:5000/api/room-images/${roomId}/images`,
                    config
                );
            } else {
                throw primaryErr;
            }
        }

        const data =
            response.data?.images ||
            response.data?.roomImages ||
            response.data?.data ||
            (Array.isArray(response.data) ? response.data : []);

        setRoomImages(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error("Fetch room images error:", err);
        setRoomImages([]);
        setError(
            err.response?.data?.message ||
                err.message ||
                "Failed to load room images."
        );
    } finally {
        setLoadingImages(false);
    }
};

const openRoomImages = async (room) => {
    const roomId = getRoomId(room);

    if (!roomId) {
        setError("Room ID could not be found.");
        return;
    }

    setError("");
    setSelectedRoomForImages(room);
    setSelectedImageFile(null);
    setImageModalOpen(true);

    await fetchRoomImages(roomId);
};

const closeImageModal = () => {
    if (uploadingImage) return;

    setImageModalOpen(false);
    setSelectedRoomForImages(null);
    setRoomImages([]);
    setSelectedImageFile(null);
};

const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
        setSelectedImageFile(null);
        return;
    }

    if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (JPG, PNG, WEBP).");
        event.target.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be 5 MB or less.");
        event.target.value = "";
        return;
    }

    setError("");
    setSelectedImageFile(file);
};

const handleUploadRoomImage = async () => {
    if (!selectedRoomForImages) {
        setError("No room selected.");
        return;
    }

    if (!selectedImageFile) {
        setError("Please select an image first.");
        return;
    }

    const roomId = getRoomId(selectedRoomForImages);

    if (!roomId) {
        setError("Room ID is missing.");
        return;
    }

    try {
        setUploadingImage(true);
        setError("");

        const formData = new FormData();
        // Try common field names your backend may expect
        formData.append("image", selectedImageFile);
        formData.append("file", selectedImageFile);
        formData.append("roomImage", selectedImageFile);

        let uploaded = false;
        let lastError = null;

        const uploadUrls = [
            `http://localhost:5000/api/rooms/${roomId}/images`,
            `http://localhost:5000/api/room-images/${roomId}/images`,
            `http://localhost:5000/api/room-images/${roomId}`,
        ];

        for (const url of uploadUrls) {
            try {
                await axios.post(url, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        // Do NOT set Content-Type — browser sets multipart boundary
                    },
                });
                uploaded = true;
                break;
            } catch (err) {
                lastError = err;
                if (err.response?.status !== 404) {
                    // Non-404 = real validation/auth error, stop trying
                    throw err;
                }
            }
        }

        if (!uploaded) {
            throw lastError || new Error("Upload endpoint not found.");
        }

        setSelectedImageFile(null);

        const fileInput = document.getElementById("room-image-upload");
        if (fileInput) fileInput.value = "";

        await fetchRoomImages(roomId);
    } catch (err) {
        console.error("Upload room image error:", err);
        setError(
            err.response?.data?.message ||
                err.message ||
                "Failed to upload room image."
        );
    } finally {
        setUploadingImage(false);
    }
};

const handleDeleteRoomImage = async (image) => {
    const imageId = getId(
        image,
        "RoomImageID",
        "roomImageID",
        "roomImageId",
        "ImageID",
        "imageID",
        "imageId",
        "PropertyImageID",
        "propertyImageID",
        "id"
    );

    if (!imageId) {
        setError("Image ID could not be found.");
        return;
    }

    const confirmed = window.confirm(
        "Are you sure you want to delete this room image?"
    );
    if (!confirmed) return;

    try {
        setError("");

        const roomId = getRoomId(selectedRoomForImages);

        const deleteUrls = [
            `http://localhost:5000/api/rooms/images/${imageId}`,
            `http://localhost:5000/api/rooms/${roomId}/images/${imageId}`,
            `http://localhost:5000/api/room-images/${imageId}`,
            `http://localhost:5000/api/room-images/${roomId}/images/${imageId}`,
        ];

        let deleted = false;
        let lastError = null;

        for (const url of deleteUrls) {
            try {
                await axios.delete(url, config);
                deleted = true;
                break;
            } catch (err) {
                lastError = err;
                if (err.response?.status !== 404) throw err;
            }
        }

        if (!deleted) {
            throw lastError || new Error("Delete endpoint not found.");
        }

        if (roomId) {
            await fetchRoomImages(roomId);
        }
    } catch (err) {
        console.error("Delete room image error:", err);
        setError(
            err.response?.data?.message ||
                err.message ||
                "Failed to delete room image."
        );
    }
};
    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="property-structure-page">

                <div className="property-structure-loading">

                    <RefreshCw
                        size={32}
                        className="loading-spinner"
                    />

                    <h2>
                        Loading Property Structure...
                    </h2>

                    <p>
                        Please wait while we
                        load the properties,
                        buildings, floors and
                        rooms.
                    </p>

                </div>

            </div>
        );
    }

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="property-structure-page">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="property-structure-header">

                <div className="header-left">

                    <Link
                        to={
                            isOwner
                                ? "/owner-dashboard"
                                : "/dashboard"
                        }
                        className="back-button"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </Link>

                    <div>
                        <h1>
                            Property Structure
                        </h1>

                        <p>
                            Manage buildings,
                            floors, rooms and
                            room images.
                        </p>
                    </div>

                </div>

                <div className="header-right">

                    <span className="role-badge">
                        {isOwner
                            ? "Owner"
                            : isAdministrator
                                ? "Administrator"
                                : userName}
                    </span>

                    <button
                        type="button"
                        className="refresh-button"
                        onClick={
                            handleRefresh
                        }
                        disabled={
                            refreshing
                        }
                    >
                        <RefreshCw
                            size={17}
                            className={
                                refreshing
                                    ? "loading-spinner"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>

                </div>

            </div>

            {/* =====================================================
                ERROR
            ===================================================== */}

            {error && (
                <div className="structure-error">

                    <strong>
                        Unable to process property structure
                    </strong>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={
                            handleRefresh
                        }
                    >
                        Try Again
                    </button>

                </div>
            )}

            {/* =====================================================
                SUMMARY
            ===================================================== */}

            <div className="structure-summary">

                <div className="summary-card">

                    <Building2 size={24} />

                    <div>
                        <strong>
                            {
                                properties.length
                            }
                        </strong>

                        <span>
                            Properties
                        </span>
                    </div>

                </div>

                <div className="summary-card">

                    <Building2 size={24} />

                    <div>
                        <strong>
                            {
                                buildings.length
                            }
                        </strong>

                        <span>
                            Buildings
                        </span>
                    </div>

                </div>

                <div className="summary-card">

                    <Layers size={24} />

                    <div>
                        <strong>
                            {
                                floors.length
                            }
                        </strong>

                        <span>
                            Floors
                        </span>
                    </div>

                </div>

                <div className="summary-card">

                    <DoorOpen size={24} />

                    <div>
                        <strong>
                            {
                                rooms.length
                            }
                        </strong>

                        <span>
                            Rooms
                        </span>
                    </div>

                </div>

            </div>

            {/* =====================================================
                STRUCTURE CONTAINER
            ===================================================== */}

            <div className="structure-container">

                <div className="structure-container-header">

                    <div>
                        <h2>
                            Property Hierarchy
                        </h2>

                        <p>
                            {selectedProperty
                                ? selectedProperty.PropertyName ||
                                  selectedProperty.propertyName ||
                                  "Selected Property"
                                : "No property selected"}
                        </p>
                    </div>

                    <div className="structure-header-actions">

                        {properties.length >
                            0 && (
                            <select
                                value={
                                    selectedPropertyId
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSelectedPropertyId(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className="property-selector"
                            >
                                {properties.map(
                                    (
                                        property
                                    ) => {
                                        const id =
                                            getPropertyId(
                                                property
                                            );

                                        return (
                                            <option
                                                key={
                                                    id
                                                }
                                                value={
                                                    id
                                                }
                                            >
                                                {property.PropertyName ||
                                                    property.propertyName ||
                                                    `Property ${id}`}
                                            </option>
                                        );
                                    }
                                )}
                            </select>
                        )}

                        {canManageStructure &&
                            selectedPropertyId && (
                                <button
                                    type="button"
                                    className="add-action"
                                    onClick={
                                        openAddBuilding
                                    }
                                >
                                    <Plus
                                        size={17}
                                    />
                                    Add Building
                                </button>
                            )}

                    </div>

                </div>

                {/* =================================================
                    PROPERTY TREE
                ================================================= */}

                {selectedProperty ? (

                    <div className="property-tree">

                        {/* PROPERTY */}

                        <div className="tree-row property-row">

                            <div className="tree-content">

                                <Building2
                                    size={22}
                                    className="tree-icon property-icon"
                                />

                                <div>

                                    <strong>
                                        {selectedProperty.PropertyName ||
                                            selectedProperty.propertyName ||
                                            "Property"}
                                    </strong>

                                    <span className="tree-count">
                                        {
                                            propertyBuildings.length
                                        }{" "}
                                        building(s)
                                    </span>

                                </div>

                            </div>

                            <div className="tree-location">

                                <MapPin size={15} />

                                {selectedProperty.Address ||
                                    selectedProperty.address ||
                                    "Address not available"}

                            </div>

                        </div>

                        {/* NO BUILDINGS */}

                        {propertyBuildings.length ===
                        0 ? (

                            <div className="tree-empty">

                                No buildings found
                                for this property.

                                {canManageStructure && (
                                    <button
                                        type="button"
                                        className="inline-add-button"
                                        onClick={
                                            openAddBuilding
                                        }
                                    >
                                        <Plus
                                            size={15}
                                        />
                                        Add Building
                                    </button>
                                )}

                            </div>

                        ) : (

                            propertyBuildings.map(
                                (building) => {

                                    const buildingId =
                                        getBuildingId(
                                            building
                                        );

                                    const buildingFloors =
                                        floors.filter(
                                            (
                                                floor
                                            ) =>
                                                String(
                                                    getFloorBuildingId(
                                                        floor
                                                    )
                                                ) ===
                                                String(
                                                    buildingId
                                                )
                                        );

                                    const isExpanded =
                                        Boolean(
                                            expandedBuildings[
                                                buildingId
                                            ]
                                        );

                                    return (

                                        <div
                                            key={
                                                buildingId
                                            }
                                            className="building-tree-item"
                                        >

                                            {/* BUILDING ROW */}

                                            <div className="tree-row building-row">

                                                <button
                                                    type="button"
                                                    className="expand-button"
                                                    onClick={() =>
                                                        toggleBuilding(
                                                            buildingId
                                                        )
                                                    }
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown
                                                            size={
                                                                18
                                                            }
                                                        />
                                                    ) : (
                                                        <ChevronRight
                                                            size={
                                                                18
                                                            }
                                                        />
                                                    )}
                                                </button>

                                                <Building2
                                                    size={
                                                        20
                                                    }
                                                    className="tree-icon"
                                                />

                                                <div className="tree-content">

                                                    <strong>
                                                        {building.BuildingName ||
                                                            building.buildingName ||
                                                            `Building ${buildingId}`}
                                                    </strong>

                                                    <span className="tree-count">
                                                        {
                                                            buildingFloors.length
                                                        }{" "}
                                                        floor(s)
                                                    </span>

                                                </div>

                                                {/* BUILDING ACTIONS */}

                                                {canManageStructure && (
                                                    <div className="tree-actions">

                                                        <button
                                                            type="button"
                                                            className="tree-action add-small-action"
                                                            title="Add Floor"
                                                            onClick={(
                                                                event
                                                            ) => {
                                                                event.stopPropagation();

                                                                openAddFloor(
                                                                    building
                                                                );
                                                            }}
                                                        >
                                                            <Plus
                                                                size={
                                                                    15
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="tree-action edit-action"
                                                            title="Edit Building"
                                                            onClick={(
                                                                event
                                                            ) => {
                                                                event.stopPropagation();

                                                                openEditBuilding(
                                                                    building
                                                                );
                                                            }}
                                                        >
                                                            <Edit
                                                                size={
                                                                    15
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="tree-action delete-action"
                                                            title="Delete Building"
                                                            onClick={(
                                                                event
                                                            ) => {
                                                                event.stopPropagation();

                                                                handleDeleteBuilding(
                                                                    building
                                                                );
                                                            }}
                                                        >
                                                            <Trash2
                                                                size={
                                                                    15
                                                                }
                                                            />
                                                        </button>

                                                    </div>
                                                )}

                                            </div>

                                            {/* BUILDING CHILDREN */}

                                            {isExpanded && (

                                                <div className="tree-children">

                                                    {buildingFloors.length ===
                                                    0 ? (

                                                        <div className="tree-empty">

                                                            No floors
                                                            found.

                                                            {canManageStructure && (
                                                                <button
                                                                    type="button"
                                                                    className="inline-add-button"
                                                                    onClick={() =>
                                                                        openAddFloor(
                                                                            building
                                                                        )
                                                                    }
                                                                >
                                                                    <Plus
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                    Add Floor
                                                                </button>
                                                            )}

                                                        </div>

                                                    ) : (

                                                        buildingFloors.map(
                                                            (
                                                                floor
                                                            ) => {

                                                                const floorId =
                                                                    getFloorId(
                                                                        floor
                                                                    );

                                                                const floorRooms =
                                                                    rooms.filter(
                                                                        (
                                                                            room
                                                                        ) =>
                                                                            String(
                                                                                getRoomFloorId(
                                                                                    room
                                                                                )
                                                                            ) ===
                                                                            String(
                                                                                floorId
                                                                            )
                                                                    );

                                                                const floorExpanded =
                                                                    Boolean(
                                                                        expandedFloors[
                                                                            floorId
                                                                        ]
                                                                    );

                                                                return (

                                                                    <div
                                                                        key={
                                                                            floorId
                                                                        }
                                                                        className="floor-tree-item"
                                                                    >

                                                                        {/* FLOOR ROW */}

                                                                        <div className="tree-row floor-row">

                                                                            <button
                                                                                type="button"
                                                                                className="expand-button"
                                                                                onClick={() =>
                                                                                    toggleFloor(
                                                                                        floorId
                                                                                    )
                                                                                }
                                                                            >
                                                                                {floorExpanded ? (
                                                                                    <ChevronDown
                                                                                        size={
                                                                                            17
                                                                                        }
                                                                                    />
                                                                                ) : (
                                                                                    <ChevronRight
                                                                                        size={
                                                                                            17
                                                                                        }
                                                                                    />
                                                                                )}
                                                                            </button>

                                                                            <Layers
                                                                                size={
                                                                                    19
                                                                                }
                                                                                className="tree-icon"
                                                                            />

                                                                            <div className="tree-content">

                                                                                <strong>
                                                                                    {floor.FloorNumber ??
                                                                                        floor.floorNumber ??
                                                                                        `Floor ${floorId}`}
                                                                                </strong>

                                                                                <span className="tree-count">
                                                                                    {
                                                                                        floorRooms.length
                                                                                    }{" "}
                                                                                    room(s)
                                                                                </span>

                                                                            </div>

                                                                            {/* FLOOR ACTIONS */}

                                                                            {canManageStructure && (
                                                                                <div className="tree-actions">

                                                                                    <button
                                                                                        type="button"
                                                                                        className="tree-action add-small-action"
                                                                                        title="Add Room"
                                                                                        onClick={(
                                                                                            event
                                                                                        ) => {
                                                                                            event.stopPropagation();

                                                                                            openAddRoom(
                                                                                                floor
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <Plus
                                                                                            size={
                                                                                                15
                                                                                            }
                                                                                        />
                                                                                    </button>

                                                                                    <button
                                                                                        type="button"
                                                                                        className="tree-action edit-action"
                                                                                        title="Edit Floor"
                                                                                        onClick={(
                                                                                            event
                                                                                        ) => {
                                                                                            event.stopPropagation();

                                                                                            openEditFloor(
                                                                                                floor
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <Edit
                                                                                            size={
                                                                                                15
                                                                                            }
                                                                                        />
                                                                                    </button>

                                                                                    <button
                                                                                        type="button"
                                                                                        className="tree-action delete-action"
                                                                                        title="Delete Floor"
                                                                                        onClick={(
                                                                                            event
                                                                                        ) => {
                                                                                            event.stopPropagation();

                                                                                            handleDeleteFloor(
                                                                                                floor
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <Trash2
                                                                                            size={
                                                                                                15
                                                                                            }
                                                                                        />
                                                                                    </button>

                                                                                </div>
                                                                            )}

                                                                        </div>

                                                                        {/* ROOMS */}

                                                                        {floorExpanded && (

                                                                            <div className="tree-children room-children">

                                                                                {floorRooms.length ===
                                                                                0 ? (

                                                                                    <div className="tree-empty">

                                                                                        No rooms
                                                                                        found.

                                                                                        {canManageStructure && (
                                                                                            <button
                                                                                                type="button"
                                                                                                className="inline-add-button"
                                                                                                onClick={() =>
                                                                                                    openAddRoom(
                                                                                                        floor
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                <Plus
                                                                                                    size={
                                                                                                        15
                                                                                                    }
                                                                                                />
                                                                                                Add Room
                                                                                            </button>
                                                                                        )}

                                                                                    </div>

                                                                                ) : (

                                                                                    floorRooms.map(
                                                                                        (
                                                                                            room
                                                                                        ) => {

                                                                                            const roomId =
                                                                                                getRoomId(
                                                                                                    room
                                                                                                );

                                                                                            const roomStatus =
                                                                                                room.Status ||
                                                                                                room.status ||
                                                                                                "Available";

                                                                                            return (

                                                                                                <div
                                                                                                    key={
                                                                                                        roomId
                                                                                                    }
                                                                                                    className="tree-row room-row"
                                                                                                >

                                                                                                    <span className="room-spacer" />

                                                                                                    <DoorOpen
                                                                                                        size={
                                                                                                            18
                                                                                                        }
                                                                                                        className="tree-icon"
                                                                                                    />

                                                                                                    <div className="tree-content">

                                                                                                        <strong>
                                                                                                            {room.RoomNumber ||
                                                                                                                room.roomNumber ||
                                                                                                                `Room ${roomId}`}
                                                                                                        </strong>

                                                                                                        <span className="tree-count">
                                                                                                            {room.RoomType ||
                                                                                                                room.roomType ||
                                                                                                                "Room"}
                                                                                                        </span>

                                                                                                    </div>

                                                                                                    <span
                                                                                                        className={`room-status ${String(
                                                                                                            roomStatus
                                                                                                        )
                                                                                                            .toLowerCase()
                                                                                                            .replace(
                                                                                                                /\s+/g,
                                                                                                                "-"
                                                                                                            )}`}
                                                                                                    >
                                                                                                        {
                                                                                                            roomStatus
                                                                                                        }
                                                                                                    </span>

                                                                                                    {/* ROOM ACTIONS */}

                                                                                                    {canManageStructure && (
                                                                                                        <div className="tree-actions">

                                                                                                            <button
                                                                                                                type="button"
                                                                                                                className="tree-action image-action"
                                                                                                                title="Room Images"
                                                                                                                onClick={(
                                                                                                                    event
                                                                                                                ) => {
                                                                                                                    event.stopPropagation();

                                                                                                                    openRoomImages(
                                                                                                                        room
                                                                                                                    );
                                                                                                                }}
                                                                                                            >
                                                                                                                <ImageIcon
                                                                                                                    size={
                                                                                                                        15
                                                                                                                    }
                                                                                                                />
                                                                                                            </button>

                                                                                                            <button
                                                                                                                type="button"
                                                                                                                className="tree-action edit-action"
                                                                                                                title="Edit Room"
                                                                                                                onClick={(
                                                                                                                    event
                                                                                                                ) => {
                                                                                                                    event.stopPropagation();

                                                                                                                    openEditRoom(
                                                                                                                        room
                                                                                                                    );
                                                                                                                }}
                                                                                                            >
                                                                                                                <Edit
                                                                                                                    size={
                                                                                                                        15
                                                                                                                    }
                                                                                                                />
                                                                                                            </button>

                                                                                                            <button
                                                                                                                type="button"
                                                                                                                className="tree-action delete-action"
                                                                                                                title="Delete Room"
                                                                                                                onClick={(
                                                                                                                    event
                                                                                                                ) => {
                                                                                                                    event.stopPropagation();

                                                                                                                    handleDeleteRoom(
                                                                                                                        room
                                                                                                                    );
                                                                                                                }}
                                                                                                            >
                                                                                                                <Trash2
                                                                                                                    size={
                                                                                                                        15
                                                                                                                    }
                                                                                                                />
                                                                                                            </button>

                                                                                                        </div>
                                                                                                    )}

                                                                                                </div>
                                                                                            );
                                                                                        }
                                                                                    )
                                                                                )}

                                                                            </div>
                                                                        )}

                                                                    </div>
                                                                );
                                                            }
                                                        )
                                                    )}

                                                </div>
                                            )}

                                        </div>
                                    );
                                }
                            )
                        )}

                    </div>

                ) : (

                    <div className="empty-structure">

                        <Building2 size={48} />

                        <h3>
                            No property found
                        </h3>

                        <p>
                            There are no properties
                            available for this
                            account.
                        </p>

                    </div>
                )}

                {/* =====================================================
                    BUILDING MODAL
                ===================================================== */}

                {buildingModalOpen && (

                    <div className="structure-modal-overlay">

                        <div className="structure-modal">

                            <div className="modal-header">

                                <div>
                                    <h2>
                                        {buildingModalType ===
                                        "add"
                                            ? "Add Building"
                                            : "Edit Building"}
                                    </h2>

                                    <p>
                                        {buildingModalType ===
                                        "add"
                                            ? "Add a new building to this property."
                                            : "Update the building name."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={
                                        closeBuildingModal
                                    }
                                    disabled={
                                        savingBuilding
                                    }
                                >
                                    <X size={20} />
                                </button>

                            </div>

                            <form
                                className="structure-form"
                                onSubmit={
                                    handleSaveBuilding
                                }
                            >

                                <div className="form-group">

                                    <label>
                                        Building Name
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            buildingName
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setBuildingName(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Enter building name"
                                        autoFocus
                                        disabled={
                                            savingBuilding
                                        }
                                    />

                                </div>

                                {buildingModalType ===
                                    "add" && (
                                    <div className="selected-property-info">

                                        <strong>
                                            Property:
                                        </strong>{" "}

                                        {selectedProperty?.PropertyName ||
                                            selectedProperty?.propertyName ||
                                            "Selected Property"}

                                    </div>
                                )}

                                <div className="modal-actions">

                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={
                                            closeBuildingModal
                                        }
                                        disabled={
                                            savingBuilding
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="save-button"
                                        disabled={
                                            savingBuilding ||
                                            !buildingName.trim()
                                        }
                                    >
                                        {savingBuilding
                                            ? "Saving..."
                                            : buildingModalType ===
                                                "add"
                                                ? "Add Building"
                                                : "Save Changes"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>
                )}

                {/* =====================================================
                    FLOOR MODAL
                ===================================================== */}

                {floorModalOpen && (

                    <div className="structure-modal-overlay">

                        <div className="structure-modal">

                            <div className="modal-header">

                                <div>
                                    <h2>
                                        {floorModalType ===
                                        "add"
                                            ? "Add Floor"
                                            : "Edit Floor"}
                                    </h2>

                                    <p>
                                        {floorModalType ===
                                        "add"
                                            ? "Add a floor to this building."
                                            : "Update the floor number."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={
                                        closeFloorModal
                                    }
                                    disabled={
                                        savingFloor
                                    }
                                >
                                    <X size={20} />
                                </button>

                            </div>

                            <form
                                className="structure-form"
                                onSubmit={
                                    handleSaveFloor
                                }
                            >

                                <div className="form-group">

                                    <label>
                                        Floor Number
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            floorNumber
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setFloorNumber(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Example: Ground Floor, 1, 2"
                                        autoFocus
                                        disabled={
                                            savingFloor
                                        }
                                    />

                                </div>

                                {floorModalType ===
                                    "add" &&
                                    selectedBuildingForFloor && (
                                    <div className="selected-property-info">

                                        <strong>
                                            Building:
                                        </strong>{" "}

                                        {selectedBuildingForFloor.BuildingName ||
                                            selectedBuildingForFloor.buildingName ||
                                            "Selected Building"}

                                    </div>
                                )}

                                <div className="modal-actions">

                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={
                                            closeFloorModal
                                        }
                                        disabled={
                                            savingFloor
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="save-button"
                                        disabled={
                                            savingFloor ||
                                            !String(
                                                floorNumber
                                            ).trim()
                                        }
                                    >
                                        {savingFloor
                                            ? "Saving..."
                                            : floorModalType ===
                                                "add"
                                                ? "Add Floor"
                                                : "Save Changes"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>
                )}

                {/* =====================================================
                    ROOM MODAL
                ===================================================== */}

                {roomModalOpen && (

                    <div className="structure-modal-overlay">

                        <div className="structure-modal">

                            <div className="modal-header">

                                <div>
                                    <h2>
                                        {roomModalType ===
                                        "add"
                                            ? "Add Room"
                                            : "Edit Room"}
                                    </h2>

                                    <p>
                                        {roomModalType ===
                                        "add"
                                            ? "Add a room to this floor."
                                            : "Update room information."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={
                                        closeRoomModal
                                    }
                                    disabled={
                                        savingRoom
                                    }
                                >
                                    <X size={20} />
                                </button>

                            </div>

                            <form
                                className="structure-form"
                                onSubmit={
                                    handleSaveRoom
                                }
                            >

                                <div className="form-group">

                                    <label>
                                        Room Number
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            roomNumber
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setRoomNumber(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Example: 101"
                                        autoFocus
                                        disabled={
                                            savingRoom
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Room Type
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            roomType
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setRoomType(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Example: Bedroom, Office, Shop"
                                        disabled={
                                            savingRoom
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Status
                                    </label>

                                    <select
                                        value={
                                            roomStatus
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setRoomStatus(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        disabled={
                                            savingRoom
                                        }
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

                                {roomModalType ===
                                    "add" &&
                                    selectedFloorForRoom && (
                                    <div className="selected-property-info">

                                        <strong>
                                            Floor:
                                        </strong>{" "}

                                        {selectedFloorForRoom.FloorNumber ??
                                            selectedFloorForRoom.floorNumber ??
                                            "Selected Floor"}

                                    </div>
                                )}

                                <div className="modal-actions">

                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={
                                            closeRoomModal
                                        }
                                        disabled={
                                            savingRoom
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="save-button"
                                        disabled={
                                            savingRoom ||
                                            !roomNumber.trim() ||
                                            !roomType.trim()
                                        }
                                    >
                                        {savingRoom
                                            ? "Saving..."
                                            : roomModalType ===
                                                "add"
                                                ? "Add Room"
                                                : "Save Changes"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>
                )}

                {/* =====================================================
                    ROOM IMAGE MODAL
                ===================================================== */}

                {imageModalOpen && (

                    <div className="structure-modal-overlay">

                        <div className="structure-modal room-image-modal">

                            <div className="modal-header">

                                <div>

                                    <h2>
                                        <ImageIcon
                                            size={22}
                                        />

                                        Room Images
                                    </h2>

                                    <p>
                                        {selectedRoomForImages?.RoomNumber ||
                                            selectedRoomForImages?.roomNumber ||
                                            "Selected Room"}
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={
                                        closeImageModal
                                    }
                                    disabled={
                                        uploadingImage
                                    }
                                >
                                    <X size={20} />
                                </button>

                            </div>

                            {/* UPLOAD */}

                            {canManageStructure && (
                                <div className="room-image-upload">

                                    <div className="form-group">

                                        <label>
                                            Upload Room Image
                                        </label>

                                        <input
                                            id="room-image-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={
                                                handleImageFileChange
                                            }
                                            disabled={
                                                uploadingImage
                                            }
                                        />

                                    </div>

                                    {selectedImageFile && (
                                        <div className="selected-image-name">

                                            Selected:
                                            {" "}
                                            <strong>
                                                {
                                                    selectedImageFile.name
                                                }
                                            </strong>

                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="save-button upload-image-button"
                                        onClick={
                                            handleUploadRoomImage
                                        }
                                        disabled={
                                            uploadingImage ||
                                            !selectedImageFile
                                        }
                                    >

                                        <Upload
                                            size={17}
                                        />

                                        {uploadingImage
                                            ? "Uploading..."
                                            : "Upload Image"}

                                    </button>

                                </div>
                            )}

                            {/* IMAGE LIST */}

                            <div className="room-images-container">

                                {loadingImages ? (

                                    <div className="images-loading">

                                        <RefreshCw
                                            size={28}
                                            className="loading-spinner"
                                        />

                                        <p>
                                            Loading images...
                                        </p>

                                    </div>

                                ) : roomImages.length ===
                                  0 ? (

                                    <div className="no-room-images">

                                        <ImageIcon
                                            size={42}
                                        />

                                        <h3>
                                            No room images
                                        </h3>

                                        <p>
                                            Upload an image
                                            for this room.
                                        </p>

                                    </div>

                                ) : (

                                    <div className="room-image-grid">

                                        {roomImages.map(
                                            (
                                                image,
                                                index
                                            ) => {

                                                const imageId =
                                                    getId(
                                                        image,
                                                        "RoomImageID",
                                                        "roomImageID",
                                                        "roomImageId",
                                                        "ImageID",
                                                        "imageID",
                                                        "imageId",
                                                        "PropertyImageID",
                                                        "propertyImageID"
                                                    );

                                                const imageUrl =
                                                    getImageUrl(
                                                        image
                                                    );

                                                return (

                                                    <div
                                                        key={
                                                            imageId ||
                                                            index
                                                        }
                                                        className="room-image-card"
                                                    >

                                                        {imageUrl ? (

                                                            <img
                                                                src={
                                                                    imageUrl
                                                                }
                                                                alt={`Room ${
                                                                    selectedRoomForImages?.RoomNumber ||
                                                                    ""
                                                                }`}
                                                                className="room-image-preview"
                                                            />

                                                        ) : (

                                                            <div className="room-image-invalid">
                                                                Image unavailable
                                                            </div>

                                                        )}
<div className="room-image-footer">
  <span>
    {image.Caption || `Image ${index + 1}`}
  </span>
  <small>
    {image.UploadDate
      ? new Date(image.UploadDate).toLocaleDateString()
      : ""}
  </small>
  {canManageStructure && (
    <button
      type="button"
      className="tree-action delete-action"
      title="Delete Image"
      onClick={() => handleDeleteRoomImage(image)}
    >
      <Trash2 size={15} />
    </button>
  )}
</div>

                                                    </div>
                                                );
                                            }
                                        )}

                                    </div>
                                )}

                            </div>

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={
                                        closeImageModal
                                    }
                                    disabled={
                                        uploadingImage
                                    }
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>
                )}

            </div>

        </div>
    );
}

export default OwnerPropertyStructure;

