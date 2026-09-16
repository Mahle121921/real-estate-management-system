const db = require("../config/db");

// ============================================================
// GET OWNER ID FROM LOGGED-IN USER
// ============================================================
const getOwnerId = async (userId) => {
    const [rows] = await db.query(
        "SELECT OwnerID FROM owners WHERE UserID = ? LIMIT 1",
        [userId]
    );

    return rows.length > 0 ? rows[0].OwnerID : null;
};

// ============================================================
// CHECK PROPERTY ACCESS
// Administrator = all properties
// Sales Agent = all properties
// Owner = only owned properties
// ============================================================
const canAccessProperty = async (req, propertyId) => {
    const role = req.user?.role;
    const userId = req.user?.userId;

    if (role === "Administrator" || role === "Sales Agent") {
        return true;
    }

    if (role === "Owner") {
        const ownerId = await getOwnerId(userId);

        if (!ownerId) {
            return false;
        }

        const [rows] = await db.query(
            `
            SELECT PropertyID
            FROM properties
            WHERE PropertyID = ?
              AND OwnerID = ?
            LIMIT 1
            `,
            [propertyId, ownerId]
        );

        return rows.length > 0;
    }

    return false;
};

// ============================================================
// GET ALL RENTAL AGREEMENTS
// ============================================================
exports.getAllRentals = async (req, res) => {
    try {
        const role = req.user?.role;
        const userId = req.user?.userId;

        let query = `
            SELECT
                r.RentalID,
                r.PropertyID,
                p.PropertyName,
                p.PropertyType,
                p.OwnerID,
                r.CustomerID,
                c.FullName AS CustomerName,
                c.PhoneNumber AS CustomerPhone,
                c.Email AS CustomerEmail,
                r.HandledBy,
                u.FullName AS HandledByName,
                r.MonthlyRent,
                r.StartDate,
                r.EndDate,
                r.DueDate,
                r.Status
            FROM rental_agreements r
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            INNER JOIN customers c
                ON r.CustomerID = c.CustomerID
            INNER JOIN users u
                ON r.HandledBy = u.UserID
        `;

        const params = [];

        if (role === "Owner") {
            const ownerId = await getOwnerId(userId);

            if (!ownerId) {
                return res.status(403).json({
                    message: "Owner record not found."
                });
            }

            query += `
                WHERE p.OwnerID = ?
            `;

            params.push(ownerId);
        }

        query += `
            ORDER BY r.RentalID DESC
        `;

        const [rows] = await db.query(query, params);

        res.json(rows);
    } catch (error) {
        console.error("Get rentals error:", error);

        res.status(500).json({
            message: "Failed to retrieve rental agreements.",
            error: error.message
        });
    }
};

// ============================================================
// GET MY RENTAL AGREEMENTS
// Customer can see only their own rental agreements
// ============================================================
exports.getMyRentals = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user not found."
            });
        }

        if (role !== "Customer") {
            return res.status(403).json({
                success: false,
                message: "Only customers can access their rental agreements."
            });
        }

        // Find logged-in customer's profile
        const [customerRows] = await db.query(
            `
            SELECT
                CustomerID,
                FullName,
                Email,
                PhoneNumber
            FROM customers
            WHERE UserID = ?
            LIMIT 1
            `,
            [userId]
        );

        if (customerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found."
            });
        }

        const customer = customerRows[0];

        // Get only this customer's rental agreements
        const [rentals] = await db.query(
            `
            SELECT
                r.RentalID,
                r.PropertyID,

                p.PropertyName,
                p.PropertyType,
                p.Address,
                p.Status AS PropertyStatus,

                r.CustomerID,
                c.FullName AS CustomerName,
                c.Email AS CustomerEmail,
                c.PhoneNumber AS CustomerPhone,

                r.HandledBy,
                u.FullName AS HandledByName,

                r.MonthlyRent,
                r.StartDate,
                r.EndDate,
                r.DueDate,
                r.Status

            FROM rental_agreements r

            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID

            INNER JOIN customers c
                ON r.CustomerID = c.CustomerID

            LEFT JOIN users u
                ON r.HandledBy = u.UserID

            WHERE r.CustomerID = ?

            ORDER BY r.RentalID DESC
            `,
            [customer.CustomerID]
        );

        return res.status(200).json({
            success: true,
            count: rentals.length,
            customer: {
                CustomerID: customer.CustomerID,
                FullName: customer.FullName,
                Email: customer.Email,
                PhoneNumber: customer.PhoneNumber
            },
            rentals
        });

    } catch (error) {
        console.error("Get my rentals error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your rental agreements.",
            error: error.message
        });
    }
};


// ============================================================
// GET RENTAL AGREEMENT BY ID
// ============================================================
exports.getRentalById = async (req, res) => {
    try {
        const rentalId = req.params.id;

        const [rows] = await db.query(
            `
            SELECT
                r.RentalID,
                r.PropertyID,
                p.PropertyName,
                p.PropertyType,
                p.Address,
                p.OwnerID,
                r.CustomerID,
                c.FullName AS CustomerName,
                c.PhoneNumber AS CustomerPhone,
                c.Email AS CustomerEmail,
                r.HandledBy,
                u.FullName AS HandledByName,
                r.MonthlyRent,
                r.StartDate,
                r.EndDate,
                r.DueDate,
                r.Status
            FROM rental_agreements r
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            INNER JOIN customers c
                ON r.CustomerID = c.CustomerID
            INNER JOIN users u
                ON r.HandledBy = u.UserID
            WHERE r.RentalID = ?
            LIMIT 1
            `,
            [rentalId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Rental agreement not found."
            });
        }

        const rental = rows[0];

        const allowed = await canAccessProperty(
            req,
            rental.PropertyID
        );

        if (!allowed) {
            return res.status(403).json({
                message: "You are not authorized to access this rental agreement."
            });
        }

        res.json(rental);
    } catch (error) {
        console.error("Get rental by ID error:", error);

        res.status(500).json({
            message: "Failed to retrieve rental agreement.",
            error: error.message
        });
    }
};

// ============================================================
// CREATE RENTAL AGREEMENT
// ============================================================
exports.createRental = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const {
            PropertyID,
            CustomerID,
            MonthlyRent,
            StartDate,
            EndDate,
            DueDate,
            Status
        } = req.body;

        const HandledBy = req.user?.userId;

        if (
            !PropertyID ||
            !CustomerID ||
            MonthlyRent === undefined ||
            !StartDate ||
            !EndDate ||
            DueDate === undefined
        ) {
            return res.status(400).json({
                message: "Property, customer, monthly rent, start date, end date and due date are required."
            });
        }

        if (!HandledBy) {
            return res.status(401).json({
                message: "Authenticated user not found."
            });
        }

        const validStatuses = [
            "Active",
            "Expired",
            "Terminated"
        ];

        const rentalStatus = Status || "Active";

        if (!validStatuses.includes(rentalStatus)) {
            return res.status(400).json({
                message: "Invalid rental status."
            });
        }

        if (Number(MonthlyRent) <= 0) {
            return res.status(400).json({
                message: "Monthly rent must be greater than zero."
            });
        }

        if (Number(DueDate) < 1 || Number(DueDate) > 31) {
            return res.status(400).json({
                message: "Due date must be between 1 and 31."
            });
        }

        if (new Date(EndDate) <= new Date(StartDate)) {
            return res.status(400).json({
                message: "End date must be after start date."
            });
        }

        const allowed = await canAccessProperty(
            req,
            PropertyID
        );

        if (!allowed) {
            return res.status(403).json({
                message: "You are not authorized to create a rental agreement for this property."
            });
        }

        await connection.beginTransaction();

        // --------------------------------------------------------
        // Check property
        // --------------------------------------------------------
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
            [PropertyID]
        );

        if (propertyRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Property not found."
            });
        }

        const property = propertyRows[0];

       if (property.Status !== "Available") {
    await connection.rollback();

    return res.status(400).json({
        message: `Property is not available for rental. Current status: ${property.Status}.`
    });
}

        // --------------------------------------------------------
        // Check customer
        // --------------------------------------------------------
        const [customerRows] = await connection.query(
            `
            SELECT CustomerID
            FROM customers
            WHERE CustomerID = ?
            LIMIT 1
            `,
            [CustomerID]
        );

        if (customerRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Customer not found."
            });
        }

        // --------------------------------------------------------
        // Create rental agreement
        // --------------------------------------------------------
        const [result] = await connection.query(
            `
            INSERT INTO rental_agreements
            (
                PropertyID,
                CustomerID,
                HandledBy,
                MonthlyRent,
                StartDate,
                EndDate,
                DueDate,
                Status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                PropertyID,
                CustomerID,
                HandledBy,
                MonthlyRent,
                StartDate,
                EndDate,
                DueDate,
                rentalStatus
            ]
        );

        // --------------------------------------------------------
        // Update property status
        // --------------------------------------------------------
        if (rentalStatus === "Active") {
            await connection.query(
                `
                UPDATE properties
                SET Status = 'Rented'
                WHERE PropertyID = ?
                `,
                [PropertyID]
            );
        }

        // --------------------------------------------------------
        // Activity log
        // --------------------------------------------------------
        await connection.query(
            `
            INSERT INTO activity_logs
            (
                UserID,
                Action,
                TableName,
                RecordID,
                Description
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                HandledBy,
                "CREATE",
                "rental_agreements",
                result.insertId,
                `Created rental agreement for property ${property.PropertyName}`
            ]
        );

        await connection.commit();

        res.status(201).json({
            message: "Rental agreement created successfully.",
            RentalID: result.insertId
        });
    } catch (error) {
        await connection.rollback();

        console.error("Create rental error:", error);

        res.status(500).json({
            message: "Failed to create rental agreement.",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// ============================================================
// CREATE RENTAL AGREEMENT - CUSTOMER
// Customer creates a rental for themselves
// ============================================================
exports.createCustomerRental = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const userId = req.user?.userId;
        const role = req.user?.role;

        if (!userId) {
            return res.status(401).json({
                message: "Authenticated user not found."
            });
        }

        if (role !== "Customer") {
            return res.status(403).json({
                message: "Only customers can use this endpoint."
            });
        }

        const {
            PropertyID,
            MonthlyRent,
            StartDate,
            EndDate,
            DueDate
        } = req.body;

        // --------------------------------------------------------
        // Validate required fields
        // --------------------------------------------------------
        if (
            !PropertyID ||
            MonthlyRent === undefined ||
            !StartDate ||
            !EndDate ||
            DueDate === undefined
        ) {
            return res.status(400).json({
                message:
                    "Property, monthly rent, start date, end date and due date are required."
            });
        }

        // --------------------------------------------------------
        // Validate monthly rent
        // --------------------------------------------------------
        if (Number(MonthlyRent) <= 0) {
            return res.status(400).json({
                message: "Monthly rent must be greater than zero."
            });
        }

        // --------------------------------------------------------
        // Validate due date
        // --------------------------------------------------------
        if (Number(DueDate) < 1 || Number(DueDate) > 31) {
            return res.status(400).json({
                message: "Due date must be between 1 and 31."
            });
        }

        // --------------------------------------------------------
        // Validate rental dates
        // --------------------------------------------------------
        if (new Date(EndDate) <= new Date(StartDate)) {
            return res.status(400).json({
                message: "End date must be after start date."
            });
        }

        // --------------------------------------------------------
        // Get CustomerID from logged-in user
        // --------------------------------------------------------
        const [customerRows] = await connection.query(
            `
            SELECT
                CustomerID,
                FullName,
                Email,
                PhoneNumber
            FROM customers
            WHERE UserID = ?
            LIMIT 1
            `,
            [userId]
        );

        if (customerRows.length === 0) {
            return res.status(404).json({
                message:
                    "Customer profile not found for the logged-in user."
            });
        }

        const customer = customerRows[0];
        const CustomerID = customer.CustomerID;

        // --------------------------------------------------------
        // Begin transaction
        // --------------------------------------------------------
        await connection.beginTransaction();

        // --------------------------------------------------------
        // Check property
        // Lock property to prevent two customers renting it
        // simultaneously
        // --------------------------------------------------------
        const [propertyRows] = await connection.query(
            `
            SELECT
                PropertyID,
                PropertyName,
                PropertyType,
                Status,
                OwnerID
            FROM properties
            WHERE PropertyID = ?
            FOR UPDATE
            `,
            [PropertyID]
        );

        if (propertyRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Property not found."
            });
        }

        const property = propertyRows[0];

        // --------------------------------------------------------
        // Property must be Available
        // --------------------------------------------------------
        if (property.Status !== "Available") {
            await connection.rollback();

            return res.status(400).json({
                message:
                    `Property is not available for rental. Current status: ${property.Status}.`
            });
        }

        // --------------------------------------------------------
        // Check if customer already has an active rental
        // for this property
        // --------------------------------------------------------
        const [existingRentalRows] = await connection.query(
            `
            SELECT RentalID
            FROM rental_agreements
            WHERE PropertyID = ?
              AND CustomerID = ?
              AND Status = 'Active'
            LIMIT 1
            `,
            [PropertyID, CustomerID]
        );

        if (existingRentalRows.length > 0) {
            await connection.rollback();

            return res.status(400).json({
                message:
                    "You already have an active rental agreement for this property."
            });
        }

        // --------------------------------------------------------
        // Create rental agreement
        //
        // Your existing database requires HandledBy.
        // For the current system we use the logged-in customer ID.
        // If you later introduce rental approval, this should be
        // changed to an authorized staff user.
        // --------------------------------------------------------
        const [result] = await connection.query(
            `
            INSERT INTO rental_agreements
            (
                PropertyID,
                CustomerID,
                HandledBy,
                MonthlyRent,
                StartDate,
                EndDate,
                DueDate,
                Status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
            `,
            [
                PropertyID,
                CustomerID,
                userId,
                MonthlyRent,
                StartDate,
                EndDate,
                DueDate
            ]
        );

        // --------------------------------------------------------
        // Update property status
        // --------------------------------------------------------
        await connection.query(
            `
            UPDATE properties
            SET Status = 'Rented'
            WHERE PropertyID = ?
            `,
            [PropertyID]
        );

        // --------------------------------------------------------
        // Activity log
        // --------------------------------------------------------
        await connection.query(
            `
            INSERT INTO activity_logs
            (
                UserID,
                Action,
                TableName,
                RecordID,
                Description
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                userId,
                "CREATE",
                "rental_agreements",
                result.insertId,
                `Customer ${customer.FullName} rented property ${property.PropertyName}`
            ]
        );

        // --------------------------------------------------------
        // Commit
        // --------------------------------------------------------
        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Rental agreement created successfully.",
            RentalID: result.insertId,
            CustomerID,
            PropertyID: Number(PropertyID),
            PropertyName: property.PropertyName,
            MonthlyRent: Number(MonthlyRent),
            StartDate,
            EndDate,
            DueDate,
            Status: "Active"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Create customer rental error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create rental agreement.",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// ============================================================
// RENEW RENTAL AGREEMENT
// ============================================================
exports.renewRental = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const rentalId = req.params.id;
        const { EndDate, MonthlyRent, DueDate } = req.body;

        if (!EndDate) {
            return res.status(400).json({
                message: "New end date is required."
            });
        }

        const [rows] = await connection.query(
            `
            SELECT
                r.*,
                p.PropertyName,
                p.Status AS PropertyStatus
            FROM rental_agreements r
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            WHERE r.RentalID = ?
            FOR UPDATE
            `,
            [rentalId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Rental agreement not found."
            });
        }

        const rental = rows[0];

        const allowed = await canAccessProperty(
            req,
            rental.PropertyID
        );

        if (!allowed) {
            return res.status(403).json({
                message: "You are not authorized to renew this rental agreement."
            });
        }

        if (new Date(EndDate) <= new Date(rental.StartDate)) {
            return res.status(400).json({
                message: "New end date must be after the rental start date."
            });
        }

        await connection.beginTransaction();

        await connection.query(
            `
            UPDATE rental_agreements
            SET
                EndDate = ?,
                MonthlyRent = COALESCE(?, MonthlyRent),
                DueDate = COALESCE(?, DueDate),
                Status = 'Active'
            WHERE RentalID = ?
            `,
            [
                EndDate,
                MonthlyRent || null,
                DueDate || null,
                rentalId
            ]
        );

        await connection.query(
            `
            UPDATE properties
            SET Status = 'Rented'
            WHERE PropertyID = ?
            `,
            [rental.PropertyID]
        );

        await connection.query(
            `
            INSERT INTO activity_logs
            (
                UserID,
                Action,
                TableName,
                RecordID,
                Description
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                req.user.userId,
                "RENEW",
                "rental_agreements",
                rentalId,
                `Renewed rental agreement for property ${rental.PropertyName}`
            ]
        );

        await connection.commit();

        res.json({
            message: "Rental agreement renewed successfully."
        });
    } catch (error) {
        await connection.rollback();

        console.error("Renew rental error:", error);

        res.status(500).json({
            message: "Failed to renew rental agreement.",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// ============================================================
// TERMINATE RENTAL AGREEMENT
// ============================================================
exports.terminateRental = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const rentalId = req.params.id;

        const [rows] = await connection.query(
            `
            SELECT
                r.RentalID,
                r.PropertyID,
                r.Status,
                p.PropertyName
            FROM rental_agreements r
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            WHERE r.RentalID = ?
            FOR UPDATE
            `,
            [rentalId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Rental agreement not found."
            });
        }

        const rental = rows[0];

        const allowed = await canAccessProperty(
            req,
            rental.PropertyID
        );

        if (!allowed) {
            return res.status(403).json({
                message: "You are not authorized to terminate this rental agreement."
            });
        }

        await connection.beginTransaction();

        await connection.query(
            `
            UPDATE rental_agreements
            SET Status = 'Terminated'
            WHERE RentalID = ?
            `,
            [rentalId]
        );

        await connection.query(
            `
            UPDATE properties
            SET Status = 'Available'
            WHERE PropertyID = ?
            `,
            [rental.PropertyID]
        );

        await connection.query(
            `
            INSERT INTO activity_logs
            (
                UserID,
                Action,
                TableName,
                RecordID,
                Description
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                req.user.userId,
                "TERMINATE",
                "rental_agreements",
                rentalId,
                `Terminated rental agreement for property ${rental.PropertyName}`
            ]
        );

        await connection.commit();

        res.json({
            message: "Rental agreement terminated successfully."
        });
    } catch (error) {
        await connection.rollback();

        console.error("Terminate rental error:", error);

        res.status(500).json({
            message: "Failed to terminate rental agreement.",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// ============================================================
// GET RENTAL DUE DATES
// ============================================================
exports.getRentalDueDates = async (req, res) => {
    try {
        const role = req.user?.role;
        const userId = req.user?.userId;

        let query = `
            SELECT
                r.RentalID,
                r.PropertyID,
                p.PropertyName,
                r.CustomerID,
                c.FullName AS CustomerName,
                r.MonthlyRent,
                r.DueDate,
                r.StartDate,
                r.EndDate,
                r.Status
            FROM rental_agreements r
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            INNER JOIN customers c
                ON r.CustomerID = c.CustomerID
            WHERE r.Status = 'Active'
        `;

        const params = [];

        if (role === "Owner") {
            const ownerId = await getOwnerId(userId);

            if (!ownerId) {
                return res.status(403).json({
                    message: "Owner record not found."
                });
            }

            query += `
                AND p.OwnerID = ?
            `;

            params.push(ownerId);
        }

        query += `
            ORDER BY r.DueDate ASC
        `;

        const [rows] = await db.query(query, params);

        res.json(rows);
    } catch (error) {
        console.error("Get rental due dates error:", error);

        res.status(500).json({
            message: "Failed to retrieve rental due dates.",
            error: error.message
        });
    }
};

// ============================================================
// RECORD MONTHLY RENT PAYMENT
// ============================================================
exports.recordMonthlyRent = async (req, res) => {
    try {
        const rentalId = req.params.id;

        const [rows] = await db.query(
            `
            SELECT
                r.*,
                p.PropertyName
            FROM rental_agreements r
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            WHERE r.RentalID = ?
            LIMIT 1
            `,
            [rentalId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Rental agreement not found."
            });
        }

        const rental = rows[0];

        const allowed = await canAccessProperty(
            req,
            rental.PropertyID
        );

        if (!allowed) {
            return res.status(403).json({
                message: "You are not authorized to record payment for this rental agreement."
            });
        }

        res.json({
            message: "Monthly rent payment endpoint is available.",
            RentalID: rental.RentalID,
            PropertyID: rental.PropertyID,
            PropertyName: rental.PropertyName,
            CustomerID: rental.CustomerID,
            MonthlyRent: rental.MonthlyRent,
            DueDate: rental.DueDate
        });
    } catch (error) {
        console.error("Record rent payment error:", error);

        res.status(500).json({
            message: "Failed to process rent payment.",
            error: error.message
        });
    }
};
// ============================================================
// UPDATE RENTAL AGREEMENT
// Administrator / Owner / Sales Agent
// ============================================================
const updateRental = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const rentalId = req.params.id;

        const {
            MonthlyRent,
            StartDate,
            EndDate,
            DueDate,
            Status
        } = req.body;

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authenticated user not found."
            });
        }

        // --------------------------------------------------------
        // Validate required fields
        // --------------------------------------------------------
        if (
            MonthlyRent === undefined ||
            !StartDate ||
            !EndDate ||
            DueDate === undefined ||
            !Status
        ) {
            return res.status(400).json({
                message:
                    "Monthly rent, start date, end date, due date and status are required."
            });
        }

        // --------------------------------------------------------
        // Validate monthly rent
        // --------------------------------------------------------
        if (Number(MonthlyRent) <= 0) {
            return res.status(400).json({
                message: "Monthly rent must be greater than zero."
            });
        }

        // --------------------------------------------------------
        // Validate due date
        // --------------------------------------------------------
        if (Number(DueDate) < 1 || Number(DueDate) > 31) {
            return res.status(400).json({
                message: "Due date must be between 1 and 31."
            });
        }

        // --------------------------------------------------------
        // Validate dates
        // --------------------------------------------------------
        if (new Date(EndDate) <= new Date(StartDate)) {
            return res.status(400).json({
                message: "End date must be after start date."
            });
        }

        // --------------------------------------------------------
        // Validate status
        // --------------------------------------------------------
        const validStatuses = [
            "Active",
            "Expired",
            "Terminated"
        ];

        if (!validStatuses.includes(Status)) {
            return res.status(400).json({
                message: "Invalid rental status."
            });
        }

        // --------------------------------------------------------
        // Get existing rental
        // --------------------------------------------------------
        const [rows] = await connection.query(
            `
            SELECT
                r.RentalID,
                r.PropertyID,
                r.CustomerID,
                r.MonthlyRent,
                r.StartDate,
                r.EndDate,
                r.DueDate,
                r.Status,
                p.PropertyName,
                p.Status AS PropertyStatus
            FROM rental_agreements r
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            WHERE r.RentalID = ?
            LIMIT 1
            `,
            [rentalId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Rental agreement not found."
            });
        }

        const rental = rows[0];

        // --------------------------------------------------------
        // Check property access
        // --------------------------------------------------------
        const allowed = await canAccessProperty(
            req,
            rental.PropertyID
        );

        if (!allowed) {
            return res.status(403).json({
                message:
                    "You are not authorized to update this rental agreement."
            });
        }

        await connection.beginTransaction();

        // --------------------------------------------------------
        // Update rental agreement
        // --------------------------------------------------------
        await connection.query(
            `
            UPDATE rental_agreements
            SET
                MonthlyRent = ?,
                StartDate = ?,
                EndDate = ?,
                DueDate = ?,
                Status = ?
            WHERE RentalID = ?
            `,
            [
                MonthlyRent,
                StartDate,
                EndDate,
                DueDate,
                Status,
                rentalId
            ]
        );

        // --------------------------------------------------------
        // Synchronize property status
        // --------------------------------------------------------
        if (Status === "Active") {
            await connection.query(
                `
                UPDATE properties
                SET Status = 'Rented'
                WHERE PropertyID = ?
                `,
                [rental.PropertyID]
            );
        } else if (
            Status === "Terminated" ||
            Status === "Expired"
        ) {
            await connection.query(
                `
                UPDATE properties
                SET Status = 'Available'
                WHERE PropertyID = ?
                `,
                [rental.PropertyID]
            );
        }

        // --------------------------------------------------------
        // Activity log
        // --------------------------------------------------------
        await connection.query(
            `
            INSERT INTO activity_logs
            (
                UserID,
                Action,
                TableName,
                RecordID,
                Description
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                userId,
                "UPDATE",
                "rental_agreements",
                rentalId,
                `Updated rental agreement for property ${rental.PropertyName}`
            ]
        );

        await connection.commit();

        res.json({
            message: "Rental agreement updated successfully.",
            RentalID: rentalId
        });

    } catch (error) {
        await connection.rollback();

        console.error("Update rental error:", error);

        res.status(500).json({
            message: "Failed to update rental agreement.",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

exports.updateRental = updateRental;