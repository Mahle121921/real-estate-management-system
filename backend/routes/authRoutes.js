const express = require("express");

const router = express.Router();

const {
    registerCustomer,
    login,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

// ==========================================
// CUSTOMER REGISTRATION
// ==========================================
router.post("/register", registerCustomer);

// ==========================================
// LOGIN
// ==========================================
router.post("/login", login);

// ==========================================
// FORGOT PASSWORD
// ==========================================
router.post("/forgot-password", forgotPassword);

// ==========================================
// RESET PASSWORD
// ==========================================
router.post("/reset-password", resetPassword);

module.exports = router;
