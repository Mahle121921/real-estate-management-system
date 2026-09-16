const express = require("express");

const router = express.Router();

const paymentController = require("../controllers/paymentController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

const {
    getAllPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    cancelPayment,
    getPaymentReceipt,
    getMyPayments,
    getMyTransactions,
    customerCreatePayment
} = require("../controllers/paymentController");


// ============================================================
// PAYMENT ACCESS ROLES
// ============================================================

const paymentRoles = authorizeRole(
    "Administrator",
    "Owner",
    "Sales Agent"
);


// ============================================================
// ADMIN / OWNER / SALES AGENT
// GET ALL PAYMENTS
// ============================================================

router.get(
    "/",
    authenticateToken,
    paymentRoles,
    getAllPayments
);


// ============================================================
// CUSTOMER
// GET MY PAYMENT HISTORY
// ============================================================

router.get(
    "/my",
    authenticateToken,
    authorizeRole("Customer"),
    getMyPayments
);


// ============================================================
// CUSTOMER
// GET MY SALES AND RENTAL AGREEMENTS
// ============================================================

router.get(
    "/my-transactions",
    authenticateToken,
    authorizeRole("Customer"),
    getMyTransactions
);


// ============================================================
// CUSTOMER
// SUBMIT PAYMENT
// ============================================================

router.post(
    "/customer",
    authenticateToken,
    authorizeRole("Customer"),
    customerCreatePayment
);


// ============================================================
// PAYMENT RECEIPT
// ============================================================

router.get(
    "/receipt/:id",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Owner",
        "Sales Agent",
        "Customer"
    ),
    paymentController.getPaymentReceipt
);


// ============================================================
// GET PAYMENT BY ID
// ============================================================

router.get(
    "/:id",
    authenticateToken,
    paymentRoles,
    getPaymentById
);


// ============================================================
// ADMIN / OWNER / SALES AGENT
// CREATE PAYMENT
// ============================================================

router.post(
    "/",
    authenticateToken,
    paymentRoles,
    createPayment
);


// ============================================================
// ADMIN / OWNER / SALES AGENT
// UPDATE PAYMENT
// ============================================================

router.patch(
    "/:id",
    authenticateToken,
    paymentRoles,
    updatePayment
);


// ============================================================
// CANCEL PAYMENT
// ============================================================

router.patch(
    "/:id/cancel",
    authenticateToken,
    paymentRoles,
    cancelPayment
);


module.exports = router;