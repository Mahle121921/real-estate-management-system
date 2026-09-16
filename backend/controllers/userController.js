const bcrypt = require("bcryptjs");
const pool = require("../config/db");

// Get all users
const getUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT
                UserID,
                FullName,
                Email,
                PhoneNumber,
                Role,
                Status
            FROM users
            ORDER BY UserID ASC
        `);

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error("Get users error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve users"
        });
    }
};


// Get one user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await pool.query(
            `SELECT
                UserID,
                FullName,
                Email,
                PhoneNumber,
                Role,
                Status
             FROM users
             WHERE UserID = ?`,
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error("Get user by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// Create a new user
const createUser = async (req, res) => {
    try {
        const {
            fullName,
            email,
            phoneNumber,
            password,
            role
        } = req.body || {};

        // Validate required fields
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, password and role are required"
            });
        }

        const allowedRoles = [
            "Owner",
            "Administrator",
            "Sales Agent",
            "Maintenance Staff",
            "Customer"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role"
            });
        }

        const currentUserRole = req.user?.role;

        // Owner cannot create Administrator accounts
        if (
            currentUserRole === "Owner" &&
            role === "Administrator"
        ) {
            return res.status(403).json({
                success: false,
                message: "Owner cannot create Administrator accounts"
            });
        }

        // Check email
        const [existingUsers] = await pool.query(
            "SELECT UserID FROM users WHERE Email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            `INSERT INTO users
                (FullName, Email, PhoneNumber, PasswordHash, Role, Status)
             VALUES (?, ?, ?, ?, ?, 'Active')`,
            [
                fullName,
                email,
                phoneNumber || null,
                passwordHash,
                role
            ]
        );

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                UserID: result.insertId,
                FullName: fullName,
                Email: email,
                PhoneNumber: phoneNumber || null,
                Role: role,
                Status: "Active"
            }
        });

    } catch (error) {
        console.error("Create user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create user"
        });
    }
};


// Update a user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            fullName,
            email,
            phoneNumber,
            role
        } = req.body || {};

        if (!fullName || !email || !role) {
            return res.status(400).json({
                success: false,
                message: "Full name, email and role are required"
            });
        }

        const allowedRoles = [
            "Owner",
            "Administrator",
            "Sales Agent",
            "Maintenance Staff",
            "Customer"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role"
            });
        }

        const currentUserRole = req.user?.role;

        // Get target user
        const [existingUsers] = await pool.query(
            `SELECT
                UserID,
                FullName,
                Email,
                PhoneNumber,
                Role,
                Status
             FROM users
             WHERE UserID = ?`,
            [id]
        );

        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const existingUser = existingUsers[0];

        // Owner cannot modify Administrator accounts
        if (
            currentUserRole === "Owner" &&
            existingUser.Role === "Administrator"
        ) {
            return res.status(403).json({
                success: false,
                message: "Owner cannot modify Administrator accounts"
            });
        }

        // Owner cannot assign Administrator role
        if (
            currentUserRole === "Owner" &&
            role === "Administrator"
        ) {
            return res.status(403).json({
                success: false,
                message: "Owner cannot assign the Administrator role"
            });
        }

        // Prevent email duplication
        const [emailUsers] = await pool.query(
            `SELECT UserID
             FROM users
             WHERE Email = ? AND UserID != ?`,
            [email, id]
        );

        if (emailUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        await pool.query(
            `UPDATE users
             SET FullName = ?,
                 Email = ?,
                 PhoneNumber = ?,
                 Role = ?
             WHERE UserID = ?`,
            [
                fullName,
                email,
                phoneNumber || null,
                role,
                id
            ]
        );

        const [updatedUsers] = await pool.query(
            `SELECT
                UserID,
                FullName,
                Email,
                PhoneNumber,
                Role,
                Status
             FROM users
             WHERE UserID = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: updatedUsers[0]
        });

    } catch (error) {
        console.error("Update user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update user"
        });
    }
};


// Update user status
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};

        const allowedStatuses = ["Active", "Inactive"];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Active or Inactive"
            });
        }

        const currentUserRole = req.user?.role;

        const [existingUsers] = await pool.query(
            `SELECT
                UserID,
                FullName,
                Email,
                Role,
                Status
             FROM users
             WHERE UserID = ?`,
            [id]
        );

        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const existingUser = existingUsers[0];

        // Owner cannot deactivate/activate Administrator
        if (
            currentUserRole === "Owner" &&
            existingUser.Role === "Administrator"
        ) {
            return res.status(403).json({
                success: false,
                message: "Owner cannot change Administrator account status"
            });
        }

        // Prevent a user from changing their own account status
        if (
            Number(req.user?.userId) === Number(id)
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot change your own account status"
            });
        }

        await pool.query(
            `UPDATE users
             SET Status = ?
             WHERE UserID = ?`,
            [status, id]
        );

        const [updatedUsers] = await pool.query(
            `SELECT
                UserID,
                FullName,
                Email,
                PhoneNumber,
                Role,
                Status
             FROM users
             WHERE UserID = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: "User status updated successfully",
            user: updatedUsers[0]
        });

    } catch (error) {
        console.error("Update user status error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update user status"
        });
    }
};


// Prevent hard deletion of users
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const [existingUsers] = await pool.query(
            `SELECT
                UserID,
                FullName,
                Email,
                Role,
                Status
             FROM users
             WHERE UserID = ?`,
            [id]
        );

        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(409).json({
            success: false,
            message:
                "Users cannot be permanently deleted. Please set the user status to Inactive instead.",
            user: existingUsers[0]
        });

    } catch (error) {
        console.error("Delete user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to process user deletion"
        });
    }
};


module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser
};