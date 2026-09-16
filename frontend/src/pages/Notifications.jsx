import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Bell,
    CheckCircle2,
    Clock3,
    Mail,
    RefreshCw,
    RotateCcw,
    Search,
    Send,
    Users,
    X,
    XCircle
} from "lucide-react";

import "./Notifications.css";

const API_URL = "http://localhost:5000/api/notifications";

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [recipients, setRecipients] = useState([]);

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [retrying, setRetrying] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        RecipientID: "",
        subject: "",
        message: ""
    });

    const token = localStorage.getItem("token");

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    // ==========================================
    // LOAD NOTIFICATIONS
    // ==========================================
    const loadNotifications = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                API_URL,
                authConfig
            );

            if (response.data.success) {
                setNotifications(
                    Array.isArray(response.data.notifications)
                        ? response.data.notifications
                        : []
                );
            } else {
                setError(
                    response.data.message ||
                    "Failed to load notifications."
                );
            }

        } catch (err) {
            console.error(
                "Load notifications error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load notifications."
            );

        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // LOAD RECIPIENTS
    // ==========================================
    const loadRecipients = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/recipients`,
                authConfig
            );

            if (response.data.success) {
                setRecipients(
                    Array.isArray(response.data.recipients)
                        ? response.data.recipients
                        : []
                );
            }

        } catch (err) {
            console.error(
                "Load recipients error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load recipients."
            );
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================
    useEffect(() => {
        loadNotifications();
        loadRecipients();
    }, []);

    // ==========================================
    // SEND NOTIFICATION
    // ==========================================
    const handleSendNotification = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!formData.RecipientID) {
            setError("Please select a recipient.");
            return;
        }

        if (!formData.subject.trim()) {
            setError("Please enter an email subject.");
            return;
        }

        if (!formData.message.trim()) {
            setError("Please enter a message.");
            return;
        }

        try {
            setSending(true);

            const response = await axios.post(
                `${API_URL}/send`,
                {
                    RecipientID: Number(formData.RecipientID),
                    subject: formData.subject.trim(),
                    message: formData.message.trim()
                },
                authConfig
            );

            if (response.data.success) {
                setSuccess(
                    "Email notification sent successfully."
                );

                setFormData({
                    RecipientID: "",
                    subject: "",
                    message: ""
                });

                setShowModal(false);

                await loadNotifications();
            } else {
                setError(
                    response.data.message ||
                    "Failed to send notification."
                );
            }

        } catch (err) {
            console.error(
                "Send notification error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to send email notification."
            );

        } finally {
            setSending(false);
        }
    };

    // ==========================================
    // RETRY FAILED NOTIFICATION
    // ==========================================
    const handleRetry = async (notificationID) => {
        setError("");
        setSuccess("");

        try {
            setRetrying(notificationID);

            const response = await axios.post(
                `${API_URL}/${notificationID}/retry`,
                {},
                authConfig
            );

            if (response.data.success) {
                setSuccess(
                    "Notification resent successfully."
                );

                await loadNotifications();
            } else {
                setError(
                    response.data.message ||
                    "Failed to resend notification."
                );
            }

        } catch (err) {
            console.error(
                "Retry notification error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to resend notification."
            );

        } finally {
            setRetrying(null);
        }
    };

    // ==========================================
    // FILTER NOTIFICATIONS
    // ==========================================
    const filteredNotifications = useMemo(() => {
        return notifications.filter((notification) => {

            const matchesStatus =
                statusFilter === "All" ||
                notification.Status === statusFilter;

            const keyword =
                search.trim().toLowerCase();

            const matchesSearch =
                !keyword ||
                [
                    notification.RecipientName,
                    notification.RecipientEmail,
                    notification.RecipientRole,
                    notification.NotificationType,
                    notification.Message,
                    notification.Status
                ]
                    .some((value) =>
                        String(value ?? "")
                            .toLowerCase()
                            .includes(keyword)
                    );

            return matchesStatus && matchesSearch;
        });
    }, [
        notifications,
        search,
        statusFilter
    ]);

    // ==========================================
    // STATISTICS
    // ==========================================
    const totalNotifications =
        notifications.length;

    const sentNotifications =
        notifications.filter(
            (item) => item.Status === "Sent"
        ).length;

    const pendingNotifications =
        notifications.filter(
            (item) => item.Status === "Pending"
        ).length;

    const failedNotifications =
        notifications.filter(
            (item) => item.Status === "Failed"
        ).length;

    // ==========================================
    // DATE FORMAT
    // ==========================================
    const formatDate = (value) => {
        if (!value) return "-";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString();
    };

    // ==========================================
    // CLOSE MESSAGE
    // ==========================================
    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    return (
        <div className="notifications-page">

            {/* ======================================
                HEADER
            ====================================== */}

            <div className="notifications-header">

                <div>
                    <h1>Email Notifications</h1>

                    <p>
                        Manage and send email notifications
                        to system users.
                    </p>
                </div>

                <div className="notifications-header-actions">

                    <button
                        className="refresh-button"
                        onClick={() => {
                            clearMessages();
                            loadNotifications();
                        }}
                        disabled={loading}
                    >
                        <RefreshCw
                            size={18}
                            className={
                                loading
                                    ? "spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>

                    <button
                        className="send-notification-button"
                        onClick={() => {
                            clearMessages();
                            setShowModal(true);
                        }}
                    >
                        <Send size={18} />

                        Send Notification
                    </button>

                </div>
            </div>

            {/* ======================================
                SUCCESS MESSAGE
            ====================================== */}

            {success && (
                <div className="notification-alert success-alert">

                    <CheckCircle2 size={20} />

                    <span>{success}</span>

                    <button
                        onClick={() =>
                            setSuccess("")
                        }
                    >
                        <X size={17} />
                    </button>

                </div>
            )}

            {/* ======================================
                ERROR MESSAGE
            ====================================== */}

            {error && (
                <div className="notification-alert error-alert">

                    <XCircle size={20} />

                    <span>{error}</span>

                    <button
                        onClick={() =>
                            setError("")
                        }
                    >
                        <X size={17} />
                    </button>

                </div>
            )}

            {/* ======================================
                STATISTICS
            ====================================== */}

            <div className="notification-stat-grid">

                <div className="notification-stat-card">

                    <div className="notification-stat-icon">
                        <Bell size={21} />
                    </div>

                    <div>
                        <span>Total</span>
                        <strong>
                            {totalNotifications}
                        </strong>
                    </div>

                </div>

                <div className="notification-stat-card">

                    <div className="notification-stat-icon">
                        <CheckCircle2 size={21} />
                    </div>

                    <div>
                        <span>Sent</span>
                        <strong>
                            {sentNotifications}
                        </strong>
                    </div>

                </div>

                <div className="notification-stat-card">

                    <div className="notification-stat-icon">
                        <Clock3 size={21} />
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>
                            {pendingNotifications}
                        </strong>
                    </div>

                </div>

                <div className="notification-stat-card">

                    <div className="notification-stat-icon">
                        <XCircle size={21} />
                    </div>

                    <div>
                        <span>Failed</span>
                        <strong>
                            {failedNotifications}
                        </strong>
                    </div>

                </div>

            </div>

            {/* ======================================
                TOOLBAR
            ====================================== */}

            <div className="notification-toolbar">

                <div className="notification-search">

                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                </div>

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(
                            e.target.value
                        )
                    }
                >
                    <option value="All">
                        All Status
                    </option>

                    <option value="Sent">
                        Sent
                    </option>

                    <option value="Pending">
                        Pending
                    </option>

                    <option value="Failed">
                        Failed
                    </option>
                </select>

            </div>

            {/* ======================================
                NOTIFICATION TABLE
            ====================================== */}

            <div className="notifications-card">

                <div className="notifications-card-header">

                    <div>
                        <h2>
                            Notification History
                        </h2>

                        <p>
                            {filteredNotifications.length}
                            {" "}
                            notification
                            {filteredNotifications.length !== 1
                                ? "s"
                                : ""}
                        </p>
                    </div>

                    <Mail size={22} />

                </div>

                {loading ? (
                    <div className="notification-loading">
                        <RefreshCw
                            size={30}
                            className="spin"
                        />

                        <p>
                            Loading notifications...
                        </p>
                    </div>

                ) : filteredNotifications.length === 0 ? (

                    <div className="notification-empty">

                        <Bell size={45} />

                        <h3>
                            No notifications found
                        </h3>

                        <p>
                            There are no notifications
                            matching your search.
                        </p>

                    </div>

                ) : (

                    <div className="notification-table-wrapper">

                        <table className="notification-table">

                            <thead>
                                <tr>
                                    <th>Recipient</th>
                                    <th>Type</th>
                                    <th>Message</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredNotifications.map(
                                    (notification) => (
                                        <tr
                                            key={
                                                notification.NotificationID
                                            }
                                        >

                                            <td>
                                                <div className="recipient-cell">

                                                    <strong>
                                                        {
                                                            notification.RecipientName ||
                                                            "-"
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            notification.RecipientEmail ||
                                                            "-"
                                                        }
                                                    </span>

                                                    <small>
                                                        {
                                                            notification.RecipientRole ||
                                                            "-"
                                                        }
                                                    </small>

                                                </div>
                                            </td>

                                            <td>
                                                <span className="notification-type">
                                                    {
                                                        notification.NotificationType
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <div className="message-cell">
                                                    {
                                                        notification.Message
                                                    }
                                                </div>
                                            </td>

                                            <td>
                                                <span className="date-cell">
                                                    {formatDate(
                                                        notification.SentDate
                                                    )}
                                                </span>
                                            </td>

                                            <td>

                                                <span
                                                    className={`notification-status ${String(
                                                        notification.Status ||
                                                        ""
                                                    ).toLowerCase()}`}
                                                >

                                                    {notification.Status ===
                                                    "Sent" && (
                                                        <CheckCircle2
                                                            size={14}
                                                        />
                                                    )}

                                                    {notification.Status ===
                                                    "Pending" && (
                                                        <Clock3
                                                            size={14}
                                                        />
                                                    )}

                                                    {notification.Status ===
                                                    "Failed" && (
                                                        <XCircle
                                                            size={14}
                                                        />
                                                    )}

                                                    {
                                                        notification.Status
                                                    }

                                                </span>

                                            </td>

                                            <td>

                                                {notification.Status ===
                                                    "Failed" && (
                                                    <button
                                                        className="retry-button"
                                                        onClick={() =>
                                                            handleRetry(
                                                                notification.NotificationID
                                                            )
                                                        }
                                                        disabled={
                                                            retrying ===
                                                            notification.NotificationID
                                                        }
                                                    >

                                                        <RotateCcw
                                                            size={15}
                                                            className={
                                                                retrying ===
                                                                notification.NotificationID
                                                                    ? "spin"
                                                                    : ""
                                                            }
                                                        />

                                                        Retry

                                                    </button>
                                                )}

                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* ======================================
                SEND NOTIFICATION MODAL
            ====================================== */}

            {showModal && (
                <div
                    className="notification-modal-overlay"
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            setShowModal(false);
                        }

                    }}
                >

                    <div className="notification-modal">

                        <div className="notification-modal-header">

                            <div>
                                <h2>
                                    Send Email Notification
                                </h2>

                                <p>
                                    Send an email to an active
                                    system user.
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    setShowModal(false)
                                }
                                className="modal-close-button"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleSendNotification
                            }
                        >

                            {/* RECIPIENT */}

                            <div className="form-group">

                                <label>
                                    Recipient
                                </label>

                                <div className="input-with-icon">

                                    <Users size={18} />

                                    <select
                                        value={
                                            formData.RecipientID
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                RecipientID:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select recipient
                                        </option>

                                        {recipients.map(
                                            (recipient) => (
                                                <option
                                                    key={
                                                        recipient.UserID
                                                    }
                                                    value={
                                                        recipient.UserID
                                                    }
                                                >
                                                    {
                                                        recipient.FullName
                                                    }
                                                    {" — "}
                                                    {
                                                        recipient.Email
                                                    }
                                                    {" ("}
                                                    {
                                                        recipient.Role
                                                    }
                                                    {")"}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                            </div>

                            {/* SUBJECT */}

                            <div className="form-group">

                                <label>
                                    Email Subject
                                </label>

                                <div className="input-with-icon">

                                    <Mail size={18} />

                                    <input
                                        type="text"
                                        placeholder="Enter email subject"
                                        value={
                                            formData.subject
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                subject:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                </div>

                            </div>

                            {/* MESSAGE */}

                            <div className="form-group">

                                <label>
                                    Message
                                </label>

                                <textarea
                                    rows="7"
                                    placeholder="Write your notification message..."
                                    value={
                                        formData.message
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            message:
                                                e.target.value
                                        })
                                    }
                                    required
                                />

                            </div>

                            {/* BUTTONS */}

                            <div className="notification-modal-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() =>
                                        setShowModal(false)
                                    }
                                    disabled={sending}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="send-button"
                                    disabled={sending}
                                >

                                    {sending ? (
                                        <>
                                            <RefreshCw
                                                size={17}
                                                className="spin"
                                            />

                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send
                                                size={17}
                                            />

                                            Send Email
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Notifications;