const express = require("express");

const router = express.Router();

const {
    getPropertyReport,
    getSalesReport,
    getRentalReport,
    getCustomerReport,
    getOwnerReport,
    getRevenueReport,
    getExpenseReport,
    getProfitReport,
    getMaintenanceReport,
    getAppointmentReport
} = require("../controllers/reportController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");


// ======================================================
// FR16 – REPORT ROUTES
// ======================================================

// Owner and Administrator can view reports

router.get(
    "/properties",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getPropertyReport
);

router.get(
    "/sales",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getSalesReport
);

router.get(
    "/rentals",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getRentalReport
);

router.get(
    "/customers",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getCustomerReport
);

router.get(
    "/owners",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getOwnerReport
);

router.get(
    "/revenue",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getRevenueReport
);

router.get(
    "/expenses",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getExpenseReport
);

router.get(
    "/profit",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getProfitReport
);

router.get(
    "/maintenance",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getMaintenanceReport
);

router.get(
    "/appointments",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    getAppointmentReport
);


module.exports = router;