const express = require("express");

const router = express.Router();

const {
    getOwners,
    getOwnerById,
    updateOwner,
    getMyOwnerProfile,
    getOwnerProperties,
    getOwnerRevenue,
    getOwnerExpenses,
    getOwnerFinancialSummary,
    getOwnerMaintenanceRequests,
    getOwnerAppointments,
    getOwnerReservations,
    getOwnerRentals,
    getOwnerSales,
    getOwnerSaleById,
    getOwnerPayments,
    getOwnerPaymentById,
    getOwnerReport
} = require("../controllers/ownerController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

// =====================================================
// CURRENTLY LOGGED-IN OWNER
// =====================================================

router.get(
    "/me",
    authenticateToken,
    authorizeRole("Owner"),
    getMyOwnerProfile
);

// =====================================================
// ALL OWNERS
// =====================================================

router.get(
    "/",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getOwners
);

// =====================================================
// OWNER REPORT
// IMPORTANT: Keep this BEFORE /:id routes
// =====================================================

router.get(
    "/owner/reports",
    authenticateToken,
    authorizeRole("Owner"),
    getOwnerReport
);

// =====================================================
// OWNER SALES
// =====================================================

router.get(
    "/owner/sales",
    authenticateToken,
    authorizeRole("Owner"),
    getOwnerSales
);

router.get(
    "/owner/sales/:id",
    authenticateToken,
    authorizeRole("Owner"),
    getOwnerSaleById
);

// =====================================================
// OWNER PAYMENTS
// =====================================================

router.get(
    "/owner/payments",
    authenticateToken,
    authorizeRole("Owner"),
    getOwnerPayments
);

router.get(
    "/owner/payments/:id",
    authenticateToken,
    authorizeRole("Owner"),
    getOwnerPaymentById
);

// =====================================================
// OWNER PROPERTIES
// =====================================================

router.get(
    "/:id/properties",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getOwnerProperties
);

// =====================================================
// OWNER REVENUE
// =====================================================

router.get(
    "/:id/revenue",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getOwnerRevenue
);

// =====================================================
// OWNER EXPENSES
// =====================================================

router.get(
    "/:id/expenses",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getOwnerExpenses
);

// =====================================================
// OWNER FINANCIAL SUMMARY
// =====================================================

router.get(
    "/:id/financial-summary",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getOwnerFinancialSummary
);

// =====================================================
// OWNER MAINTENANCE
// =====================================================

router.get(
    "/:id/maintenance-requests",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getOwnerMaintenanceRequests
);

// =====================================================
// OWNER APPOINTMENTS
// =====================================================

router.get(
    "/:id/appointments",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getOwnerAppointments
);

// =====================================================
// OWNER RESERVATIONS
// =====================================================

router.get(
    "/:id/reservations",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getOwnerReservations
);

// =====================================================
// OWNER RENTALS
// =====================================================

router.get(
    "/:id/rental-agreements",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getOwnerRentals
);

// =====================================================
// SINGLE OWNER
// IMPORTANT: Keep this AFTER specific /owner/... routes
// =====================================================

router.get(
    "/:id",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getOwnerById
);

// =====================================================
// UPDATE OWNER PROFILE
// =====================================================

router.put(
    "/:id",
    authenticateToken,
    authorizeRole("Owner"),
    updateOwner
);

module.exports = router;