const pool = require("../config/db");

// ========================================
// CREATE EXPENSE
// POST /api/expenses
// ========================================
const createExpense = async (req, res) => {
    try {
        const { OwnerID, PropertyID, ExpenseType, Amount } = req.body;

        // Validate required fields
        if (!OwnerID || !PropertyID || !ExpenseType || Amount === undefined) {
            return res.status(400).json({
                success: false,
                message: "OwnerID, PropertyID, ExpenseType, and Amount are required"
            });
        }

        // Validate amount
        if (Number(Amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than 0"
            });
        }

        // Owner can only create expenses for their own financial records
        if (
            req.user.role === "Owner" &&
            Number(OwnerID) !== Number(req.user.userId)
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only manage your own financial records"
            });
        }

        // Verify owner exists
        const [ownerRows] = await pool.query(
            `SELECT OwnerID, UserID
             FROM owners
             WHERE OwnerID = ?`,
            [OwnerID]
        );

        if (ownerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        // Verify property exists and belongs to the owner
        const [propertyRows] = await pool.query(
            `SELECT PropertyID, OwnerID, PropertyName
             FROM properties
             WHERE PropertyID = ? AND OwnerID = ?`,
            [PropertyID, OwnerID]
        );

        if (propertyRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Property not found or does not belong to this owner"
            });
        }

        // Insert expense
        const [result] = await pool.query(
            `INSERT INTO expenses
            (OwnerID, PropertyID, ExpenseType, Amount)
            VALUES (?, ?, ?, ?)`,
            [OwnerID, PropertyID, ExpenseType, Amount]
        );

        // Get created expense with owner and property information
        const [rows] = await pool.query(
            `SELECT
                e.ExpenseID,
                e.OwnerID,
                u.FullName AS OwnerName,
                e.PropertyID,
                p.PropertyName,
                e.ExpenseType,
                e.Amount,
                e.DateRecorded
             FROM expenses e
             JOIN owners o ON e.OwnerID = o.OwnerID
             JOIN users u ON o.UserID = u.UserID
             JOIN properties p ON e.PropertyID = p.PropertyID
             WHERE e.ExpenseID = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Expense recorded successfully",
            expense: rows[0]
        });

    } catch (error) {
        console.error("Create expense error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while recording expense"
        });
    }
};


// ========================================
// GET ALL EXPENSES
// GET /api/expenses
// ========================================
const getExpenses = async (req, res) => {
    try {
        let query = `
            SELECT
                e.ExpenseID,
                e.OwnerID,
                u.FullName AS OwnerName,
                e.PropertyID,
                p.PropertyName,
                e.ExpenseType,
                e.Amount,
                e.DateRecorded
            FROM expenses e
            JOIN owners o ON e.OwnerID = o.OwnerID
            JOIN users u ON o.UserID = u.UserID
            JOIN properties p ON e.PropertyID = p.PropertyID
        `;

        let params = [];

        // Owner sees only their own financial records
        if (req.user.role === "Owner") {
            query += " WHERE e.OwnerID = ?";
            params.push(req.user.userId);
        }

        query += " ORDER BY e.DateRecorded DESC";

        const [rows] = await pool.query(query, params);

        res.json({
            success: true,
            count: rows.length,
            expenses: rows
        });

    } catch (error) {
        console.error("========== GET EXPENSES ERROR ==========");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("SQL State:", error.sqlState);
        console.error("SQL Message:", error.sqlMessage);
        console.error("Full Error:", error);
        console.error("========================================");

        res.status(500).json({
            success: false,
            message: "Server error while retrieving expense records"
        });
    }
};


// ========================================
// GET EXPENSE BY ID
// GET /api/expenses/:id
// ========================================
const getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            `SELECT
                e.ExpenseID,
                e.OwnerID,
                u.FullName AS OwnerName,
                e.PropertyID,
                p.PropertyName,
                e.ExpenseType,
                e.Amount,
                e.DateRecorded
             FROM expenses e
             JOIN owners o ON e.OwnerID = o.OwnerID
             JOIN users u ON o.UserID = u.UserID
             JOIN properties p ON e.PropertyID = p.PropertyID
             WHERE e.ExpenseID = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Expense record not found"
            });
        }

        // Owner can only view their own record
        if (
            req.user.role === "Owner" &&
            Number(rows[0].OwnerID) !== Number(req.user.userId)
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only view your own financial records"
            });
        }

        res.json({
            success: true,
            expense: rows[0]
        });

    } catch (error) {
        console.error("Get expense by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while retrieving expense record"
        });
    }
};


// ========================================
// GET EXPENSES BY OWNER
// GET /api/expenses/owner/:ownerId
// ========================================
const getExpensesByOwner = async (req, res) => {
    try {
        const { ownerId } = req.params;

        // Owner can only access their own records
        if (
            req.user.role === "Owner" &&
            Number(ownerId) !== Number(req.user.userId)
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only view your own financial records"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                e.ExpenseID,
                e.OwnerID,
                u.FullName AS OwnerName,
                e.PropertyID,
                p.PropertyName,
                e.ExpenseType,
                e.Amount,
                e.DateRecorded
             FROM expenses e
             JOIN owners o ON e.OwnerID = o.OwnerID
             JOIN users u ON o.UserID = u.UserID
             JOIN properties p ON e.PropertyID = p.PropertyID
             WHERE e.OwnerID = ?
             ORDER BY e.DateRecorded DESC`,
            [ownerId]
        );

        res.json({
            success: true,
            count: rows.length,
            expenses: rows
        });

    } catch (error) {
        console.error("Get expenses by owner error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while retrieving owner expenses"
        });
    }
};


// ========================================
// EXPORT CONTROLLERS
// ========================================
module.exports = {
    createExpense,
    getExpenses,
    getExpenseById,
    getExpensesByOwner
};