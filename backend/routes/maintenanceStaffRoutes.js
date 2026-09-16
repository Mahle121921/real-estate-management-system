const express = require("express");

const router = express.Router();

const {
    getMaintenanceStaff,
    getMaintenanceStaffById
} = require("../controllers/maintenanceStaffController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

// ==========================================
// GET ALL ACTIVE MAINTENANCE STAFF
// ==========================================
router.get(
    "/",
    authenticateToken,
    authorizeRole("Administrator", "Owner"),
    getMaintenanceStaff
);

// ==========================================
// GET STAFF BY ID
// ==========================================
router.get(
    "/:id",
    authenticateToken,
    authorizeRole("Administrator", "Owner"),
    getMaintenanceStaffById
);

module.exports = router;
