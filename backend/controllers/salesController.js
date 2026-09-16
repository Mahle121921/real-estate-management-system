const db = require("../config/db");

// =====================================================
// HELPER: GET OWNER ID
// =====================================================
const getOwnerId = async (userId) => {
const [owners] = await db.query(
`         SELECT OwnerID
        FROM owners
        WHERE UserID = ?
        LIMIT 1
        `,
[userId]
);

return owners.length > 0 ? owners[0].OwnerID : null;


};

// =====================================================
// HELPER: CHECK PROPERTY ACCESS
// Administrator and Sales Agent:
//   Can access all properties.
//
// Owner:
//   Can access only their own properties.
// =====================================================
const canAccessProperty = async (req, propertyId) => {
const role = String(req.user?.role || "").trim();
const userId = req.user?.userId;


if (role === "Administrator" || role === "Sales Agent") {
    return true;
}

if (role === "Owner") {
    const ownerId = await getOwnerId(userId);

    if (!ownerId) {
        return false;
    }

    const [properties] = await db.query(
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
// 1. GET ALL SALES
// =====================================================
exports.getAllSales = async (req, res) => {
try {
const role = String(req.user?.role || "").trim();
const userId = req.user?.userId;


    let query = `
        SELECT
            s.SaleID,
            s.PropertyID,
            p.PropertyName,
            p.OwnerID,
            s.CustomerID,
            c.FullName AS CustomerName,
            s.HandledBy,
            u.FullName AS HandledByName,
            s.SaleDate,
            s.SalePrice,
            s.PaymentStatus
        FROM sales s
        JOIN properties p
            ON s.PropertyID = p.PropertyID
        JOIN customers c
            ON s.CustomerID = c.CustomerID
        JOIN users u
            ON s.HandledBy = u.UserID
    `;

    const params = [];

    if (role === "Owner") {
        const ownerId = await getOwnerId(userId);

        if (!ownerId) {
            return res.status(403).json({
                success: false,
                message: "Owner record not found"
            });
        }

        query += `
            WHERE p.OwnerID = ?
        `;

        params.push(ownerId);
    }

    query += `
        ORDER BY s.SaleID DESC
    `;

    const [sales] = await db.query(query, params);

    res.status(200).json({
        success: true,
        count: sales.length,
        sales
    });

} catch (error) {
    console.error("Get all sales error:", error);

    res.status(500).json({
        success: false,
        message: "Failed to retrieve sales",
        error: error.message
    });
}

};
// =====================================================
// GET MY PURCHASES
// Customer can see only their own purchases
// GET /api/sales/my
// =====================================================
exports.getMySales = async (req, res) => {
    try {
        const userId = req.user?.userId;

        console.log("========== GET MY PURCHASES ==========");
        console.log("Authenticated user ID:", userId);
        console.log("Authenticated role:", req.user?.role);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user ID is missing"
            });
        }

        // -------------------------------------------------
        // Find customer belonging to logged-in user
        // -------------------------------------------------
        const [customers] = await db.query(
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

        console.log("Customer lookup result:", customers);

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer record not found for this user"
            });
        }

        const customerId = customers[0].CustomerID;

        console.log("CustomerID:", customerId);

        // -------------------------------------------------
        // Get customer's sales
        // -------------------------------------------------
        const [sales] = await db.query(
            `
            SELECT
                s.SaleID,
                s.PropertyID,
                p.PropertyName,
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

            LEFT JOIN users u
                ON s.HandledBy = u.UserID

            WHERE s.CustomerID = ?

            ORDER BY s.SaleID DESC
            `,
            [customerId]
        );

        console.log("Customer sales:", sales);

        return res.status(200).json({
            success: true,
            count: sales.length,
            sales
        });

    } catch (error) {
        console.error("========== GET MY PURCHASES ERROR ==========");
        console.error(error);
        console.error("SQL error message:", error.message);
        console.error("SQL error code:", error.code);
        console.error("SQL error number:", error.errno);
        console.error("SQL error SQL:", error.sql);
        console.error("============================================");

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your purchases",
            error: error.message
        });
    }
};

// =====================================================
// 2. GET SALE BY ID
// =====================================================
exports.getSaleById = async (req, res) => {
const { id } = req.params;

try {
    const [sales] = await db.query(
        `
        SELECT
            s.SaleID,
            s.PropertyID,
            p.PropertyName,
            p.OwnerID,
            s.CustomerID,
            c.FullName AS CustomerName,
            s.HandledBy,
            u.FullName AS HandledByName,
            s.SaleDate,
            s.SalePrice,
            s.PaymentStatus
        FROM sales s
        JOIN properties p
            ON s.PropertyID = p.PropertyID
        JOIN customers c
            ON s.CustomerID = c.CustomerID
        JOIN users u
            ON s.HandledBy = u.UserID
        WHERE s.SaleID = ?
        `,
        [id]
    );

    if (sales.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Sale not found"
        });
    }

    const sale = sales[0];

    const allowed = await canAccessProperty(
        req,
        sale.PropertyID
    );

    if (!allowed) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to access this sale"
        });
    }

    res.status(200).json({
        success: true,
        sale
    });

} catch (error) {
    console.error("Get sale by ID error:", error);

    res.status(500).json({
        success: false,
        message: "Failed to retrieve sale",
        error: error.message
    });
}

};

// =====================================================
// 3. CREATE SALE
// =====================================================
exports.createSale = async (req, res) => {
const {
PropertyID,
CustomerID,
SaleDate,
SalePrice,
PaymentStatus
} = req.body || {};

const HandledBy = req.user?.userId;

const validPaymentStatuses = [
    "Pending",
    "Paid",
    "Cancelled"
];

const finalPaymentStatus =
    PaymentStatus || "Pending";

if (
    !PropertyID ||
    !CustomerID ||
    !SaleDate ||
    SalePrice === undefined ||
    SalePrice === null ||
    SalePrice === ""
) {
    return res.status(400).json({
        success: false,
        message:
            "PropertyID, CustomerID, SaleDate and SalePrice are required"
    });
}

if (!validPaymentStatuses.includes(finalPaymentStatus)) {
    return res.status(400).json({
        success: false,
        message:
            "Invalid PaymentStatus. Use Pending, Paid, or Cancelled."
    });
}

if (!HandledBy) {
    return res.status(401).json({
        success: false,
        message: "Authenticated user ID is missing"
    });
}

const connection = await db.getConnection();

try {
    await connection.beginTransaction();

    // -------------------------------------------------
    // Check property
    // -------------------------------------------------
    const [properties] = await connection.query(
        `
        SELECT
            PropertyID,
            PropertyName,
            OwnerID,
            Status
        FROM properties
        WHERE PropertyID = ?
        FOR UPDATE
        `,
        [PropertyID]
    );

    if (properties.length === 0) {
        await connection.rollback();

        return res.status(404).json({
            success: false,
            message: "Property not found"
        });
    }

    const property = properties[0];

    // -------------------------------------------------
    // Owner can only manage own property sales
    // -------------------------------------------------
    const role = String(req.user?.role || "").trim();

    if (role === "Owner") {
        const ownerId = await getOwnerId(HandledBy);

        if (!ownerId || ownerId !== property.OwnerID) {
            await connection.rollback();

            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to sell this property"
            });
        }
    }

    // -------------------------------------------------
    // Prevent invalid property sale
    // -------------------------------------------------
    if (property.Status === "Sold") {
        await connection.rollback();

        return res.status(400).json({
            success: false,
            message: "Property is already sold"
        });
    }

    if (property.Status === "Rented") {
        await connection.rollback();

        return res.status(400).json({
            success: false,
            message: "Property is currently rented"
        });
    }

    // -------------------------------------------------
    // Check customer
    // -------------------------------------------------
    const [customers] = await connection.query(
        `
        SELECT CustomerID
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

    // -------------------------------------------------
    // Insert sale
    // -------------------------------------------------
    const [result] = await connection.query(
        `
        INSERT INTO sales
        (
            PropertyID,
            CustomerID,
            HandledBy,
            SaleDate,
            SalePrice,
            PaymentStatus
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            PropertyID,
            CustomerID,
            HandledBy,
            SaleDate,
            SalePrice,
            finalPaymentStatus
        ]
    );

    // -------------------------------------------------
    // Determine property status
    // -------------------------------------------------
    let propertyStatus = "Reserved";

    if (finalPaymentStatus === "Paid") {
        propertyStatus = "Sold";
    }

    if (finalPaymentStatus === "Cancelled") {
        propertyStatus = "Available";
    }

    // -------------------------------------------------
    // Update property status
    // -------------------------------------------------
    await connection.query(
        `
        UPDATE properties
        SET Status = ?
        WHERE PropertyID = ?
        `,
        [
            propertyStatus,
            PropertyID
        ]
    );

    // -------------------------------------------------
    // Activity log
    // -------------------------------------------------
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
            HandledBy,
            `Sale #${result.insertId} recorded for property ${PropertyID}`,
            "Sales",
            req.ip
        ]
    );

    await connection.commit();

    res.status(201).json({
        success: true,
        message: "Sale recorded successfully",
        saleId: result.insertId,
        paymentStatus: finalPaymentStatus,
        propertyStatus
    });

} catch (error) {
    await connection.rollback();

    console.error("Create sale error:", error);

    res.status(500).json({
        success: false,
        message: "Failed to record sale",
        error: error.message
    });

} finally {
    connection.release();
}


};

// =====================================================
// 4. UPDATE SALE
// =====================================================
exports.updateSale = async (req, res) => {
const { id } = req.params;


const {
    CustomerID,
    SaleDate,
    SalePrice,
    PaymentStatus
} = req.body || {};

const HandledBy = req.user?.userId;

const validPaymentStatuses = [
    "Pending",
    "Paid",
    "Cancelled"
];

const connection = await db.getConnection();

try {
    await connection.beginTransaction();

    const [sales] = await connection.query(
        `
        SELECT
            SaleID,
            PropertyID,
            CustomerID,
            SaleDate,
            SalePrice,
            PaymentStatus
        FROM sales
        WHERE SaleID = ?
        FOR UPDATE
        `,
        [id]
    );

    if (sales.length === 0) {
        await connection.rollback();

        return res.status(404).json({
            success: false,
            message: "Sale not found"
        });
    }

    const sale = sales[0];

    // -------------------------------------------------
    // Check property
    // -------------------------------------------------
    const [properties] = await connection.query(
        `
        SELECT
            PropertyID,
            OwnerID
        FROM properties
        WHERE PropertyID = ?
        FOR UPDATE
        `,
        [sale.PropertyID]
    );

    if (properties.length === 0) {
        await connection.rollback();

        return res.status(404).json({
            success: false,
            message: "Related property not found"
        });
    }

    const property = properties[0];

    // -------------------------------------------------
    // Owner access check
    // -------------------------------------------------
    const role = String(req.user?.role || "").trim();

    if (role === "Owner") {
        const ownerId = await getOwnerId(HandledBy);

        if (!ownerId || ownerId !== property.OwnerID) {
            await connection.rollback();

            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to update this sale"
            });
        }
    }

    // -------------------------------------------------
    // Final values
    // -------------------------------------------------
    const finalCustomerID =
        CustomerID || sale.CustomerID;

    const finalSaleDate =
        SaleDate || sale.SaleDate;

    const finalSalePrice =
        SalePrice !== undefined &&
        SalePrice !== null &&
        SalePrice !== ""
            ? SalePrice
            : sale.SalePrice;

    const finalPaymentStatus =
        PaymentStatus || sale.PaymentStatus;

    if (!validPaymentStatuses.includes(finalPaymentStatus)) {
        await connection.rollback();

        return res.status(400).json({
            success: false,
            message:
                "Invalid PaymentStatus. Use Pending, Paid, or Cancelled."
        });
    }

    // -------------------------------------------------
    // Check customer
    // -------------------------------------------------
    const [customers] = await connection.query(
        `
        SELECT CustomerID
        FROM customers
        WHERE CustomerID = ?
        LIMIT 1
        `,
        [finalCustomerID]
    );

    if (customers.length === 0) {
        await connection.rollback();

        return res.status(404).json({
            success: false,
            message: "Customer not found"
        });
    }

    // -------------------------------------------------
    // Update sale
    // -------------------------------------------------
    await connection.query(
        `
        UPDATE sales
        SET
            CustomerID = ?,
            SaleDate = ?,
            SalePrice = ?,
            PaymentStatus = ?
        WHERE SaleID = ?
        `,
        [
            finalCustomerID,
            finalSaleDate,
            finalSalePrice,
            finalPaymentStatus,
            id
        ]
    );

    // -------------------------------------------------
    // Update property status
    // -------------------------------------------------
    let propertyStatus = "Reserved";

    if (finalPaymentStatus === "Paid") {
        propertyStatus = "Sold";
    }

    if (finalPaymentStatus === "Cancelled") {
        propertyStatus = "Available";
    }

    await connection.query(
        `
        UPDATE properties
        SET Status = ?
        WHERE PropertyID = ?
        `,
        [
            propertyStatus,
            sale.PropertyID
        ]
    );

    // -------------------------------------------------
    // Activity log
    // -------------------------------------------------
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
            HandledBy,
            `Sale #${id} updated`,
            "Sales",
            req.ip
        ]
    );

    await connection.commit();

    res.status(200).json({
        success: true,
        message: "Sale updated successfully",
        propertyStatus
    });

} catch (error) {
    await connection.rollback();

    console.error("Update sale error:", error);

    res.status(500).json({
        success: false,
        message: "Failed to update sale",
        error: error.message
    });

} finally {
    connection.release();
}

};

// =====================================================
// 5. CANCEL SALE
// =====================================================
exports.cancelSale = async (req, res) => {
const { id } = req.params;


const HandledBy = req.user?.userId;

const connection = await db.getConnection();

try {
    await connection.beginTransaction();

    const [sales] = await connection.query(
        `
        SELECT
            SaleID,
            PropertyID,
            PaymentStatus
        FROM sales
        WHERE SaleID = ?
        FOR UPDATE
        `,
        [id]
    );

    if (sales.length === 0) {
        await connection.rollback();

        return res.status(404).json({
            success: false,
            message: "Sale not found"
        });
    }

    const sale = sales[0];

    // -------------------------------------------------
    // Check property
    // -------------------------------------------------
    const [properties] = await connection.query(
        `
        SELECT
            PropertyID,
            OwnerID
        FROM properties
        WHERE PropertyID = ?
        FOR UPDATE
        `,
        [sale.PropertyID]
    );

    if (properties.length === 0) {
        await connection.rollback();

        return res.status(404).json({
            success: false,
            message: "Related property not found"
        });
    }

    const property = properties[0];

    // -------------------------------------------------
    // Owner access check
    // -------------------------------------------------
    const role = String(req.user?.role || "").trim();

    if (role === "Owner") {
        const ownerId = await getOwnerId(HandledBy);

        if (!ownerId || ownerId !== property.OwnerID) {
            await connection.rollback();

            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to cancel this sale"
            });
        }
    }

    // -------------------------------------------------
    // Cancel sale
    // -------------------------------------------------
    await connection.query(
        `
        UPDATE sales
        SET PaymentStatus = 'Cancelled'
        WHERE SaleID = ?
        `,
        [id]
    );

    // -------------------------------------------------
    // Make property available
    // -------------------------------------------------
    await connection.query(
        `
        UPDATE properties
        SET Status = 'Available'
        WHERE PropertyID = ?
        `,
        [sale.PropertyID]
    );

    // -------------------------------------------------
    // Activity log
    // -------------------------------------------------
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
            HandledBy,
            `Sale #${id} cancelled`,
            "Sales",
            req.ip
        ]
    );

    await connection.commit();

    res.status(200).json({
        success: true,
        message: "Sale cancelled successfully"
    });

} catch (error) {
    await connection.rollback();

    console.error("Cancel sale error:", error);

    res.status(500).json({
        success: false,
        message: "Failed to cancel sale",
        error: error.message
    });

} finally {
    connection.release();
}


};
