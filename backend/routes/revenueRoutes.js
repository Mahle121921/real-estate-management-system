const express = require("express");

const {
    createRevenue,
    getRevenues,
    getRevenueById,
    getRevenueByOwner,
    getFinancialSummary
} = require("../controllers/revenueController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

const router = express.Router();

// Create revenue
router.post(
    "/",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    createRevenue
);

// Get all revenue
router.get(
    "/",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getRevenues
);

// Get revenue by owner
router.get(
    "/owner/:ownerId",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getRevenueByOwner
);

// Get financial summary
// GET /api/revenue/summary
router.get(
    "/summary",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getFinancialSummary
);

// Get revenue by ID
router.get(
    "/:id",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getRevenueById
);

module.exports = router;