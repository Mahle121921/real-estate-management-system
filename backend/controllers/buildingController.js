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
// GET ALL BUILDINGS
// ======================================================
const getBuildings = async (req, res) => {
    try {
        const role = String(
            req.user?.role ||
            req.user?.Role ||
            req.user?.RoleName ||
            ""
        ).trim().toLowerCase();

        let query = `
            SELECT
                b.BuildingID,
                b.PropertyID,
                p.PropertyName,
                b.BuildingName,
                b.TotalFloors,
                COUNT(DISTINCT f.FloorID) AS FloorCount,
                COUNT(DISTINCT r.RoomID) AS RoomCount
            FROM buildings b

            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID

            LEFT JOIN floors f
                ON f.BuildingID = b.BuildingID

            LEFT JOIN rooms r
                ON r.FloorID = f.FloorID
        `;

        const params = [];

        // ------------------------------------------
        // OWNER: ONLY THEIR OWN BUILDINGS
        // ------------------------------------------
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
                b.BuildingID,
                b.PropertyID,
                p.PropertyName,
                b.BuildingName,
                b.TotalFloors

            ORDER BY b.BuildingID ASC
        `;

        const [buildings] = await pool.query(query, params);

        res.status(200).json({
            success: true,
            count: buildings.length,
            buildings
        });

    } catch (error) {
        console.error("Get buildings error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve buildings"
        });
    }
};


// ======================================================
// GET BUILDING BY ID
// ======================================================
const getBuildingById = async (req, res) => {
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
                b.BuildingID,
                b.PropertyID,
                p.PropertyName,
                p.OwnerID,
                b.BuildingName,
                b.TotalFloors,
                COUNT(DISTINCT f.FloorID) AS FloorCount,
                COUNT(DISTINCT r.RoomID) AS RoomCount
            FROM buildings b

            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID

            LEFT JOIN floors f
                ON f.BuildingID = b.BuildingID

            LEFT JOIN rooms r
                ON r.FloorID = f.FloorID

            WHERE b.BuildingID = ?
        `;

        const params = [id];

        // ------------------------------------------
        // OWNER: VERIFY OWNERSHIP
        // ------------------------------------------
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
                b.BuildingID,
                b.PropertyID,
                p.PropertyName,
                p.OwnerID,
                b.BuildingName,
                b.TotalFloors
        `;

        const [buildings] = await pool.query(query, params);

        if (buildings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Building not found or you are not authorized to access it"
            });
        }

        res.status(200).json({
            success: true,
            building: buildings[0]
        });

    } catch (error) {
        console.error("Get building by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve building"
        });
    }
};


// ======================================================
// CREATE BUILDING
// ======================================================
const createBuilding = async (req, res) => {
    try {
        const {
            propertyId,
            buildingName
        } = req.body || {};

        if (!propertyId || !buildingName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Property ID and building name are required"
            });
        }

        const role = String(
            req.user?.role ||
            req.user?.Role ||
            req.user?.RoleName ||
            ""
        ).trim().toLowerCase();

        // ------------------------------------------
        // OWNER
        // ------------------------------------------
        if (role === "owner") {
            const ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            const [properties] = await pool.query(
                `
                SELECT PropertyID
                FROM properties
                WHERE PropertyID = ?
                AND OwnerID = ?
                `,
                [propertyId, ownerId]
            );

            if (properties.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to add a building to this property"
                });
            }
        } else {
            // --------------------------------------
            // ADMINISTRATOR
            // --------------------------------------
            const [properties] = await pool.query(
                `
                SELECT PropertyID
                FROM properties
                WHERE PropertyID = ?
                `,
                [propertyId]
            );

            if (properties.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Property not found"
                });
            }
        }

        // ------------------------------------------
        // INSERT
        // ------------------------------------------
        const [result] = await pool.query(
            `
            INSERT INTO buildings
            (
                PropertyID,
                BuildingName,
                TotalFloors
            )
            VALUES (?, ?, 0)
            `,
            [
                propertyId,
                buildingName.trim()
            ]
        );

        const [buildings] = await pool.query(
            `
            SELECT
                b.BuildingID,
                b.PropertyID,
                p.PropertyName,
                b.BuildingName,
                b.TotalFloors
            FROM buildings b
            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID
            WHERE b.BuildingID = ?
            `,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Building created successfully",
            building: buildings[0]
        });

    } catch (error) {
        console.error("Create building error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create building"
        });
    }
};


// ======================================================
// UPDATE BUILDING
// ======================================================
const updateBuilding = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            buildingName
        } = req.body || {};

        if (!buildingName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Building name is required"
            });
        }

        const role = String(
            req.user?.role ||
            req.user?.Role ||
            req.user?.RoleName ||
            ""
        ).trim().toLowerCase();

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

        const params = [id];

        // ------------------------------------------
        // OWNER: VERIFY OWNERSHIP
        // ------------------------------------------
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

        const [existingBuilding] = await pool.query(
            query,
            params
        );

        if (existingBuilding.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Building not found or you are not authorized to modify it"
            });
        }

        // ------------------------------------------
        // UPDATE ONLY NAME
        // ------------------------------------------
        await pool.query(
            `
            UPDATE buildings
            SET BuildingName = ?
            WHERE BuildingID = ?
            `,
            [
                buildingName.trim(),
                id
            ]
        );

        const [buildings] = await pool.query(
            `
            SELECT
                b.BuildingID,
                b.PropertyID,
                p.PropertyName,
                b.BuildingName,
                b.TotalFloors
            FROM buildings b
            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID
            WHERE b.BuildingID = ?
            `,
            [id]
        );

        res.status(200).json({
            success: true,
            message: "Building updated successfully",
            building: buildings[0]
        });

    } catch (error) {
        console.error("Update building error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update building"
        });
    }
};


// ======================================================
// DELETE BUILDING
// ======================================================
const deleteBuilding = async (req, res) => {
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
                b.BuildingID,
                p.OwnerID
            FROM buildings b
            INNER JOIN properties p
                ON b.PropertyID = p.PropertyID
            WHERE b.BuildingID = ?
        `;

        const params = [id];

        // ------------------------------------------
        // OWNER: VERIFY OWNERSHIP
        // ------------------------------------------
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

        const [existingBuilding] = await pool.query(
            query,
            params
        );

        if (existingBuilding.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Building not found or you are not authorized to delete it"
            });
        }

        // ------------------------------------------
        // CHECK FLOORS
        // ------------------------------------------
        const [floors] = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM floors
            WHERE BuildingID = ?
            `,
            [id]
        );

        if (Number(floors[0].count) > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete building because it contains floors. Remove its floors first."
            });
        }

        await pool.query(
            `
            DELETE FROM buildings
            WHERE BuildingID = ?
            `,
            [id]
        );

        res.status(200).json({
            success: true,
            message: "Building deleted successfully"
        });

    } catch (error) {
        console.error("Delete building error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete building"
        });
    }
};


module.exports = {
    getBuildings,
    getBuildingById,
    createBuilding,
    updateBuilding,
    deleteBuilding
};