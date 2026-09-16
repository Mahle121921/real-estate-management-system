const pool = require("../config/db");

// ==========================================
// GET SYSTEM SETTINGS
// Administrator only
// ==========================================
const getSettings = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                SettingID,
                SettingKey,
                SettingValue,
                UpdatedBy,
                UpdatedAt
            FROM system_settings
            ORDER BY SettingID ASC
        `);

        return res.status(200).json({
            success: true,
            count: rows.length,
            settings: rows
        });
    } catch (error) {
        console.error("Get settings error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving settings"
        });
    }
};


// ==========================================
// UPDATE SYSTEM SETTINGS
// Administrator only
// ==========================================
const updateSettings = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { settings } = req.body;
        const userId = req.user.userId;

        if (!Array.isArray(settings) || settings.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Settings data is required"
            });
        }

        await connection.beginTransaction();

        for (const setting of settings) {
            const { SettingKey, SettingValue } = setting;

            if (!SettingKey) {
                throw new Error("SettingKey is required");
            }

            await connection.query(
                `
                UPDATE system_settings
                SET
                    SettingValue = ?,
                    UpdatedBy = ?
                WHERE SettingKey = ?
                `,
                [
                    SettingValue ?? "",
                    userId,
                    SettingKey
                ]
            );
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "System settings updated successfully"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Update settings error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating settings"
        });

    } finally {
        connection.release();
    }
};


module.exports = {
    getSettings,
    updateSettings
};