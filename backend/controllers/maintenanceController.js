const pool = require("../config/db");

// =====================================================
// CONSTANTS
// =====================================================

const VALID_CATEGORIES = [
    "Water",
    "Electricity",
    "Plumbing",
    "Building",
    "Cleaning",
    "Security"
];

const VALID_PRIORITIES = [
    "Low",
    "Medium",
    "High",
    "Critical"
];

const VALID_STATUSES = [
    "Pending",
    "In Progress",
    "Completed",
    "Rejected"
];

const VALID_RESPONSIBLE_PARTIES = [
    "Owner",
    "Tenant"
];

const VALID_COST_APPROVAL_STATUSES = [
    "Approved",
    "Rejected"
];


// =====================================================
// HELPER: GET OWNER ID FROM USER ID
// =====================================================

const getOwnerIdByUserId = async (userId) => {
    const [rows] = await pool.query(
        `
        SELECT OwnerID
        FROM owners
        WHERE UserID = ?
        LIMIT 1
        `,
        [userId]
    );

    return rows.length > 0 ? rows[0].OwnerID : null;
};


// =====================================================
// HELPER: GET MAINTENANCE REQUEST WITH OWNER
// =====================================================

const getRequestWithOwner = async (maintenanceRequestId) => {
    const [rows] = await pool.query(
        `
        SELECT
            mr.MaintenanceRequestID,
            mr.PropertyID,
            mr.ReportedBy,
            mr.AssignedStaffID,
            mr.Category,
            mr.Description,
            mr.MaintenanceNotes,
            mr.CompletionDetails,
            mr.Priority,
            mr.EstimatedCost,
            mr.ActualCost,
            mr.CostApprovalStatus,
            mr.CostApprovedBy,
            mr.CostApprovedDate,
            mr.ResponsibleParty,
            mr.Status,
            mr.RequestDate,
            mr.CompletionDate,

            p.PropertyName,
            p.OwnerID,

            o.UserID AS OwnerUserID

        FROM maintenance_requests mr

        INNER JOIN properties p
            ON mr.PropertyID = p.PropertyID

        LEFT JOIN owners o
            ON p.OwnerID = o.OwnerID

        WHERE mr.MaintenanceRequestID = ?

        LIMIT 1
        `,
        [maintenanceRequestId]
    );

    return rows.length > 0 ? rows[0] : null;
};


// =====================================================
// HELPER: CHECK REQUEST ACCESS
// =====================================================

const checkRequestAccess = async (req, maintenanceRequestId) => {
    const request = await getRequestWithOwner(maintenanceRequestId);

    if (!request) {
        return {
            allowed: false,
            status: 404,
            message: "Maintenance request not found."
        };
    }

    const role = req.user.role;
    const userId = req.user.userId;

    // -------------------------------------------------
    // ADMINISTRATOR
    // -------------------------------------------------

    if (role === "Administrator") {
        return {
            allowed: true,
            request
        };
    }

    // -------------------------------------------------
    // OWNER
    // -------------------------------------------------

    if (role === "Owner") {
        if (Number(request.OwnerUserID) !== Number(userId)) {
            return {
                allowed: false,
                status: 403,
                message:
                    "Access denied. You can only manage maintenance requests for your own properties."
            };
        }

        return {
            allowed: true,
            request
        };
    }

    // -------------------------------------------------
    // MAINTENANCE STAFF
    // -------------------------------------------------

    if (role === "Maintenance Staff") {
        const [staffRows] = await pool.query(
            `
            SELECT StaffID
            FROM maintenance_staff
            WHERE UserID = ?
            LIMIT 1
            `,
            [userId]
        );

        if (staffRows.length === 0) {
            return {
                allowed: false,
                status: 403,
                message: "Maintenance staff profile not found."
            };
        }

        const staffId = staffRows[0].StaffID;

        if (Number(request.AssignedStaffID) !== Number(staffId)) {
            return {
                allowed: false,
                status: 403,
                message:
                    "Access denied. This maintenance request is not assigned to you."
            };
        }

        return {
            allowed: true,
            request
        };
    }

    // -------------------------------------------------
    // SALES AGENT
    // -------------------------------------------------

    if (role === "Sales Agent") {
        if (Number(request.ReportedBy) !== Number(userId)) {
            return {
                allowed: false,
                status: 403,
                message:
                    "Access denied. You can only view maintenance requests that you reported."
            };
        }

        return {
            allowed: true,
            request
        };
    }

    return {
        allowed: false,
        status: 403,
        message: "You are not authorized to access this maintenance request."
    };
};


// =====================================================
// CREATE MAINTENANCE REQUEST
// Owner, Administrator, Sales Agent
// =====================================================

const createMaintenanceRequest = async (req, res) => {
    try {
        const {
            propertyId,
            category,
            description,
            priority,
            estimatedCost,
            responsibleParty
        } = req.body;

        const reportedBy = req.user.userId;

        // -------------------------------------------------
        // REQUIRED FIELDS
        // -------------------------------------------------

        if (!propertyId) {
            return res.status(400).json({
                message: "Property ID is required."
            });
        }

        if (!category) {
            return res.status(400).json({
                message: "Category is required."
            });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({
                message: "Description is required."
            });
        }

        // -------------------------------------------------
        // VALIDATE CATEGORY
        // -------------------------------------------------

        if (!VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({
                message: `Invalid category. Allowed categories: ${VALID_CATEGORIES.join(", ")}.`
            });
        }

        // -------------------------------------------------
        // VALIDATE PRIORITY
        // -------------------------------------------------

        const finalPriority = priority || "Medium";

        if (!VALID_PRIORITIES.includes(finalPriority)) {
            return res.status(400).json({
                message: `Invalid priority. Allowed priorities: ${VALID_PRIORITIES.join(", ")}.`
            });
        }

        // -------------------------------------------------
        // VALIDATE RESPONSIBLE PARTY
        // -------------------------------------------------

        if (
            responsibleParty &&
            !VALID_RESPONSIBLE_PARTIES.includes(responsibleParty)
        ) {
            return res.status(400).json({
                message: `Invalid responsible party. Allowed values: ${VALID_RESPONSIBLE_PARTIES.join(", ")}.`
            });
        }

        // -------------------------------------------------
        // VALIDATE ESTIMATED COST
        // -------------------------------------------------

        if (
            estimatedCost !== undefined &&
            estimatedCost !== null &&
            estimatedCost !== ""
        ) {
            const cost = Number(estimatedCost);

            if (Number.isNaN(cost) || cost < 0) {
                return res.status(400).json({
                    message: "Estimated cost must be a valid non-negative number."
                });
            }
        }

        // -------------------------------------------------
        // CHECK PROPERTY
        // -------------------------------------------------

        const [propertyRows] = await pool.query(
            `
            SELECT
                p.PropertyID,
                p.PropertyName,
                p.OwnerID,
                o.UserID AS OwnerUserID
            FROM properties p
            LEFT JOIN owners o
                ON p.OwnerID = o.OwnerID
            WHERE p.PropertyID = ?
            LIMIT 1
            `,
            [propertyId]
        );

        if (propertyRows.length === 0) {
            return res.status(404).json({
                message: "Property not found."
            });
        }

        const property = propertyRows[0];

        // -------------------------------------------------
        // OWNER CAN ONLY CREATE FOR OWN PROPERTY
        // -------------------------------------------------

        if (req.user.role === "Owner") {
            if (Number(property.OwnerUserID) !== Number(req.user.userId)) {
                return res.status(403).json({
                    message:
                        "You can only create maintenance requests for your own properties."
                });
            }
        }

        // -------------------------------------------------
        // INSERT
        // -------------------------------------------------

        const [result] = await pool.query(
            `
            INSERT INTO maintenance_requests
            (
                PropertyID,
                ReportedBy,
                Category,
                Description,
                Priority,
                EstimatedCost,
                ResponsibleParty,
                Status,
                CostApprovalStatus,
                RequestDate
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending', NOW())
            `,
            [
                propertyId,
                reportedBy,
                category,
                description.trim(),
                finalPriority,
                estimatedCost || null,
                responsibleParty || null
            ]
        );

        return res.status(201).json({
            message: "Maintenance request created successfully.",
            maintenanceRequestId: result.insertId
        });

    } catch (error) {
        console.error(
            "CREATE MAINTENANCE REQUEST ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to create maintenance request.",
            error: error.message
        });
    }
};


// =====================================================
// GET ALL MAINTENANCE REQUESTS
// Administrator = all
// Owner = own properties
// =====================================================

const getMaintenanceRequests = async (req, res) => {
    try {
        let query = `
            SELECT
                mr.MaintenanceRequestID,
                mr.PropertyID,
                p.PropertyName,
                p.Address,

                mr.ReportedBy,
                reporter.FullName AS ReportedByName,

                mr.AssignedStaffID,
                ms.FullName AS AssignedStaffName,
                ms.PhoneNumber AS AssignedStaffPhone,
                ms.Email AS AssignedStaffEmail,

                mr.Category,
                mr.Description,
                mr.MaintenanceNotes,
                mr.CompletionDetails,

                mr.Priority,
                mr.EstimatedCost,
                mr.ActualCost,

                mr.CostApprovalStatus,
                mr.CostApprovedBy,
                approver.FullName AS CostApprovedByName,
                mr.CostApprovedDate,

                mr.ResponsibleParty,
                mr.Status,
                mr.RequestDate,
                mr.CompletionDate

            FROM maintenance_requests mr

            INNER JOIN properties p
                ON mr.PropertyID = p.PropertyID

            LEFT JOIN users reporter
                ON mr.ReportedBy = reporter.UserID

            LEFT JOIN maintenance_staff ms
                ON mr.AssignedStaffID = ms.StaffID

            LEFT JOIN users approver
                ON mr.CostApprovedBy = approver.UserID
        `;

        const params = [];

        // -------------------------------------------------
        // OWNER FILTER
        // -------------------------------------------------

        if (req.user.role === "Owner") {
            const ownerId = await getOwnerIdByUserId(req.user.userId);

            if (!ownerId) {
                return res.status(404).json({
                    message: "Owner profile not found."
                });
            }

            query += `
                WHERE p.OwnerID = ?
            `;

            params.push(ownerId);
        }

        query += `
            ORDER BY mr.RequestDate DESC
        `;

        const [rows] = await pool.query(query, params);

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            "GET MAINTENANCE REQUESTS ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to retrieve maintenance requests.",
            error: error.message
        });
    }
};


// =====================================================
// GET OWNER MAINTENANCE REQUESTS
// Owner = own properties
// Administrator = all requests
// =====================================================

const getOwnerMaintenanceRequests = async (req, res) => {
    try {
        let query = `
            SELECT
                mr.MaintenanceRequestID,
                mr.PropertyID,
                p.PropertyName,
                p.Address,

                mr.ReportedBy,
                reporter.FullName AS ReportedByName,

                mr.AssignedStaffID,
                ms.FullName AS AssignedStaffName,
                ms.PhoneNumber AS AssignedStaffPhone,
                ms.Email AS AssignedStaffEmail,

                mr.Category,
                mr.Description,
                mr.MaintenanceNotes,
                mr.CompletionDetails,

                mr.Priority,
                mr.EstimatedCost,
                mr.ActualCost,

                mr.CostApprovalStatus,
                mr.CostApprovedBy,
                approver.FullName AS CostApprovedByName,
                mr.CostApprovedDate,

                mr.ResponsibleParty,
                mr.Status,
                mr.RequestDate,
                mr.CompletionDate

            FROM maintenance_requests mr

            INNER JOIN properties p
                ON mr.PropertyID = p.PropertyID

            LEFT JOIN users reporter
                ON mr.ReportedBy = reporter.UserID

            LEFT JOIN maintenance_staff ms
                ON mr.AssignedStaffID = ms.StaffID

            LEFT JOIN users approver
                ON mr.CostApprovedBy = approver.UserID
        `;

        const params = [];

        if (req.user.role === "Owner") {
            const ownerId = await getOwnerIdByUserId(req.user.userId);

            if (!ownerId) {
                return res.status(404).json({
                    message: "Owner profile not found."
                });
            }

            query += `
                WHERE p.OwnerID = ?
            `;

            params.push(ownerId);
        }

        query += `
            ORDER BY mr.RequestDate DESC
        `;

        const [rows] = await pool.query(query, params);

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            "GET OWNER MAINTENANCE REQUESTS ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to retrieve owner maintenance requests.",
            error: error.message
        });
    }
};


// =====================================================
// GET MAINTENANCE REQUEST BY ID
// =====================================================

const getMaintenanceRequestById = async (req, res) => {
    try {
        const maintenanceRequestId = req.params.id;

        const access = await checkRequestAccess(
            req,
            maintenanceRequestId
        );

        if (!access.allowed) {
            return res.status(access.status).json({
                message: access.message
            });
        }

        const [rows] = await pool.query(
            `
            SELECT
                mr.MaintenanceRequestID,
                mr.PropertyID,

                p.PropertyName,
                p.Address,

                mr.ReportedBy,
                reporter.FullName AS ReportedByName,
                reporter.Email AS ReporterEmail,

                mr.AssignedStaffID,
                ms.FullName AS AssignedStaffName,
                ms.PhoneNumber AS AssignedStaffPhone,
                ms.Email AS AssignedStaffEmail,

                mr.Category,
                mr.Description,
                mr.MaintenanceNotes,
                mr.CompletionDetails,

                mr.Priority,
                mr.EstimatedCost,
                mr.ActualCost,

                mr.CostApprovalStatus,
                mr.CostApprovedBy,
                approver.FullName AS CostApprovedByName,
                mr.CostApprovedDate,

                mr.ResponsibleParty,
                mr.Status,
                mr.RequestDate,
                mr.CompletionDate

            FROM maintenance_requests mr

            INNER JOIN properties p
                ON mr.PropertyID = p.PropertyID

            LEFT JOIN users reporter
                ON mr.ReportedBy = reporter.UserID

            LEFT JOIN maintenance_staff ms
                ON mr.AssignedStaffID = ms.StaffID

            LEFT JOIN users approver
                ON mr.CostApprovedBy = approver.UserID

            WHERE mr.MaintenanceRequestID = ?

            LIMIT 1
            `,
            [maintenanceRequestId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Maintenance request not found."
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error(
            "GET MAINTENANCE REQUEST BY ID ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to retrieve maintenance request.",
            error: error.message
        });
    }
};


// =====================================================
// ASSIGN PRIORITY
// Administrator / Owner
// =====================================================

const assignPriority = async (req, res) => {
    try {
        const maintenanceRequestId = req.params.id;
        const { priority } = req.body;

        if (!priority) {
            return res.status(400).json({
                message: "Priority is required."
            });
        }

        if (!VALID_PRIORITIES.includes(priority)) {
            return res.status(400).json({
                message: `Invalid priority. Allowed values: ${VALID_PRIORITIES.join(", ")}.`
            });
        }

        const access = await checkRequestAccess(
            req,
            maintenanceRequestId
        );

        if (!access.allowed) {
            return res.status(access.status).json({
                message: access.message
            });
        }

        await pool.query(
            `
            UPDATE maintenance_requests
            SET Priority = ?
            WHERE MaintenanceRequestID = ?
            `,
            [priority, maintenanceRequestId]
        );

        return res.status(200).json({
            message: "Maintenance priority updated successfully."
        });

    } catch (error) {
        console.error(
            "ASSIGN PRIORITY ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to update maintenance priority.",
            error: error.message
        });
    }
};
// =====================================================
// ASSIGN MAINTENANCE STAFF
// Administrator only
// =====================================================

const assignMaintenanceStaff = async (req, res) => {
    try {
        const maintenanceRequestId = req.params.id;

        // Frontend sends AssignedStaffID
        const { AssignedStaffID } = req.body;

        // -------------------------------------------------
        // VALIDATE STAFF ID
        // -------------------------------------------------

        if (!AssignedStaffID) {
            return res.status(400).json({
                message: "AssignedStaffID is required."
            });
        }

        const staffId = Number(AssignedStaffID);

        if (!Number.isInteger(staffId) || staffId <= 0) {
            return res.status(400).json({
                message: "AssignedStaffID must be a valid staff ID."
            });
        }

        // -------------------------------------------------
        // CHECK REQUEST
        // -------------------------------------------------

        const access = await checkRequestAccess(
            req,
            maintenanceRequestId
        );

        if (!access.allowed) {
            return res.status(access.status).json({
                message: access.message
            });
        }

        // -------------------------------------------------
        // ADMINISTRATOR ONLY
        // -------------------------------------------------

        if (req.user.role !== "Administrator") {
            return res.status(403).json({
                message:
                    "Only an Administrator can assign maintenance staff."
            });
        }

        // -------------------------------------------------
        // CHECK STAFF
        // -------------------------------------------------

        const [staffRows] = await pool.query(
            `
            SELECT
                StaffID,
                UserID,
                FullName,
                PhoneNumber,
                Email,
                Status
            FROM maintenance_staff
            WHERE StaffID = ?
            LIMIT 1
            `,
            [staffId]
        );

        if (staffRows.length === 0) {
            return res.status(404).json({
                message: "Maintenance staff not found."
            });
        }

        const staff = staffRows[0];

        // -------------------------------------------------
        // STAFF MUST BE ACTIVE
        // -------------------------------------------------

        if (staff.Status !== "Active") {
            return res.status(400).json({
                message:
                    "Cannot assign inactive maintenance staff."
            });
        }

        // -------------------------------------------------
        // ASSIGN STAFF
        // -------------------------------------------------
        //
        // IMPORTANT:
        // Do NOT use Status = 'Assigned'
        //
        // Your database allows:
        // Pending
        // In Progress
        // Completed
        // Rejected
        //
        // Assignment is stored using AssignedStaffID.
        // -------------------------------------------------

        const [result] = await pool.query(
            `
            UPDATE maintenance_requests
            SET AssignedStaffID = ?
            WHERE MaintenanceRequestID = ?
            `,
            [
                staff.StaffID,
                maintenanceRequestId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Maintenance request not found."
            });
        }

        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        return res.status(200).json({
            message:
                "Maintenance staff assigned successfully.",

            assignedStaff: {
                StaffID: staff.StaffID,
                UserID: staff.UserID,
                FullName: staff.FullName,
                PhoneNumber: staff.PhoneNumber,
                Email: staff.Email
            }
        });

    } catch (error) {
        console.error(
            "ASSIGN MAINTENANCE STAFF ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to assign maintenance staff.",
            error: error.message
        });
    }
};
// =====================================================
// UPDATE MAINTENANCE STATUS
// Administrator / Owner / Assigned Maintenance Staff
// =====================================================

const updateMaintenanceStatus = async (req, res) => {
    try {
        const maintenanceRequestId = req.params.id;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required."
            });
        }

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Allowed values: ${VALID_STATUSES.join(", ")}.`
            });
        }

        const access = await checkRequestAccess(
            req,
            maintenanceRequestId
        );

        if (!access.allowed) {
            return res.status(access.status).json({
                message: access.message
            });
        }

        if (status === "Completed") {
            await pool.query(
                `
                UPDATE maintenance_requests
                SET
                    Status = ?,
                    CompletionDate = NOW()
                WHERE MaintenanceRequestID = ?
                `,
                [status, maintenanceRequestId]
            );
        } else {
            await pool.query(
                `
                UPDATE maintenance_requests
                SET
                    Status = ?
                WHERE MaintenanceRequestID = ?
                `,
                [status, maintenanceRequestId]
            );
        }

        return res.status(200).json({
            message: "Maintenance status updated successfully."
        });

    } catch (error) {
        console.error(
            "UPDATE MAINTENANCE STATUS ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to update maintenance status.",
            error: error.message
        });
    }
};


// =====================================================
// ADD MAINTENANCE NOTES
// Maintenance Staff only
// =====================================================

const addMaintenanceNotes = async (req, res) => {
    try {
        const maintenanceRequestId = req.params.id;
        const { maintenanceNotes } = req.body;

        if (!maintenanceNotes || !maintenanceNotes.trim()) {
            return res.status(400).json({
                message: "Maintenance notes are required."
            });
        }

        const access = await checkRequestAccess(
            req,
            maintenanceRequestId
        );

        if (!access.allowed) {
            return res.status(access.status).json({
                message: access.message
            });
        }

        if (req.user.role !== "Maintenance Staff") {
            return res.status(403).json({
                message:
                    "Only assigned maintenance staff can add maintenance notes."
            });
        }

        await pool.query(
            `
            UPDATE maintenance_requests
            SET MaintenanceNotes = ?
            WHERE MaintenanceRequestID = ?
            `,
            [
                maintenanceNotes.trim(),
                maintenanceRequestId
            ]
        );

        return res.status(200).json({
            message: "Maintenance notes added successfully."
        });

    } catch (error) {
        console.error(
            "ADD MAINTENANCE NOTES ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to add maintenance notes.",
            error: error.message
        });
    }
};


// =====================================================
// RECORD COMPLETION DETAILS
// Maintenance Staff only
// =====================================================

const recordCompletionDetails = async (req, res) => {
    try {
        const maintenanceRequestId = req.params.id;
        const { completionDetails } = req.body;

        if (!completionDetails || !completionDetails.trim()) {
            return res.status(400).json({
                message: "Completion details are required."
            });
        }

        const access = await checkRequestAccess(
            req,
            maintenanceRequestId
        );

        if (!access.allowed) {
            return res.status(access.status).json({
                message: access.message
            });
        }

        if (req.user.role !== "Maintenance Staff") {
            return res.status(403).json({
                message:
                    "Only assigned maintenance staff can record completion details."
            });
        }

        await pool.query(
            `
            UPDATE maintenance_requests
            SET
                CompletionDetails = ?,
                CompletionDate = NOW(),
                Status = 'Completed'
            WHERE MaintenanceRequestID = ?
            `,
            [
                completionDetails.trim(),
                maintenanceRequestId
            ]
        );

        return res.status(200).json({
            message:
                "Completion details recorded successfully."
        });

    } catch (error) {
        console.error(
            "RECORD COMPLETION DETAILS ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to record completion details.",
            error: error.message
        });
    }
};


// =====================================================
// RECORD ACTUAL MAINTENANCE COST
// Administrator / Owner
// =====================================================

const recordMaintenanceCost = async (req, res) => {
    try {
        const maintenanceRequestId = req.params.id;
        const { actualCost } = req.body;

        if (
            actualCost === undefined ||
            actualCost === null ||
            actualCost === ""
        ) {
            return res.status(400).json({
                message: "Actual cost is required."
            });
        }

        const cost = Number(actualCost);

        if (Number.isNaN(cost) || cost < 0) {
            return res.status(400).json({
                message:
                    "Actual cost must be a valid non-negative number."
            });
        }

        const access = await checkRequestAccess(
            req,
            maintenanceRequestId
        );

        if (!access.allowed) {
            return res.status(access.status).json({
                message: access.message
            });
        }

        await pool.query(
            `
            UPDATE maintenance_requests
            SET
                ActualCost = ?,
                CostApprovalStatus = 'Pending',
                CostApprovedBy = NULL,
                CostApprovedDate = NULL
            WHERE MaintenanceRequestID = ?
            `,
            [
                cost,
                maintenanceRequestId
            ]
        );

        return res.status(200).json({
            message:
                "Actual maintenance cost recorded successfully."
        });

    } catch (error) {
        console.error(
            "RECORD MAINTENANCE COST ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to record maintenance cost.",
            error: error.message
        });
    }
};


// =====================================================
// APPROVE / REJECT MAINTENANCE COST
// Owner only
// =====================================================

const approveMaintenanceCost = async (req, res) => {
    try {
        const maintenanceRequestId = req.params.id;
        const { approvalStatus } = req.body;

        if (!approvalStatus) {
            return res.status(400).json({
                message:
                    "Approval status is required."
            });
        }

        if (
            !VALID_COST_APPROVAL_STATUSES.includes(
                approvalStatus
            )
        ) {
            return res.status(400).json({
                message:
                    "Approval status must be Approved or Rejected."
            });
        }

        const access = await checkRequestAccess(
            req,
            maintenanceRequestId
        );

        if (!access.allowed) {
            return res.status(access.status).json({
                message: access.message
            });
        }

        if (req.user.role !== "Owner") {
            return res.status(403).json({
                message:
                    "Only the property owner can approve or reject maintenance costs."
            });
        }

        if (
            access.request.ActualCost === null ||
            access.request.ActualCost === undefined
        ) {
            return res.status(400).json({
                message:
                    "Actual maintenance cost must be recorded before approval."
            });
        }

        await pool.query(
            `
            UPDATE maintenance_requests
            SET
                CostApprovalStatus = ?,
                CostApprovedBy = ?,
                CostApprovedDate = NOW()
            WHERE MaintenanceRequestID = ?
            `,
            [
                approvalStatus,
                req.user.userId,
                maintenanceRequestId
            ]
        );

        return res.status(200).json({
            message:
                `Maintenance cost ${approvalStatus.toLowerCase()} successfully.`
        });

    } catch (error) {
        console.error(
            "APPROVE MAINTENANCE COST ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to process maintenance cost approval.",
            error: error.message
        });
    }
};


// =====================================================
// GET MAINTENANCE HISTORY
// Administrator = all
// Owner = own properties
// =====================================================

const getMaintenanceHistory = async (req, res) => {
    try {
        let query = `
            SELECT
                mr.MaintenanceRequestID,
                mr.PropertyID,
                p.PropertyName,
                p.Address,

                mr.ReportedBy,
                reporter.FullName AS ReportedByName,

                mr.AssignedStaffID,
                ms.FullName AS AssignedStaffName,

                mr.Category,
                mr.Description,
                mr.MaintenanceNotes,
                mr.CompletionDetails,

                mr.Priority,
                mr.EstimatedCost,
                mr.ActualCost,

                mr.CostApprovalStatus,
                mr.CostApprovedBy,
                approver.FullName AS CostApprovedByName,
                mr.CostApprovedDate,

                mr.ResponsibleParty,
                mr.Status,
                mr.RequestDate,
                mr.CompletionDate

            FROM maintenance_requests mr

            INNER JOIN properties p
                ON mr.PropertyID = p.PropertyID

            LEFT JOIN users reporter
                ON mr.ReportedBy = reporter.UserID

            LEFT JOIN maintenance_staff ms
                ON mr.AssignedStaffID = ms.StaffID

            LEFT JOIN users approver
                ON mr.CostApprovedBy = approver.UserID

            WHERE mr.Status IN ('Completed', 'Rejected')
        `;

        const params = [];

        if (req.user.role === "Owner") {
            const ownerId = await getOwnerIdByUserId(req.user.userId);

            if (!ownerId) {
                return res.status(404).json({
                    message: "Owner profile not found."
                });
            }

            query += `
                AND p.OwnerID = ?
            `;

            params.push(ownerId);
        }

        query += `
            ORDER BY
                mr.CompletionDate DESC,
                mr.RequestDate DESC
        `;

        const [rows] = await pool.query(
            query,
            params
        );

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            "GET MAINTENANCE HISTORY ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to retrieve maintenance history.",
            error: error.message
        });
    }
};

// =====================================================
// GET MY ASSIGNED MAINTENANCE REQUESTS
// Maintenance Staff only
// =====================================================

const getMyAssignedMaintenanceRequests = async (req, res) => {
    try {
        const userId = req.user.userId;

        // ---------------------------------------------
        // FIND MAINTENANCE STAFF PROFILE
        // ---------------------------------------------

        const [staffRows] = await pool.query(
            `
            SELECT
                StaffID,
                FullName,
                PhoneNumber,
                Email,
                Status
            FROM maintenance_staff
            WHERE UserID = ?
            LIMIT 1
            `,
            [userId]
        );

        if (staffRows.length === 0) {
            return res.status(404).json({
                message: "Maintenance staff profile not found."
            });
        }

        const staff = staffRows[0];

        // ---------------------------------------------
        // GET REQUESTS ASSIGNED TO THIS STAFF
        // ---------------------------------------------

        const [requests] = await pool.query(
            `
            SELECT
                mr.MaintenanceRequestID,
                mr.PropertyID,

                p.PropertyName,
                p.Address,

                mr.ReportedBy,
                reporter.FullName AS ReportedByName,

                mr.AssignedStaffID,
                ms.FullName AS AssignedStaffName,

                mr.Category,
                mr.Description,
                mr.MaintenanceNotes,
                mr.CompletionDetails,

                mr.Priority,
                mr.EstimatedCost,

                mr.ResponsibleParty,
                mr.Status,

                mr.RequestDate,
                mr.CompletionDate

            FROM maintenance_requests mr

            INNER JOIN properties p
                ON mr.PropertyID = p.PropertyID

            LEFT JOIN users reporter
                ON mr.ReportedBy = reporter.UserID

            LEFT JOIN maintenance_staff ms
                ON mr.AssignedStaffID = ms.StaffID

            WHERE mr.AssignedStaffID = ?

            ORDER BY
                CASE
                    WHEN mr.Status = 'Pending' THEN 1
                    WHEN mr.Status = 'In Progress' THEN 2
                    WHEN mr.Status = 'Completed' THEN 3
                    WHEN mr.Status = 'Rejected' THEN 4
                    ELSE 5
                END,
                mr.RequestDate DESC
            `,
            [staff.StaffID]
        );

        return res.status(200).json({
            success: true,
            staff: {
                StaffID: staff.StaffID,
                FullName: staff.FullName,
                PhoneNumber: staff.PhoneNumber,
                Email: staff.Email
            },
            count: requests.length,
            maintenanceRequests: requests
        });

    } catch (error) {
        console.error(
            "GET MY ASSIGNED MAINTENANCE REQUESTS ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to retrieve assigned maintenance requests.",
            error: error.message
        });
    }
};

// =====================================================
// GET MY MAINTENANCE HISTORY
// Maintenance Staff only
// Completed / Rejected requests assigned to logged-in staff
// =====================================================

const getMyMaintenanceHistory = async (req, res) => {
    try {
        const userId = req.user.userId;

        // ---------------------------------------------
        // FIND STAFF PROFILE
        // ---------------------------------------------

        const [staffRows] = await pool.query(
            `
            SELECT StaffID
            FROM maintenance_staff
            WHERE UserID = ?
            LIMIT 1
            `,
            [userId]
        );

        if (staffRows.length === 0) {
            return res.status(404).json({
                message: "Maintenance staff profile not found."
            });
        }

        const staffId = staffRows[0].StaffID;

        // ---------------------------------------------
        // GET STAFF HISTORY
        // ---------------------------------------------

        const [history] = await pool.query(
            `
            SELECT
                mr.MaintenanceRequestID,
                mr.PropertyID,

                p.PropertyName,
                p.Address,

                mr.Category,
                mr.Description,
                mr.MaintenanceNotes,
                mr.CompletionDetails,

                mr.Priority,
                mr.ResponsibleParty,
                mr.Status,

                mr.RequestDate,
                mr.CompletionDate

            FROM maintenance_requests mr

            INNER JOIN properties p
                ON mr.PropertyID = p.PropertyID

            WHERE
                mr.AssignedStaffID = ?
                AND mr.Status IN ('Completed', 'Rejected')

            ORDER BY
                mr.CompletionDate DESC,
                mr.RequestDate DESC
            `,
            [staffId]
        );

        return res.status(200).json({
            success: true,
            count: history.length,
            history
        });

    } catch (error) {
        console.error(
            "GET MY MAINTENANCE HISTORY ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to retrieve maintenance history.",
            error: error.message
        });
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
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
};
