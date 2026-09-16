import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Activity,
    Calendar,
    Search,
    User,
    Shield,
    Clock,
    Globe,
    RefreshCw,
    AlertCircle
} from "lucide-react";

import "./OwnerActivityLogs.css";

const API_URL = "http://localhost:5000/api/activity-logs";

function OwnerActivityLogs() {
    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [moduleFilter, setModuleFilter] = useState("All");
    const [roleFilter, setRoleFilter] = useState("All");

    // =====================================================
    // GET ACTIVITY LOGS
    // =====================================================

    const fetchActivityLogs = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                setError("You are not logged in.");
                return;
            }

            const response = await axios.get(API_URL, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data?.success) {
                setActivityLogs(response.data.activityLogs || []);
            } else {
                setError(
                    response.data?.message ||
                    "Failed to load activity logs."
                );
            }

        } catch (err) {
            console.error("Activity log error:", err);

            if (err.response?.status === 403) {
                setError(
                    "You are not authorized to view activity logs."
                );
            } else if (err.response?.status === 401) {
                setError(
                    "Your session has expired. Please login again."
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    "Unable to load activity logs."
                );
            }

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // =====================================================
    // LOAD LOGS
    // =====================================================

    useEffect(() => {
        fetchActivityLogs();
    }, []);

    // =====================================================
    // FILTER OPTIONS
    // =====================================================

    const modules = useMemo(() => {
        const values = activityLogs
            .map((log) => log.Module)
            .filter(Boolean);

        return ["All", ...new Set(values)];
    }, [activityLogs]);

    const roles = useMemo(() => {
        const values = activityLogs
            .map((log) => log.UserRole)
            .filter(Boolean);

        return ["All", ...new Set(values)];
    }, [activityLogs]);

    // =====================================================
    // FILTER LOGS
    // =====================================================

    const filteredLogs = useMemo(() => {
        const query = search.trim().toLowerCase();

        return activityLogs.filter((log) => {

            const matchesSearch =
                !query ||
                String(log.UserName || "")
                    .toLowerCase()
                    .includes(query) ||
                String(log.UserEmail || "")
                    .toLowerCase()
                    .includes(query) ||
                String(log.Activity || "")
                    .toLowerCase()
                    .includes(query) ||
                String(log.Module || "")
                    .toLowerCase()
                    .includes(query) ||
                String(log.IPAddress || "")
                    .toLowerCase()
                    .includes(query);

            const matchesModule =
                moduleFilter === "All" ||
                log.Module === moduleFilter;

            const matchesRole =
                roleFilter === "All" ||
                log.UserRole === roleFilter;

            return (
                matchesSearch &&
                matchesModule &&
                matchesRole
            );
        });
    }, [
        activityLogs,
        search,
        moduleFilter,
        roleFilter
    ]);

    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleString();
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="owner-activity-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="owner-activity-header">

                <div className="owner-activity-title">

                    <div className="owner-activity-title-icon">
                        <Activity size={25} />
                    </div>

                    <div>
                        <h1>Activity Logs</h1>

                        <p>
                            View authorized system activity logs.
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    className="owner-activity-refresh"
                    onClick={() => fetchActivityLogs(true)}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={17}
                        className={
                            refreshing
                                ? "owner-refresh-spin"
                                : ""
                        }
                    />

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}
                </button>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="owner-activity-error">

                    <AlertCircle size={20} />

                    <div>
                        <strong>Access / Loading Error</strong>

                        <p>{error}</p>
                    </div>

                </div>
            )}


            {/* =================================================
                LOADING
            ================================================= */}

            {loading ? (

                <div className="owner-activity-loading">

                    <RefreshCw
                        size={28}
                        className="owner-refresh-spin"
                    />

                    <p>Loading activity logs...</p>

                </div>

            ) : (

                <>
                    {/* =========================================
                        SUMMARY
                    ========================================= */}

                    <div className="owner-activity-summary">

                        <div className="owner-activity-summary-card">

                            <div className="summary-icon">
                                <Activity size={21} />
                            </div>

                            <div>
                                <span>Total Activities</span>
                                <strong>
                                    {activityLogs.length}
                                </strong>
                            </div>

                        </div>


                        <div className="owner-activity-summary-card">

                            <div className="summary-icon">
                                <User size={21} />
                            </div>

                            <div>
                                <span>Users</span>
                                <strong>
                                    {
                                        new Set(
                                            activityLogs
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


                        <div className="owner-activity-summary-card">

                            <div className="summary-icon">
                                <Shield size={21} />
                            </div>

                            <div>
                                <span>Modules</span>
                                <strong>
                                    {modules.length - 1}
                                </strong>
                            </div>

                        </div>


                        <div className="owner-activity-summary-card">

                            <div className="summary-icon">
                                <Clock size={21} />
                            </div>

                            <div>
                                <span>Showing</span>
                                <strong>
                                    {filteredLogs.length}
                                </strong>
                            </div>

                        </div>

                    </div>


                    {/* =========================================
                        FILTERS
                    ========================================= */}

                    <div className="owner-activity-filters">

                        <div className="owner-activity-search">

                            <Search size={18} />

                            <input
                                type="text"
                                placeholder="Search user, activity, module, IP..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                            />

                        </div>


                        <select
                            value={moduleFilter}
                            onChange={(e) =>
                                setModuleFilter(e.target.value)
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


                        <select
                            value={roleFilter}
                            onChange={(e) =>
                                setRoleFilter(e.target.value)
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

                    </div>


                    {/* =========================================
                        TABLE
                    ========================================= */}

                    <div className="owner-activity-card">

                        <div className="owner-activity-card-header">

                            <div>
                                <h2>System Activity</h2>

                                <p>
                                    Authorized activity records
                                </p>
                            </div>

                            <span className="owner-activity-count">
                                {filteredLogs.length} records
                            </span>

                        </div>


                        {filteredLogs.length === 0 ? (

                            <div className="owner-activity-empty">

                                <Activity size={42} />

                                <h3>No Activity Logs Found</h3>

                                <p>
                                    There are no activity logs
                                    matching your current filters.
                                </p>

                            </div>

                        ) : (

                            <div className="owner-activity-table-wrapper">

                                <table className="owner-activity-table">

                                    <thead>

                                        <tr>
                                            <th>USER</th>
                                            <th>ROLE</th>
                                            <th>ACTIVITY</th>
                                            <th>MODULE</th>
                                            <th>IP ADDRESS</th>
                                            <th>DATE & TIME</th>
                                        </tr>

                                    </thead>

                                    <tbody>

                                        {filteredLogs.map((log) => (

                                            <tr key={log.LogID}>

                                                <td>

                                                    <div className="activity-user">

                                                        <div className="activity-user-icon">
                                                            <User size={17} />
                                                        </div>

                                                        <div>

                                                            <strong>
                                                                {log.UserName ||
                                                                    "Unknown User"}
                                                            </strong>

                                                            <span>
                                                                {log.UserEmail ||
                                                                    "-"}
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>


                                                <td>

                                                    <span className="activity-role">
                                                        {log.UserRole ||
                                                            "-"}
                                                    </span>

                                                </td>


                                                <td>

                                                    <div className="activity-description">
                                                        {log.Activity ||
                                                            "-"}
                                                    </div>

                                                </td>


                                                <td>

                                                    <span className="activity-module">
                                                        <Shield size={14} />
                                                        {log.Module ||
                                                            "-"}
                                                    </span>

                                                </td>


                                                <td>

                                                    <span className="activity-ip">
                                                        <Globe size={14} />
                                                        {log.IPAddress ||
                                                            "-"}
                                                    </span>

                                                </td>


                                                <td>

                                                    <div className="activity-date">

                                                        <Calendar size={15} />

                                                        <span>
                                                            {formatDate(
                                                                log.LogDate
                                                            )}
                                                        </span>

                                                    </div>

                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </div>

                </>
            )}

        </div>
    );
}

export default OwnerActivityLogs;