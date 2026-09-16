
const pool = require("../config/db");

const getLoggedInOwnerId = async (userId) => {
    const [owners] = await pool.query(
        "SELECT OwnerID FROM owners WHERE UserID = ?",
        [userId]
    );

    return owners.length > 0
        ? owners[0].OwnerID
        : null;
};

// ==========================================
// GET ALL PROPERTIES
// ==========================================
const getProperties = async (req, res) => {
    try {
        const [properties] = await pool.query(`
            SELECT
                p.PropertyID,
                p.OwnerID,
                u.FullName AS OwnerName,
                p.PropertyName,
                p.PropertyType,
                p.Address,
                p.SalePrice,
                p.MonthlyRent,
                p.Status,
                p.Description,

                (
                    SELECT pi.ImagePath
                    FROM property_images pi
                    WHERE pi.PropertyID = p.PropertyID
                    ORDER BY pi.PropertyImageID ASC
                    LIMIT 1
                ) AS ImagePath

            FROM properties p
            INNER JOIN owners o
                ON p.OwnerID = o.OwnerID
            INNER JOIN users u
                ON o.UserID = u.UserID
            ORDER BY p.PropertyID ASC
        `);

        res.status(200).json({
            success: true,
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error("Get properties error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve properties"
        });
    }
};

// ==========================================
// GET PROPERTY BY ID
// ==========================================
const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;

        const [properties] = await pool.query(`
            SELECT
                p.PropertyID,
                p.OwnerID,
                u.FullName AS OwnerName,
                p.PropertyName,
                p.PropertyType,
                p.Address,
                p.SalePrice,
                p.MonthlyRent,
                p.Status,
                p.Description,

                (
                    SELECT pi.ImagePath
                    FROM property_images pi
                    WHERE pi.PropertyID = p.PropertyID
                    ORDER BY pi.PropertyImageID ASC
                    LIMIT 1
                ) AS ImagePath

            FROM properties p
            INNER JOIN owners o
                ON p.OwnerID = o.OwnerID
            INNER JOIN users u
                ON o.UserID = u.UserID
            WHERE p.PropertyID = ?
        `, [id]);

        if (properties.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        res.status(200).json({
            success: true,
            property: properties[0]
        });

    } catch (error) {
        console.error("Get property by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve property"
        });
    }
};

// ==========================================
// CREATE PROPERTY
// ==========================================
const createProperty = async (req, res) => {
    try {
        const {
            ownerId,
            propertyName,
            propertyType,
            address,
            salePrice,
            monthlyRent,
            status,
            description
        } = req.body || {};

        if (!propertyName || !propertyType || !address) {
            return res.status(400).json({
                success: false,
                message:
                    "Property name, property type, and address are required"
            });
        }

        let finalOwnerId;

        // OWNER: automatically use logged-in owner
        if (req.user.role === "Owner") {
            finalOwnerId = await getLoggedInOwnerId(
                req.user.userId
            );

            if (!finalOwnerId) {
                return res.status(404).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }
        } else {
            // ADMINISTRATOR: can select owner
            finalOwnerId = ownerId;

            if (!finalOwnerId) {
                return res.status(400).json({
                    success: false,
                    message: "Owner ID is required"
                });
            }
        }

        const [owners] = await pool.query(
            "SELECT OwnerID FROM owners WHERE OwnerID = ?",
            [finalOwnerId]
        );

        if (owners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        const allowedTypes = [
            "Villa",
            "Apartment",
            "Commercial Building",
            "Residential House",
            "Other"
        ];

        if (!allowedTypes.includes(propertyType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property type"
            });
        }

        const allowedStatuses = [
            "Available",
            "Reserved",
            "Sold",
            "Rented"
        ];

        const propertyStatus = status || "Available";

        if (!allowedStatuses.includes(propertyStatus)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid property status"
            });
        }

        const [result] = await pool.query(`
            INSERT INTO properties
            (
                OwnerID,
                PropertyName,
                PropertyType,
                Address,
                SalePrice,
                MonthlyRent,
                Status,
                Description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            finalOwnerId,
            propertyName,
            propertyType,
            address,
            salePrice || null,
            monthlyRent || null,
            propertyStatus,
            description || null
        ]);

        const [properties] = await pool.query(`
            SELECT
                p.PropertyID,
                p.OwnerID,
                u.FullName AS OwnerName,
                p.PropertyName,
                p.PropertyType,
                p.Address,
                p.SalePrice,
                p.MonthlyRent,
                p.Status,
                p.Description,

                (
                    SELECT pi.ImagePath
                    FROM property_images pi
                    WHERE pi.PropertyID = p.PropertyID
                    ORDER BY pi.PropertyImageID ASC
                    LIMIT 1
                ) AS ImagePath

            FROM properties p
            INNER JOIN owners o
                ON p.OwnerID = o.OwnerID
            INNER JOIN users u
                ON o.UserID = u.UserID
            WHERE p.PropertyID = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: "Property created successfully",
            property: properties[0]
        });

    } catch (error) {
        console.error("Create property error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create property"
        });
    }
};

// ==========================================
// UPDATE PROPERTY
// ==========================================
const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            ownerId,
            propertyName,
            propertyType,
            address,
            salePrice,
            monthlyRent,
            status,
            description
        } = req.body || {};

        if (!propertyName || !propertyType || !address) {
            return res.status(400).json({
                success: false,
                message:
                    "Property name, property type, and address are required"
            });
        }

        const [existingProperty] = await pool.query(
            "SELECT * FROM properties WHERE PropertyID = ?",
            [id]
        );

        if (existingProperty.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const property = existingProperty[0];

        // OWNER can only edit their own property
        if (req.user.role === "Owner") {
            const loggedInOwnerId =
                await getLoggedInOwnerId(
                    req.user.userId
                );

            if (!loggedInOwnerId) {
                return res.status(404).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            if (
                property.OwnerID !==
                loggedInOwnerId
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to edit this property"
                });
            }
        }

        const allowedTypes = [
            "Villa",
            "Apartment",
            "Commercial Building",
            "Residential House",
            "Other"
        ];

        if (!allowedTypes.includes(propertyType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property type"
            });
        }

        const allowedStatuses = [
            "Available",
            "Reserved",
            "Sold",
            "Rented"
        ];

        if (
            status &&
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid property status"
            });
        }

        // Owner cannot change ownership
        const finalOwnerId =
            req.user.role === "Owner"
                ? property.OwnerID
                : ownerId;

        if (!finalOwnerId) {
            return res.status(400).json({
                success: false,
                message: "Owner ID is required"
            });
        }

        await pool.query(`
            UPDATE properties
            SET
                OwnerID = ?,
                PropertyName = ?,
                PropertyType = ?,
                Address = ?,
                SalePrice = ?,
                MonthlyRent = ?,
                Status = ?,
                Description = ?
            WHERE PropertyID = ?
        `, [
            finalOwnerId,
            propertyName,
            propertyType,
            address,
            salePrice || null,
            monthlyRent || null,
            status || property.Status,
            description || null,
            id
        ]);

        const [updatedProperties] =
            await pool.query(`
                SELECT
                    p.PropertyID,
                    p.OwnerID,
                    u.FullName AS OwnerName,
                    p.PropertyName,
                    p.PropertyType,
                    p.Address,
                    p.SalePrice,
                    p.MonthlyRent,
                    p.Status,
                    p.Description,

                    (
                        SELECT pi.ImagePath
                        FROM property_images pi
                        WHERE pi.PropertyID = p.PropertyID
                        ORDER BY pi.PropertyImageID ASC
                        LIMIT 1
                    ) AS ImagePath

                FROM properties p
                INNER JOIN owners o
                    ON p.OwnerID = o.OwnerID
                INNER JOIN users u
                    ON o.UserID = u.UserID
                WHERE p.PropertyID = ?
            `, [id]);

        res.status(200).json({
            success: true,
            message: "Property updated successfully",
            property: updatedProperties[0]
        });

    } catch (error) {
        console.error("Update property error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update property"
        });
    }
};

// ==========================================
// UPDATE PROPERTY STATUS
// ==========================================
const updatePropertyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};

        const allowedStatuses = [
            "Available",
            "Reserved",
            "Sold",
            "Rented"
        ];

        if (
            !status ||
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be Available, Reserved, Sold, or Rented"
            });
        }

        const [existingProperty] =
            await pool.query(
                "SELECT * FROM properties WHERE PropertyID = ?",
                [id]
            );

        if (existingProperty.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const property =
            existingProperty[0];

        // OWNER can only change their own property
        if (req.user.role === "Owner") {
            const loggedInOwnerId =
                await getLoggedInOwnerId(
                    req.user.userId
                );

            if (!loggedInOwnerId) {
                return res.status(404).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            if (
                property.OwnerID !==
                loggedInOwnerId
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to change this property's status"
                });
            }
        }

        await pool.query(
            `UPDATE properties
             SET Status = ?
             WHERE PropertyID = ?`,
            [status, id]
        );

        const [updatedProperties] =
            await pool.query(`
                SELECT
                    p.PropertyID,
                    p.OwnerID,
                    p.PropertyName,
                    p.PropertyType,
                    p.Address,
                    p.SalePrice,
                    p.MonthlyRent,
                    p.Status,
                    p.Description,

                    (
                        SELECT pi.ImagePath
                        FROM property_images pi
                        WHERE pi.PropertyID = p.PropertyID
                        ORDER BY pi.PropertyImageID ASC
                        LIMIT 1
                    ) AS ImagePath

                FROM properties p
                WHERE p.PropertyID = ?
            `, [id]);

        res.status(200).json({
            success: true,
            message:
                "Property status updated successfully",
            property: updatedProperties[0]
        });

    } catch (error) {
        console.error(
            "Update property status error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update property status"
        });
    }
};

// ==========================================
// SEARCH PROPERTIES
// ==========================================
const searchProperties = async (req, res) => {
    try {
        const { q } = req.query;

        let query = `
            SELECT
                p.PropertyID,
                p.OwnerID,
                u.FullName AS OwnerName,
                p.PropertyName,
                p.PropertyType,
                p.Address,
                p.SalePrice,
                p.MonthlyRent,
                p.Status,
                p.Description,

                (
                    SELECT pi.ImagePath
                    FROM property_images pi
                    WHERE pi.PropertyID = p.PropertyID
                    ORDER BY pi.PropertyImageID ASC
                    LIMIT 1
                ) AS ImagePath

            FROM properties p
            INNER JOIN owners o
                ON p.OwnerID = o.OwnerID
            INNER JOIN users u
                ON o.UserID = u.UserID
            WHERE p.Status = 'Available'
        `;

        const params = [];

        if (q && q.trim() !== "") {
            const searchTerm =
                `%${q.trim()}%`;

            query += `
                AND (
                    p.PropertyName LIKE ?
                    OR p.PropertyType LIKE ?
                    OR p.Address LIKE ?
                    OR p.Description LIKE ?
                )
            `;

            params.push(
                searchTerm,
                searchTerm,
                searchTerm,
                searchTerm
            );
        }

        query += `
            ORDER BY p.PropertyID ASC
        `;

        const [properties] =
            await pool.query(
                query,
                params
            );

        return res.status(200).json({
            success: true,
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error(
            "Search properties error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to search properties"
        });
    }
};

module.exports = {
    getProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    updatePropertyStatus,
    searchProperties
};
