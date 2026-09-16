const pool = require("../config/db");

// ======================================================
// GET USERS + ACTIVITY LOG PERMISSIONS
// Administrator only
// ======================================================

const getActivityLogPermissions = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                u.UserID,
                u.FullName,
                u.Email,
                u.Role,

                COALESCE(
                    p.PermissionID,
                    NULL
                ) AS PermissionID,

                COALESCE(
                    p.CanViewActivityLogs,
                    0
                ) AS CanViewActivityLogs,

                p.AuthorizedBy,

                au.FullName AS AuthorizedByName,

                p.AuthorizedAt

            FROM users u

            LEFT JOIN activity_log_permissions p
                ON p.UserID = u.UserID

            LEFT JOIN users au
                ON au.UserID = p.AuthorizedBy

            WHERE u.Role <> 'Administrator'

            ORDER BY u.FullName ASC
        `);

        return res.status(200).json({
            success: true,
            permissions: rows
        });

    } catch (error) {
        console.error(
            "GET ACTIVITY LOG PERMISSIONS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while loading activity log permissions."
        });
    }
};


// ======================================================
// AUTHORIZE / REVOKE ACTIVITY LOG ACCESS
// Administrator only
// ======================================================

const updateActivityLogPermission = async (req, res) => {
    try {
        const targetUserId = Number(req.params.userId);

        const canView =
            Number(req.body.canViewActivityLogs);

        const authorizedBy = req.user.userId;

        // ----------------------------------------------
        // VALIDATE USER ID
        // ----------------------------------------------

        if (!Number.isInteger(targetUserId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        // ----------------------------------------------
        // VALIDATE PERMISSION VALUE
        // ----------------------------------------------

        if (canView !== 0 && canView !== 1) {
            return res.status(400).json({
                success: false,
                message:
                    "CanViewActivityLogs must be 0 or 1."
            });
        }

        // ----------------------------------------------
        // CHECK TARGET USER
        // ----------------------------------------------

        const [users] = await pool.query(
            `
            SELECT
                UserID,
                FullName,
                Role
            FROM users
            WHERE UserID = ?
            LIMIT 1
            `,
            [targetUserId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const targetUser = users[0];

        // ----------------------------------------------
        // ADMINISTRATORS DON'T NEED PERMISSION
        // ----------------------------------------------

        if (targetUser.Role === "Administrator") {
            return res.status(400).json({
                success: false,
                message:
                    "Administrator already has activity log access."
            });
        }

        // ----------------------------------------------
        // INSERT OR UPDATE PERMISSION
        // ----------------------------------------------

        await pool.query(
            `
            INSERT INTO activity_log_permissions
            (
                UserID,
                CanViewActivityLogs,
                AuthorizedBy,
                AuthorizedAt
            )
            VALUES (?, ?, ?, NOW())

            ON DUPLICATE KEY UPDATE
                CanViewActivityLogs = VALUES(CanViewActivityLogs),
                AuthorizedBy = VALUES(AuthorizedBy),
                AuthorizedAt = NOW()
            `,
            [
                targetUserId,
                canView,
                authorizedBy
            ]
        );

        // ----------------------------------------------
        // RESPONSE
        // ----------------------------------------------

        return res.status(200).json({
            success: true,
            message:
                canView === 1
                    ? `${targetUser.FullName} is now authorized to view activity logs.`
                    : `${targetUser.FullName} is no longer authorized to view activity logs.`
        });

    } catch (error) {
        console.error(
            "UPDATE ACTIVITY LOG PERMISSION ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while updating activity log permission."
        });
    }
};


module.exports = {
    getActivityLogPermissions,
    updateActivityLogPermission
};