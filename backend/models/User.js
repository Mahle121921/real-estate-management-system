const pool = require("../config/db");

const User = {
    // =====================================================
    // FIND USER BY EMAIL
    // =====================================================
    async findByEmail(email) {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE Email = ? LIMIT 1",
            [email]
        );

        return rows[0];
    },


    // =====================================================
    // FIND USER BY ID
    // =====================================================
    async findById(userId) {
        const [rows] = await pool.query(
            `SELECT
                UserID,
                FullName,
                Email,
                PhoneNumber,
                Role,
                Status
             FROM users
             WHERE UserID = ?
             LIMIT 1`,
            [userId]
        );

        return rows[0];
    },


    // =====================================================
    // SAVE PASSWORD RESET TOKEN
    // =====================================================
    async saveResetToken(userId, resetToken, resetTokenExpiry) {
        const [result] = await pool.query(
            `UPDATE users
             SET ResetToken = ?,
                 ResetTokenExpiry = ?
             WHERE UserID = ?`,
            [
                resetToken,
                resetTokenExpiry,
                userId
            ]
        );

        return result;
    },


    // =====================================================
    // FIND USER BY RESET TOKEN
    // =====================================================
    async findByResetToken(resetToken) {
        const [rows] = await pool.query(
            `SELECT
                UserID,
                FullName,
                Email,
                PasswordHash,
                ResetToken,
                ResetTokenExpiry,
                Status
             FROM users
             WHERE ResetToken = ?
             LIMIT 1`,
            [resetToken]
        );

        return rows[0];
    },


    // =====================================================
    // UPDATE PASSWORD
    // =====================================================
    async updatePassword(userId, passwordHash) {
        const [result] = await pool.query(
            `UPDATE users
             SET PasswordHash = ?,
                 ResetToken = NULL,
                 ResetTokenExpiry = NULL
             WHERE UserID = ?`,
            [
                passwordHash,
                userId
            ]
        );

        return result;
    }
};

module.exports = User;
