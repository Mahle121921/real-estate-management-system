const pool = require("../config/db");

// ==========================================
// HELPER: GET USER ROLE
// ==========================================
const getUserRole = (req) => {
    return String(
        req.user?.role ||
        req.user?.Role ||
        req.user?.RoleName ||
        req.user?.roleName ||
        ""
    )
        .trim()
        .toLowerCase();
};


// ==========================================
// HELPER: GET OWNER ID FROM LOGGED-IN USER
// ==========================================
const getOwnerId = async (req) => {
    const userId =
        req.user?.UserID ??
        req.user?.userID ??
        req.user?.userId ??
        req.user?.id;

    if (!userId) {
        return null;
    }

    const [owners] = await pool.query(
        `
        SELECT OwnerID
        FROM owners
        WHERE UserID = ?
        LIMIT 1
        `,
        [userId]
    );

    return owners.length > 0
        ? owners[0].OwnerID
        : null;
};


// ==========================================
// GET ALL ROOMS
// ==========================================
const getRooms = async (req, res) => {
    try {
        let ownerId = null;

        // Owner can only see their own rooms
        if (getUserRole(req) === "owner") {
            ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }
        }

        let query = `
            SELECT
                r.RoomID,
                r.FloorID,
                f.FloorNumber,
                b.BuildingID,
                b.BuildingName,
                p.PropertyID,
                p.PropertyName,
                p.OwnerID,
                r.RoomNumber,
                r.RoomType,
                r.Area,
                r.Price,
                r.Status
            FROM rooms r
            INNER JOIN floors f
                ON r.FloorID = f.FloorID
            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID
            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID
        `;

        const params = [];

        if (getUserRole(req) === "owner") {
            query += `
                WHERE p.OwnerID = ?
            `;

            params.push(ownerId);
        }

        query += `
            ORDER BY
                p.PropertyID ASC,
                b.BuildingID ASC,
                f.FloorNumber ASC,
                r.RoomNumber ASC
        `;

        const [rooms] = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            count: rooms.length,
            rooms
        });

    } catch (error) {
        console.error("Get rooms error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve rooms",
            error: error.message
        });
    }
};


// ==========================================
// GET ROOM BY ID
// ==========================================
const getRoomById = async (req, res) => {
    try {
        const { id } = req.params;

        let query = `
            SELECT
                r.RoomID,
                r.FloorID,
                f.FloorNumber,
                b.BuildingID,
                b.BuildingName,
                p.PropertyID,
                p.PropertyName,
                p.OwnerID,
                r.RoomNumber,
                r.RoomType,
                r.Area,
                r.Price,
                r.Status
            FROM rooms r
            INNER JOIN floors f
                ON r.FloorID = f.FloorID
            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID
            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID
            WHERE r.RoomID = ?
        `;

        const params = [id];

        if (getUserRole(req) === "owner") {
            const ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            query += `
                AND p.OwnerID = ?
            `;

            params.push(ownerId);
        }

        const [rooms] = await pool.query(
            query,
            params
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        return res.status(200).json({
            success: true,
            room: rooms[0]
        });

    } catch (error) {
        console.error("Get room by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve room",
            error: error.message
        });
    }
};


// ==========================================
// CREATE ROOM
// ==========================================
const createRoom = async (req, res) => {
    try {
        const {
            floorId,
            roomNumber,
            roomType,
            area,
            price
        } = req.body || {};

        // ==========================================
        // VALIDATE REQUIRED FIELDS
        // ==========================================
        if (!floorId || !roomNumber || !roomType) {
            return res.status(400).json({
                success: false,
                message:
                    "Floor ID, room number, and room type are required"
            });
        }

        const cleanRoomNumber = String(roomNumber).trim();
        const cleanRoomType = String(roomType).trim();

        if (!cleanRoomNumber || !cleanRoomType) {
            return res.status(400).json({
                success: false,
                message:
                    "Room number and room type cannot be empty"
            });
        }

        // ==========================================
        // VALIDATE AREA
        // ==========================================
        if (
            area !== undefined &&
            area !== null &&
            area !== "" &&
            (
                Number.isNaN(Number(area)) ||
                Number(area) < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Area must be a valid non-negative number"
            });
        }

        // ==========================================
        // VALIDATE PRICE
        // ==========================================
        if (
            price !== undefined &&
            price !== null &&
            price !== "" &&
            (
                Number.isNaN(Number(price)) ||
                Number(price) < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Price must be a valid non-negative number"
            });
        }

        // ==========================================
        // CHECK FLOOR + OWNERSHIP
        // ==========================================
        let floorQuery = `
            SELECT
                f.FloorID,
                f.FloorNumber,
                b.BuildingID,
                b.BuildingName,
                p.PropertyID,
                p.PropertyName,
                p.OwnerID
            FROM floors f
            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID
            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID
            WHERE f.FloorID = ?
        `;

        const floorParams = [floorId];

        if (getUserRole(req) === "owner") {
            const ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            floorQuery += `
                AND p.OwnerID = ?
            `;

            floorParams.push(ownerId);
        }

        const [floors] = await pool.query(
            floorQuery,
            floorParams
        );

        if (floors.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Floor not found or you do not have permission to use this floor"
            });
        }

        // ==========================================
        // CHECK DUPLICATE ROOM NUMBER
        // ==========================================
        const [existingRooms] = await pool.query(
            `
            SELECT RoomID
            FROM rooms
            WHERE FloorID = ?
              AND RoomNumber = ?
            LIMIT 1
            `,
            [
                floorId,
                cleanRoomNumber
            ]
        );

        if (existingRooms.length > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "This room number already exists on this floor"
            });
        }

        // ==========================================
        // CREATE ROOM
        // ==========================================
        const [result] = await pool.query(
            `
            INSERT INTO rooms
            (
                FloorID,
                RoomNumber,
                RoomType,
                Area,
                Price,
                Status
            )
            VALUES (?, ?, ?, ?, ?, 'Available')
            `,
            [
                Number(floorId),
                cleanRoomNumber,
                cleanRoomType,
                area === "" ||
                area === undefined ||
                area === null
                    ? null
                    : Number(area),
                price === "" ||
                price === undefined ||
                price === null
                    ? null
                    : Number(price)
            ]
        );

        // ==========================================
        // GET CREATED ROOM
        // ==========================================
        const [rooms] = await pool.query(
            `
            SELECT
                r.RoomID,
                r.FloorID,
                f.FloorNumber,
                b.BuildingID,
                b.BuildingName,
                p.PropertyID,
                p.PropertyName,
                p.OwnerID,
                r.RoomNumber,
                r.RoomType,
                r.Area,
                r.Price,
                r.Status
            FROM rooms r
            INNER JOIN floors f
                ON r.FloorID = f.FloorID
            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID
            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID
            WHERE r.RoomID = ?
            `,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Room created successfully",
            room: rooms[0]
        });

    } catch (error) {
        console.error("Create room error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create room",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE ROOM
// ==========================================
const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            roomNumber,
            roomType,
            area,
            price
        } = req.body || {};

        // ==========================================
        // VALIDATE REQUIRED FIELDS
        // ==========================================
        if (!roomNumber || !roomType) {
            return res.status(400).json({
                success: false,
                message:
                    "Room number and room type are required"
            });
        }

        const cleanRoomNumber = String(roomNumber).trim();
        const cleanRoomType = String(roomType).trim();

        if (!cleanRoomNumber || !cleanRoomType) {
            return res.status(400).json({
                success: false,
                message:
                    "Room number and room type cannot be empty"
            });
        }

        // ==========================================
        // FIND ROOM + VERIFY OWNERSHIP
        // ==========================================
        let roomQuery = `
            SELECT
                r.RoomID,
                r.FloorID,
                r.RoomNumber,
                r.Status,
                p.OwnerID
            FROM rooms r
            INNER JOIN floors f
                ON r.FloorID = f.FloorID
            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID
            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID
            WHERE r.RoomID = ?
        `;

        const roomParams = [id];

        if (getUserRole(req) === "owner") {
            const ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            roomQuery += `
                AND p.OwnerID = ?
            `;

            roomParams.push(ownerId);
        }

        const [existingRooms] = await pool.query(
            roomQuery,
            roomParams
        );

        if (existingRooms.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Room not found or you do not have permission to modify it"
            });
        }

        const existingRoom = existingRooms[0];

        // ==========================================
        // VALIDATE AREA
        // ==========================================
        if (
            area !== undefined &&
            area !== null &&
            area !== "" &&
            (
                Number.isNaN(Number(area)) ||
                Number(area) < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Area must be a valid non-negative number"
            });
        }

        // ==========================================
        // VALIDATE PRICE
        // ==========================================
        if (
            price !== undefined &&
            price !== null &&
            price !== "" &&
            (
                Number.isNaN(Number(price)) ||
                Number(price) < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Price must be a valid non-negative number"
            });
        }

        // ==========================================
        // CHECK DUPLICATE ROOM NUMBER
        // ==========================================
        const [duplicateRooms] = await pool.query(
            `
            SELECT RoomID
            FROM rooms
            WHERE FloorID = ?
              AND RoomNumber = ?
              AND RoomID != ?
            LIMIT 1
            `,
            [
                existingRoom.FloorID,
                cleanRoomNumber,
                id
            ]
        );

        if (duplicateRooms.length > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "This room number already exists on this floor"
            });
        }

        // ==========================================
        // UPDATE ROOM
        // ==========================================
        await pool.query(
            `
            UPDATE rooms
            SET
                RoomNumber = ?,
                RoomType = ?,
                Area = ?,
                Price = ?
            WHERE RoomID = ?
            `,
            [
                cleanRoomNumber,
                cleanRoomType,
                area === "" ||
                area === undefined ||
                area === null
                    ? null
                    : Number(area),
                price === "" ||
                price === undefined ||
                price === null
                    ? null
                    : Number(price),
                id
            ]
        );

        // ==========================================
        // GET UPDATED ROOM
        // ==========================================
        const [updatedRooms] = await pool.query(
            `
            SELECT
                r.RoomID,
                r.FloorID,
                f.FloorNumber,
                b.BuildingID,
                b.BuildingName,
                p.PropertyID,
                p.PropertyName,
                p.OwnerID,
                r.RoomNumber,
                r.RoomType,
                r.Area,
                r.Price,
                r.Status
            FROM rooms r
            INNER JOIN floors f
                ON r.FloorID = f.FloorID
            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID
            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID
            WHERE r.RoomID = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Room updated successfully",
            room: updatedRooms[0]
        });

    } catch (error) {
        console.error("Update room error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update room",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE ROOM STATUS
// ==========================================
const updateRoomStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};

        const allowedStatuses = [
            "Available",
            "Reserved",
            "Sold",
            "Rented"
        ];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be Available, Reserved, Sold, or Rented"
            });
        }

        // ==========================================
        // FIND ROOM + VERIFY OWNERSHIP
        // ==========================================
        let roomQuery = `
            SELECT
                r.RoomID,
                r.Status,
                p.OwnerID
            FROM rooms r
            INNER JOIN floors f
                ON r.FloorID = f.FloorID
            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID
            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID
            WHERE r.RoomID = ?
        `;

        const params = [id];

        if (getUserRole(req) === "owner") {
            const ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            roomQuery += `
                AND p.OwnerID = ?
            `;

            params.push(ownerId);
        }

        const [rooms] = await pool.query(
            roomQuery,
            params
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Room not found or you do not have permission to modify it"
            });
        }

        // ==========================================
        // UPDATE STATUS
        // ==========================================
        await pool.query(
            `
            UPDATE rooms
            SET Status = ?
            WHERE RoomID = ?
            `,
            [status, id]
        );

        // ==========================================
        // GET UPDATED ROOM
        // ==========================================
        const [updatedRooms] = await pool.query(
            `
            SELECT
                r.RoomID,
                r.FloorID,
                f.FloorNumber,
                b.BuildingID,
                b.BuildingName,
                p.PropertyID,
                p.PropertyName,
                p.OwnerID,
                r.RoomNumber,
                r.RoomType,
                r.Area,
                r.Price,
                r.Status
            FROM rooms r
            INNER JOIN floors f
                ON r.FloorID = f.FloorID
            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID
            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID
            WHERE r.RoomID = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Room status updated successfully",
            room: updatedRooms[0]
        });

    } catch (error) {
        console.error("Update room status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update room status",
            error: error.message
        });
    }
};


// ==========================================
// DELETE ROOM
// ==========================================
const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;

        // ==========================================
        // FIND ROOM + VERIFY OWNERSHIP
        // ==========================================
        let roomQuery = `
            SELECT
                r.RoomID,
                r.Status,
                p.OwnerID
            FROM rooms r
            INNER JOIN floors f
                ON r.FloorID = f.FloorID
            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID
            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID
            WHERE r.RoomID = ?
        `;

        const params = [id];

        if (getUserRole(req) === "owner") {
            const ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            roomQuery += `
                AND p.OwnerID = ?
            `;

            params.push(ownerId);
        }

        const [rooms] = await pool.query(
            roomQuery,
            params
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Room not found or you do not have permission to delete it"
            });
        }

        const room = rooms[0];

        // ==========================================
        // PROTECT SOLD / RENTED / RESERVED ROOMS
        // ==========================================
        if (
            room.Status === "Sold" ||
            room.Status === "Rented" ||
            room.Status === "Reserved"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot delete a ${room.Status.toLowerCase()} room`
            });
        }

        // ==========================================
        // DELETE ROOM
        // ==========================================
        await pool.query(
            `
            DELETE FROM rooms
            WHERE RoomID = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Room deleted successfully"
        });

    } catch (error) {
        console.error("Delete room error:", error);

        if (
            error.code === "ER_ROW_IS_REFERENCED_2" ||
            error.code === "ER_ROW_IS_REFERENCED"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete this room because it is referenced by other records"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to delete room",
            error: error.message
        });
    }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
    getRooms,
    getRoomById,
    createRoom,
    updateRoom,
    updateRoomStatus,
    deleteRoom
};
