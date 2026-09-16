const express = require("express");

const router = express.Router();

const {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    searchCustomers,
    updateCustomerStatus
} = require("../controllers/customerController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

// View all customers
router.get(
    "/",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent"),
    getCustomers
);

// Search customers
router.get(
    "/search",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent"),
    searchCustomers
);

// View one customer
router.get(
    "/:id",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent"),
    getCustomerById
);

// Create customer
router.post(
    "/",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent"),
    createCustomer
);

// Update customer
router.put(
    "/:id",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent"),
    updateCustomer
);

// Activate / deactivate customer
router.patch(
    "/:id/status",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent"),
    updateCustomerStatus
);

module.exports = router;