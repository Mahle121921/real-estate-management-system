const express = require("express");

const router = express.Router();

const {
    getFloors,
    getFloorById,
    createFloor,
    updateFloor,
    deleteFloor
} = require("../controllers/floorController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");


// ======================================================
// GET ALL FLOORS
// ======================================================
router.get(
    "/",
    authenticateToken,
    authorizeRole(
        "Owner",
        "Administrator",
        "Sales Agent"
    ),
    getFloors
);


// ======================================================
// GET ONE FLOOR
// ======================================================
router.get(
    "/:id",
    authenticateToken,
    authorizeRole(
        "Owner",
        "Administrator",
        "Sales Agent"
    ),
    getFloorById
);


// ======================================================
// CREATE FLOOR
// ======================================================
router.post(
    "/",
    authenticateToken,
    authorizeRole(
        "Owner",
        "Administrator"
    ),
    createFloor
);


// ======================================================
// UPDATE FLOOR
// ======================================================
router.put(
    "/:id",
    authenticateToken,
    authorizeRole(
        "Owner",
        "Administrator"
    ),
    updateFloor
);


// ======================================================
// DELETE FLOOR
// ======================================================
router.delete(
    "/:id",
    authenticateToken,
    authorizeRole(
        "Owner",
        "Administrator"
    ),
    deleteFloor
);


module.exports = router;