const express = require("express");

const router = express.Router();

const {
getActivityLogs
} = require("../controllers/activityLogController");

const {
authenticateToken
} = require("../middleware/authMiddleware");

// ======================================================
// FR17 – ACTIVITY LOG ROUTES
//
// Administrator:
//   Automatically authorized
//
// Other users:
//   Must have explicit activity-log permission
//
// ======================================================

router.get(
"/",
authenticateToken,
getActivityLogs
);

module.exports = router;
