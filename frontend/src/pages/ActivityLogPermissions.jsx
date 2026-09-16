import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    CheckCircle2,
    RefreshCw,
    Search,
    ShieldCheck,
    ShieldOff,
    UserRound
} from "lucide-react";

import "./ActivityLogPermissions.css";

const API_URL =
    "http://localhost:5000/api/activity-log-permissions";

function ActivityLogPermissions() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] =
        useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");

    const token = localStorage.getItem("token");

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    // ==================================================
    // LOAD USERS
    // ==================================================

    const loadPermissions = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                API_URL,
                authConfig
            );

            if (response.data.success) {
                setUsers(
                    Array.isArray(
                        response.data.permissions
                    )
                        ? response.data.permissions
                        : []
                );
            } else {
                setError(
                    response.data.message ||
                    "Failed to load permissions."
                );
            }

        } catch (err) {
            console.error(
                "Activity permission error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load activity log permissions."
            );

        } finally {
            setLoading(false);
        }
    };

    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {
        loadPermissions();
    }, []);

    // ==================================================
    // AUTHORIZE / REVOKE
    // ==================================================

    const togglePermission = async (user) => {
        try {
            setUpdatingUserId(user.UserID);
            setError("");
            setSuccess("");

            const currentPermission =
                Number(user.CanViewActivityLogs) === 1;

            const newPermission =
                currentPermission ? 0 : 1;

            const response = await axios.patch(
                `${API_URL}/${user.UserID}`,
                {
                    canViewActivityLogs:
                        newPermission
                },
                authConfig
            );

            if (response.data.success) {
                setUsers((previousUsers) =>
                    previousUsers.map((item) =>
                        item.UserID === user.UserID
                            ? {
                                ...item,
                                CanViewActivityLogs:
                                    newPermission,
                                AuthorizedBy:
                                    newPermission === 1
                                        ? item.AuthorizedBy
                                        : null,
                                AuthorizedAt:
                                    newPermission === 1
                                        ? item.AuthorizedAt
                                        : null
                            }
                            : item
                    )
                );

                setSuccess(
                    response.data.message
                );

                // Reload so AuthorizedBy /
                // AuthorizedAt are accurate.
                await loadPermissions();
            }

        } catch (err) {
            console.error(
                "Update permission error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to update permission."
            );

        } finally {
            setUpdatingUserId(null);
        }
    };

    // ==================================================
    // SEARCH
    // ==================================================

    const filteredUsers = useMemo(() => {
        const keyword =
            search.trim().toLowerCase();

        if (!keyword) {
            return users;
        }

        return users.filter((user) =>
            [
                user.FullName,
                user.Email,
                user.Role
            ].some((value) =>
                String(value ?? "")
                    .toLowerCase()
                    .includes(keyword)
            )
        );
    }, [users, search]);

    // ==================================================
    // FORMAT DATE
    // ==================================================

    const formatDate = (value) => {
        if (!value) return "-";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString();
    };

    // ==================================================
    // COUNTS
    // ==================================================

    const authorizedCount = users.filter(
        (user) =>
            Number(user.CanViewActivityLogs) === 1
    ).length;

    const unauthorizedCount =
        users.length - authorizedCount;

    return (
        <div className="activity-permission-page">

            {/* =========================================
                HEADER
            ========================================= */}

            <div className="activity-permission-header">

                <div className="activity-permission-title">

                    <div className="activity-permission-icon">
                        <ShieldCheck size={26} />
                    </div>

                    <div>
                        <h1>
                            Activity Log Access
                        </h1>

                        <p>
                            Authorize users to view
                            system activity logs.
                        </p>
                    </div>

                </div>

                <button
                    className="permission-refresh-button"
                    onClick={loadPermissions}
                    disabled={loading}
                >
                    <RefreshCw
                        size={18}
                        className={
                            loading
                                ? "permission-spin"
                                : ""
                        }
                    />

                    Refresh
                </button>

            </div>

            {/* =========================================
                ALERTS
            ========================================= */}

            {error && (
                <div className="permission-alert error">
                    {error}
                </div>
            )}

            {success && (
                <div className="permission-alert success">
                    <CheckCircle2 size={18} />
                    {success}
                </div>
            )}

            {/* =========================================
                SUMMARY
            ========================================= */}

            <div className="permission-summary">

                <div className="permission-summary-card">

                    <div className="permission-summary-icon">
                        <UserRound size={21} />
                    </div>

                    <div>
                        <span>Total Users</span>
                        <strong>
                            {users.length}
                        </strong>
                    </div>

                </div>

                <div className="permission-summary-card">

                    <div className="permission-summary-icon">
                        <ShieldCheck size={21} />
                    </div>

                    <div>
                        <span>Authorized</span>
                        <strong>
                            {authorizedCount}
                        </strong>
                    </div>

                </div>

                <div className="permission-summary-card">

                    <div className="permission-summary-icon">
                        <ShieldOff size={21} />
                    </div>

                    <div>
                        <span>Not Authorized</span>
                        <strong>
                            {unauthorizedCount}
                        </strong>
                    </div>

                </div>

            </div>

            {/* =========================================
                SEARCH
            ========================================= */}

            <div className="permission-search-wrapper">

                <Search size={18} />

                <input
                    type="text"
                    placeholder="Search user, email, or role..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                />

            </div>

            {/* =========================================
                TABLE
            ========================================= */}

            <div className="permission-card">

                <div className="permission-card-header">

                    <div>
                        <h2>
                            User Activity Log Access
                        </h2>

                        <p>
                            Only the Administrator can
                            authorize or revoke access.
                        </p>
                    </div>

                    <ShieldCheck size={22} />

                </div>

                {loading ? (

                    <div className="permission-loading">

                        <RefreshCw
                            size={30}
                            className="permission-spin"
                        />

                        <p>
                            Loading users...
                        </p>

                    </div>

                ) : filteredUsers.length === 0 ? (

                    <div className="permission-empty">

                        <UserRound size={42} />

                        <h3>
                            No users found
                        </h3>

                        <p>
                            No users match your search.
                        </p>

                    </div>

                ) : (

                    <div className="permission-table-wrapper">

                        <table className="permission-table">

                            <thead>
                                <tr>
                                    <th>USER</th>
                                    <th>ROLE</th>
                                    <th>ACCESS</th>
                                    <th>AUTHORIZED BY</th>
                                    <th>AUTHORIZED AT</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredUsers.map(
                                    (user) => {

                                        const authorized =
                                            Number(
                                                user.CanViewActivityLogs
                                            ) === 1;

                                        const updating =
                                            updatingUserId ===
                                            user.UserID;

                                        return (
                                            <tr
                                                key={
                                                    user.UserID
                                                }
                                            >

                                                <td>
                                                    <div className="permission-user">

                                                        <div className="permission-user-icon">
                                                            <UserRound
                                                                size={17}
                                                            />
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {
                                                                    user.FullName
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    user.Email ||
                                                                    "-"
                                                                }
                                                            </span>
                                                        </div>

                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="permission-role">
                                                        {
                                                            user.Role
                                                        }
                                                    </span>
                                                </td>

                                                <td>

                                                    {authorized ? (

                                                        <span className="access-badge authorized">
                                                            <CheckCircle2
                                                                size={15}
                                                            />
                                                            Authorized
                                                        </span>

                                                    ) : (

                                                        <span className="access-badge denied">
                                                            <ShieldOff
                                                                size={15}
                                                            />
                                                            Not Authorized
                                                        </span>

                                                    )}

                                                </td>

                                                <td>
                                                    {
                                                        user.AuthorizedByName ||
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        formatDate(
                                                            user.AuthorizedAt
                                                        )
                                                    }
                                                </td>

                                                <td>

                                                    <button
                                                        className={
                                                            authorized
                                                                ? "permission-action revoke"
                                                                : "permission-action authorize"
                                                        }
                                                        onClick={() =>
                                                            togglePermission(
                                                                user
                                                            )
                                                        }
                                                        disabled={
                                                            updating
                                                        }
                                                    >

                                                        {updating ? (

                                                            <>
                                                                <RefreshCw
                                                                    size={
                                                                        15
                                                                    }
                                                                    className="permission-spin"
                                                                />

                                                                Updating...
                                                            </>

                                                        ) : authorized ? (

                                                            <>
                                                                <ShieldOff
                                                                    size={
                                                                        15
                                                                    }
                                                                />

                                                                Revoke
                                                            </>

                                                        ) : (

                                                            <>
                                                                <ShieldCheck
                                                                    size={
                                                                        15
                                                                    }
                                                                />

                                                                Authorize
                                                            </>

                                                        )}

                                                    </button>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}

export default ActivityLogPermissions;