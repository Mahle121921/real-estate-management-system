const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const pool = require("../config/db");

// =====================================================
// LOGIN
// =====================================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findByEmail(email);

        console.log("LOGIN USER:", user);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        console.log("EMAIL:", user.Email);
        console.log("PASSWORD HASH:", user.PasswordHash);
        console.log("HASH LENGTH:", user.PasswordHash?.length);

        if (user.Status !== "Active") {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.PasswordHash
        );

        console.log("PASSWORD MATCH:", passwordMatch);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user.UserID,
                role: user.Role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                userId: user.UserID,
                fullName: user.FullName,
                email: user.Email,
                phoneNumber: user.PhoneNumber,
                role: user.Role,
                status: user.Status
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
};


// =====================================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// =====================================================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findByEmail(email);

        // Don't reveal whether an email exists
        if (!user) {
            return res.json({
                success: true,
                message:
                    "If an account with that email exists, a password reset link has been sent."
            });
        }

        // Generate secure random token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Token expires after 15 minutes
        const resetTokenExpiry = new Date(
            Date.now() + 15 * 60 * 1000
        );

        // Store token in database
        await User.saveResetToken(
            user.UserID,
            resetToken,
            resetTokenExpiry
        );

        // Reset URL
        const frontendUrl =
            process.env.FRONTEND_URL || "http://localhost:5173";

        const resetUrl =
            `${frontendUrl}/reset-password/${resetToken}`;

        // Nodemailer transporter
        const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

        // Send email
        await transporter.sendMail({
            from: `"Real Estate Management System" <${process.env.EMAIL_USER}>`,
            to: user.Email,
            subject: "Password Reset Request",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                    <h2>Password Reset</h2>

                    <p>Hello ${user.FullName},</p>

                    <p>
                        We received a request to reset your password.
                    </p>

                    <p>
                        Click the button below to create a new password:
                    </p>

                    <p style="margin: 30px 0;">
                        <a
                            href="${resetUrl}"
                            style="
                                background: #2563eb;
                                color: white;
                                padding: 12px 20px;
                                text-decoration: none;
                                border-radius: 6px;
                                display: inline-block;
                            "
                        >
                            Reset Password
                        </a>
                    </p>

                    <p>
                        This link will expire in <strong>15 minutes</strong>.
                    </p>

                    <p>
                        If you did not request a password reset,
                        you can safely ignore this email.
                    </p>

                    <p>
                        Regards,<br>
                        Real Estate Management System
                    </p>
                </div>
            `
        });

        console.log("PASSWORD RESET EMAIL SENT TO:", user.Email);

        res.json({
            success: true,
            message:
                "If an account with that email exists, a password reset link has been sent."
        });

    } catch (error) {
        console.error("Forgot password error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to process password reset request"
        });
    }
};


// =====================================================
// RESET PASSWORD
// POST /api/auth/reset-password
// =====================================================
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Reset token and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters long"
            });
        }

        // Find user by reset token
        const user = await User.findByResetToken(token);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        // Check expiration
        const now = new Date();

        if (
            !user.ResetTokenExpiry ||
            new Date(user.ResetTokenExpiry) < now
        ) {
            return res.status(400).json({
                success: false,
                message: "Reset token has expired"
            });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(
            newPassword,
            10
        );

        // Update password and remove reset token
        await User.updatePassword(
            user.UserID,
            passwordHash
        );

        res.json({
            success: true,
            message:
                "Password reset successfully. You can now log in with your new password."
        });

    } catch (error) {
        console.error("Reset password error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to reset password"
        });
    }
};


// =====================================================
// CUSTOMER REGISTRATION
// POST /api/auth/register
// =====================================================
const registerCustomer = async (req, res) => {
    let connection;

    try {
        const {
            FullName,
            Email,
            PhoneNumber,
            Password
        } = req.body;

        // ==========================================
        // VALIDATION
        // ==========================================

        if (
            !FullName ||
            !Email ||
            !PhoneNumber ||
            !Password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name, email, phone number and password are required"
            });
        }

        if (Password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters long"
            });
        }

        const email = Email.trim().toLowerCase();

        // ==========================================
        // CHECK EMAIL
        // ==========================================

        const [existingUsers] = await pool.query(
            `
            SELECT UserID
            FROM users
            WHERE LOWER(Email) = ?
            LIMIT 1
            `,
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists"
            });
        }

        // ==========================================
        // HASH PASSWORD
        // ==========================================

        const passwordHash = await bcrypt.hash(
            Password,
            10
        );

        // ==========================================
        // START TRANSACTION
        // ==========================================

        connection = await pool.getConnection();

        await connection.beginTransaction();

        // ==========================================
        // CREATE USER
        // ==========================================

        const [userResult] = await connection.query(
            `
            INSERT INTO users
            (
                FullName,
                Email,
                PhoneNumber,
                PasswordHash,
                Role,
                Status
            )
            VALUES (?, ?, ?, ?, 'Customer', 'Active')
            `,
            [
                FullName.trim(),
                email,
                PhoneNumber.trim(),
                passwordHash
            ]
        );

        const userId = userResult.insertId;

        // ==========================================
        // CREATE CUSTOMER PROFILE
        // ==========================================

        await connection.query(
            `
            INSERT INTO customers
            (
                UserID,
                FullName,
                PhoneNumber,
                Email,
                Status
            )
            VALUES (?, ?, ?, ?, 'Active')
            `,
            [
                userId,
                FullName.trim(),
                PhoneNumber.trim(),
                email
            ]
        );

        // ==========================================
        // COMMIT
        // ==========================================

        await connection.commit();

        res.status(201).json({
            success: true,
            message:
                "Customer account created successfully",
            user: {
                userId,
                fullName: FullName.trim(),
                email,
                phoneNumber: PhoneNumber.trim(),
                role: "Customer",
                status: "Active"
            }
        });

    } catch (error) {
        // ==========================================
        // ROLLBACK IF SOMETHING FAILS
        // ==========================================

        if (connection) {
            await connection.rollback();
        }

        console.error(
            "Customer registration error:",
            error
        );

        // Handle duplicate email safely
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists"
            });
        }

        res.status(500).json({
            success: false,
            message:
                "Server error during customer registration"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// =====================================================
// EXPORTS
// =====================================================
module.exports = {
    registerCustomer,
    login,
    forgotPassword,
    resetPassword
};
