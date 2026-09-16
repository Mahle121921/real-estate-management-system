const pool = require("../config/db");

// Get all owners
// Get all owners
const getOwners = async (req, res) => {
    try {
        const [owners] = await pool.query(`
            SELECT
                o.OwnerID,
                o.UserID,
                u.FullName,
                u.Email,
                u.PhoneNumber,
                u.Role,
                u.Status,
                o.Address,
                o.IDType,
                o.IDNumber
            FROM owners o
            INNER JOIN users u
                ON o.UserID = u.UserID
            ORDER BY o.OwnerID ASC
        `);

        res.status(200).json({
            success: true,
            count: owners.length,
            owners
        });

    } catch (error) {
        console.error("Get owners error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve owners"
        });
    }
};

// Get one owner by ID
const getOwnerById = async (req, res) => {
    try {
        const { id } = req.params;

        const [owners] = await pool.query(`
            SELECT
                o.OwnerID,
                o.UserID,
                u.FullName,
                u.Email,
                u.PhoneNumber,
                u.Role,
                u.Status,
                o.Address,
                o.IDType,
                o.IDNumber
            FROM owners o
            INNER JOIN users u ON o.UserID = u.UserID
            WHERE o.OwnerID = ?
        `, [id]);

        if (owners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        res.status(200).json({
            success: true,
            owner: owners[0]
        });

    } catch (error) {
        console.error("Get owner by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve owner"
        });
    }
};
const getMyOwnerProfile = async (req, res) => {
     try {
         // The JWT should contain the logged-in user's UserID 
         // 
         const userId = req.user.UserID || req.user.userId || req.user.id; 
         if (!userId) { 
            return res.status(401).json({ success: false, message: "User ID not found in token" }); } const [owners] = await pool.query( ` SELECT o.OwnerID, o.UserID, u.FullName, u.Email, u.PhoneNumber, u.Role, u.Status, o.Address, o.IDType, o.IDNumber FROM owners o INNER JOIN users u ON o.UserID = u.UserID WHERE o.UserID = ? LIMIT 1 `, [userId] ); if (owners.length === 0) { return res.status(404).json({ success: false, message: "Owner profile not found" }); } res.status(200).json({ success: true, owner: owners[0] }); } catch (error) { console.error("Get my owner profile error:", error); res.status(500).json({ success: false, message: "Failed to retrieve owner profile" }); } };

const getOwnerProperties = async (req, res) => {
    try {
        const { id } = req.params;

        // ==========================================
        // OWNER AUTHORIZATION
        // ==========================================
        if (req.user.role === "Owner") {
            const userId =
                req.user.UserID ||
                req.user.userId ||
                req.user.id;

            const [currentOwner] = await pool.query(
                `SELECT OwnerID
                 FROM owners
                 WHERE UserID = ?
                 LIMIT 1`,
                [userId]
            );

            if (currentOwner.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Owner profile not found"
                });
            }

            if (
                Number(currentOwner[0].OwnerID) !==
                Number(id)
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to view these properties"
                });
            }
        }

        // ==========================================
        // CHECK WHETHER OWNER EXISTS
        // ==========================================
        const [owners] = await pool.query(
            `SELECT OwnerID
             FROM owners
             WHERE OwnerID = ?
             LIMIT 1`,
            [id]
        );

        if (owners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        // ==========================================
        // GET OWNER PROPERTIES + FIRST IMAGE
        // ==========================================
        const [properties] = await pool.query(
            `
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
            WHERE p.OwnerID = ?
            ORDER BY p.PropertyID ASC
            `,
            [id]
        );

        // ==========================================
        // RESPONSE
        // ==========================================
        res.status(200).json({
            success: true,
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error(
            "Get owner properties error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to retrieve owner properties"
        });
    }
};

// Get revenue for an owner
const getOwnerRevenue = async (req, res) => {
    try {
        const { id } = req.params;

        // Check whether owner exists
        const [owners] = await pool.query(
            "SELECT OwnerID FROM owners WHERE OwnerID = ?",
            [id]
        );

        if (owners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        // Get revenue records
        const [revenue] = await pool.query(
            `SELECT
                r.RevenueID,
                r.OwnerID,
                r.PropertyID,
                p.PropertyName,
                r.Source,
                r.Amount,
                r.DateRecorded
             FROM revenue r
             INNER JOIN properties p
                 ON r.PropertyID = p.PropertyID
             WHERE r.OwnerID = ?
             ORDER BY r.DateRecorded DESC`,
            [id]
        );

        // Calculate total revenue
        const [totalResult] = await pool.query(
            `SELECT
                COALESCE(SUM(Amount), 0) AS TotalRevenue
             FROM revenue
             WHERE OwnerID = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            count: revenue.length,
            totalRevenue: totalResult[0].TotalRevenue,
            revenue: revenue
        });

    } catch (error) {
        console.error("Get owner revenue error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve owner revenue"
        });
    }
};
// Get expenses for an owner
const getOwnerExpenses = async (req, res) => {
    try {
        const { id } = req.params;

        // Check whether owner exists
        const [owners] = await pool.query(
            "SELECT OwnerID FROM owners WHERE OwnerID = ?",
            [id]
        );

        if (owners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        // Get expense records
        const [expenses] = await pool.query(
            `SELECT
                e.ExpenseID,
                e.OwnerID,
                e.PropertyID,
                p.PropertyName,
                e.ExpenseType,
                e.Amount,
                e.DateRecorded
             FROM expenses e
             INNER JOIN properties p
                 ON e.PropertyID = p.PropertyID
             WHERE e.OwnerID = ?
             ORDER BY e.DateRecorded DESC`,
            [id]
        );

        // Calculate total expenses
        const [totalResult] = await pool.query(
            `SELECT
                COALESCE(SUM(Amount), 0) AS TotalExpenses
             FROM expenses
             WHERE OwnerID = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            count: expenses.length,
            totalExpenses: totalResult[0].TotalExpenses,
            expenses: expenses
        });

    } catch (error) {
        console.error("Get owner expenses error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve owner expenses"
        });
    }
};
// Get owner financial summary
const getOwnerFinancialSummary = async (req, res) => {
    try {
        const { id } = req.params;

        // Check whether owner exists
        const [owners] = await pool.query(
            "SELECT OwnerID FROM owners WHERE OwnerID = ?",
            [id]
        );

        if (owners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        // Calculate total revenue
        const [revenueResult] = await pool.query(
            `SELECT COALESCE(SUM(Amount), 0) AS TotalRevenue
             FROM revenue
             WHERE OwnerID = ?`,
            [id]
        );

        // Calculate total expenses
        const [expenseResult] = await pool.query(
            `SELECT COALESCE(SUM(Amount), 0) AS TotalExpenses
             FROM expenses
             WHERE OwnerID = ?`,
            [id]
        );

        const totalRevenue = Number(revenueResult[0].TotalRevenue);
        const totalExpenses = Number(expenseResult[0].TotalExpenses);
        const netIncome = totalRevenue - totalExpenses;

        res.status(200).json({
            success: true,
            ownerId: Number(id),
            financialSummary: {
                totalRevenue: totalRevenue.toFixed(2),
                totalExpenses: totalExpenses.toFixed(2),
                netIncome: netIncome.toFixed(2)
            }
        });

    } catch (error) {
        console.error("Get owner financial summary error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve owner financial summary"
        });
    }
};
// Update owner profile
const updateOwner = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            fullName,
            email,
            phoneNumber,
            address,
            idType,
            idNumber
        } = req.body || {};

       // Validate required fields
if (!fullName || !email) {
    return res.status(400).json({
        success: false,
        message: "Full name and email are required"
    });
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
    return res.status(400).json({
        success: false,
        message: "Invalid email format"
    });
}
        // Check owner exists
        const [owners] = await pool.query(
            "SELECT OwnerID, UserID FROM owners WHERE OwnerID = ?",
            [id]
        );

        if (owners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        const userId = owners[0].UserID;

        // Check duplicate email
        const [emailUsers] = await pool.query(
            `SELECT UserID
             FROM users
             WHERE Email = ? AND UserID != ?`,
            [email, userId]
        );

        if (emailUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        // Update user information
        await pool.query(
            `UPDATE users
             SET FullName = ?,
                 Email = ?,
                 PhoneNumber = ?
             WHERE UserID = ?`,
            [
                fullName,
                email,
                phoneNumber || null,
                userId
            ]
        );

        // Update owner information
        await pool.query(
            `UPDATE owners
             SET Address = ?,
                 IDType = ?,
                 IDNumber = ?
             WHERE OwnerID = ?`,
            [
                address || null,
                idType || null,
                idNumber || null,
                id
            ]
        );

        // Return updated owner
        const [updatedOwners] = await pool.query(`
            SELECT
                o.OwnerID,
                o.UserID,
                u.FullName,
                u.Email,
                u.PhoneNumber,
                u.Role,
                u.Status,
                o.Address,
                o.IDType,
                o.IDNumber
            FROM owners o
            INNER JOIN users u ON o.UserID = u.UserID
            WHERE o.OwnerID = ?
        `, [id]);

        res.status(200).json({
            success: true,
            message: "Owner updated successfully",
            owner: updatedOwners[0]
        });

    } catch (error) {
        console.error("Update owner error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update owner"
        });
    }
};

// =====================================================
// GET MAINTENANCE REQUESTS FOR OWNER
// URL uses OwnerID
// Example: /api/owners/1/maintenance-requests
// =====================================================

const getOwnerMaintenanceRequests = async (req, res) => {
    try {
        const { id } = req.params;

        // The URL contains the OwnerID.
        // Example:
        // /api/owners/1/maintenance-requests
        // means OwnerID = 1

        const [owners] = await pool.query(
            `
            SELECT OwnerID
            FROM owners
            WHERE OwnerID = ?
            LIMIT 1
            `,
            [id]
        );

        if (owners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        const ownerId = owners[0].OwnerID;

        // Get maintenance requests for properties
        // belonging to this owner.
        const [requests] = await pool.query(
            `
            SELECT
                mr.MaintenanceRequestID,
                mr.PropertyID,
                p.PropertyName,
                p.Address,

                mr.ReportedBy,
                reporter.FullName AS ReportedByName,

                mr.AssignedStaffID,
                staff.FullName AS AssignedStaffName,

                mr.Category,
                mr.Description,
                mr.MaintenanceNotes,
                mr.CompletionDetails,

                mr.Priority,
                mr.EstimatedCost,
                mr.ActualCost,
                mr.CostApprovalStatus,
                mr.ResponsibleParty,
                mr.Status,

                mr.RequestDate,
                mr.CompletionDate

            FROM maintenance_requests mr

            INNER JOIN properties p
                ON mr.PropertyID = p.PropertyID

            LEFT JOIN users reporter
                ON mr.ReportedBy = reporter.UserID

            LEFT JOIN users staff
                ON mr.AssignedStaffID = staff.UserID

            WHERE p.OwnerID = ?

            ORDER BY mr.RequestDate DESC
            `,
            [ownerId]
        );

        res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {
        console.error(
            "Get owner maintenance requests error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to retrieve owner maintenance requests",
            error: error.message
        });
    }
};


// Get appointments for an owner
const getOwnerAppointments = async (req, res) => {
    try {
        const { id } = req.params;

        // Check owner exists
        const [owners] = await pool.query(
            "SELECT OwnerID FROM owners WHERE OwnerID = ?",
            [id]
        );

        if (owners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        // Get appointments belonging to owner's properties
        // NOTE:
        // AppointmentType and Notes are NOT included because
        // they do not exist in the appointments table.
        const [appointments] = await pool.query(
            `
            SELECT
                a.AppointmentID,
                a.CustomerID,
                c.FullName AS CustomerName,
                a.PropertyID,
                p.PropertyName,
                a.HandledBy,
                u.FullName AS HandledByName,
                a.AppointmentDate,
                a.AppointmentTime,
                a.Status
            FROM appointments a
            INNER JOIN properties p
                ON a.PropertyID = p.PropertyID
            INNER JOIN customers c
                ON a.CustomerID = c.CustomerID
            LEFT JOIN users u
                ON a.HandledBy = u.UserID
            WHERE p.OwnerID = ?
            ORDER BY a.AppointmentDate ASC, a.AppointmentTime ASC
            `,
            [id]
        );

        res.status(200).json({
            success: true,
            count: appointments.length,
            appointments
        });

    } catch (error) {
        console.error(
            "Get owner appointments error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to retrieve owner appointments"
        });
    }
};


// Get reservations for an owner
const getOwnerReservations = async (req, res) => {
    try {
        const { id } = req.params;

        const [owners] = await pool.query(
            "SELECT OwnerID FROM owners WHERE OwnerID = ?",
            [id]
        );

        if (owners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        const [reservations] = await pool.query(
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

            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID

            INNER JOIN customers c
                ON r.CustomerID = c.CustomerID

            LEFT JOIN users u
                ON r.HandledBy = u.UserID

            WHERE p.OwnerID = ?

            ORDER BY r.ReservationDate DESC
            `,
            [id]
        );

        res.status(200).json({
            success: true,
            count: reservations.length,
            reservations
        });

    } catch (error) {
        console.error(
            "Get owner reservations error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to retrieve owner reservations"
        });
    }
};

// =====================================================
// Get rental agreements for an owner
// URL: /api/owners/:id/rental-agreements
// =====================================================

const getOwnerRentals = async (req, res) => {
    try {
        const { id } = req.params;

        // Check whether owner exists
        const [owners] = await pool.query(
            "SELECT OwnerID FROM owners WHERE OwnerID = ?",
            [id]
        );

        if (owners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        // Get rental agreements belonging to owner's properties
        const [rentals] = await pool.query(
            `
            SELECT
                r.RentalID AS AgreementID,
                r.PropertyID,
                p.PropertyName,
                r.CustomerID,
                c.FullName AS TenantName,
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
            LEFT JOIN customers c
                ON r.CustomerID = c.CustomerID
            LEFT JOIN users u
                ON r.HandledBy = u.UserID
            WHERE p.OwnerID = ?
            ORDER BY r.StartDate DESC
            `,
            [id]
        );

        res.status(200).json({
            success: true,
            count: rentals.length,
            rentalAgreements: rentals
        });

    } catch (error) {
        console.error(
            "Get owner rental agreements error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to retrieve owner rental agreements",
            error: error.message
        });
    }
};
// =====================================================
// OWNER SALES
// =====================================================

// GET SALES FOR LOGGED-IN OWNER
const getOwnerSales = async (req, res) => {
    try {
        // ==========================================
        // GET LOGGED-IN USER ID FROM JWT
        // ==========================================
        console.log("==========================================");
        console.log("OWNER SALES REQUEST");
        console.log("JWT USER:", req.user);

        const userId =
            req.user?.UserID ||
            req.user?.userId ||
            req.user?.id;

        console.log("OWNER SALES - USER ID:", userId);

        // ==========================================
        // CHECK USER ID
        // ==========================================
        if (!userId) {
            console.error("OWNER SALES - USER ID NOT FOUND");

            return res.status(401).json({
                success: false,
                message: "User ID not found in token"
            });
        }

        // ==========================================
        // GET SALES BELONGING TO LOGGED-IN OWNER
        // ==========================================
        const [sales] = await pool.query(`
            SELECT
                s.SaleID,
                s.PropertyID,

                p.PropertyName,
                p.PropertyType,
                p.Address,

                s.CustomerID,
                c.FullName AS CustomerName,

                s.HandledBy,
                u.FullName AS HandledByName,

                s.SaleDate,
                s.SalePrice,
                s.PaymentStatus

            FROM sales s

            INNER JOIN properties p
                ON s.PropertyID = p.PropertyID

            INNER JOIN customers c
                ON s.CustomerID = c.CustomerID

            INNER JOIN users u
                ON s.HandledBy = u.UserID

            INNER JOIN owners o
                ON p.OwnerID = o.OwnerID

            WHERE o.UserID = ?

            ORDER BY s.SaleID DESC
        `, [userId]);

        // ==========================================
        // DEBUG RESULT
        // ==========================================
        console.log("OWNER SALES - SALES FOUND:", sales.length);
        console.log("OWNER SALES - DATA:", sales);
        console.log("==========================================");

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================
        return res.status(200).json({
            success: true,
            count: sales.length,
            sales
        });

    } catch (error) {

        // ==========================================
        // ERROR
        // ==========================================
        console.error("==========================================");
        console.error("GET OWNER SALES ERROR:", error);
        console.error("==========================================");

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve owner sales",
            error: error.message
        });
    }
};


// GET ONE SALE FOR LOGGED-IN OWNER
const getOwnerSaleById = async (req, res) => {
    try {
        const userId =
            req.user.UserID ||
            req.user.userId ||
            req.user.id;

        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID not found in token"
            });
        }

        const [sales] = await pool.query(`
            SELECT
                s.SaleID,
                s.PropertyID,
                p.PropertyName,
                p.PropertyType,
                p.Address,
                p.SalePrice AS PropertySalePrice,

                s.CustomerID,
                c.FullName AS CustomerName,

                s.HandledBy,
                u.FullName AS HandledByName,

                s.SaleDate,
                s.SalePrice,
                s.PaymentStatus

            FROM sales s

            INNER JOIN properties p
                ON s.PropertyID = p.PropertyID

            INNER JOIN customers c
                ON s.CustomerID = c.CustomerID

            INNER JOIN users u
                ON s.HandledBy = u.UserID

            INNER JOIN owners o
                ON p.OwnerID = o.OwnerID

            WHERE o.UserID = ?
              AND s.SaleID = ?

            LIMIT 1
        `, [userId, id]);

        if (sales.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Sale not found or access denied"
            });
        }

        return res.status(200).json({
            success: true,
            sale: sales[0]
        });

    } catch (error) {
        console.error("Get owner sale by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve owner sale",
            error: error.message
        });
    }
};
// =====================================================
// GET PAYMENTS FOR LOGGED-IN OWNER
// =====================================================

const getOwnerPayments = async (req, res) => {
    try {
        // ==========================================
        // GET LOGGED-IN USER ID FROM JWT
        // ==========================================
        const userId =
            req.user?.UserID ||
            req.user?.userId ||
            req.user?.id;

        console.log("==========================================");
        console.log("OWNER PAYMENTS REQUEST");
        console.log("JWT user:", req.user);
        console.log("Extracted UserID:", userId);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID not found in authentication token"
            });
        }

        // ==========================================
        // FIND OWNER USING USERID
        // FullName, Email and PhoneNumber are in USERS
        // ==========================================
        const [owners] = await pool.query(
            `
            SELECT
                o.OwnerID,
                o.UserID,
                u.FullName,
                u.Email,
                u.PhoneNumber
            FROM owners o
            INNER JOIN users u
                ON o.UserID = u.UserID
            WHERE o.UserID = ?
            LIMIT 1
            `,
            [userId]
        );

        console.log("Owner found:", owners);

        if (owners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner profile not found"
            });
        }

        const owner = owners[0];

        // ==========================================
        // GET PAYMENTS FOR OWNER'S PROPERTIES
        // ==========================================
        const [payments] = await pool.query(
            `
            SELECT
                pay.PaymentID,
                pay.CustomerID,
                c.FullName AS CustomerName,

                pay.HandledBy,
                u.FullName AS HandledByName,

                pay.SaleID,
                s.PropertyID AS SalePropertyID,
                sp.PropertyName AS SalePropertyName,

                pay.RentalAgreementID,
                ra.PropertyID AS RentalPropertyID,
                rp.PropertyName AS RentalPropertyName,

                pay.PaymentMethod,
                pay.Amount,
                pay.PaymentDate,
                pay.PaymentStatus

            FROM payments pay

            LEFT JOIN customers c
                ON pay.CustomerID = c.CustomerID

            LEFT JOIN users u
                ON pay.HandledBy = u.UserID

            LEFT JOIN sales s
                ON pay.SaleID = s.SaleID

            LEFT JOIN properties sp
                ON s.PropertyID = sp.PropertyID

            LEFT JOIN rental_agreements ra
                ON pay.RentalAgreementID = ra.RentalID

            LEFT JOIN properties rp
                ON ra.PropertyID = rp.PropertyID

            WHERE
                sp.OwnerID = ?
                OR rp.OwnerID = ?

            ORDER BY pay.PaymentDate DESC, pay.PaymentID DESC
            `,
            [owner.OwnerID, owner.OwnerID]
        );

        console.log("Owner ID:", owner.OwnerID);
        console.log("Payments found:", payments.length);
        console.log("Payments:", payments);
        console.log("==========================================");

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================
        return res.status(200).json({
            success: true,

            owner: {
                OwnerID: owner.OwnerID,
                UserID: owner.UserID,
                FullName: owner.FullName,
                Email: owner.Email,
                PhoneNumber: owner.PhoneNumber
            },

            count: payments.length,

            payments
        });

    } catch (error) {
        console.error("==========================================");
        console.error("GET OWNER PAYMENTS ERROR:", error);
        console.error("==========================================");

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve owner payments",
            error: error.message
        });
    }
};

// =====================================================
// GET OWNER PAYMENT BY ID
// =====================================================
const getOwnerPaymentById = async (req, res) => {
    try {
        const userId =
            req.user.UserID ||
            req.user.userId ||
            req.user.id;

        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID not found in token"
            });
        }

        const [payments] = await pool.query(`
            SELECT
                p.PaymentID,

                p.CustomerID,
                c.FullName AS CustomerName,

                p.HandledBy,
                u.FullName AS HandledByName,

                p.SaleID,
                s.PropertyID AS SalePropertyID,
                sp.PropertyName AS SalePropertyName,

                p.RentalAgreementID,
                ra.PropertyID AS RentalPropertyID,
                rp.PropertyName AS RentalPropertyName,

                p.PaymentMethod,
                p.Amount,
                p.PaymentDate,
                p.PaymentStatus

            FROM payments p

            INNER JOIN customers c
                ON p.CustomerID = c.CustomerID

            INNER JOIN users u
                ON p.HandledBy = u.UserID

            LEFT JOIN sales s
                ON p.SaleID = s.SaleID

            LEFT JOIN properties sp
                ON s.PropertyID = sp.PropertyID

            LEFT JOIN rental_agreements ra
                ON p.RentalAgreementID = ra.RentalID

            LEFT JOIN properties rp
                ON ra.PropertyID = rp.PropertyID

            INNER JOIN owners o
                ON o.UserID = ?

            WHERE
                p.PaymentID = ?
                AND (
                    sp.OwnerID = o.OwnerID
                    OR rp.OwnerID = o.OwnerID
                )

            LIMIT 1
        `, [userId, id]);

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Payment not found or access denied"
            });
        }

        res.status(200).json({
            success: true,
            payment: payments[0]
        });

    } catch (error) {
        console.error("Get owner payment by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve owner payment",
            error: error.message
        });
    }
};
// ======================================================
// OWNER REPORT
// GET /api/owners/owner/reports
// ======================================================

const getOwnerReport = async (req, res) => {
    try {
        console.log("==========================================");
        console.log("OWNER REPORT REQUEST");
        console.log("JWT USER:", req.user);

        const userId =
            req.user?.UserID ||
            req.user?.userId ||
            req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID not found in token"
            });
        }

        // ==================================================
        // 1. FIND LOGGED-IN OWNER
        // ==================================================

        const [ownerRows] = await pool.query(
            `
            SELECT
                o.OwnerID,
                o.UserID,
                u.FullName AS OwnerName,
                u.Email,
                u.PhoneNumber
            FROM owners o
            INNER JOIN users u
                ON o.UserID = u.UserID
            WHERE o.UserID = ?
            LIMIT 1
            `,
            [userId]
        );

        if (ownerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner profile not found"
            });
        }

        const owner = ownerRows[0];
        const ownerId = owner.OwnerID;

        // ==================================================
        // 2. PROPERTY REPORT
        // ==================================================

        const [properties] = await pool.query(
            `
            SELECT
                PropertyID,
                OwnerID,
                PropertyName,
                PropertyType,
                Address,
                SalePrice,
                MonthlyRent,
                Status,
                Description
            FROM properties
            WHERE OwnerID = ?
            ORDER BY PropertyID DESC
            `,
            [ownerId]
        );

        // ==================================================
        // 3. PROPERTY SUMMARY
        // ==================================================

        const propertySummary = {
            total: properties.length,
            available: 0,
            reserved: 0,
            rented: 0,
            sold: 0
        };

        properties.forEach((property) => {
            const status = String(property.Status || "")
                .trim()
                .toLowerCase();

            if (status === "available") {
                propertySummary.available++;
            } else if (status === "reserved") {
                propertySummary.reserved++;
            } else if (status === "rented") {
                propertySummary.rented++;
            } else if (status === "sold") {
                propertySummary.sold++;
            }
        });

        // ==================================================
        // 4. SALES REPORT
        // ==================================================

        const [sales] = await pool.query(
            `
            SELECT
                s.SaleID,
                s.PropertyID,
                p.PropertyName,
                p.PropertyType,
                c.FullName AS CustomerName,
                s.SalePrice,
                s.SaleDate,
                s.PaymentStatus
            FROM sales s
            INNER JOIN properties p
                ON s.PropertyID = p.PropertyID
            LEFT JOIN customers c
                ON s.CustomerID = c.CustomerID
            WHERE p.OwnerID = ?
            ORDER BY s.SaleDate DESC, s.SaleID DESC
            `,
            [ownerId]
        );

        const totalSalesAmount = sales.reduce(
            (sum, sale) => sum + Number(sale.SalePrice || 0),
            0
        );

        // ==================================================
        // 5. RENTAL REPORT
        // IMPORTANT:
        // Your rental table uses RentalID and MonthlyRent
        // ==================================================

        const [rentals] = await pool.query(
            `
            SELECT
                r.RentalID AS RentalAgreementID,
                r.PropertyID,
                p.PropertyName,
                p.PropertyType,
                c.FullName AS CustomerName,
                r.MonthlyRent,
                r.StartDate,
                r.EndDate,
                r.DueDate,
                r.Status
            FROM rental_agreements r
            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID
            LEFT JOIN customers c
                ON r.CustomerID = c.CustomerID
            WHERE p.OwnerID = ?
            ORDER BY r.StartDate DESC, r.RentalID DESC
            `,
            [ownerId]
        );

        const totalRentalAmount = rentals.reduce(
            (sum, rental) => sum + Number(rental.MonthlyRent || 0),
            0
        );

        // ==================================================
        // 6. REVENUE REPORT
        // ==================================================

        const [revenues] = await pool.query(
            `
            SELECT
                r.RevenueID,
                r.OwnerID,
                r.PropertyID,
                p.PropertyName,
                r.Source,
                r.Amount,
                r.DateRecorded
            FROM revenue r
            LEFT JOIN properties p
                ON r.PropertyID = p.PropertyID
            WHERE r.OwnerID = ?
            ORDER BY r.DateRecorded DESC, r.RevenueID DESC
            `,
            [ownerId]
        );

        const totalRevenue = revenues.reduce(
            (sum, revenue) => sum + Number(revenue.Amount || 0),
            0
        );

        // ==================================================
        // 7. EXPENSE REPORT
        // ==================================================

        const [expenses] = await pool.query(
            `
            SELECT
                e.ExpenseID,
                e.OwnerID,
                e.PropertyID,
                p.PropertyName,
                e.ExpenseType,
                e.Amount,
                e.DateRecorded
            FROM expenses e
            LEFT JOIN properties p
                ON e.PropertyID = p.PropertyID
            WHERE e.OwnerID = ?
            ORDER BY e.DateRecorded DESC, e.ExpenseID DESC
            `,
            [ownerId]
        );

        const totalExpenses = expenses.reduce(
            (sum, expense) => sum + Number(expense.Amount || 0),
            0
        );

        // ==================================================
        // 8. NET PROFIT
        // ==================================================

        const netProfit = totalRevenue - totalExpenses;

        // ==================================================
        // 9. MAINTENANCE REPORT
        // Use fields that exist in your maintenance table
        // ==================================================

        const [maintenance] = await pool.query(
            `
            SELECT
                m.MaintenanceRequestID,
                m.PropertyID,
                p.PropertyName,
                m.Category,
                m.Description,
                m.Priority,
                m.EstimatedCost,
                m.ActualCost,
                m.CostApprovalStatus,
                m.ResponsibleParty,
                m.Status,
                m.RequestDate,
                m.CompletionDate
            FROM maintenance_requests m
            INNER JOIN properties p
                ON m.PropertyID = p.PropertyID
            WHERE p.OwnerID = ?
            ORDER BY m.RequestDate DESC
            `,
            [ownerId]
        );

        // ==================================================
        // 10. APPOINTMENT REPORT
        // ==================================================

        const [appointments] = await pool.query(
            `
            SELECT
                a.AppointmentID,
                a.CustomerID,
                c.FullName AS CustomerName,
                a.PropertyID,
                p.PropertyName,
                a.AppointmentDate,
                a.AppointmentTime,
                a.Status
            FROM appointments a
            INNER JOIN properties p
                ON a.PropertyID = p.PropertyID
            LEFT JOIN customers c
                ON a.CustomerID = c.CustomerID
            WHERE p.OwnerID = ?
            ORDER BY a.AppointmentDate DESC, a.AppointmentTime DESC
            `,
            [ownerId]
        );

        // ==================================================
        // 11. RESPONSE
        // ==================================================

        console.log("OWNER REPORT SUCCESS");
        console.log("Owner ID:", ownerId);
        console.log("Properties:", properties.length);
        console.log("Sales:", sales.length);
        console.log("Rentals:", rentals.length);
        console.log("Revenue:", revenues.length);
        console.log("Expenses:", expenses.length);
        console.log("Maintenance:", maintenance.length);
        console.log("Appointments:", appointments.length);
        console.log("==========================================");

        return res.status(200).json({
            success: true,

            owner,

            summary: {
                properties: propertySummary,

                sales: {
                    count: sales.length,
                    amount: totalSalesAmount
                },

                rentals: {
                    count: rentals.length,
                    amount: totalRentalAmount
                },

                revenue: {
                    count: revenues.length,
                    amount: totalRevenue
                },

                expenses: {
                    count: expenses.length,
                    amount: totalExpenses
                },

                netProfit
            },

            reports: {
                properties,
                sales,
                rentals,
                revenues,
                expenses,
                maintenance,
                appointments
            }
        });

    } catch (error) {
        console.error("==========================================");
        console.error("OWNER REPORT ERROR:", error);
        console.error("==========================================");

        return res.status(500).json({
            success: false,
            message: "Failed to generate owner report",
            error: error.message
        });
    }
};

module.exports = {
    getOwners,
    getOwnerById,
    getMyOwnerProfile,
    updateOwner,

    getOwnerProperties,
    getOwnerRevenue,
    getOwnerExpenses,
    getOwnerFinancialSummary,

    getOwnerMaintenanceRequests,
    getOwnerAppointments,
    getOwnerReservations,

    getOwnerRentals,

    // Sales
    getOwnerSales,
    getOwnerSaleById,

    // Payments
    getOwnerPayments,
    getOwnerPaymentById,

    // Reports
    getOwnerReport
};