const pool = require("../config/db");

// ============================================================
// HELPER: GET USER ID FROM JWT
// ============================================================
const getUserId = (req) => {
    return (
        req.user?.userId ||
        req.user?.UserID ||
        req.user?.id ||
        null
    );
};

// ============================================================
// HELPER: GET USER ROLE
// ============================================================
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

// ============================================================
// HELPER: GET OWNER ID FROM LOGGED-IN USER
// ============================================================
const getOwnerId = async (req) => {
    const userId = getUserId(req);

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

    if (owners.length === 0) {
        return null;
    }

    return owners[0].OwnerID;
};

// ============================================================
// GET ALL CUSTOMERS
// Administrator -> all customers
// Owner -> customers related to owner's properties
// Sales Agent -> all customers
// ============================================================
const getCustomers = async (req, res) => {
    try {
        const role = getUserRole(req);

        let query = `
            SELECT DISTINCT
                c.CustomerID,
                c.UserID,
                c.FullName,
                c.PhoneNumber,
                c.Email,
                c.Address,
                c.IDType,
                c.IDNumber,
                c.RegistrationDate,
                c.Status
            FROM customers c
        `;

        const params = [];

        // ----------------------------------------------------
        // OWNER FILTER
        // ----------------------------------------------------
        if (role === "owner") {
            const ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            /*
             * A customer is considered related to an Owner when
             * the customer appears in a reservation, sale, or
             * rental agreement for one of the owner's properties.
             */
            query += `
                LEFT JOIN reservations r
                    ON r.CustomerID = c.CustomerID

                LEFT JOIN sales s
                    ON s.CustomerID = c.CustomerID

                LEFT JOIN rental_agreements ra
                    ON ra.CustomerID = c.CustomerID

                LEFT JOIN properties p1
                    ON p1.PropertyID = r.PropertyID

                LEFT JOIN properties p2
                    ON p2.PropertyID = s.PropertyID

                LEFT JOIN properties p3
                    ON p3.PropertyID = ra.PropertyID

                WHERE
                    p1.OwnerID = ?
                    OR p2.OwnerID = ?
                    OR p3.OwnerID = ?
            `;

            params.push(ownerId, ownerId, ownerId);
        }

        query += `
            ORDER BY c.CustomerID ASC
        `;

        const [customers] = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            count: customers.length,
            customers
        });

    } catch (error) {
        console.error("Get customers error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve customers",
            error: error.message
        });
    }
};

// ============================================================
// GET CUSTOMER BY ID
// ============================================================
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const role = getUserRole(req);

        let query = `
            SELECT DISTINCT
                c.CustomerID,
                c.UserID,
                c.FullName,
                c.PhoneNumber,
                c.Email,
                c.Address,
                c.IDType,
                c.IDNumber,
                c.RegistrationDate,
                c.Status
            FROM customers c
        `;

        const params = [];

        // ----------------------------------------------------
        // OWNER CAN ONLY VIEW RELATED CUSTOMERS
        // ----------------------------------------------------
        if (role === "owner") {
            const ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            query += `
                LEFT JOIN reservations r
                    ON r.CustomerID = c.CustomerID

                LEFT JOIN sales s
                    ON s.CustomerID = c.CustomerID

                LEFT JOIN rental_agreements ra
                    ON ra.CustomerID = c.CustomerID

                LEFT JOIN properties p1
                    ON p1.PropertyID = r.PropertyID

                LEFT JOIN properties p2
                    ON p2.PropertyID = s.PropertyID

                LEFT JOIN properties p3
                    ON p3.PropertyID = ra.PropertyID

                WHERE c.CustomerID = ?
                  AND (
                        p1.OwnerID = ?
                        OR p2.OwnerID = ?
                        OR p3.OwnerID = ?
                  )
            `;

            params.push(id, ownerId, ownerId, ownerId);
        } else {
            query += `
                WHERE c.CustomerID = ?
            `;

            params.push(id);
        }

        const [customers] = await pool.query(query, params);

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found or you are not authorized to view this customer"
            });
        }

        return res.status(200).json({
            success: true,
            customer: customers[0]
        });

    } catch (error) {
        console.error("Get customer by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve customer",
            error: error.message
        });
    }
};

// ============================================================
// CREATE CUSTOMER
// Administrator / Owner / Sales Agent
// ============================================================
const createCustomer = async (req, res) => {
    try {
        const {
            userId,
            fullName,
            phoneNumber,
            email,
            address,
            idType,
            idNumber
        } = req.body || {};

        if (!fullName || !String(fullName).trim()) {
            return res.status(400).json({
                success: false,
                message: "Full name is required"
            });
        }

        // ----------------------------------------------------
        // IF USER ID IS PROVIDED, VERIFY IT EXISTS
        // ----------------------------------------------------
        if (userId) {
            const [users] = await pool.query(
                `
                SELECT UserID
                FROM users
                WHERE UserID = ?
                LIMIT 1
                `,
                [userId]
            );

            if (users.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "The specified user does not exist"
                });
            }
        }

        // ----------------------------------------------------
        // CHECK DUPLICATE EMAIL
        // ----------------------------------------------------
        if (email) {
            const [existingEmail] = await pool.query(
                `
                SELECT CustomerID
                FROM customers
                WHERE Email = ?
                LIMIT 1
                `,
                [email]
            );

            if (existingEmail.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "A customer with this email already exists"
                });
            }
        }

        // ----------------------------------------------------
        // CHECK DUPLICATE ID NUMBER
        // ----------------------------------------------------
        if (idNumber) {
            const [existingId] = await pool.query(
                `
                SELECT CustomerID
                FROM customers
                WHERE IDNumber = ?
                LIMIT 1
                `,
                [idNumber]
            );

            if (existingId.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "A customer with this ID number already exists"
                });
            }
        }

        const [result] = await pool.query(
            `
            INSERT INTO customers
            (
                UserID,
                FullName,
                PhoneNumber,
                Email,
                Address,
                IDType,
                IDNumber
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                userId || null,
                String(fullName).trim(),
                phoneNumber || null,
                email || null,
                address || null,
                idType || null,
                idNumber || null
            ]
        );

        const [customers] = await pool.query(
            `
            SELECT
                CustomerID,
                UserID,
                FullName,
                PhoneNumber,
                Email,
                Address,
                IDType,
                IDNumber,
                RegistrationDate,
                Status
            FROM customers
            WHERE CustomerID = ?
            `,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Customer created successfully",
            customer: customers[0]
        });

    } catch (error) {
        console.error("Create customer error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create customer",
            error: error.message
        });
    }
};

// ============================================================
// UPDATE CUSTOMER
// Administrator / Owner / Sales Agent
// ============================================================
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const role = getUserRole(req);

        const {
            fullName,
            email,
            phoneNumber,
            address,
            idType,
            idNumber
        } = req.body || {};

        if (!fullName || !String(fullName).trim()) {
            return res.status(400).json({
                success: false,
                message: "Full name is required"
            });
        }

        if (!email || !String(email).trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // ----------------------------------------------------
        // FIND CUSTOMER
        // ----------------------------------------------------
        let query = `
            SELECT DISTINCT
                c.CustomerID
            FROM customers c
        `;

        const params = [];

        // ----------------------------------------------------
        // OWNER AUTHORIZATION
        // ----------------------------------------------------
        if (role === "owner") {
            const ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            query += `
                LEFT JOIN reservations r
                    ON r.CustomerID = c.CustomerID

                LEFT JOIN sales s
                    ON s.CustomerID = c.CustomerID

                LEFT JOIN rental_agreements ra
                    ON ra.CustomerID = c.CustomerID

                LEFT JOIN properties p1
                    ON p1.PropertyID = r.PropertyID

                LEFT JOIN properties p2
                    ON p2.PropertyID = s.PropertyID

                LEFT JOIN properties p3
                    ON p3.PropertyID = ra.PropertyID

                WHERE c.CustomerID = ?
                  AND (
                        p1.OwnerID = ?
                        OR p2.OwnerID = ?
                        OR p3.OwnerID = ?
                  )
            `;

            params.push(id, ownerId, ownerId, ownerId);
        } else {
            query += `
                WHERE c.CustomerID = ?
            `;

            params.push(id);
        }

        const [existingCustomer] = await pool.query(query, params);

        if (existingCustomer.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found or you are not authorized to update this customer"
            });
        }

        // ----------------------------------------------------
        // CHECK DUPLICATE EMAIL
        // ----------------------------------------------------
        const [duplicateEmail] = await pool.query(
            `
            SELECT CustomerID
            FROM customers
            WHERE Email = ?
              AND CustomerID <> ?
            LIMIT 1
            `,
            [email, id]
        );

        if (duplicateEmail.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Another customer already uses this email"
            });
        }

        // ----------------------------------------------------
        // CHECK DUPLICATE ID NUMBER
        // ----------------------------------------------------
        if (idNumber) {
            const [duplicateId] = await pool.query(
                `
                SELECT CustomerID
                FROM customers
                WHERE IDNumber = ?
                  AND CustomerID <> ?
                LIMIT 1
                `,
                [idNumber, id]
            );

            if (duplicateId.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Another customer already uses this ID number"
                });
            }
        }

        // ----------------------------------------------------
        // UPDATE
        // ----------------------------------------------------
        await pool.query(
            `
            UPDATE customers
            SET
                FullName = ?,
                Email = ?,
                PhoneNumber = ?,
                Address = ?,
                IDType = ?,
                IDNumber = ?
            WHERE CustomerID = ?
            `,
            [
                String(fullName).trim(),
                String(email).trim(),
                phoneNumber || null,
                address || null,
                idType || null,
                idNumber || null,
                id
            ]
        );

        // ----------------------------------------------------
        // GET UPDATED CUSTOMER
        // ----------------------------------------------------
        const [updatedCustomers] = await pool.query(
            `
            SELECT
                CustomerID,
                UserID,
                FullName,
                PhoneNumber,
                Email,
                Address,
                IDType,
                IDNumber,
                RegistrationDate,
                Status
            FROM customers
            WHERE CustomerID = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            customer: updatedCustomers[0]
        });

    } catch (error) {
        console.error("Update customer error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update customer",
            error: error.message
        });
    }
};

// ============================================================
// SEARCH CUSTOMERS
// Administrator -> all
// Owner -> only related customers
// Sales Agent -> all
// ============================================================
const searchCustomers = async (req, res) => {
    try {
        const { q } = req.query;
        const role = getUserRole(req);

        if (!q || !String(q).trim()) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const searchTerm = `%${String(q).trim()}%`;

        let query = `
            SELECT DISTINCT
                c.CustomerID,
                c.UserID,
                c.FullName,
                c.PhoneNumber,
                c.Email,
                c.Address,
                c.IDType,
                c.IDNumber,
                c.RegistrationDate,
                c.Status
            FROM customers c
        `;

        const params = [
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm
        ];

        // ----------------------------------------------------
        // OWNER FILTER
        // ----------------------------------------------------
        if (role === "owner") {
            const ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            query += `
                LEFT JOIN reservations r
                    ON r.CustomerID = c.CustomerID

                LEFT JOIN sales s
                    ON s.CustomerID = c.CustomerID

                LEFT JOIN rental_agreements ra
                    ON ra.CustomerID = c.CustomerID

                LEFT JOIN properties p1
                    ON p1.PropertyID = r.PropertyID

                LEFT JOIN properties p2
                    ON p2.PropertyID = s.PropertyID

                LEFT JOIN properties p3
                    ON p3.PropertyID = ra.PropertyID

                WHERE
                    (
                        c.FullName LIKE ?
                        OR c.Email LIKE ?
                        OR c.PhoneNumber LIKE ?
                        OR c.IDNumber LIKE ?
                        OR c.Address LIKE ?
                    )
                    AND (
                        p1.OwnerID = ?
                        OR p2.OwnerID = ?
                        OR p3.OwnerID = ?
                    )
            `;

            params.push(ownerId, ownerId, ownerId);
        } else {
            query += `
                WHERE
                    c.FullName LIKE ?
                    OR c.Email LIKE ?
                    OR c.PhoneNumber LIKE ?
                    OR c.IDNumber LIKE ?
                    OR c.Address LIKE ?
            `;
        }

        query += `
            ORDER BY c.CustomerID ASC
        `;

        const [customers] = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            count: customers.length,
            customers
        });

    } catch (error) {
        console.error("Search customers error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to search customers",
            error: error.message
        });
    }
};

// ============================================================
// UPDATE CUSTOMER STATUS
// Administrator / Owner / Sales Agent
// ============================================================
const updateCustomerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};
        const role = getUserRole(req);

        const allowedStatuses = ["Active", "Inactive"];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Active or Inactive"
            });
        }

        // ----------------------------------------------------
        // CHECK CUSTOMER ACCESS
        // ----------------------------------------------------
        let query = `
            SELECT DISTINCT
                c.CustomerID
            FROM customers c
        `;

        const params = [];

        if (role === "owner") {
            const ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            query += `
                LEFT JOIN reservations r
                    ON r.CustomerID = c.CustomerID

                LEFT JOIN sales s
                    ON s.CustomerID = c.CustomerID

                LEFT JOIN rental_agreements ra
                    ON ra.CustomerID = c.CustomerID

                LEFT JOIN properties p1
                    ON p1.PropertyID = r.PropertyID

                LEFT JOIN properties p2
                    ON p2.PropertyID = s.PropertyID

                LEFT JOIN properties p3
                    ON p3.PropertyID = ra.PropertyID

                WHERE c.CustomerID = ?
                  AND (
                        p1.OwnerID = ?
                        OR p2.OwnerID = ?
                        OR p3.OwnerID = ?
                  )
            `;

            params.push(id, ownerId, ownerId, ownerId);
        } else {
            query += `
                WHERE c.CustomerID = ?
            `;

            params.push(id);
        }

        const [existingCustomer] = await pool.query(query, params);

        if (existingCustomer.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found or you are not authorized to update this customer"
            });
        }

        // ----------------------------------------------------
        // UPDATE STATUS
        // ----------------------------------------------------
        await pool.query(
            `
            UPDATE customers
            SET Status = ?
            WHERE CustomerID = ?
            `,
            [status, id]
        );

        // ----------------------------------------------------
        // GET UPDATED CUSTOMER
        // ----------------------------------------------------
        const [updatedCustomers] = await pool.query(
            `
            SELECT
                CustomerID,
                UserID,
                FullName,
                PhoneNumber,
                Email,
                Address,
                IDType,
                IDNumber,
                RegistrationDate,
                Status
            FROM customers
            WHERE CustomerID = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Customer status updated successfully",
            customer: updatedCustomers[0]
        });

    } catch (error) {
        console.error("Update customer status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update customer status",
            error: error.message
        });
    }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================
module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    searchCustomers,
    updateCustomerStatus
};
