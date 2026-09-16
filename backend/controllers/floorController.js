const pool = require("../config/db");

// ======================================================
// HELPER: GET OWNER ID FROM LOGGED-IN USER
// ======================================================
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

    return owners.length > 0 ? owners[0].OwnerID : null;
};


// ======================================================
// GET ALL FLOORS
// ======================================================
const getFloors = async (req, res) => {
    try {
        const role = String(
            req.user?.role ||
            req.user?.Role ||
            req.user?.RoleName ||
            ""
        ).trim().toLowerCase();

        let query = `
            SELECT
                f.FloorID,
                f.BuildingID,
                b.BuildingName,
                p.PropertyID,
                p.PropertyName,
                f.FloorNumber,
                COUNT(DISTINCT r.RoomID) AS RoomCount
            FROM floors f

            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID

            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID

            LEFT JOIN rooms r
                ON r.FloorID = f.FloorID
        `;

        const params = [];

        // ------------------------------------------------
        // OWNER: ONLY THEIR OWN FLOORS
        // ------------------------------------------------
        if (role === "owner") {
            const ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            query += `
                WHERE p.OwnerID = ?
            `;

            params.push(ownerId);
        }

        query += `
            GROUP BY
                f.FloorID,
                f.BuildingID,
                b.BuildingName,
                p.PropertyID,
                p.PropertyName,
                f.FloorNumber

            ORDER BY
                f.BuildingID ASC,
                f.FloorNumber ASC
        `;

        const [floors] = await pool.query(query, params);

        res.status(200).json({
            success: true,
            count: floors.length,
            floors
        });

    } catch (error) {
        console.error("Get floors error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve floors"
        });
    }
};


// ======================================================
// GET FLOOR BY ID
// ======================================================
const getFloorById = async (req, res) => {
    try {
        const { id } = req.params;

        const role = String(
            req.user?.role ||
            req.user?.Role ||
            req.user?.RoleName ||
            ""
        ).trim().toLowerCase();

        let query = `
            SELECT
                f.FloorID,
                f.BuildingID,
                b.BuildingName,
                p.PropertyID,
                p.PropertyName,
                p.OwnerID,
                f.FloorNumber,
                COUNT(DISTINCT r.RoomID) AS RoomCount
            FROM floors f

            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID

            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID

            LEFT JOIN rooms r
                ON r.FloorID = f.FloorID

            WHERE f.FloorID = ?
        `;

        const params = [id];

        // ------------------------------------------------
        // OWNER: VERIFY OWNERSHIP
        // ------------------------------------------------
        if (role === "owner") {
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

        query += `
            GROUP BY
                f.FloorID,
                f.BuildingID,
                b.BuildingName,
                p.PropertyID,
                p.PropertyName,
                p.OwnerID,
                f.FloorNumber
        `;

        const [floors] = await pool.query(query, params);

        if (floors.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Floor not found or you are not authorized to access it"
            });
        }

        res.status(200).json({
            success: true,
            floor: floors[0]
        });

    } catch (error) {
        console.error("Get floor by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve floor"
        });
    }
};


// ======================================================
// CREATE FLOOR
// ======================================================
const createFloor = async (req, res) => {
    try {
        const {
            buildingId,
            floorNumber
        } = req.body || {};

        // ------------------------------------------------
        // VALIDATION
        // ------------------------------------------------
        if (!buildingId || floorNumber === undefined) {
            return res.status(400).json({
                success: false,
                message: "Building ID and floor number are required"
            });
        }

        const floor = Number(floorNumber);

        if (
            !Number.isInteger(floor) ||
            floor < 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Floor number must be a positive integer"
            });
        }

        const role = String(
            req.user?.role ||
            req.user?.Role ||
            req.user?.RoleName ||
            ""
        ).trim().toLowerCase();

        // ------------------------------------------------
        // CHECK BUILDING + OWNER
        // ------------------------------------------------
        let query = `
            SELECT
                b.BuildingID,
                b.PropertyID,
                p.OwnerID
            FROM buildings b

            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID

            WHERE b.BuildingID = ?
        `;

        const params = [buildingId];

        if (role === "owner") {
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

        const [buildings] = await pool.query(
            query,
            params
        );

        if (buildings.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Building not found or you are not authorized to add a floor to it"
            });
        }

        // ------------------------------------------------
        // CHECK DUPLICATE FLOOR
        // ------------------------------------------------
        const [existingFloor] = await pool.query(
            `
            SELECT FloorID
            FROM floors
            WHERE BuildingID = ?
            AND FloorNumber = ?
            `,
            [buildingId, floor]
        );

        if (existingFloor.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This floor already exists in the building"
            });
        }

        // ------------------------------------------------
        // CREATE FLOOR
        // ------------------------------------------------
        const [result] = await pool.query(
            `
            INSERT INTO floors
            (
                BuildingID,
                FloorNumber
            )
            VALUES (?, ?)
            `,
            [
                buildingId,
                floor
            ]
        );

        // ------------------------------------------------
        // RETURN CREATED FLOOR
        // ------------------------------------------------
        const [floors] = await pool.query(
            `
            SELECT
                f.FloorID,
                f.BuildingID,
                b.BuildingName,
                p.PropertyID,
                p.PropertyName,
                f.FloorNumber
            FROM floors f

            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID

            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID

            WHERE f.FloorID = ?
            `,
            [result.insertId]
        );

        // ------------------------------------------------
        // UPDATE TOTALFLOORS
        // ------------------------------------------------
        await pool.query(
            `
            UPDATE buildings
            SET TotalFloors = (
                SELECT COUNT(*)
                FROM floors
                WHERE BuildingID = ?
            )
            WHERE BuildingID = ?
            `,
            [
                buildingId,
                buildingId
            ]
        );

        res.status(201).json({
            success: true,
            message: "Floor created successfully",
            floor: floors[0]
        });

    } catch (error) {
        console.error("Create floor error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create floor"
        });
    }
};


// ======================================================
// UPDATE FLOOR
// ======================================================
const updateFloor = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            floorNumber
        } = req.body || {};

        // ------------------------------------------------
        // VALIDATION
        // ------------------------------------------------
        if (floorNumber === undefined) {
            return res.status(400).json({
                success: false,
                message: "Floor number is required"
            });
        }

        const floor = Number(floorNumber);

        if (
            !Number.isInteger(floor) ||
            floor < 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Floor number must be a positive integer"
            });
        }

        const role = String(
            req.user?.role ||
            req.user?.Role ||
            req.user?.RoleName ||
            ""
        ).trim().toLowerCase();

        // ------------------------------------------------
        // FIND FLOOR + OWNER
        // ------------------------------------------------
        let query = `
            SELECT
                f.FloorID,
                f.BuildingID,
                b.PropertyID,
                p.OwnerID
            FROM floors f

            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID

            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID

            WHERE f.FloorID = ?
        `;

        const params = [id];

        if (role === "owner") {
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

        const [existingFloor] = await pool.query(
            query,
            params
        );

        if (existingFloor.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Floor not found or you are not authorized to modify it"
            });
        }

        const buildingId =
            existingFloor[0].BuildingID;

        // ------------------------------------------------
        // CHECK DUPLICATE FLOOR NUMBER
        // ------------------------------------------------
        const [duplicateFloor] = await pool.query(
            `
            SELECT FloorID
            FROM floors
            WHERE BuildingID = ?
            AND FloorNumber = ?
            AND FloorID != ?
            `,
            [
                buildingId,
                floor,
                id
            ]
        );

        if (duplicateFloor.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This floor already exists in the building"
            });
        }

        // ------------------------------------------------
        // UPDATE
        // ------------------------------------------------
        await pool.query(
            `
            UPDATE floors
            SET FloorNumber = ?
            WHERE FloorID = ?
            `,
            [
                floor,
                id
            ]
        );

        // ------------------------------------------------
        // RETURN UPDATED FLOOR
        // ------------------------------------------------
        const [updatedFloors] = await pool.query(
            `
            SELECT
                f.FloorID,
                f.BuildingID,
                b.BuildingName,
                p.PropertyID,
                p.PropertyName,
                f.FloorNumber
            FROM floors f

            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID

            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID

            WHERE f.FloorID = ?
            `,
            [id]
        );

        res.status(200).json({
            success: true,
            message: "Floor updated successfully",
            floor: updatedFloors[0]
        });

    } catch (error) {
        console.error("Update floor error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update floor"
        });
    }
};


// ======================================================
// DELETE FLOOR
// ======================================================
const deleteFloor = async (req, res) => {
    try {
        const { id } = req.params;

        const role = String(
            req.user?.role ||
            req.user?.Role ||
            req.user?.RoleName ||
            ""
        ).trim().toLowerCase();

        // ------------------------------------------------
        // FIND FLOOR + OWNER
        // ------------------------------------------------
        let query = `
            SELECT
                f.FloorID,
                f.BuildingID,
                p.OwnerID
            FROM floors f

            INNER JOIN buildings b
                ON f.BuildingID = b.BuildingID

            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID

            WHERE f.FloorID = ?
        `;

        const params = [id];

        if (role === "owner") {
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

        const [existingFloor] = await pool.query(
            query,
            params
        );

        if (existingFloor.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Floor not found or you are not authorized to delete it"
            });
        }

        // ------------------------------------------------
        // CHECK ROOMS
        // ------------------------------------------------
        const [rooms] = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM rooms
            WHERE FloorID = ?
            `,
            [id]
        );

        if (Number(rooms[0].count) > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete floor because it contains rooms. Remove its rooms first."
            });
        }

        // ------------------------------------------------
        // DELETE FLOOR
        // ------------------------------------------------
        await pool.query(
            `
            DELETE FROM floors
            WHERE FloorID = ?
            `,
            [id]
        );

        // ------------------------------------------------
        // UPDATE BUILDING TOTAL FLOORS
        // ------------------------------------------------
        await pool.query(
            `
            UPDATE buildings
            SET TotalFloors = (
                SELECT COUNT(*)
                FROM floors
                WHERE BuildingID = ?
            )
            WHERE BuildingID = ?
            `,
            [
                existingFloor[0].BuildingID,
                existingFloor[0].BuildingID
            ]
        );

        res.status(200).json({
            success: true,
            message: "Floor deleted successfully"
        });

    } catch (error) {
        console.error("Delete floor error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete floor"
        });
    }
};


module.exports = {
    getFloors,
    getFloorById,
    createFloor,
    updateFloor,
    deleteFloor
};