const db = require("../config/db");

// =====================================================
// CONSTANTS
// =====================================================

const VALID_PAYMENT_METHODS = [
    "Cash",
    "Bank Transfer",
    "Online Payment"
];

const VALID_PAYMENT_STATUSES = [
    "Pending",
    "Paid",
    "Failed",
    "Cancelled"
];


// =====================================================
// HELPER: GET OWNER ID FROM USER ID
// =====================================================

const getOwnerId = async (userId, connection = db) => {
    const [owners] = await connection.query(
        `
        SELECT OwnerID
        FROM owners
        WHERE UserID = ?
        LIMIT 1
        `,
        [userId]
    );

    return owners.length ? owners[0].OwnerID : null;
};


// =====================================================
// HELPER: CHECK PAYMENT ACCESS
//
// Administrator:
//     Can access every payment.
//
// Sales Agent:
//     Can access every payment.
//
// Owner:
//     Can access payments related to properties they own.
// =====================================================

const canAccessPayment = async (req, payment, connection = db) => {
    const role = req.user.role;

    // Administrator and Sales Agent have full access
    if (role === "Administrator" || role === "Sales Agent") {
        return true;
    }

    // Owner can access only their own properties
    if (role === "Owner") {
        const ownerId = await getOwnerId(req.user.userId, connection);

        if (!ownerId) {
            return false;
        }

        const propertyId =
            payment.SalePropertyID ||
            payment.RentalPropertyID ||
            payment.PropertyID;

        if (!propertyId) {
            return false;
        }

        const [properties] = await connection.query(
            `
            SELECT PropertyID
            FROM properties
            WHERE PropertyID = ?
              AND OwnerID = ?
            LIMIT 1
            `,
            [propertyId, ownerId]
        );

        return properties.length > 0;
    }

    return false;
};


// =====================================================
// HELPER: ACTIVITY LOG
// =====================================================

const logActivity = async (
    connection,
    userId,
    activity,
    ipAddress
) => {
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
            userId,
            activity,
            "Payments",
            ipAddress || null
        ]
    );
};


// =====================================================
// 1. GET ALL PAYMENTS
// =====================================================

exports.getAllPayments = async (req, res) => {
    try {
        let query = `
            SELECT
                p.PaymentID,

                p.CustomerID,
                c.FullName AS CustomerName,
                c.PhoneNumber AS CustomerPhone,
                c.Email AS CustomerEmail,

                p.HandledBy,
                u.FullName AS HandledByName,

                p.SaleID,
                s.PropertyID AS SalePropertyID,
                sp.PropertyName AS SalePropertyName,

                p.RentalAgreementID,
                ra.RentalID,
                ra.PropertyID AS RentalPropertyID,
                rp.PropertyName AS RentalPropertyName,

                p.PaymentMethod,
                p.Amount,
                p.PaymentDate,
                p.PaymentStatus

            FROM payments p

            LEFT JOIN customers c
                ON p.CustomerID = c.CustomerID

            LEFT JOIN users u
                ON p.HandledBy = u.UserID

            LEFT JOIN sales s
                ON p.SaleID = s.SaleID

            LEFT JOIN properties sp
                ON s.PropertyID = sp.PropertyID

            LEFT JOIN rental_agreements ra
                ON p.RentalAgreementID = ra.RentalID

            LEFT JOIN properties rp
                ON ra.PropertyID = rp.PropertyID
        `;

        const params = [];

        // -------------------------------------------------
        // OWNER FILTER
        // -------------------------------------------------

        if (req.user.role === "Owner") {
            const ownerId = await getOwnerId(req.user.userId);

            if (!ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "Owner record not found"
                });
            }

            query += `
                WHERE
                    sp.OwnerID = ?
                    OR rp.OwnerID = ?
            `;

            params.push(ownerId, ownerId);
        }

        query += `
            ORDER BY p.PaymentID DESC
        `;

        const [payments] = await db.query(query, params);

        res.status(200).json({
            success: true,
            count: payments.length,
            payments
        });

    } catch (error) {
        console.error("Get all payments error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve payments",
            error: error.message
        });
    }
};


// =====================================================
// 2. GET PAYMENT BY ID
// =====================================================

exports.getPaymentById = async (req, res) => {
    const { id } = req.params;

    try {
        const [payments] = await db.query(
            `
            SELECT
                p.PaymentID,

                p.CustomerID,
                c.FullName AS CustomerName,
                c.PhoneNumber AS CustomerPhone,
                c.Email AS CustomerEmail,

                p.HandledBy,
                u.FullName AS HandledByName,

                p.SaleID,
                s.PropertyID AS SalePropertyID,
                sp.PropertyName AS SalePropertyName,

                p.RentalAgreementID,
                ra.RentalID,
                ra.PropertyID AS RentalPropertyID,
                rp.PropertyName AS RentalPropertyName,

                p.PaymentMethod,
                p.Amount,
                p.PaymentDate,
                p.PaymentStatus

            FROM payments p

            LEFT JOIN customers c
                ON p.CustomerID = c.CustomerID

            LEFT JOIN users u
                ON p.HandledBy = u.UserID

            LEFT JOIN sales s
                ON p.SaleID = s.SaleID

            LEFT JOIN properties sp
                ON s.PropertyID = sp.PropertyID

            LEFT JOIN rental_agreements ra
                ON p.RentalAgreementID = ra.RentalID

            LEFT JOIN properties rp
                ON ra.PropertyID = rp.PropertyID

            WHERE p.PaymentID = ?
            `,
            [id]
        );

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const payment = payments[0];

        // -------------------------------------------------
        // AUTHORIZATION
        // -------------------------------------------------

        const allowed = await canAccessPayment(req, payment);

        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this payment"
            });
        }

        res.status(200).json({
            success: true,
            payment
        });

    } catch (error) {
        console.error("Get payment by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve payment",
            error: error.message
        });
    }
};


// =====================================================
// 3. CREATE PAYMENT
// =====================================================

exports.createPayment = async (req, res) => {
    const {
        CustomerID,
        SaleID,
        RentalAgreementID,
        PaymentMethod,
        Amount,
        PaymentDate,
        PaymentStatus
    } = req.body;

    const HandledBy = req.user.userId;

    // -------------------------------------------------
    // REQUIRED FIELDS
    // -------------------------------------------------

    if (!CustomerID || !PaymentMethod || Amount === undefined) {
        return res.status(400).json({
            success: false,
            message: "CustomerID, PaymentMethod and Amount are required"
        });
    }

    // -------------------------------------------------
    // VALIDATE AMOUNT
    // -------------------------------------------------

    const numericAmount = Number(Amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Amount must be greater than zero"
        });
    }

    // -------------------------------------------------
    // VALIDATE PAYMENT METHOD
    // -------------------------------------------------

    if (!VALID_PAYMENT_METHODS.includes(PaymentMethod)) {
        return res.status(400).json({
            success: false,
            message: `Invalid payment method. Allowed methods: ${VALID_PAYMENT_METHODS.join(", ")}`
        });
    }

    // -------------------------------------------------
    // VALIDATE STATUS
    // -------------------------------------------------

    const status = PaymentStatus || "Pending";

    if (!VALID_PAYMENT_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Invalid payment status. Allowed statuses: ${VALID_PAYMENT_STATUSES.join(", ")}`
        });
    }

    // -------------------------------------------------
    // SALE OR RENTAL, NOT BOTH
    // -------------------------------------------------

    if (!SaleID && !RentalAgreementID) {
        return res.status(400).json({
            success: false,
            message: "Either SaleID or RentalAgreementID is required"
        });
    }

    if (SaleID && RentalAgreementID) {
        return res.status(400).json({
            success: false,
            message: "Payment cannot belong to both a Sale and Rental Agreement"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // =================================================
        // CHECK CUSTOMER
        // =================================================

        const [customers] = await connection.query(
            `
            SELECT
                CustomerID,
                FullName
            FROM customers
            WHERE CustomerID = ?
            LIMIT 1
            `,
            [CustomerID]
        );

        if (customers.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        let propertyId = null;
        let relatedSale = null;
        let relatedRental = null;

        // =================================================
        // CHECK SALE
        // =================================================

        if (SaleID) {
            const [sales] = await connection.query(
                `
                SELECT
                    s.SaleID,
                    s.CustomerID,
                    s.PropertyID,
                    s.SalePrice,
                    s.PaymentStatus,
                    p.OwnerID,
                    p.Status AS PropertyStatus
                FROM sales s
                JOIN properties p
                    ON s.PropertyID = p.PropertyID
                WHERE s.SaleID = ?
                FOR UPDATE
                `,
                [SaleID]
            );

            if (sales.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message: "Sale not found"
                });
            }

            relatedSale = sales[0];
            propertyId = relatedSale.PropertyID;

            if (
                Number(relatedSale.CustomerID) !==
                Number(CustomerID)
            ) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Customer does not match the selected sale"
                });
            }
        }

        // =================================================
        // CHECK RENTAL AGREEMENT
        // =================================================

        if (RentalAgreementID) {
            const [rentals] = await connection.query(
                `
                SELECT
                    ra.RentalID,
                    ra.CustomerID,
                    ra.PropertyID,
                    ra.MonthlyRent,
                    ra.Status,
                    p.OwnerID,
                    p.Status AS PropertyStatus
                FROM rental_agreements ra
                JOIN properties p
                    ON ra.PropertyID = p.PropertyID
                WHERE ra.RentalID = ?
                FOR UPDATE
                `,
                [RentalAgreementID]
            );

            if (rentals.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message: "Rental agreement not found"
                });
            }

            relatedRental = rentals[0];
            propertyId = relatedRental.PropertyID;

            if (
                Number(relatedRental.CustomerID) !==
                Number(CustomerID)
            ) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Customer does not match the rental agreement"
                });
            }
        }

        // =================================================
        // OWNER AUTHORIZATION
        // =================================================

        if (req.user.role === "Owner") {
            const ownerId = await getOwnerId(
                req.user.userId,
                connection
            );

            if (!ownerId) {
                await connection.rollback();

                return res.status(403).json({
                    success: false,
                    message: "Owner record not found"
                });
            }

            const relatedOwnerId =
                relatedSale?.OwnerID ||
                relatedRental?.OwnerID;

            if (
                Number(relatedOwnerId) !==
                Number(ownerId)
            ) {
                await connection.rollback();

                return res.status(403).json({
                    success: false,
                    message: "You can only record payments for your own properties"
                });
            }
        }

        // =================================================
        // INSERT PAYMENT
        // =================================================

        const [result] = await connection.query(
            `
            INSERT INTO payments
            (
                CustomerID,
                HandledBy,
                SaleID,
                RentalAgreementID,
                PaymentMethod,
                Amount,
                PaymentDate,
                PaymentStatus
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                CustomerID,
                HandledBy,
                SaleID || null,
                RentalAgreementID || null,
                PaymentMethod,
                numericAmount,
                PaymentDate || new Date(),
                status
            ]
        );

        // =================================================
        // UPDATE SALE
        //
        // Current MVP rule:
        // Paid sale payment => sale Paid + property Sold
        // =================================================

        if (SaleID && status === "Paid") {
            await connection.query(
                `
                UPDATE sales
                SET PaymentStatus = 'Paid'
                WHERE SaleID = ?
                `,
                [SaleID]
            );

            await connection.query(
                `
                UPDATE properties
                SET Status = 'Sold'
                WHERE PropertyID = ?
                `,
                [propertyId]
            );
        }

        // =================================================
        // UPDATE RENTAL PROPERTY
        // =================================================

        if (
            RentalAgreementID &&
            status === "Paid"
        ) {
            await connection.query(
                `
                UPDATE properties
                SET Status = 'Rented'
                WHERE PropertyID = ?
                `,
                [propertyId]
            );
        }

        // =================================================
        // ACTIVITY LOG
        // =================================================

        await logActivity(
            connection,
            HandledBy,
            `Payment #${result.insertId} recorded`,
            req.ip
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Payment recorded successfully",
            paymentId: result.insertId,
            paymentStatus: status,
            paymentMethod: PaymentMethod,
            amount: numericAmount
        });

    } catch (error) {
        await connection.rollback();

        console.error("Create payment error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to record payment",
            error: error.message
        });

    } finally {
        connection.release();
    }
};


// =====================================================
// 4. UPDATE / VERIFY PAYMENT
// =====================================================

exports.updatePayment = async (req, res) => {
    const { id } = req.params;

    const {
        PaymentMethod,
        Amount,
        PaymentStatus
    } = req.body;

    const HandledBy = req.user.userId;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // -------------------------------------------------
        // GET PAYMENT
        // -------------------------------------------------

        const [payments] = await connection.query(
            `
            SELECT
                p.*,
                s.PropertyID AS SalePropertyID,
                sp.OwnerID AS SaleOwnerID,
                ra.PropertyID AS RentalPropertyID,
                rp.OwnerID AS RentalOwnerID
            FROM payments p

            LEFT JOIN sales s
                ON p.SaleID = s.SaleID

            LEFT JOIN properties sp
                ON s.PropertyID = sp.PropertyID

            LEFT JOIN rental_agreements ra
                ON p.RentalAgreementID = ra.RentalID

            LEFT JOIN properties rp
                ON ra.PropertyID = rp.PropertyID

            WHERE p.PaymentID = ?
            FOR UPDATE
            `,
            [id]
        );

        if (payments.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const payment = payments[0];

        // -------------------------------------------------
        // OWNER AUTHORIZATION
        // -------------------------------------------------

        if (req.user.role === "Owner") {
            const ownerId = await getOwnerId(
                req.user.userId,
                connection
            );

            const paymentOwnerId =
                payment.SaleOwnerID ||
                payment.RentalOwnerID;

            if (
                !ownerId ||
                Number(paymentOwnerId) !== Number(ownerId)
            ) {
                await connection.rollback();

                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to update this payment"
                });
            }
        }

        // -------------------------------------------------
        // VALIDATE INPUTS
        // -------------------------------------------------

        const newMethod =
            PaymentMethod || payment.PaymentMethod;

        const newAmount =
            Amount !== undefined
                ? Number(Amount)
                : Number(payment.Amount);

        const newStatus =
            PaymentStatus || payment.PaymentStatus;

        if (!VALID_PAYMENT_METHODS.includes(newMethod)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        if (!Number.isFinite(newAmount) || newAmount <= 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Amount must be greater than zero"
            });
        }

        if (!VALID_PAYMENT_STATUSES.includes(newStatus)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Invalid payment status"
            });
        }

        // -------------------------------------------------
        // UPDATE PAYMENT
        // -------------------------------------------------

        await connection.query(
            `
            UPDATE payments
            SET
                PaymentMethod = ?,
                Amount = ?,
                PaymentStatus = ?,
                HandledBy = ?
            WHERE PaymentID = ?
            `,
            [
                newMethod,
                newAmount,
                newStatus,
                HandledBy,
                id
            ]
        );

        // -------------------------------------------------
        // RELATED SALE
        // -------------------------------------------------

        if (payment.SaleID) {
            if (newStatus === "Paid") {
                await connection.query(
                    `
                    UPDATE sales
                    SET PaymentStatus = 'Paid'
                    WHERE SaleID = ?
                    `,
                    [payment.SaleID]
                );

                await connection.query(
                    `
                    UPDATE properties
                    SET Status = 'Sold'
                    WHERE PropertyID = ?
                    `,
                    [payment.SalePropertyID]
                );
            }

            if (newStatus === "Cancelled") {
                await connection.query(
                    `
                    UPDATE sales
                    SET PaymentStatus = 'Cancelled'
                    WHERE SaleID = ?
                    `,
                    [payment.SaleID]
                );

                await connection.query(
                    `
                    UPDATE properties
                    SET Status = 'Available'
                    WHERE PropertyID = ?
                    `,
                    [payment.SalePropertyID]
                );
            }
        }

        // -------------------------------------------------
        // RELATED RENTAL
        // -------------------------------------------------

        if (
            payment.RentalAgreementID &&
            newStatus === "Paid"
        ) {
            await connection.query(
                `
                UPDATE properties
                SET Status = 'Rented'
                WHERE PropertyID = ?
                `,
                [payment.RentalPropertyID]
            );
        }

        await logActivity(
            connection,
            HandledBy,
            `Payment #${id} updated`,
            req.ip
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            message: "Payment updated successfully",
            paymentId: id,
            paymentStatus: newStatus
        });

    } catch (error) {
        await connection.rollback();

        console.error("Update payment error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update payment",
            error: error.message
        });

    } finally {
        connection.release();
    }
};


// =====================================================
// 5. CANCEL PAYMENT
// =====================================================

exports.cancelPayment = async (req, res) => {
    const { id } = req.params;

    const HandledBy = req.user.userId;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [payments] = await connection.query(
            `
            SELECT
                p.PaymentID,
                p.PaymentStatus,
                p.SaleID,
                p.RentalAgreementID,

                s.PropertyID AS SalePropertyID,
                sp.OwnerID AS SaleOwnerID,

                ra.PropertyID AS RentalPropertyID,
                rp.OwnerID AS RentalOwnerID

            FROM payments p

            LEFT JOIN sales s
                ON p.SaleID = s.SaleID

            LEFT JOIN properties sp
                ON s.PropertyID = sp.PropertyID

            LEFT JOIN rental_agreements ra
                ON p.RentalAgreementID = ra.RentalID

            LEFT JOIN properties rp
                ON ra.PropertyID = rp.PropertyID

            WHERE p.PaymentID = ?
            FOR UPDATE
            `,
            [id]
        );

        if (payments.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const payment = payments[0];

        if (payment.PaymentStatus === "Cancelled") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Payment is already cancelled"
            });
        }

        // -------------------------------------------------
        // OWNER AUTHORIZATION
        // -------------------------------------------------

        if (req.user.role === "Owner") {
            const ownerId = await getOwnerId(
                req.user.userId,
                connection
            );

            const paymentOwnerId =
                payment.SaleOwnerID ||
                payment.RentalOwnerID;

            if (
                !ownerId ||
                Number(paymentOwnerId) !== Number(ownerId)
            ) {
                await connection.rollback();

                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to cancel this payment"
                });
            }
        }

        // -------------------------------------------------
        // CANCEL PAYMENT
        // -------------------------------------------------

        await connection.query(
            `
            UPDATE payments
            SET
                PaymentStatus = 'Cancelled',
                HandledBy = ?
            WHERE PaymentID = ?
            `,
            [
                HandledBy,
                id
            ]
        );

        // -------------------------------------------------
        // SALE
        // -------------------------------------------------

        if (payment.SaleID) {
            await connection.query(
                `
                UPDATE sales
                SET PaymentStatus = 'Cancelled'
                WHERE SaleID = ?
                `,
                [payment.SaleID]
            );

            await connection.query(
                `
                UPDATE properties
                SET Status = 'Available'
                WHERE PropertyID = ?
                `,
                [payment.SalePropertyID]
            );
        }

        // -------------------------------------------------
        // RENTAL
        // -------------------------------------------------

        if (payment.RentalAgreementID) {
            // Do not terminate the rental agreement here.
            // Only return the property to Rented if the
            // agreement itself is still active and business
            // rules require it.
        }

        // -------------------------------------------------
        // ACTIVITY LOG
        // -------------------------------------------------

        await logActivity(
            connection,
            HandledBy,
            `Payment #${id} cancelled`,
            req.ip
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            message: "Payment cancelled successfully",
            paymentId: id,
            paymentStatus: "Cancelled"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Cancel payment error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to cancel payment",
            error: error.message
        });

    } finally {
        connection.release();
    }
};

// =====================================================
// 6. GET PAYMENT RECEIPT
// =====================================================

exports.getPaymentReceipt = async (req, res) => {
    const { id } = req.params;

    try {
        const [payments] = await db.query(
            `
            SELECT
                p.PaymentID,

                p.CustomerID,
                c.FullName AS CustomerName,
                c.PhoneNumber,
                c.Email,

                p.HandledBy,
                u.FullName AS HandledByName,

                p.SaleID,
                s.PropertyID AS SalePropertyID,
                sp.PropertyName AS SalePropertyName,

                p.RentalAgreementID,
                ra.RentalID,
                ra.PropertyID AS RentalPropertyID,
                rp.PropertyName AS RentalPropertyName,

                p.PaymentMethod,
                p.Amount,
                p.PaymentDate,
                p.PaymentStatus

            FROM payments p

            LEFT JOIN customers c
                ON p.CustomerID = c.CustomerID

            LEFT JOIN users u
                ON p.HandledBy = u.UserID

            LEFT JOIN sales s
                ON p.SaleID = s.SaleID

            LEFT JOIN properties sp
                ON s.PropertyID = sp.PropertyID

            LEFT JOIN rental_agreements ra
                ON p.RentalAgreementID = ra.RentalID

            LEFT JOIN properties rp
                ON ra.PropertyID = rp.PropertyID

            WHERE p.PaymentID = ?
            `,
            [id]
        );

        // -------------------------------------------------
        // PAYMENT NOT FOUND
        // -------------------------------------------------

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const payment = payments[0];

        // -------------------------------------------------
        // CUSTOMER AUTHORIZATION
        // -------------------------------------------------
        // A Customer can only view their own payment receipt.

        if (req.user.role === "Customer") {

            const [customers] = await db.query(
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
                    message: "Customer record not found"
                });
            }

            const customerId = customers[0].CustomerID;

            if (Number(payment.CustomerID) !== Number(customerId)) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to access this receipt"
                });
            }

            // Customer is authorized.
            return res.status(200).json({
                success: true,
                message: "Receipt data retrieved successfully",
                receipt: payment
            });
        }

        // -------------------------------------------------
        // ADMIN / OWNER / SALES AGENT AUTHORIZATION
        // -------------------------------------------------

        const allowed = await canAccessPayment(
            req,
            payment
        );

        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this receipt"
            });
        }

        // -------------------------------------------------
        // RETURN RECEIPT
        // -------------------------------------------------

        res.status(200).json({
            success: true,
            message: "Receipt data retrieved successfully",
            receipt: payment
        });

    } catch (error) {
        console.error("Generate receipt error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate receipt",
            error: error.message
        });
    }
};

// =====================================================
// 7. GET MY PAYMENTS - CUSTOMER
// =====================================================
// Customer can see only their own payment history.
// =====================================================

exports.getMyPayments = async (req, res) => {
    console.log(">>> getMyPayments CONTROLLER REACHED");
    
    try {
        // Find the CustomerID linked to the logged-in user
        const [customers] = await db.query(
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
                message: "Customer record not found"
            });
        }

        const customerId = customers[0].CustomerID;

        const [payments] = await db.query(
            `
            SELECT
                p.PaymentID,

                p.CustomerID,

                p.SaleID,
                s.PropertyID AS SalePropertyID,
                sp.PropertyName AS SalePropertyName,

                p.RentalAgreementID,
                ra.RentalID,
                ra.PropertyID AS RentalPropertyID,
                rp.PropertyName AS RentalPropertyName,

                p.PaymentMethod,
                p.Amount,
                p.PaymentDate,
                p.PaymentStatus

            FROM payments p

            LEFT JOIN sales s
                ON p.SaleID = s.SaleID

            LEFT JOIN properties sp
                ON s.PropertyID = sp.PropertyID

            LEFT JOIN rental_agreements ra
                ON p.RentalAgreementID = ra.RentalID

            LEFT JOIN properties rp
                ON ra.PropertyID = rp.PropertyID

            WHERE p.CustomerID = ?

            ORDER BY p.PaymentID DESC
            `,
            [customerId]
        );

        res.status(200).json({
            success: true,
            count: payments.length,
            payments
        });

    } catch (error) {
        console.error("Get my payments error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve your payment history",
            error: error.message
        });
    }
};

// ============================================================
// CUSTOMER: GET SALES AND RENTALS
// ============================================================

exports.getMyTransactions = async (req, res) => {
    try {
        const userId = req.user.userId;

        // -------------------------------------------------
        // FIND CUSTOMER
        // -------------------------------------------------

        const [customers] = await db.query(
            `
            SELECT CustomerID
            FROM customers
            WHERE UserID = ?
            LIMIT 1
            `,
            [userId]
        );

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found."
            });
        }

        const customerId = customers[0].CustomerID;

        // -------------------------------------------------
        // CUSTOMER SALES
        // -------------------------------------------------

        const [sales] = await db.query(
            `
            SELECT
                s.SaleID,
                s.PropertyID,
                p.PropertyName,
                s.SalePrice,
                s.PaymentStatus
            FROM sales s

            INNER JOIN properties p
                ON s.PropertyID = p.PropertyID

            WHERE s.CustomerID = ?

            ORDER BY s.SaleID DESC
            `,
            [customerId]
        );

        // -------------------------------------------------
        // CUSTOMER RENTAL AGREEMENTS
        //
        // IMPORTANT:
        // rental_agreements uses RentalID
        // -------------------------------------------------

        const [rentals] = await db.query(
            `
            SELECT
                r.RentalID,
                r.PropertyID,
                p.PropertyName,
                r.MonthlyRent,
                r.StartDate,
                r.EndDate,
                r.DueDate,
                r.Status

            FROM rental_agreements r

            INNER JOIN properties p
                ON r.PropertyID = p.PropertyID

            WHERE r.CustomerID = ?

            ORDER BY r.RentalID DESC
            `,
            [customerId]
        );

        return res.status(200).json({
            success: true,
            sales,
            rentals
        });

    } catch (error) {
        console.error(
            "Get customer transactions error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load customer transactions.",
            error: error.message
        });
    }
};
// ============================================================
// CUSTOMER: SUBMIT PAYMENT
// ============================================================

exports.customerCreatePayment = async (req, res) => {
    const {
        SaleID,
        RentalAgreementID,
        PaymentMethod,
        Amount
    } = req.body;

    const userId = req.user.userId;

    // -------------------------------------------------
    // REQUIRED FIELDS
    // -------------------------------------------------

    if (!PaymentMethod || Amount === undefined) {
        return res.status(400).json({
            success: false,
            message: "PaymentMethod and Amount are required."
        });
    }

    // -------------------------------------------------
    // SALE OR RENTAL
    // -------------------------------------------------

    if (!SaleID && !RentalAgreementID) {
        return res.status(400).json({
            success: false,
            message: "Please select a sale or rental agreement."
        });
    }

    if (SaleID && RentalAgreementID) {
        return res.status(400).json({
            success: false,
            message: "Payment cannot belong to both a sale and rental agreement."
        });
    }

    // -------------------------------------------------
    // VALIDATE AMOUNT
    // -------------------------------------------------

    const numericAmount = Number(Amount);

    if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Amount must be greater than zero."
        });
    }

    // -------------------------------------------------
    // VALIDATE PAYMENT METHOD
    //
    // These match your payments table ENUM:
    // Cash
    // Bank Transfer
    // Online Payment
    // -------------------------------------------------

    const customerPaymentMethods = [
        "Cash",
        "Bank Transfer",
        "Online Payment"
    ];

    if (!customerPaymentMethods.includes(PaymentMethod)) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid payment method. Allowed methods: Cash, Bank Transfer, Online Payment."
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // =================================================
        // FIND CUSTOMER
        // =================================================

        const [customers] = await connection.query(
            `
            SELECT
                CustomerID,
                FullName
            FROM customers
            WHERE UserID = ?
            LIMIT 1
            `,
            [userId]
        );

        if (customers.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Customer record not found."
            });
        }

        const customerId = customers[0].CustomerID;

        // =================================================
        // CHECK SALE
        // =================================================

        if (SaleID) {
            const [sales] = await connection.query(
                `
                SELECT
                    s.SaleID,
                    s.CustomerID,
                    s.PropertyID,
                    s.SalePrice,
                    s.PaymentStatus
                FROM sales s
                WHERE s.SaleID = ?
                FOR UPDATE
                `,
                [SaleID]
            );

            if (sales.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message: "Sale not found."
                });
            }

            const sale = sales[0];

            // Make sure this sale belongs to logged-in customer
            if (
                Number(sale.CustomerID) !==
                Number(customerId)
            ) {
                await connection.rollback();

                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to make a payment for this sale."
                });
            }
        }

        // =================================================
        // CHECK RENTAL
        // =================================================

        if (RentalAgreementID) {
            const [rentals] = await connection.query(
                `
                SELECT
                    r.RentalID,
                    r.CustomerID,
                    r.PropertyID,
                    r.MonthlyRent,
                    r.Status
                FROM rental_agreements r
                WHERE r.RentalID = ?
                FOR UPDATE
                `,
                [RentalAgreementID]
            );

            if (rentals.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message: "Rental agreement not found."
                });
            }

            const rental = rentals[0];

            // Make sure rental belongs to logged-in customer
            if (
                Number(rental.CustomerID) !==
                Number(customerId)
            ) {
                await connection.rollback();

                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to make a payment for this rental agreement."
                });
            }

            // Only active rentals can receive payments
            if (rental.Status !== "Active") {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        `This rental agreement is ${rental.Status.toLowerCase()} and cannot receive a new payment.`
                });
            }
        }

        // =================================================
        // INSERT PAYMENT
        //
        // IMPORTANT:
        // Customer payments are ALWAYS Pending.
        // Customer cannot submit PaymentStatus.
        //
        // Your payments table requires HandledBy.
        // For the current schema we use the logged-in user's
        // UserID so the record can be inserted.
        // =================================================

        const [result] = await connection.query(
            `
            INSERT INTO payments
            (
                CustomerID,
                HandledBy,
                SaleID,
                RentalAgreementID,
                PaymentMethod,
                Amount,
                PaymentStatus
            )
            VALUES (?, ?, ?, ?, ?, ?, 'Pending')
            `,
            [
                customerId,
                userId,
                SaleID || null,
                RentalAgreementID || null,
                PaymentMethod,
                numericAmount
            ]
        );

        // =================================================
        // ACTIVITY LOG
        // =================================================

        await logActivity(
            connection,
            userId,
            `Customer submitted payment #${result.insertId} for ${numericAmount} ETB`,
            req.ip
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message:
                "Payment submitted successfully. It is pending administrator verification.",
            paymentId: result.insertId,
            paymentStatus: "Pending",
            paymentMethod: PaymentMethod,
            amount: numericAmount
        });

    } catch (error) {
        await connection.rollback();

        console.error(
            "Customer create payment error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to submit payment.",
            error: error.message
        });

    } finally {
        connection.release();
    }
};