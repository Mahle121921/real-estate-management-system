const express = require("express");

const router = express.Router();

const {
    getReservations,
    getOwnerReservations,
    getReservationById,
    createReservation,
    updateReservation,
    updateReservationStatus,
    searchReservations,
    cancelReservation,
    getMyReservations
} = require("../controllers/reservationController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

// ==========================================
// CUSTOMER - MY RESERVATIONS
// ==========================================
router.get(
    "/my",
    authenticateToken,
    authorizeRole("Customer"),
    getMyReservations
);

// ==========================================
// ALL RESERVATIONS
// ==========================================
router.get(
    "/",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent"),
    getReservations
);

// ==========================================
// SEARCH
// ==========================================
router.get(
    "/search",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent"),
    searchReservations
);

// ==========================================
// OWNER RESERVATIONS
// ==========================================
router.get(
    "/owner",
    authenticateToken,
    authorizeRole("Owner"),
    getOwnerReservations
);

// ==========================================
// GET RESERVATION BY ID
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
    getReservationById
);

// ==========================================
// CREATE RESERVATION
// ==========================================
router.post(
    "/",
    authenticateToken,
    authorizeRole(
        "Owner",
        "Administrator",
        "Sales Agent",
        "Customer"
    ),
    createReservation
);

// ==========================================
// UPDATE RESERVATION
// ==========================================
router.put(
    "/:id",
    authenticateToken,
    authorizeRole(
        "Owner",
        "Administrator",
        "Sales Agent"
    ),
    updateReservation
);

// ==========================================
// UPDATE RESERVATION STATUS
// ==========================================
router.patch(
    "/:id/status",
    authenticateToken,
    authorizeRole(
        "Owner",
        "Administrator",
        "Sales Agent"
    ),
    updateReservationStatus
);

// ==========================================
// CANCEL RESERVATION
// ==========================================
router.patch(
    "/:id/cancel",
    authenticateToken,
    authorizeRole(
        "Owner",
        "Administrator",
        "Sales Agent",
        "Customer"
    ),
    cancelReservation
);

module.exports = router;