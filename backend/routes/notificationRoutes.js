const express = require("express");

const router = express.Router();

const notificationController =
    require("../controllers/notificationController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");


// ==========================================
// ADMINISTRATOR
// ==========================================

// Get all notifications
router.get(
    "/",
    authenticateToken,
    authorizeRole("Administrator"),
    notificationController.getNotifications
);

// Get active users for recipient selection
router.get(
    "/recipients",
    authenticateToken,
    authorizeRole("Administrator"),
    notificationController.getNotificationRecipients
);

// Send notification
router.post(
    "/send",
    authenticateToken,
    authorizeRole("Administrator"),
    notificationController.sendNotification
);


// ==========================================
// OWNER
// ==========================================

// Get owner's notifications
router.get(
    "/owner",
    authenticateToken,
    authorizeRole("Owner"),
    notificationController.getOwnerNotifications
);

// Mark one notification as read
router.patch(
    "/owner/:id/read",
    authenticateToken,
    authorizeRole("Owner"),
    notificationController.markOwnerNotificationAsRead
);

// Mark all owner notifications as read
router.patch(
    "/owner/read-all",
    authenticateToken,
    authorizeRole("Owner"),
    notificationController.markAllOwnerNotificationsAsRead
);


// ==========================================
// ADMINISTRATOR
// RETRY FAILED NOTIFICATION
// ==========================================
router.post(
    "/:id/retry",
    authenticateToken,
    authorizeRole("Administrator"),
    notificationController.retryNotification
);


module.exports = router;