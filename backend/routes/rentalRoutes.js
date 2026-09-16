const express = require("express");

const router = express.Router();

const rentalController = require("../controllers/rentalController");

const {
authenticateToken,
authorizeRole
} = require("../middleware/authMiddleware");

// Get all rental agreements
router.get(
    "/",
    authenticateToken,
    authorizeRole("Administrator", "Owner", "Sales Agent"),
    rentalController.getAllRentals
);

// =====================================================
// CUSTOMER - CREATE RENTAL
// =====================================================

router.post(
    "/customer",
    authenticateToken,
    authorizeRole("Customer"),
    rentalController.createCustomerRental
);

// =====================================================
// TRACK RENTAL DUE DATES
// =====================================================

router.get(
    "/due",
    authenticateToken,
    authorizeRole("Administrator", "Owner", "Sales Agent"),
    rentalController.getRentalDueDates
);

router.get(
    "/my",
    authenticateToken,
    authorizeRole("Customer"),
    rentalController.getMyRentals
);

// Get rental agreement by ID
router.get(
    "/:id",
    authenticateToken,
    authorizeRole("Administrator", "Owner", "Sales Agent"),
    rentalController.getRentalById
);
// Create rental agreement
router.post(
"/",
authenticateToken,
authorizeRole("Administrator", "Owner", "Sales Agent"),
rentalController.createRental
);

// Renew rental agreement
router.patch(
"/:id/renew",
authenticateToken,
authorizeRole("Administrator", "Owner", "Sales Agent"),
rentalController.renewRental
);

// Terminate rental agreement
router.patch(
"/:id/terminate",
authenticateToken,
authorizeRole("Administrator", "Owner", "Sales Agent"),
rentalController.terminateRental
);

// =====================================================
// RECORD MONTHLY RENT PAYMENT
// =====================================================

router.post(
"/:id/rent-payment",
authenticateToken,
authorizeRole("Administrator", "Owner", "Sales Agent"),
rentalController.recordMonthlyRent
);

router.put(
    "/:id",
    authenticateToken,
    authorizeRole("Administrator", "Owner", "Sales Agent"),
    rentalController.updateRental
);

module.exports = router;
