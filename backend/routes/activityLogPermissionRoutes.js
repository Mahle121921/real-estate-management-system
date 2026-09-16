const express = require("express");

const router = express.Router();

const {
    getActivityLogPermissions,
    updateActivityLogPermission
} = require("../controllers/activityLogPermissionController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

// ======================================================
// ACTIVITY LOG PERMISSION MANAGEMENT
//
// ONLY ADMINISTRATOR
// ======================================================

// Get users and their activity-log permissions
router.get(
    "/",
    authenticateToken,
    authorizeRole("Administrator"),
    getActivityLogPermissions
);

// Authorize / revoke a user's activity-log access
router.patch(
    "/:userId",
    authenticateToken,
    authorizeRole("Administrator"),
    updateActivityLogPermission
);

module.exports = router;