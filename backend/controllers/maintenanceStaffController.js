const pool = require("../config/db");

// ==========================================
// GET ALL ACTIVE MAINTENANCE STAFF
// Administrator / Owner
// ==========================================
const getMaintenanceStaff = async (req, res) => {
    try {
        const [staff] = await pool.query(`
            SELECT
                StaffID,
                UserID,
                FullName,
                PhoneNumber,
                Email,
                Status
            FROM maintenance_staff
            WHERE Status = 'Active'
            ORDER BY FullName ASC
        `);

        res.json({
            success: true,
            data: staff
        });

    } catch (error) {
        console.error("GET MAINTENANCE STAFF ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load maintenance staff",
            error: error.message
        });
    }
};

// ==========================================
// GET ONE MAINTENANCE STAFF
// Administrator / Owner
// ==========================================
const getMaintenanceStaffById = async (req, res) => {
    try {
        const staffId = Number(req.params.id);

        if (!Number.isInteger(staffId) || staffId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid staff ID"
            });
        }

        const [staff] = await pool.query(`
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
        `, [staffId]);

        if (staff.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Maintenance staff not found"
            });
        }

        res.json({
            success: true,
            data: staff[0]
        });

    } catch (error) {
        console.error("GET MAINTENANCE STAFF BY ID ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load maintenance staff",
            error: error.message
        });
    }
};

module.exports = {
    getMaintenanceStaff,
    getMaintenanceStaffById
};
