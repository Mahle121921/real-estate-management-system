const express = require("express");
const router = express.Router();

const settingsController = require("../controllers/settingsController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");


// ==========================================
// GET SETTINGS
// Administrator only
// ==========================================
router.get(
    "/",
    authenticateToken,
    authorizeRole("Administrator"),
    settingsController.getSettings
);


// ==========================================
// UPDATE SETTINGS
// Administrator only
// ==========================================
router.patch(
    "/",
    authenticateToken,
    authorizeRole("Administrator"),
    settingsController.updateSettings
);


module.exports = router;