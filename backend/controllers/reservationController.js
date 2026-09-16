const pool = require("../config/db");

// ==========================================
// GET ALL RESERVATIONS
// Administrator / Owner / Sales Agent
// ==========================================
const getReservations = async (req, res) => {
    try {
        const [reservations] = await pool.query(`
            SELECT
                r.ReservationID,
                r.CustomerID,
                c.FullName AS CustomerName,
                r.PropertyID,
                p.PropertyName,
                r.HandledBy,
                u.FullName AS HandledByName,
                r.ReservationDate,
                r.ExpiryDate,
                r.ReservationStatus,
                r.Remarks
            FROM reservations r
            INNER JOIN customers c
                ON r.CustomerID = c.CustomerID
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            LEFT JOIN users u
                ON r.HandledBy = u.UserID
            ORDER BY r.ReservationID ASC
        `);

        return res.status(200).json({
            success: true,
            count: reservations.length,
            reservations
        });

    } catch (error) {
        console.error("Get reservations error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve reservations"
        });
    }
};


// ==========================================
// GET MY RESERVATIONS
// Customer only
// ==========================================
const getMyReservations = async (req, res) => {
    console.log(">>> getMyReservations CONTROLLER REACHED");

    try {
        const [customers] = await pool.query(
            `
            SELECT CustomerID
            FROM customers
            WHERE UserID = ?
            LIMIT 1
            `,
            [req.user.userId]
        );

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found"
            });
        }

        const customerId = customers[0].CustomerID;

        const [reservationList] = await pool.query(
            `
            SELECT
                r.ReservationID,
                r.CustomerID,
                c.FullName AS CustomerName,
                r.PropertyID,
                p.PropertyName,
                p.PropertyType,
                p.Address,
                p.Status AS PropertyStatus,
                r.HandledBy,
                u.FullName AS HandledByName,
                r.ReservationDate,
                r.ExpiryDate,
                r.ReservationStatus,
                r.Remarks
            FROM reservations r
            INNER JOIN customers c
                ON r.CustomerID = c.CustomerID
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            LEFT JOIN users u
                ON r.HandledBy = u.UserID
            WHERE r.CustomerID = ?
            ORDER BY r.ReservationID DESC
            `,
            [customerId]
        );

        return res.status(200).json({
            success: true,
            count: reservationList.length,
            reservations: reservationList
        });

    } catch (error) {
        console.error("Get my reservations error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your reservations"
        });
    }
};


// ==========================================
// GET RESERVATION BY ID
// ==========================================
const getReservationById = async (req, res) => {
    try {
        const { id } = req.params;

        const [reservationList] = await pool.query(
            `
            SELECT
                r.ReservationID,
                r.CustomerID,
                c.FullName AS CustomerName,
                r.PropertyID,
                p.PropertyName,
                r.HandledBy,
                u.FullName AS HandledByName,
                r.ReservationDate,
                r.ExpiryDate,
                r.ReservationStatus,
                r.Remarks
            FROM reservations r
            INNER JOIN customers c
                ON r.CustomerID = c.CustomerID
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            LEFT JOIN users u
                ON r.HandledBy = u.UserID
            WHERE r.ReservationID = ?
            `,
            [id]
        );

        if (reservationList.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found"
            });
        }

        const reservation = reservationList[0];

        // Customer can only see their own reservation
        if (req.user.role === "Customer") {
            const [customers] = await pool.query(
                `
                SELECT CustomerID
                FROM customers
                WHERE UserID = ?
                LIMIT 1
                `,
                [req.user.userId]
            );

            if (customers.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "Customer profile not found"
                });
            }

            const customerId = customers[0].CustomerID;

            if (
                Number(reservation.CustomerID) !==
                Number(customerId)
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });
            }
        }

        return res.status(200).json({
            success: true,
            reservation
        });

    } catch (error) {
        console.error("Get reservation by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve reservation"
        });
    }
};


// ==========================================
// CREATE RESERVATION
// Customer / Administrator / Owner / Sales Agent
// ==========================================
// ==========================================
// CREATE RESERVATION
// Customer / Administrator / Owner / Sales Agent
// ==========================================
const createReservation = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const {
            customerId: requestedCustomerId,
            propertyId,
            reservationDate,
            expiryDate,
            reservationStatus,
            remarks
        } = req.body || {};

        const HandledBy = req.user.userId;

        // ==========================================
        // DETERMINE CUSTOMER
        // ==========================================

        let customerId;

        if (req.user.role === "Customer") {
            const [customerRows] = await connection.query(
                `
                SELECT CustomerID
                FROM customers
                WHERE UserID = ?
                LIMIT 1
                `,
                [req.user.userId]
            );

            if (customerRows.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message: "Customer profile not found"
                });
            }

            customerId = customerRows[0].CustomerID;
        } else {
            customerId = requestedCustomerId;

            if (!customerId) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Customer ID is required"
                });
            }
        }

        // ==========================================
        // REQUIRED FIELDS
        // ==========================================

        if (!propertyId || !HandledBy) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Property ID is required"
            });
        }

        // ==========================================
        // CUSTOMER
        // ==========================================

        const [customerRows] = await connection.query(
            `
            SELECT CustomerID, FullName
            FROM customers
            WHERE CustomerID = ?
            LIMIT 1
            `,
            [customerId]
        );

        if (customerRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // ==========================================
        // PROPERTY
        // ==========================================

        const [propertyRows] = await connection.query(
            `
            SELECT
                PropertyID,
                PropertyName,
                Status
            FROM properties
            WHERE PropertyID = ?
            FOR UPDATE
            `,
            [propertyId]
        );

        if (propertyRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const property = propertyRows[0];

        // ==========================================
        // PROPERTY MUST BE AVAILABLE
        // ==========================================

        if (property.Status !== "Available") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    `Property is not available. Current status: ${property.Status}.`
            });
        }

        // ==========================================
        // CHECK HANDLED BY USER
        // ==========================================

        const [userRows] = await connection.query(
            `
            SELECT UserID
            FROM users
            WHERE UserID = ?
            LIMIT 1
            `,
            [HandledBy]
        );

        if (userRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Reserved By user not found"
            });
        }

        // ==========================================
        // DEFAULT DATES
        // ==========================================

        const finalReservationDate =
            reservationDate || new Date();

        const finalExpiryDate =
            expiryDate ||
            new Date(
                new Date(finalReservationDate).getTime() +
                7 * 24 * 60 * 60 * 1000
            );

        // ==========================================
        // VALIDATE DATES
        // ==========================================

        if (
            new Date(finalExpiryDate) <
            new Date(finalReservationDate)
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Expiry date cannot be before reservation date"
            });
        }

        // ==========================================
        // RESERVATION STATUS
        // ==========================================

        const allowedStatuses = [
            "Pending",
            "Active",
            "Canceled",
            "Expired",
            "Confirmed"
        ];

        let status = reservationStatus || "Pending";

        // Customer reservations always start Pending
        if (req.user.role === "Customer") {
            status = "Pending";
        }

        if (!allowedStatuses.includes(status)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Invalid reservation status"
            });
        }

        // ==========================================
        // CHECK EXISTING RESERVATION
        // ==========================================

        const [existingReservation] = await connection.query(
            `
            SELECT ReservationID
            FROM reservations
            WHERE PropertyID = ?
              AND ReservationStatus IN ('Pending', 'Active', 'Confirmed')
              AND ExpiryDate >= CURDATE()
            LIMIT 1
            `,
            [propertyId]
        );

        if (existingReservation.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "This property already has an active reservation"
            });
        }

        // ==========================================
        // INSERT RESERVATION
        // ==========================================

        const [result] = await connection.query(
            `
            INSERT INTO reservations
            (
                CustomerID,
                PropertyID,
                HandledBy,
                ReservationDate,
                ExpiryDate,
                ReservationStatus,
                Remarks
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                customerId,
                propertyId,
                HandledBy,
                finalReservationDate,
                finalExpiryDate,
                status,
                remarks || null
            ]
        );

        // ==========================================
        // CHANGE PROPERTY STATUS
        // ==========================================

        await connection.query(
            `
            UPDATE properties
            SET Status = 'Reserved'
            WHERE PropertyID = ?
              AND Status = 'Available'
            `,
            [propertyId]
        );

        // ==========================================
        // GET CREATED RESERVATION
        // ==========================================

        const [createdReservation] = await connection.query(
            `
            SELECT
                r.ReservationID,
                r.CustomerID,
                c.FullName AS CustomerName,
                r.PropertyID,
                p.PropertyName,
                p.PropertyType,
                p.Address,
                p.Status AS PropertyStatus,
                r.HandledBy,
                u.FullName AS HandledByName,
                r.ReservationDate,
                r.ExpiryDate,
                r.ReservationStatus,
                r.Remarks
            FROM reservations r
            INNER JOIN customers c
                ON r.CustomerID = c.CustomerID
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            LEFT JOIN users u
                ON r.HandledBy = u.UserID
            WHERE r.ReservationID = ?
            `,
            [result.insertId]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Property reserved successfully",
            reservation: createdReservation[0]
        });

    } catch (error) {
        await connection.rollback();

        console.error("Create reservation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create reservation",
            error: error.message
        });
    } finally {
        connection.release();
    }
};


// ==========================================
// GET RESERVATIONS FOR LOGGED-IN OWNER
// ==========================================
const getOwnerReservations = async (req, res) => {
    try {
        const ownerUserId = req.user.userId;

        const [owners] = await pool.query(
            `
            SELECT OwnerID
            FROM owners
            WHERE UserID = ?
            LIMIT 1
            `,
            [ownerUserId]
        );

        if (owners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner profile not found"
            });
        }

        const ownerId = owners[0].OwnerID;

        const [reservationList] = await pool.query(
            `
            SELECT
                r.ReservationID,
                r.CustomerID,
                c.FullName AS CustomerName,

                r.PropertyID,
                p.PropertyName,
                p.PropertyType,
                p.Address,
                p.Status AS PropertyStatus,

                r.HandledBy,
                u.FullName AS HandledByName,

                r.ReservationDate,
                r.ExpiryDate,
                r.ReservationStatus,
                r.Remarks

            FROM reservations r
            INNER JOIN customers c
                ON r.CustomerID = c.CustomerID
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            LEFT JOIN users u
                ON r.HandledBy = u.UserID

            WHERE p.OwnerID = ?

            ORDER BY r.ReservationID DESC
            `,
            [ownerId]
        );

        return res.status(200).json({
            success: true,
            count: reservationList.length,
            reservations: reservationList
        });

    } catch (error) {
        console.error("Get owner reservations error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve owner reservations"
        });
    }
};


// ==========================================
// UPDATE RESERVATION
// Administrator / Owner / Sales Agent
// ==========================================
const updateReservation = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            customerId,
            propertyId,
            HandledBy,
            reservationDate,
            expiryDate,
            reservationStatus,
            remarks
        } = req.body || {};

        if (
            !customerId ||
            !propertyId ||
            !HandledBy ||
            !reservationDate ||
            !expiryDate
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Customer ID, Property ID, Reserved By, Reservation Date, and Expiry Date are required"
            });
        }

        // Check reservation
        const [existingReservation] = await pool.query(
            `
            SELECT ReservationID
            FROM reservations
            WHERE ReservationID = ?
            `,
            [id]
        );

        if (existingReservation.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found"
            });
        }

        // Check customer
        const [customerRows] = await pool.query(
            `
            SELECT CustomerID
            FROM customers
            WHERE CustomerID = ?
            `,
            [customerId]
        );

        if (customerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Check property
        const [propertyRows] = await pool.query(
            `
            SELECT PropertyID
            FROM properties
            WHERE PropertyID = ?
            `,
            [propertyId]
        );

        if (propertyRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        // Check user
        const [userRows] = await pool.query(
            `
            SELECT UserID
            FROM users
            WHERE UserID = ?
            `,
            [HandledBy]
        );

        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reserved By user not found"
            });
        }

        // Validate dates
        if (new Date(expiryDate) < new Date(reservationDate)) {
            return res.status(400).json({
                success: false,
                message:
                    "Expiry date cannot be before reservation date"
            });
        }

        const allowedStatuses = [
            "Pending",
            "Active",
            "Canceled",
            "Expired",
            "Confirmed"
        ];

        const status = reservationStatus || "Pending";

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reservation status"
            });
        }

        await pool.query(
            `
            UPDATE reservations
            SET
                CustomerID = ?,
                PropertyID = ?,
                HandledBy = ?,
                ReservationDate = ?,
                ExpiryDate = ?,
                ReservationStatus = ?,
                Remarks = ?
            WHERE ReservationID = ?
            `,
            [
                customerId,
                propertyId,
                HandledBy,
                reservationDate,
                expiryDate,
                status,
                remarks || null,
                id
            ]
        );

        const [updatedReservation] = await pool.query(
            `
            SELECT
                r.ReservationID,
                r.CustomerID,
                c.FullName AS CustomerName,
                r.PropertyID,
                p.PropertyName,
                r.HandledBy,
                u.FullName AS HandledByName,
                r.ReservationDate,
                r.ExpiryDate,
                r.ReservationStatus,
                r.Remarks
            FROM reservations r
            INNER JOIN customers c
                ON r.CustomerID = c.CustomerID
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            LEFT JOIN users u
                ON r.HandledBy = u.UserID
            WHERE r.ReservationID = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Reservation updated successfully",
            reservation: updatedReservation[0]
        });

    } catch (error) {
        console.error("Update reservation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update reservation"
        });
    }
};


// ==========================================
// UPDATE RESERVATION STATUS
// ==========================================
const updateReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};

        const allowedStatuses = [
            "Pending",
            "Active",
            "Canceled",
            "Expired",
            "Confirmed"
        ];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be Pending, Active, Canceled, Expired, or Confirmed"
            });
        }

        const [existingReservation] = await pool.query(
            `
            SELECT ReservationID
            FROM reservations
            WHERE ReservationID = ?
            `,
            [id]
        );

        if (existingReservation.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found"
            });
        }

        await pool.query(
            `
            UPDATE reservations
            SET ReservationStatus = ?
            WHERE ReservationID = ?
            `,
            [status, id]
        );

        const [updatedReservation] = await pool.query(
            `
            SELECT
                r.ReservationID,
                r.CustomerID,
                c.FullName AS CustomerName,
                r.PropertyID,
                p.PropertyName,
                r.HandledBy,
                u.FullName AS HandledByName,
                r.ReservationDate,
                r.ExpiryDate,
                r.ReservationStatus,
                r.Remarks
            FROM reservations r
            INNER JOIN customers c
                ON r.CustomerID = c.CustomerID
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            LEFT JOIN users u
                ON r.HandledBy = u.UserID
            WHERE r.ReservationID = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Reservation status updated successfully",
            reservation: updatedReservation[0]
        });

    } catch (error) {
        console.error("Update reservation status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update reservation status"
        });
    }
};


// ==========================================
// SEARCH RESERVATIONS
// ==========================================
const searchReservations = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const searchTerm = `%${q}%`;

        const [reservationList] = await pool.query(
            `
            SELECT
                r.ReservationID,
                r.CustomerID,
                c.FullName AS CustomerName,
                r.PropertyID,
                p.PropertyName,
                r.HandledBy,
                u.FullName AS HandledByName,
                r.ReservationDate,
                r.ExpiryDate,
                r.ReservationStatus,
                r.Remarks
            FROM reservations r
            INNER JOIN customers c
                ON r.CustomerID = c.CustomerID
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            LEFT JOIN users u
                ON r.HandledBy = u.UserID
            WHERE c.FullName LIKE ?
               OR p.PropertyName LIKE ?
               OR r.ReservationStatus LIKE ?
               OR r.Remarks LIKE ?
            ORDER BY r.ReservationID ASC
            `,
            [
                searchTerm,
                searchTerm,
                searchTerm,
                searchTerm
            ]
        );

        return res.status(200).json({
            success: true,
            count: reservationList.length,
            reservations: reservationList
        });

    } catch (error) {
        console.error("Search reservations error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to search reservations"
        });
    }
};

// ==========================================
// CANCEL RESERVATION
// Customer can cancel ONLY their own
// Staff can cancel any reservation
// ==========================================
const cancelReservation = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = req.params;

        let query = `
            SELECT
                ReservationID,
                CustomerID,
                PropertyID,
                ReservationStatus
            FROM reservations
            WHERE ReservationID = ?
        `;

        const params = [id];

        // ==========================================
        // CUSTOMER CAN CANCEL ONLY THEIR OWN
        // ==========================================

        if (req.user.role === "Customer") {
            const [customers] = await connection.query(
                `
                SELECT CustomerID
                FROM customers
                WHERE UserID = ?
                LIMIT 1
                `,
                [req.user.userId]
            );

            if (customers.length === 0) {
                await connection.rollback();

                return res.status(403).json({
                    success: false,
                    message: "Customer profile not found"
                });
            }

            query += ` AND CustomerID = ?`;
            params.push(customers[0].CustomerID);
        }

        // ==========================================
        // GET RESERVATION
        // ==========================================

        const [existingReservation] = await connection.query(
            query,
            params
        );

        if (existingReservation.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Reservation not found"
            });
        }

        const reservation = existingReservation[0];

        // ==========================================
        // ALREADY CANCELED
        // ==========================================

        if (reservation.ReservationStatus === "Canceled") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Reservation is already canceled"
            });
        }

        // ==========================================
        // CHECK PROPERTY
        // ==========================================

        const [propertyRows] = await connection.query(
            `
            SELECT
                PropertyID,
                PropertyName,
                Status
            FROM properties
            WHERE PropertyID = ?
            FOR UPDATE
            `,
            [reservation.PropertyID]
        );

        if (propertyRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const property = propertyRows[0];

        // ==========================================
        // CANCEL RESERVATION
        // ==========================================

        await connection.query(
            `
            UPDATE reservations
            SET ReservationStatus = 'Canceled'
            WHERE ReservationID = ?
            `,
            [id]
        );

        // ==========================================
        // MAKE PROPERTY AVAILABLE AGAIN
        // ==========================================

        /*
           Only change Reserved -> Available.

           This prevents accidentally changing a property
           that has already become Sold or Rented.
        */

        await connection.query(
            `
            UPDATE properties
            SET Status = 'Available'
            WHERE PropertyID = ?
              AND Status = 'Reserved'
            `,
            [reservation.PropertyID]
        );

        // ==========================================
        // ACTIVITY LOG
        // ==========================================

        await connection.query(
            `
            INSERT INTO activity_logs
            (
                UserID,
                Activity,
                Module,
                IPAddress
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                req.user.userId,
                `Reservation #${reservation.ReservationID} canceled for property ${reservation.PropertyID}`,
                "Reservations",
                req.ip
            ]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Reservation canceled successfully",
            reservationId: reservation.ReservationID,
            propertyId: reservation.PropertyID,
            propertyStatus: "Available"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Cancel reservation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel reservation",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
    getReservations,
    getMyReservations,
    getOwnerReservations,
    getReservationById,
    createReservation,
    updateReservation,
    updateReservationStatus,
    searchReservations,
    cancelReservation
};