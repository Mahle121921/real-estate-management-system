const express = require("express");

const router = express.Router();

const appointmentController = require("../controllers/appointmentController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

router.get(
    "/my",
    authenticateToken,
    authorizeRole("Customer"),
    appointmentController.getMyAppointments
);
// =====================================================
// APPOINTMENT ROUTES
// =====================================================

// =====================================================
// GET ALL APPOINTMENTS
// Administrator / Sales Agent / Owner
// =====================================================
router.get(
    "/",
    authenticateToken,
    authorizeRole("Administrator", "Sales Agent", "Owner"),
    appointmentController.getAllAppointments
);

// =====================================================
// GET APPOINTMENT BY ID
// =====================================================
router.get(
    "/:id",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Sales Agent",
        "Owner",
        "Customer"
    ),
    appointmentController.getAppointmentById
);

// =====================================================
// REQUEST APPOINTMENT
// Customer
// =====================================================
router.post(
    "/",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Owner",
        "Sales Agent",
        "Customer"
    ),
    appointmentController.createAppointment
);
// =====================================================
// APPROVE APPOINTMENT
// Administrator / Sales Agent / Owner
// =====================================================
router.patch(
    "/:id/approve",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Sales Agent",
        "Owner"
    ),
    appointmentController.approveAppointment
);

// =====================================================
// REJECT APPOINTMENT
// Administrator / Sales Agent / Owner
// =====================================================
router.patch(
    "/:id/reject",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Sales Agent",
        "Owner"
    ),
    appointmentController.rejectAppointment
);

// =====================================================
// RESCHEDULE APPOINTMENT
// Administrator / Sales Agent / Owner / Customer
// =====================================================
router.patch(
    "/:id/reschedule",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Sales Agent",
        "Owner",
        "Customer"
    ),
    appointmentController.rescheduleAppointment
);

// =====================================================
// COMPLETE APPOINTMENT
// Administrator / Sales Agent / Owner
// =====================================================
router.patch(
    "/:id/complete",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Sales Agent",
        "Owner"
    ),
    appointmentController.completeAppointment
);

module.exports = router;