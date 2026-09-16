import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Bell,
    CheckCircle2,
    Clock3,
    Eye,
    MailOpen,
    RefreshCw,
    Search,
    XCircle
} from "lucide-react";

import "./OwnerNotifications.css";

const API_URL = "http://localhost:5000/api/notifications";

function OwnerNotifications() {
    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [markingRead, setMarkingRead] = useState(null);
    const [markingAllRead, setMarkingAllRead] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [readFilter, setReadFilter] = useState("All");

    // ==========================================
    // AUTH CONFIG
    // ==========================================

    const getAuthConfig = () => {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken");

        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    };

    // ==========================================
    // LOAD OWNER NOTIFICATIONS
    // ==========================================

    const loadNotifications = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await axios.get(
                `${API_URL}/owner`,
                getAuthConfig()
            );

            console.log(
                "OWNER NOTIFICATIONS API RESPONSE:",
                response.data
            );

            if (response.data.success) {
                setNotifications(
                    response.data.notifications || []
                );
            } else {
                setNotifications([]);

                setError(
                    response.data.message ||
                    "Failed to load notifications"
                );
            }

        } catch (err) {
            console.error(
                "OWNER NOTIFICATIONS ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load notifications"
            );

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // ==========================================
    // LOAD ON PAGE OPEN
    // ==========================================

    useEffect(() => {
        loadNotifications();
    }, []);

    // ==========================================
    // MARK ONE NOTIFICATION AS READ
    // ==========================================

    const handleMarkAsRead = async (notificationID) => {
        try {
            setMarkingRead(notificationID);
            setError("");
            setSuccess("");

            const response = await axios.patch(
                `${API_URL}/owner/${notificationID}/read`,
                {},
                getAuthConfig()
            );

            if (response.data.success) {
                setNotifications((previous) =>
                    previous.map((notification) =>
                        notification.NotificationID ===
                        notificationID
                            ? {
                                  ...notification,
                                  IsRead: 1,
                                  ReadDate: new Date().toISOString()
                              }
                            : notification
                    )
                );

                setSuccess(
                    "Notification marked as read."
                );

                setTimeout(() => {
                    setSuccess("");
                }, 3000);
            } else {
                setError(
                    response.data.message ||
                    "Failed to mark notification as read."
                );
            }

        } catch (err) {
            console.error(
                "MARK NOTIFICATION READ ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to mark notification as read."
            );

        } finally {
            setMarkingRead(null);
        }
    };

    // ==========================================
    // MARK ALL AS READ
    // ==========================================

    const handleMarkAllAsRead = async () => {
        try {
            setMarkingAllRead(true);
            setError("");
            setSuccess("");

            const response = await axios.patch(
                `${API_URL}/owner/read-all`,
                {},
                getAuthConfig()
            );

            if (response.data.success) {
                const readDate =
                    new Date().toISOString();

                setNotifications((previous) =>
                    previous.map((notification) => ({
                        ...notification,
                        IsRead: 1,
                        ReadDate:
                            notification.ReadDate ||
                            readDate
                    }))
                );

                setSuccess(
                    "All notifications marked as read."
                );

                setTimeout(() => {
                    setSuccess("");
                }, 3000);
            } else {
                setError(
                    response.data.message ||
                    "Failed to mark all notifications as read."
                );
            }

        } catch (err) {
            console.error(
                "MARK ALL NOTIFICATIONS READ ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to mark all notifications as read."
            );

        } finally {
            setMarkingAllRead(false);
        }
    };

    // ==========================================
    // FILTER NOTIFICATIONS
    // ==========================================

    const filteredNotifications = useMemo(() => {
        const keyword = search
            .trim()
            .toLowerCase();

        return notifications.filter((notification) => {

            // ------------------------------
            // STATUS FILTER
            // ------------------------------

            const matchesStatus =
                statusFilter === "All" ||
                notification.Status === statusFilter;

            // ------------------------------
            // READ FILTER
            // ------------------------------

            const isRead =
                Number(notification.IsRead) === 1;

            const matchesReadFilter =
                readFilter === "All" ||
                (readFilter === "Unread" && !isRead) ||
                (readFilter === "Read" && isRead);

            // ------------------------------
            // SEARCH
            // ------------------------------

            const matchesSearch =
                !keyword ||
                String(
                    notification.NotificationType || ""
                )
                    .toLowerCase()
                    .includes(keyword) ||

                String(
                    notification.Message || ""
                )
                    .toLowerCase()
                    .includes(keyword) ||

                String(
                    notification.Status || ""
                )
                    .toLowerCase()
                    .includes(keyword);

            return (
                matchesStatus &&
                matchesReadFilter &&
                matchesSearch
            );
        });

    }, [
        notifications,
        search,
        statusFilter,
        readFilter
    ]);

    // ==========================================
    // STATISTICS
    // ==========================================

    const statistics = useMemo(() => {

        const unread =
            notifications.filter(
                (item) =>
                    Number(item.IsRead) !== 1
            ).length;

        const read =
            notifications.filter(
                (item) =>
                    Number(item.IsRead) === 1
            ).length;

        const failed =
            notifications.filter(
                (item) =>
                    item.Status === "Failed"
            ).length;

        return {
            total: notifications.length,
            unread,
            read,
            failed
        };

    }, [notifications]);

    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        const formattedDate =
            new Date(date);

        if (
            Number.isNaN(
                formattedDate.getTime()
            )
        ) {
            return "—";
        }

        return formattedDate.toLocaleString();
    };

    // ==========================================
    // STATUS ICON
    // ==========================================

    const getStatusIcon = (status) => {

        if (status === "Sent") {
            return <CheckCircle2 size={16} />;
        }

        if (status === "Pending") {
            return <Clock3 size={16} />;
        }

        if (status === "Failed") {
            return <XCircle size={16} />;
        }

        return null;
    };

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="owner-notifications-page">

            {/* =====================================
                HEADER
            ====================================== */}

            <div className="owner-notifications-header">

                <div className="owner-notifications-title">

                    <Bell size={28} />

                    <div>
                        <h1>
                            Notifications
                        </h1>

                        <p>
                            View notifications and
                            updates related to your
                            account.
                        </p>
                    </div>

                </div>

                <div className="owner-notification-header-actions">

                    {statistics.unread > 0 && (
                        <button
                            type="button"
                            className="owner-mark-all-read-button"
                            onClick={
                                handleMarkAllAsRead
                            }
                            disabled={markingAllRead}
                        >
                            <MailOpen size={18} />

                            {markingAllRead
                                ? "Marking..."
                                : "Mark All as Read"}
                        </button>
                    )}

                    <button
                        type="button"
                        className="owner-refresh-button"
                        onClick={() =>
                            loadNotifications(true)
                        }
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={18}
                            className={
                                refreshing
                                    ? "owner-spin"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>

                </div>

            </div>

            {/* =====================================
                ERROR
            ====================================== */}

            {error && (
                <div className="owner-notification-alert error">

                    <XCircle size={18} />

                    <span>
                        {error}
                    </span>

                </div>
            )}

            {/* =====================================
                SUCCESS
            ====================================== */}

            {success && (
                <div className="owner-notification-alert success">

                    <CheckCircle2 size={18} />

                    <span>
                        {success}
                    </span>

                </div>
            )}

            {/* =====================================
                STATISTICS
            ====================================== */}

            <div className="owner-notification-stats">

                {/* TOTAL */}

                <div className="owner-stat-card">

                    <div className="owner-stat-icon">
                        <Bell size={22} />
                    </div>

                    <div>
                        <span>
                            Total
                        </span>

                        <strong>
                            {statistics.total}
                        </strong>
                    </div>

                </div>

                {/* UNREAD */}

                <div
                    className={`owner-stat-card ${
                        statistics.unread > 0
                            ? "has-unread"
                            : ""
                    }`}
                >

                    <div className="owner-stat-icon">
                        <Eye size={22} />
                    </div>

                    <div>
                        <span>
                            Unread
                        </span>

                        <strong>
                            {statistics.unread}
                        </strong>
                    </div>

                </div>

                {/* READ */}

                <div className="owner-stat-card">

                    <div className="owner-stat-icon">
                        <MailOpen size={22} />
                    </div>

                    <div>
                        <span>
                            Read
                        </span>

                        <strong>
                            {statistics.read}
                        </strong>
                    </div>

                </div>

                {/* FAILED */}

                <div className="owner-stat-card">

                    <div className="owner-stat-icon">
                        <XCircle size={22} />
                    </div>

                    <div>
                        <span>
                            Failed
                        </span>

                        <strong>
                            {statistics.failed}
                        </strong>
                    </div>

                </div>

            </div>

            {/* =====================================
                SEARCH / FILTER
            ====================================== */}

            <div className="owner-notification-toolbar">

                <div className="owner-notification-search">

                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                </div>

                {/* STATUS */}

                <select
                    className="owner-notification-filter"
                    value={statusFilter}
                    onChange={(event) =>
                        setStatusFilter(
                            event.target.value
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

                {/* READ STATUS */}

                <select
                    className="owner-notification-filter"
                    value={readFilter}
                    onChange={(event) =>
                        setReadFilter(
                            event.target.value
                        )
                    }
                >
                    <option value="All">
                        All Notifications
                    </option>

                    <option value="Unread">
                        Unread
                    </option>

                    <option value="Read">
                        Read
                    </option>
                </select>

            </div>

            {/* =====================================
                NOTIFICATION CARD
            ====================================== */}

            <div className="owner-notification-card">

                {loading ? (

                    <div className="owner-notification-loading">

                        <RefreshCw
                            size={30}
                            className="owner-spin"
                        />

                        <p>
                            Loading notifications...
                        </p>

                    </div>

                ) : filteredNotifications.length === 0 ? (

                    <div className="owner-notification-empty">

                        <Bell size={44} />

                        <h3>
                            No notifications found
                        </h3>

                        <p>
                            You don't have any
                            notifications matching
                            your search.
                        </p>

                    </div>

                ) : (

                    <div className="owner-notification-list">

                        {filteredNotifications.map(
                            (notification) => {

                                const isUnread =
                                    Number(
                                        notification.IsRead
                                    ) !== 1;

                                return (
                                    <div
                                        key={
                                            notification.NotificationID
                                        }
                                        className={`owner-notification-item ${
                                            isUnread
                                                ? "unread"
                                                : "read"
                                        }`}
                                    >

                                        {/* ICON */}

                                        <div className="owner-notification-item-icon">

                                            <Bell size={20} />

                                        </div>

                                        {/* CONTENT */}

                                        <div className="owner-notification-content">

                                            <div className="owner-notification-item-top">

                                                <div className="owner-notification-heading">

                                                    <div className="owner-notification-title-row">

                                                        <h3>
                                                            {
                                                                notification.NotificationType ||
                                                                "Notification"
                                                            }
                                                        </h3>

                                                        {isUnread && (
                                                            <span className="owner-unread-badge">
                                                                Unread
                                                            </span>
                                                        )}

                                                    </div>

                                                    <span>
                                                        {formatDate(
                                                            notification.SentDate
                                                        )}
                                                    </span>

                                                </div>

                                                <div
                                                    className={`owner-notification-status ${String(
                                                        notification.Status ||
                                                            ""
                                                    ).toLowerCase()}`}
                                                >

                                                    {getStatusIcon(
                                                        notification.Status
                                                    )}

                                                    {
                                                        notification.Status
                                                    }

                                                </div>

                                            </div>

                                            <p>
                                                {
                                                    notification.Message
                                                }
                                            </p>

                                            {/* READ INFORMATION */}

                                            {notification.ReadDate && (
                                                <div className="owner-read-date">

                                                    <MailOpen size={14} />

                                                    Read on{" "}
                                                    {formatDate(
                                                        notification.ReadDate
                                                    )}

                                                </div>
                                            )}

                                            {/* ACTION */}

                                            {isUnread && (
                                                <button
                                                    type="button"
                                                    className="owner-mark-read-button"
                                                    onClick={() =>
                                                        handleMarkAsRead(
                                                            notification.NotificationID
                                                        )
                                                    }
                                                    disabled={
                                                        markingRead ===
                                                        notification.NotificationID
                                                    }
                                                >

                                                    {markingRead ===
                                                    notification.NotificationID ? (
                                                        <>
                                                            <RefreshCw
                                                                size={15}
                                                                className="owner-spin"
                                                            />

                                                            Marking...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2
                                                                size={15}
                                                            />

                                                            Mark as Read
                                                        </>
                                                    )}

                                                </button>
                                            )}

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>

                )}

            </div>

        </div>
    );
}

export default OwnerNotifications;