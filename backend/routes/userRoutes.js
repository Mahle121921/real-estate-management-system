const express = require("express");

const router = express.Router();

const {
    getUsers,
    getUserById,
    updateUser,
    updateUserStatus,
    deleteUser,
    createUser
} = require("../controllers/userController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

// =====================================================
// OWNER USER MANAGEMENT
// =====================================================

// GET ALL USERS
router.get(
    "/",
    authenticateToken,
    authorizeRole("Owner"),
    getUsers
);

// GET ONE USER
router.get(
    "/:id",
    authenticateToken,
    authorizeRole("Owner"),
    getUserById
);

// UPDATE USER
router.put(
    "/:id",
    authenticateToken,
    authorizeRole("Owner"),
    updateUser
);

// ACTIVATE / DEACTIVATE USER
router.patch(
    "/:id/status",
    authenticateToken,
    authorizeRole("Owner"),
    updateUserStatus
);

// DELETE USER
router.delete(
    "/:id",
    authenticateToken,
    authorizeRole("Owner"),
    deleteUser
);

// CREATE USER
router.post(
    "/",
    authenticateToken,
    authorizeRole("Owner"),
    createUser
);

module.exports = router;