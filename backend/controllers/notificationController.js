const pool = require("../config/db");
const {
    transporter
} = require("../config/email");

// ==========================================
// GET ALL NOTIFICATIONS
// Administrator
// ==========================================
const getNotifications = async (req, res) => {
    try {
        const [notifications] = await pool.query(`
            SELECT
                n.NotificationID,
                n.RecipientID,
                u.FullName AS RecipientName,
                u.Email AS RecipientEmail,
                u.Role AS RecipientRole,
                n.NotificationType,
                n.Message,
                n.SentDate,
                n.Status,
                n.IsRead,
                n.ReadDate
            FROM notifications n
            LEFT JOIN users u
                ON n.RecipientID = u.UserID
            ORDER BY n.NotificationID DESC
        `);

        res.json({
            success: true,
            count: notifications.length,
            notifications
        });

    } catch (error) {
        console.error("Get notifications error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve notifications"
        });
    }
};


// ==========================================
// GET OWNER NOTIFICATIONS
// Owner sees only their own notifications
// ==========================================
const getOwnerNotifications = async (req, res) => {
    try {
        const userId =
            req.user?.userId ||
            req.user?.UserID ||
            req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID not found"
            });
        }

        const [notifications] = await pool.query(`
            SELECT
                n.NotificationID,
                n.RecipientID,
                u.FullName AS RecipientName,
                u.Email AS RecipientEmail,
                u.Role AS RecipientRole,
                n.NotificationType,
                n.Message,
                n.SentDate,
                n.Status,
                n.IsRead,
                n.ReadDate
            FROM notifications n
            INNER JOIN users u
                ON n.RecipientID = u.UserID
            WHERE n.RecipientID = ?
            ORDER BY n.NotificationID DESC
        `, [userId]);

        res.json({
            success: true,
            count: notifications.length,
            notifications
        });

    } catch (error) {
        console.error(
            "Get owner notifications error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to retrieve owner notifications"
        });
    }
};


// ==========================================
// MARK OWNER NOTIFICATION AS READ
// Owner can only mark their own notification
// ==========================================
const markOwnerNotificationAsRead = async (req, res) => {
    try {
        const userId =
            req.user?.userId ||
            req.user?.UserID ||
            req.user?.id;

        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID not found"
            });
        }

        // Make sure this notification belongs to this Owner
        const [notifications] = await pool.query(`
            SELECT
                NotificationID
            FROM notifications
            WHERE NotificationID = ?
            AND RecipientID = ?
        `, [id, userId]);

        if (notifications.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        await pool.query(`
            UPDATE notifications
            SET
                IsRead = 1,
                ReadDate = NOW()
            WHERE NotificationID = ?
            AND RecipientID = ?
        `, [id, userId]);

        res.json({
            success: true,
            message: "Notification marked as read"
        });

    } catch (error) {
        console.error(
            "Mark notification as read error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to mark notification as read"
        });
    }
};


// ==========================================
// MARK ALL OWNER NOTIFICATIONS AS READ
// Owner can only update their own notifications
// ==========================================
const markAllOwnerNotificationsAsRead = async (req, res) => {
    try {
        const userId =
            req.user?.userId ||
            req.user?.UserID ||
            req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID not found"
            });
        }

        await pool.query(`
            UPDATE notifications
            SET
                IsRead = 1,
                ReadDate = NOW()
            WHERE RecipientID = ?
            AND IsRead = 0
        `, [userId]);

        res.json({
            success: true,
            message: "All notifications marked as read"
        });

    } catch (error) {
        console.error(
            "Mark all notifications as read error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to mark all notifications as read"
        });
    }
};


// ==========================================
// GET ACTIVE USERS FOR RECIPIENT SELECTION
// Administrator
// ==========================================
const getNotificationRecipients = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT
                UserID,
                FullName,
                Email,
                Role
            FROM users
            WHERE Status = 'Active'
            ORDER BY FullName ASC
        `);

        res.json({
            success: true,
            recipients: users
        });

    } catch (error) {
        console.error(
            "Get notification recipients error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to retrieve notification recipients"
        });
    }
};


// ==========================================
// SEND EMAIL NOTIFICATION
// Administrator
// ==========================================
const sendNotification = async (req, res) => {
    const {
        RecipientID,
        subject,
        message
    } = req.body;

    if (!RecipientID || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: "Recipient, subject and message are required"
        });
    }

    try {
        const [users] = await pool.query(
            `
            SELECT
                UserID,
                FullName,
                Email
            FROM users
            WHERE UserID = ?
            AND Status = 'Active'
            `,
            [RecipientID]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Active recipient not found"
            });
        }

        const recipient = users[0];

        const [result] = await pool.query(
            `
            INSERT INTO notifications
            (
                RecipientID,
                NotificationType,
                Message,
                Status,
                IsRead,
                ReadDate
            )
            VALUES (?, 'Email', ?, 'Pending', 0, NULL)
            `,
            [
                recipient.UserID,
                message
            ]
        );

        const notificationID = result.insertId;

        try {

            await transporter.sendMail({
                from: `"Real Estate Management System" <${process.env.EMAIL_USER}>`,
                to: recipient.Email,
                subject: subject,
                text: message,
                html: `
                    <div style="
                        font-family: Arial, sans-serif;
                        max-width: 650px;
                        margin: auto;
                        padding: 30px;
                        border: 1px solid #ddd;
                        border-radius: 10px;
                    ">

                        <h2>
                            Real Estate Management System
                        </h2>

                        <p>
                            Dear ${recipient.FullName},
                        </p>

                        <p>
                            ${message.replace(/\n/g, "<br>")}
                        </p>

                        <hr>

                        <p style="font-size: 12px; color: #777;">
                            This email was sent by the
                            Real Estate Management System.
                        </p>

                    </div>
                `
            });

            await pool.query(
                `
                UPDATE notifications
                SET
                    Status = 'Sent',
                    SentDate = NOW()
                WHERE NotificationID = ?
                `,
                [notificationID]
            );

            res.json({
                success: true,
                message: "Email notification sent successfully",
                notificationID
            });

        } catch (emailError) {

            console.error(
                "Email sending error:",
                emailError
            );

            await pool.query(
                `
                UPDATE notifications
                SET Status = 'Failed'
                WHERE NotificationID = ?
                `,
                [notificationID]
            );

            res.status(500).json({
                success: false,
                message: "Notification was created but email sending failed",
                notificationID
            });
        }

    } catch (error) {

        console.error(
            "Send notification error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to send notification"
        });
    }
};


// ==========================================
// RETRY FAILED NOTIFICATION
// Administrator
// ==========================================
const retryNotification = async (req, res) => {
    const { id } = req.params;

    try {

        const [rows] = await pool.query(
            `
            SELECT
                n.NotificationID,
                n.RecipientID,
                n.Message,
                u.FullName,
                u.Email
            FROM notifications n
            INNER JOIN users u
                ON n.RecipientID = u.UserID
            WHERE n.NotificationID = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        const notification = rows[0];

        await transporter.sendMail({
            from: `"Real Estate Management System" <${process.env.EMAIL_USER}>`,
            to: notification.Email,
            subject: "Real Estate Management System Notification",
            text: notification.Message
        });

        await pool.query(
            `
            UPDATE notifications
            SET
                Status = 'Sent',
                SentDate = NOW()
            WHERE NotificationID = ?
            `,
            [id]
        );

        res.json({
            success: true,
            message: "Notification resent successfully"
        });

    } catch (error) {

        console.error(
            "Retry notification error:",
            error
        );

        await pool.query(
            `
            UPDATE notifications
            SET Status = 'Failed'
            WHERE NotificationID = ?
            `,
            [id]
        );

        res.status(500).json({
            success: false,
            message: "Failed to resend notification"
        });
    }
};


// ==========================================
// EXPORT
// ==========================================
module.exports = {
    getNotifications,
    getOwnerNotifications,
    markOwnerNotificationAsRead,
    markAllOwnerNotificationsAsRead,
    getNotificationRecipients,
    sendNotification,
    retryNotification
};