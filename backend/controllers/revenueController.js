const pool = require("../config/db");

// ========================================
// HELPER: GET OWNER ID FROM USER ID
// ========================================
const getOwnerIdFromUserId = async (userId) => {
    const [rows] = await pool.query(
        "SELECT OwnerID FROM owners WHERE UserID = ?",
        [userId]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0].OwnerID;
};


// ========================================
// CREATE REVENUE
// POST /api/revenue
// ========================================
const createRevenue = async (req, res) => {
    try {
        const {
            OwnerID,
            PropertyID,
            Source,
            Amount
        } = req.body;

        if (!OwnerID || !PropertyID || !Source || Amount === undefined) {
            return res.status(400).json({
                success: false,
                message: "OwnerID, PropertyID, Source, and Amount are required"
            });
        }

        if (!["Sale", "Rental"].includes(Source)) {
            return res.status(400).json({
                success: false,
                message: "Source must be Sale or Rental"
            });
        }

        if (Number(Amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than 0"
            });
        }

        // Owner can only create their own financial record
        if (req.user.role === "Owner") {

            const ownerId = await getOwnerIdFromUserId(
                req.user.userId
            );

            if (!ownerId) {
                return res.status(404).json({
                    success: false,
                    message: "Owner record not found"
                });
            }

            if (Number(OwnerID) !== Number(ownerId)) {
                return res.status(403).json({
                    success: false,
                    message: "You can only manage your own financial records"
                });
            }
        }

        const [result] = await pool.query(
            `INSERT INTO revenue
            (OwnerID, PropertyID, Source, Amount)
            VALUES (?, ?, ?, ?)`,
            [OwnerID, PropertyID, Source, Amount]
        );

        const [rows] = await pool.query(
            `SELECT
                r.RevenueID,
                r.OwnerID,
                u.FullName AS OwnerName,
                r.PropertyID,
                p.PropertyName,
                r.Source,
                r.Amount,
                r.DateRecorded
             FROM revenue r
             JOIN owners o ON r.OwnerID = o.OwnerID
             JOIN users u ON o.UserID = u.UserID
             JOIN properties p ON r.PropertyID = p.PropertyID
             WHERE r.RevenueID = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Revenue recorded successfully",
            revenue: rows[0]
        });

    } catch (error) {
        console.error("Create revenue error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while recording revenue"
        });
    }
};


// ========================================
// GET ALL REVENUE
// GET /api/revenue
// ========================================
const getRevenues = async (req, res) => {
    try {

        let query = `
            SELECT
                r.RevenueID,
                r.OwnerID,
                u.FullName AS OwnerName,
                r.PropertyID,
                p.PropertyName,
                r.Source,
                r.Amount,
                r.DateRecorded
            FROM revenue r
            JOIN owners o ON r.OwnerID = o.OwnerID
            JOIN users u ON o.UserID = u.UserID
            JOIN properties p ON r.PropertyID = p.PropertyID
        `;

        const params = [];

        // Owner sees only their own records
        if (req.user.role === "Owner") {

            const ownerId = await getOwnerIdFromUserId(
                req.user.userId
            );

            if (!ownerId) {
                return res.status(404).json({
                    success: false,
                    message: "Owner record not found"
                });
            }

            query += " WHERE r.OwnerID = ?";
            params.push(ownerId);
        }

        query += " ORDER BY r.DateRecorded DESC";

        const [rows] = await pool.query(query, params);

        res.json({
            success: true,
            count: rows.length,
            revenues: rows
        });

    } catch (error) {
        console.error("Get revenues error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while retrieving revenue records"
        });
    }
};


// ========================================
// GET REVENUE BY ID
// GET /api/revenue/:id
// ========================================
const getRevenueById = async (req, res) => {
    try {

        const { id } = req.params;

        const [rows] = await pool.query(
            `SELECT
                r.RevenueID,
                r.OwnerID,
                u.FullName AS OwnerName,
                r.PropertyID,
                p.PropertyName,
                r.Source,
                r.Amount,
                r.DateRecorded
             FROM revenue r
             JOIN owners o ON r.OwnerID = o.OwnerID
             JOIN users u ON o.UserID = u.UserID
             JOIN properties p ON r.PropertyID = p.PropertyID
             WHERE r.RevenueID = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Revenue record not found"
            });
        }

        // Owner can only view their own record
        if (req.user.role === "Owner") {

            const ownerId = await getOwnerIdFromUserId(
                req.user.userId
            );

            if (!ownerId) {
                return res.status(404).json({
                    success: false,
                    message: "Owner record not found"
                });
            }

            if (Number(rows[0].OwnerID) !== Number(ownerId)) {
                return res.status(403).json({
                    success: false,
                    message: "You can only view your own financial records"
                });
            }
        }

        res.json({
            success: true,
            revenue: rows[0]
        });

    } catch (error) {
        console.error("Get revenue by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while retrieving revenue record"
        });
    }
};


// ========================================
// GET REVENUE BY OWNER
// GET /api/revenue/owner/:ownerId
// ========================================
const getRevenueByOwner = async (req, res) => {
    try {

        const { ownerId } = req.params;

        // Owner can only view their own records
        if (req.user.role === "Owner") {

            const actualOwnerId = await getOwnerIdFromUserId(
                req.user.userId
            );

            if (!actualOwnerId) {
                return res.status(404).json({
                    success: false,
                    message: "Owner record not found"
                });
            }

            if (Number(ownerId) !== Number(actualOwnerId)) {
                return res.status(403).json({
                    success: false,
                    message: "You can only view your own financial records"
                });
            }
        }

        const [rows] = await pool.query(
            `SELECT
                r.RevenueID,
                r.OwnerID,
                u.FullName AS OwnerName,
                r.PropertyID,
                p.PropertyName,
                r.Source,
                r.Amount,
                r.DateRecorded
             FROM revenue r
             JOIN owners o ON r.OwnerID = o.OwnerID
             JOIN users u ON o.UserID = u.UserID
             JOIN properties p ON r.PropertyID = p.PropertyID
             WHERE r.OwnerID = ?
             ORDER BY r.DateRecorded DESC`,
            [ownerId]
        );

        res.json({
            success: true,
            count: rows.length,
            revenues: rows
        });

    } catch (error) {
        console.error("Get revenue by owner error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while retrieving revenue records"
        });
    }
};


// ========================================
// GET FINANCIAL SUMMARY
// GET /api/revenue/summary
// ========================================
const getFinancialSummary = async (req, res) => {
    try {

        let ownerId = null;

        // ========================================
        // OWNER
        // ========================================
        if (req.user.role === "Owner") {

            ownerId = await getOwnerIdFromUserId(
                req.user.userId
            );

            if (!ownerId) {
                return res.status(404).json({
                    success: false,
                    message: "Owner record not found"
                });
            }
        }

        // ========================================
        // TOTAL REVENUE
        // ========================================
        let revenueQuery = `
            SELECT
                COALESCE(SUM(Amount), 0) AS TotalRevenue,
                COUNT(*) AS RevenueCount
            FROM revenue
        `;

        const revenueParams = [];

        if (ownerId !== null) {
            revenueQuery += " WHERE OwnerID = ?";
            revenueParams.push(ownerId);
        }

        const [revenueRows] = await pool.query(
            revenueQuery,
            revenueParams
        );

        // ========================================
        // TOTAL EXPENSES
        // ========================================
        let expenseQuery = `
            SELECT
                COALESCE(SUM(Amount), 0) AS TotalExpenses,
                COUNT(*) AS ExpenseCount
            FROM expenses
        `;

        const expenseParams = [];

        if (ownerId !== null) {
            expenseQuery += " WHERE OwnerID = ?";
            expenseParams.push(ownerId);
        }

        const [expenseRows] = await pool.query(
            expenseQuery,
            expenseParams
        );

        // ========================================
        // CALCULATE FINANCIAL SUMMARY
        // ========================================
        const totalRevenue = Number(
            revenueRows[0].TotalRevenue
        );

        const totalExpenses = Number(
            expenseRows[0].TotalExpenses
        );

        const netIncome = totalRevenue - totalExpenses;

        // ========================================
        // RESPONSE
        // ========================================
        res.json({
            success: true,
            summary: {
                totalRevenue: totalRevenue.toFixed(2),
                totalExpenses: totalExpenses.toFixed(2),
                netIncome: netIncome.toFixed(2),
                revenueCount: Number(
                    revenueRows[0].RevenueCount
                ),
                expenseCount: Number(
                    expenseRows[0].ExpenseCount
                )
            }
        });

    } catch (error) {

        console.error("========== FINANCIAL SUMMARY ERROR ==========");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("SQL State:", error.sqlState);
        console.error("SQL Message:", error.sqlMessage);
        console.error("Full Error:", error);
        console.error("=============================================");

        res.status(500).json({
            success: false,
            message: "Server error while retrieving financial summary"
        });
    }
};


// ========================================
// EXPORT
// ========================================
module.exports = {
    createRevenue,
    getRevenues,
    getRevenueById,
    getRevenueByOwner,
    getFinancialSummary
};