const express = require("express");

const {
    createExpense,
    getExpenses,
    getExpenseById,
    getExpensesByOwner
} = require("../controllers/expenseController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// CREATE EXPENSE
// POST /api/expenses
// ========================================
router.post(
    "/",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    createExpense
);

// ========================================
// GET ALL EXPENSES
// GET /api/expenses
// ========================================
router.get(
    "/",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getExpenses
);

// ========================================
// GET EXPENSE BY ID
// GET /api/expenses/:id
// ========================================
router.get(
    "/:id",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getExpenseById
);

// ========================================
// GET EXPENSES BY OWNER
// GET /api/expenses/owner/:ownerId
// ========================================
router.get(
    "/owner/:ownerId",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getExpensesByOwner
);

module.exports = router;