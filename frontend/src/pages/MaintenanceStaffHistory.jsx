
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
    FileText,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Search,
    AlertCircle
} from "lucide-react";

import "./MaintenanceStaffHistory.css";

const API_URL =
    "http://localhost:5000/api/maintenance-requests";

function MaintenanceStaffHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const getConfig = useCallback(() => {
        const token = localStorage.getItem("token");

        return {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        };
    }, []);

    // ==========================================
    // LOAD MY MAINTENANCE HISTORY
    // ==========================================
    const loadHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/my-history`,
                getConfig()
            );

            console.log(
                "MAINTENANCE HISTORY RESPONSE:",
                response.data
            );

            if (response.data?.success) {
                setHistory(response.data.history || []);
            } else {
                setHistory([]);
                setError(
                    response.data?.message ||
                    "Failed to load maintenance history."
                );
            }

        } catch (err) {
            console.error(
                "LOAD MAINTENANCE HISTORY ERROR:",
                err
            );

            console.error(
                "SERVER RESPONSE:",
                err.response?.data
            );

            setHistory([]);

            setError(
                err.response?.data?.message ||
                "Failed to load maintenance history."
            );

        } finally {
            setLoading(false);
        }
    }, [getConfig]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // ==========================================
    // SEARCH
    // ==========================================
    const filteredHistory = history.filter((item) => {
        const search = searchTerm.trim().toLowerCase();

        if (!search) {
            return true;
        }

        return (
            String(
                item.MaintenanceRequestID || ""
            )
                .toLowerCase()
                .includes(search) ||

            String(
                item.PropertyName || ""
            )
                .toLowerCase()
                .includes(search) ||

            String(
                item.Category || ""
            )
                .toLowerCase()
                .includes(search) ||

            String(
                item.Description || ""
            )
                .toLowerCase()
                .includes(search) ||

            String(
                item.Status || ""
            )
                .toLowerCase()
                .includes(search)
        );
    });

    // ==========================================
    // DATE FORMAT
    // ==========================================
    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        const formattedDate = new Date(date);

        if (Number.isNaN(formattedDate.getTime())) {
            return "—";
        }

        return formattedDate.toLocaleDateString();
    };

    // ==========================================
    // PAGE
    // ==========================================
    return (
        <div className="maintenance-history-page">

            {/* HEADER */}
            <div className="history-header">

                <div>
                    <h1>Maintenance History</h1>

                    <p>
                        View maintenance requests you have
                        completed or rejected.
                    </p>
                </div>

                <button
                    type="button"
                    className="refresh-history-btn"
                    onClick={loadHistory}
                    disabled={loading}
                >
                    <RefreshCw
                        size={18}
                        className={loading ? "spin" : ""}
                    />

                    {loading
                        ? "Refreshing..."
                        : "Refresh"}
                </button>

            </div>

            {/* ERROR */}
            {error && (
                <div className="history-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* SEARCH / COUNT */}
            <div className="history-toolbar">

                <div className="history-search">

                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search maintenance history..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                    />

                </div>

                <div className="history-count">
                    {filteredHistory.length} request
                    {filteredHistory.length !== 1
                        ? "s"
                        : ""}
                </div>

            </div>

            {/* LOADING */}
            {loading ? (

                <div className="history-loading">

                    <RefreshCw
                        size={28}
                        className="spin"
                    />

                    <p>
                        Loading maintenance history...
                    </p>

                </div>

            ) : filteredHistory.length === 0 ? (

                /* EMPTY */
                <div className="history-empty">

                    <div className="history-empty-icon">
                        <FileText size={42} />
                    </div>

                    <h3>
                        No Maintenance History Found
                    </h3>

                    <p>
                        Completed or rejected maintenance
                        requests will appear here.
                    </p>

                </div>

            ) : (

                /* TABLE */
                <div className="history-table-container">

                    <table className="history-table">

                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Property</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Request Date</th>
                                <th>Completion Date</th>
                            </tr>
                        </thead>

                        <tbody>

                            {filteredHistory.map((item) => (

                                <tr
                                    key={
                                        item.MaintenanceRequestID
                                    }
                                >

                                    {/* ID */}
                                    <td>
                                        #
                                        {
                                            item.MaintenanceRequestID
                                        }
                                    </td>

                                    {/* PROPERTY */}
                                    <td>
                                        {item.PropertyName || "—"}
                                    </td>

                                    {/* CATEGORY */}
                                    <td>
                                        {item.Category || "—"}
                                    </td>

                                    {/* DESCRIPTION */}
                                    <td className="description-cell">
                                        {
                                            item.Description ||
                                            "—"
                                        }
                                    </td>

                                    {/* PRIORITY */}
                                    <td>

                                        <span
                                            className={
                                                `priority-badge priority-${
                                                    String(
                                                        item.Priority ||
                                                        "Low"
                                                    )
                                                        .toLowerCase()
                                                        .replace(
                                                            /\s+/g,
                                                            "-"
                                                        )
                                                }`
                                            }
                                        >
                                            {item.Priority || "—"}
                                        </span>

                                    </td>

                                    {/* STATUS */}
                                    <td>

                                        {item.Status ===
                                        "Completed" ? (

                                            <span className="status-badge completed">

                                                <CheckCircle2
                                                    size={15}
                                                />

                                                Completed

                                            </span>

                                        ) : (

                                            <span className="status-badge rejected">

                                                <XCircle
                                                    size={15}
                                                />

                                                {item.Status ||
                                                    "Rejected"}

                                            </span>

                                        )}

                                    </td>

                                    {/* REQUEST DATE */}
                                    <td>
                                        {formatDate(
                                            item.RequestDate
                                        )}
                                    </td>

                                    {/* COMPLETION DATE */}
                                    <td>
                                        {formatDate(
                                            item.CompletionDate
                                        )}
                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            )}

        </div>
    );
}

export default MaintenanceStaffHistory;
