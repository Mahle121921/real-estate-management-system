const express = require("express");

const router = express.Router();

const {
    getBuildings,
    getBuildingById,
    createBuilding,
    updateBuilding,
    deleteBuilding
} = require("../controllers/buildingController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");


// ======================================================
// GET ALL BUILDINGS
// Owner      → own buildings only
// Administrator → all buildings
// Sales Agent   → all buildings (view only)
// ======================================================
router.get(
    "/",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent"),
    getBuildings
);


// ======================================================
// GET ONE BUILDING
// ======================================================
router.get(
    "/:id",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent"),
    getBuildingById
);


// ======================================================
// CREATE BUILDING
// Owner      → own property only
// Administrator → any property
// ======================================================
router.post(
    "/",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    createBuilding
);


// ======================================================
// UPDATE BUILDING
// Owner      → own building only
// Administrator → any building
// ======================================================
router.put(
    "/:id",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    updateBuilding
);


// ======================================================
// DELETE BUILDING
// Owner      → own building only
// Administrator → any building
// ======================================================
router.delete(
    "/:id",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    deleteBuilding
);


module.exports = router;