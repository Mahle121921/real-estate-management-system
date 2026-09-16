const express = require("express");

const router = express.Router();

const {
    getRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    updateRoomStatus
} = require("../controllers/roomController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");


// ==========================================
// GET ALL ROOMS
// ==========================================
router.get(
    "/",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent"),
    getRooms
);


// ==========================================
// CREATE ROOM
// ==========================================
router.post(
    "/",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    createRoom
);


// ==========================================
// GET ROOM BY ID
// ==========================================
router.get(
    "/:id",
    authenticateToken,
    authorizeRole(
        "Owner",
        "Administrator",
        "Sales Agent",
        "Customer"
    ),
    getRoomById
);


// ==========================================
// UPDATE ROOM
// ==========================================
router.put(
    "/:id",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    updateRoom
);


// ==========================================
// UPDATE ROOM STATUS
// ==========================================
// Status should normally be controlled by
// reservation / sales / rental workflows.
router.patch(
    "/:id/status",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Sales Agent"
    ),
    updateRoomStatus
);


// ==========================================
// DELETE ROOM
// ==========================================
router.delete(
    "/:id",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    deleteRoom
);


module.exports = router;