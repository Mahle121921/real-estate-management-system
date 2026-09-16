
const express = require("express");

const router = express.Router();

const {
    createMaintenanceRequest,

    getMaintenanceRequests,
    getOwnerMaintenanceRequests,
    getMaintenanceRequestById,

    getMyAssignedMaintenanceRequests,
    getMyMaintenanceHistory,

    assignPriority,
    assignMaintenanceStaff,
    updateMaintenanceStatus,
    addMaintenanceNotes,
    recordCompletionDetails,
    recordMaintenanceCost,
    approveMaintenanceCost,
    getMaintenanceHistory

} = require("../controllers/maintenanceController");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

// =====================================================
// GET MAINTENANCE REQUESTS
//
// Administrator -> all requests
// Owner -> own-property requests
//
// GET /api/maintenance-requests
// =====================================================

router.get(
    "/",
    authenticateToken,
    authorizeRole("Administrator", "Owner"),
    getMaintenanceRequests
);

// =====================================================
// GET OWNER MAINTENANCE REQUESTS
//
// Owner -> own requests
// Administrator -> can inspect an owner's requests
//
// GET /api/maintenance-requests/owner
// GET /api/maintenance-requests/owner/:id
// =====================================================

router.get(
    "/owner",
    authenticateToken,
    authorizeRole("Owner"),
    getOwnerMaintenanceRequests
);

router.get(
    "/owner/:id",
    authenticateToken,
    authorizeRole("Administrator"),
    getOwnerMaintenanceRequests
);


// =====================================================
// CREATE MAINTENANCE REQUEST
//
// Owner
// Administrator
// Sales Agent
//
// POST /api/maintenance-requests
// =====================================================

router.post(
    "/",
    authenticateToken,
    authorizeRole(
        "Owner",
        "Administrator",
        "Sales Agent"
    ),
    createMaintenanceRequest
);

// =====================================================
router.get(
    "/history",
    authenticateToken,
    authorizeRole("Administrator", "Owner"),
    getMaintenanceHistory
);

router.get(
    "/my-assigned",
    authenticateToken,
    authorizeRole("Maintenance Staff"),
    getMyAssignedMaintenanceRequests
);

router.get(
    "/my-history",
    authenticateToken,
    authorizeRole("Maintenance Staff"),
    getMyMaintenanceHistory
);

router.get(
    "/:id",
    authenticateToken,
    authorizeRole("Administrator", "Owner", "Maintenance Staff"),
    getMaintenanceRequestById
);

// =====================================================
// ASSIGN PRIORITY
//
// Administrator -> any request
// Owner -> own property
//
// PUT /api/maintenance-requests/:id/priority
// =====================================================

router.put(
    "/:id/priority",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Owner"
    ),
    assignPriority
);
// =====================================================
// ASSIGN MAINTENANCE STAFF
//
// Administrator -> any maintenance request
//
// Owner -> CANNOT assign staff
// Maintenance Staff -> CANNOT assign staff
//
// PUT /api/maintenance/:id/assign-staff
// =====================================================

router.put(
    "/:id/assign-staff",
    authenticateToken,
    authorizeRole("Administrator"),
    assignMaintenanceStaff
);

// =====================================================
// UPDATE MAINTENANCE STATUS
//
// Administrator -> any request
// Owner -> own property
// Maintenance Staff -> assigned request
//
// PUT /api/maintenance-requests/:id/status
// =====================================================

router.put(
    "/:id/status",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Owner",
        "Maintenance Staff"
    ),
    updateMaintenanceStatus
);

// =====================================================
// ADD MAINTENANCE NOTES
//
// Maintenance Staff only
//
// PUT /api/maintenance-requests/:id/notes
// =====================================================

router.put(
    "/:id/notes",
    authenticateToken,
    authorizeRole("Maintenance Staff"),
    addMaintenanceNotes
);

// =====================================================
// RECORD COMPLETION DETAILS
//
// Maintenance Staff only
//
// PUT /api/maintenance-requests/:id/completion
// =====================================================

router.put(
    "/:id/completion",
    authenticateToken,
    authorizeRole("Maintenance Staff"),
    recordCompletionDetails
);

// =====================================================
// RECORD MAINTENANCE COST
//
// Administrator -> any request
// Owner -> own property
//
// PUT /api/maintenance-requests/:id/cost
// =====================================================

router.put(
    "/:id/cost",
    authenticateToken,
    authorizeRole(
        "Administrator",
        "Owner"
    ),
    recordMaintenanceCost
);

// =====================================================
// APPROVE / REJECT MAINTENANCE COST
//
// Owner -> own property
//
// PUT /api/maintenance-requests/:id/cost-approval
// =====================================================

router.put(
    "/:id/cost-approval",
    authenticateToken,
    authorizeRole("Owner"),
    approveMaintenanceCost
);

module.exports = router;
