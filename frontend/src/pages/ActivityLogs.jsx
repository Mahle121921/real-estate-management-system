import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Activity,
    Calendar,
    RefreshCw,
    Search,
    UserRound,
    X
} from "lucide-react";

import "./ActivityLogs.css";

const API_URL = "http://localhost:5000/api/activity-logs";

function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [moduleFilter, setModuleFilter] = useState("All");

    const token = localStorage.getItem("token");

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    // ==========================================
    // LOAD ACTIVITY LOGS
    // ==========================================
    const loadActivityLogs = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                API_URL,
                authConfig
            );

            if (response.data.success) {
                setLogs(
                    Array.isArray(response.data.activityLogs)
                        ? response.data.activityLogs
                        : []
                );
            } else {
                setError(
                    response.data.message ||
                    "Failed to load activity logs."
                );
            }
        } catch (err) {
            console.error(
                "Activity logs error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load activity logs."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================
    useEffect(() => {
        loadActivityLogs();
    }, []);

    // ==========================================
    // UNIQUE ROLES
    // ==========================================
    const roles = useMemo(() => {
        return [
            "All",
            ...new Set(
                logs
                    .map((log) => log.UserRole)
                    .filter(Boolean)
            )
        ];
    }, [logs]);

    // ==========================================
    // UNIQUE MODULES
    // ==========================================
    const modules = useMemo(() => {
        return [
            "All",
            ...new Set(
                logs
                    .map((log) => log.Module)
                    .filter(Boolean)
            )
        ];
    }, [logs]);

    // ==========================================
    // FILTER LOGS
    // ==========================================
    const filteredLogs = useMemo(() => {
        const keyword = search
            .trim()
            .toLowerCase();

        return logs.filter((log) => {
            const matchesRole =
                roleFilter === "All" ||
                log.UserRole === roleFilter;

            const matchesModule =
                moduleFilter === "All" ||
                log.Module === moduleFilter;

            const matchesSearch =
                !keyword ||
                [
                    log.UserName,
                    log.UserEmail,
                    log.UserRole,
                    log.Activity,
                    log.Module,
                    log.IPAddress
                ].some((value) =>
                    String(value ?? "")
                        .toLowerCase()
                        .includes(keyword)
                );

            return (
                matchesRole &&
                matchesModule &&
                matchesSearch
            );
        });
    }, [
        logs,
        search,
        roleFilter,
        moduleFilter
    ]);

    // ==========================================
    // FORMAT DATE
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
    // CLEAR FILTERS
    // ==========================================
    const clearFilters = () => {
        setSearch("");
        setRoleFilter("All");
        setModuleFilter("All");
    };

    const hasFilters =
        search ||
        roleFilter !== "All" ||
        moduleFilter !== "All";

    return (
        <div className="activity-logs-page">

            {/* ======================================
                HEADER
            ====================================== */}

            <div className="activity-logs-header">

                <div>
                    <h1>Activity Logs</h1>

                    <p>
                        Monitor system activities and
                        user actions.
                    </p>
                </div>

                <button
                    className="activity-refresh-button"
                    onClick={loadActivityLogs}
                    disabled={loading}
                >
                    <RefreshCw
                        size={18}
                        className={
                            loading
                                ? "activity-spin"
                                : ""
                        }
                    />

                    Refresh
                </button>

            </div>

            {/* ======================================
                ERROR
            ====================================== */}

            {error && (
                <div className="activity-error">

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
                SUMMARY
            ====================================== */}

            <div className="activity-summary">

                <div className="activity-summary-card">

                    <div className="activity-summary-icon">
                        <Activity size={21} />
                    </div>

                    <div>
                        <span>Total Activities</span>
                        <strong>
                            {logs.length}
                        </strong>
                    </div>

                </div>

                <div className="activity-summary-card">

                    <div className="activity-summary-icon">
                        <UserRound size={21} />
                    </div>

                    <div>
                        <span>Users</span>
                        <strong>
                            {
                                new Set(
                                    logs
                                        .map(
                                            (log) =>
                                                log.UserID
                                        )
                                        .filter(Boolean)
                                ).size
                            }
                        </strong>
                    </div>

                </div>

                <div className="activity-summary-card">

                    <div className="activity-summary-icon">
                        <Calendar size={21} />
                    </div>

                    <div>
                        <span>Displayed</span>
                        <strong>
                            {filteredLogs.length}
                        </strong>
                    </div>

                </div>

            </div>

            {/* ======================================
                FILTERS
            ====================================== */}

            <div className="activity-filters">

                <div className="activity-search">

                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search activity logs..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                </div>

                <select
                    value={roleFilter}
                    onChange={(e) =>
                        setRoleFilter(
                            e.target.value
                        )
                    }
                >
                    {roles.map((role) => (
                        <option
                            key={role}
                            value={role}
                        >
                            {role === "All"
                                ? "All Roles"
                                : role}
                        </option>
                    ))}
                </select>

                <select
                    value={moduleFilter}
                    onChange={(e) =>
                        setModuleFilter(
                            e.target.value
                        )
                    }
                >
                    {modules.map((module) => (
                        <option
                            key={module}
                            value={module}
                        >
                            {module === "All"
                                ? "All Modules"
                                : module}
                        </option>
                    ))}
                </select>

                {hasFilters && (
                    <button
                        className="clear-filter-button"
                        onClick={clearFilters}
                    >
                        <X size={16} />
                        Clear
                    </button>
                )}

            </div>

            {/* ======================================
                ACTIVITY TABLE
            ====================================== */}

            <div className="activity-logs-card">

                <div className="activity-card-header">

                    <div>
                        <h2>System Activity</h2>

                        <p>
                            {filteredLogs.length} activity
                            {filteredLogs.length !== 1
                                ? " logs"
                                : " log"}{" "}
                            displayed
                        </p>
                    </div>

                    <Activity size={22} />

                </div>

                {loading ? (

                    <div className="activity-loading">

                        <RefreshCw
                            size={32}
                            className="activity-spin"
                        />

                        <p>
                            Loading activity logs...
                        </p>

                    </div>

                ) : filteredLogs.length === 0 ? (

                    <div className="activity-empty">

                        <Activity size={45} />

                        <h3>
                            No activity logs found
                        </h3>

                        <p>
                            There are no activity logs
                            matching your filters.
                        </p>

                    </div>

                ) : (

                    <div className="activity-table-wrapper">

                        <table className="activity-table">

                            <thead>

                                <tr>
                                    <th>ID</th>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Activity</th>
                                    <th>Module</th>
                                    <th>IP Address</th>
                                    <th>Date & Time</th>
                                </tr>

                            </thead>

                            <tbody>

                                {filteredLogs.map(
                                    (log) => (
                                        <tr
                                            key={
                                                log.LogID
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    #
                                                    {
                                                        log.LogID
                                                    }
                                                </strong>
                                            </td>

                                            <td>

                                                <div className="activity-user">

                                                    <strong>
                                                        {
                                                            log.UserName ||
                                                            "Unknown User"
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            log.UserEmail ||
                                                            "-"
                                                        }
                                                    </span>

                                                </div>

                                            </td>

                                            <td>

                                                <span className="activity-role">
                                                    {
                                                        log.UserRole ||
                                                        "-"
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <span className="activity-action">
                                                    {
                                                        log.Activity ||
                                                        "-"
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <span className="activity-module">
                                                    {
                                                        log.Module ||
                                                        "-"
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                <span className="activity-ip">
                                                    {
                                                        log.IPAddress ||
                                                        "-"
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="activity-date">
                                                    {formatDate(
                                                        log.LogDate
                                                    )}
                                                </span>
                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}

export default ActivityLogs;