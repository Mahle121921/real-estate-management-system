const express = require("express");

const router = express.Router();

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

const {
    getAllSales,
    getMySales,
    getSaleById,
    createSale,
    updateSale,
    cancelSale
} = require("../controllers/salesController");

// =====================================================
// SALES ROUTES
// =====================================================

// =====================================================
// GET MY PURCHASES - CUSTOMER ONLY
// GET /api/sales/my
// =====================================================
router.get(
    "/my",
    authenticateToken,
    authorizeRole("Customer"),
    getMySales
);

// =====================================================
// GET ALL SALES
// GET /api/sales
// Administrator, Owner, Sales Agent
// =====================================================
router.get(
    "/",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Owner",
        "Sales Agent"
    ),
    getAllSales
);

// =====================================================
// GET ONE SALE
// GET /api/sales/:id
// =====================================================
router.get(
    "/:id",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Owner",
        "Sales Agent"
    ),
    getSaleById
);

// =====================================================
// CREATE SALE
// POST /api/sales
// =====================================================
router.post(
    "/",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Owner",
        "Sales Agent",
        "Customer"
    ),
    createSale
);

// =====================================================
// UPDATE SALE
// PUT /api/sales/:id
// =====================================================
router.put(
    "/:id",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Owner",
        "Sales Agent"
    ),
    updateSale
);

// =====================================================
// CANCEL SALE
// PATCH /api/sales/:id/cancel
// =====================================================
router.patch(
    "/:id/cancel",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Owner",
        "Sales Agent"
    ),
    cancelSale
);

module.exports = router;