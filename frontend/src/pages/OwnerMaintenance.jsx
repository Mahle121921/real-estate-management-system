import { useEffect, useState } from "react";
import axios from "axios";
import {
    Wrench,
    Search,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    DollarSign,
    Check,
    X,
} from "lucide-react";

import "./OwnerMaintenance.css";

function OwnerMaintenance() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // =========================================================
    // SELECTED REQUEST / MODALS
    // =========================================================
    const [selectedRequest, setSelectedRequest] = useState(null);

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCostModal, setShowCostModal] = useState(false);

    // =========================================================
    // COST MANAGEMENT
    // =========================================================
    const [estimatedCost, setEstimatedCost] = useState("");
    const [actualCost, setActualCost] = useState("");

    const [savingCost, setSavingCost] = useState(false);
    const [approvingCost, setApprovingCost] = useState(false);

    const [message, setMessage] = useState("");

    const token = localStorage.getItem("token");

    // =========================================================
    // FETCH MAINTENANCE REQUESTS
    // =========================================================
    const fetchMaintenanceRequests = async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                "http://localhost:5000/api/maintenance",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log(
                "OWNER MAINTENANCE API RESPONSE:",
                response.data
            );

            const data =
                response.data?.maintenanceRequests ||
                response.data?.requests ||
                response.data?.data ||
                (Array.isArray(response.data)
                    ? response.data
                    : []);

            console.log(
                "OWNER EXTRACTED MAINTENANCE REQUESTS:",
                data
            );

            setRequests(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (err) {
            console.error(
                "Error loading owner maintenance requests:",
                err
            );

            if (
                err.response?.status === 401 ||
                err.response?.status === 403
            ) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/";
                return;
            }

            setError(
                err.response?.data?.message ||
                    "Failed to load maintenance requests."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // INITIAL PAGE LOAD
    // =========================================================
    useEffect(() => {
        let cancelled = false;

        const loadInitialData = async () => {
            if (cancelled || !token) {
                setLoading(false);
                return;
            }

            await fetchMaintenanceRequests();
        };

        loadInitialData();

        return () => {
            cancelled = true;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // =========================================================
    // VIEW REQUEST DETAILS
    // =========================================================
    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setMessage("");
        setShowDetailsModal(true);
    };

    // =========================================================
    // CLOSE DETAILS MODAL
    // =========================================================
    const closeDetailsModal = () => {
        if (approvingCost) return;

        setShowDetailsModal(false);
        setSelectedRequest(null);
        setMessage("");
    };

    // =========================================================
    // OPEN COST MODAL
    // =========================================================
    const handleManageCost = (request) => {
        setSelectedRequest(request);

        setEstimatedCost(
            request.EstimatedCost ??
                request.estimatedCost ??
                ""
        );

        setActualCost(
            request.ActualCost ??
                request.actualCost ??
                ""
        );

        setMessage("");
        setShowCostModal(true);
    };

    // =========================================================
    // CLOSE COST MODAL
    // =========================================================
    const closeCostModal = () => {
        if (savingCost) return;

        setShowCostModal(false);
        setSelectedRequest(null);
        setEstimatedCost("");
        setActualCost("");
        setMessage("");
    };

    // =========================================================
    // SAVE MAINTENANCE COST
    // =========================================================
    const handleSaveCost = async () => {
        if (!selectedRequest?.MaintenanceRequestID) {
            setMessage("Invalid maintenance request.");
            return;
        }

        if (
            estimatedCost === "" ||
            actualCost === ""
        ) {
            setMessage(
                "Please enter both estimated and actual cost."
            );
            return;
        }

        if (
            Number.isNaN(Number(estimatedCost)) ||
            Number.isNaN(Number(actualCost))
        ) {
            setMessage(
                "Please enter valid cost amounts."
            );
            return;
        }

        if (
            Number(estimatedCost) < 0 ||
            Number(actualCost) < 0
        ) {
            setMessage(
                "Cost values cannot be negative."
            );
            return;
        }

        try {
            setSavingCost(true);
            setMessage("");

            await axios.put(
                `http://localhost:5000/api/maintenance/${selectedRequest.MaintenanceRequestID}/cost`,
                {
                    EstimatedCost: Number(estimatedCost),
                    ActualCost: Number(actualCost),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            await fetchMaintenanceRequests();

            setShowCostModal(false);
            setSelectedRequest(null);
            setEstimatedCost("");
            setActualCost("");

            setMessage(
                "Maintenance cost saved successfully."
            );
        } catch (err) {
            console.error(
                "Save maintenance cost error:",
                err
            );

            if (
                err.response?.status === 401 ||
                err.response?.status === 403
            ) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/";
                return;
            }

            setMessage(
                err.response?.data?.message ||
                    "Failed to save maintenance cost."
            );
        } finally {
            setSavingCost(false);
        }
    };

    // =========================================================
    // APPROVE / REJECT MAINTENANCE COST
    // =========================================================
    const handleCostApproval = async (decision) => {
        if (!selectedRequest?.MaintenanceRequestID) {
            setMessage("Invalid maintenance request.");
            return;
        }

        try {
            setApprovingCost(true);
            setMessage("");

            await axios.put(
                `http://localhost:5000/api/maintenance/${selectedRequest.MaintenanceRequestID}/cost-approval`,
                {
                    CostApprovalStatus: decision,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            await fetchMaintenanceRequests();

            setMessage(
                decision === "Approved"
                    ? "Maintenance cost approved successfully."
                    : "Maintenance cost rejected successfully."
            );

            setShowDetailsModal(false);
            setSelectedRequest(null);
        } catch (err) {
            console.error(
                "Maintenance cost approval error:",
                err
            );

            if (
                err.response?.status === 401 ||
                err.response?.status === 403
            ) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/";
                return;
            }

            setMessage(
                err.response?.data?.message ||
                    "Failed to update cost approval."
            );
        } finally {
            setApprovingCost(false);
        }
    };

    // =========================================================
    // HELPER: GET VALUE
    // =========================================================
    const getValue = (item, keys) => {
        for (const key of keys) {
            if (
                item?.[key] !== undefined &&
                item?.[key] !== null &&
                item?.[key] !== ""
            ) {
                return item[key];
            }
        }

        return "-";
    };

    // =========================================================
    // FORMAT DATE
    // =========================================================
    const formatDate = (date) => {
        if (!date || date === "-") {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString();
    };

    // =========================================================
    // FORMAT CURRENCY
    // =========================================================
    const formatCurrency = (amount) => {
        if (
            amount === null ||
            amount === undefined ||
            amount === "" ||
            amount === "-"
        ) {
            return "-";
        }

        const number = Number(amount);

        if (Number.isNaN(number)) {
            return amount;
        }

        return `${number.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })} ETB`;
    };

    // =========================================================
    // STATUS CLASS
    // =========================================================
    const getStatusClass = (status) => {
        const value = String(status || "").toLowerCase();

        if (
            value.includes("complete") ||
            value.includes("resolved")
        ) {
            return "completed";
        }

        if (value.includes("progress")) {
            return "in-progress";
        }

        if (value.includes("pending")) {
            return "pending";
        }

        if (
            value.includes("cancel") ||
            value.includes("reject") ||
            value.includes("closed")
        ) {
            return "cancelled";
        }

        return "default";
    };

    // =========================================================
    // STATUS ICON
    // =========================================================
    const getStatusIcon = (status) => {
        const value = String(status || "").toLowerCase();

        if (
            value.includes("complete") ||
            value.includes("resolved")
        ) {
            return <CheckCircle size={15} />;
        }

        if (value.includes("progress")) {
            return <Clock size={15} />;
        }

        if (
            value.includes("cancel") ||
            value.includes("reject")
        ) {
            return <XCircle size={15} />;
        }

        return <AlertCircle size={15} />;
    };

    // =========================================================
    // COST APPROVAL CLASS
    // =========================================================
    const getCostApprovalClass = (status) => {
        const value = String(status || "").toLowerCase();

        if (value === "approved") {
            return "approved";
        }

        if (value === "rejected") {
            return "rejected";
        }

        return "pending";
    };

    // =========================================================
    // FILTER REQUESTS
    // =========================================================
    const filteredRequests = requests.filter((request) => {
        if (!request || typeof request !== "object") {
            return false;
        }

        if (!searchTerm.trim()) {
            return true;
        }

        const searchableText = [
            getValue(request, [
                "PropertyName",
                "propertyName",
                "Property",
                "property",
            ]),

            getValue(request, [
                "Category",
                "category",
                "MaintenanceCategory",
                "maintenanceCategory",
            ]),

            getValue(request, [
                "Priority",
                "priority",
            ]),

            getValue(request, [
                "Status",
                "status",
                "RequestStatus",
                "requestStatus",
            ]),

            getValue(request, [
                "AssignedStaffName",
                "assignedStaffName",
                "AssignedStaff",
                "assignedStaff",
                "MaintenanceStaff",
                "maintenanceStaff",
                "StaffName",
                "staffName",
            ]),

            getValue(request, [
                "Description",
                "description",
            ]),
        ]
            .map((value) => String(value))
            .join(" ")
            .toLowerCase();

        return searchableText.includes(
            searchTerm.trim().toLowerCase()
        );
    });

    // =========================================================
    // SUMMARY COUNTS
    // =========================================================
    const pendingCount = requests.filter((request) =>
        String(
            getValue(request, [
                "Status",
                "status",
                "RequestStatus",
                "requestStatus",
            ])
        )
            .toLowerCase()
            .includes("pending")
    ).length;

    const progressCount = requests.filter((request) =>
        String(
            getValue(request, [
                "Status",
                "status",
                "RequestStatus",
                "requestStatus",
            ])
        )
            .toLowerCase()
            .includes("progress")
    ).length;

    const completedCount = requests.filter((request) => {
        const status = String(
            getValue(request, [
                "Status",
                "status",
                "RequestStatus",
                "requestStatus",
            ])
        ).toLowerCase();

        return (
            status.includes("complete") ||
            status.includes("resolved")
        );
    }).length;

    // =========================================================
    // RENDER
    // =========================================================
    return (
        <div className="owner-maintenance-page">

            {/* =================================================
                HEADER
            ================================================= */}
            <div className="owner-maintenance-header">
                <div className="owner-maintenance-title">
                    <Wrench size={28} />

                    <div>
                        <h1>Maintenance Requests</h1>

                        <p>
                            View and track maintenance requests
                            for your properties.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="maintenance-refresh-btn"
                    onClick={fetchMaintenanceRequests}
                    disabled={loading}
                >
                    <RefreshCw
                        size={17}
                        className={
                            loading ? "spinning" : ""
                        }
                    />

                    Refresh
                </button>
            </div>

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}
            <div className="maintenance-summary">

                <div className="maintenance-summary-card">
                    <div className="summary-icon">
                        <Wrench size={21} />
                    </div>

                    <div>
                        <span>Total Requests</span>
                        <strong>
                            {requests.length}
                        </strong>
                    </div>
                </div>

                <div className="maintenance-summary-card">
                    <div className="summary-icon pending-icon">
                        <Clock size={21} />
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>
                            {pendingCount}
                        </strong>
                    </div>
                </div>

                <div className="maintenance-summary-card">
                    <div className="summary-icon progress-icon">
                        <AlertCircle size={21} />
                    </div>

                    <div>
                        <span>In Progress</span>
                        <strong>
                            {progressCount}
                        </strong>
                    </div>
                </div>

                <div className="maintenance-summary-card">
                    <div className="summary-icon completed-icon">
                        <CheckCircle size={21} />
                    </div>

                    <div>
                        <span>Completed</span>
                        <strong>
                            {completedCount}
                        </strong>
                    </div>
                </div>
            </div>

            {/* =================================================
                TOOLBAR
            ================================================= */}
            <div className="maintenance-toolbar">
                <div className="maintenance-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search maintenance requests..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                    />
                </div>
            </div>

            {/* =================================================
                MESSAGE
            ================================================= */}
            {message && (
                <div className="maintenance-message">
                    {message}
                </div>
            )}

            {/* =================================================
                LOADING
            ================================================= */}
            {loading ? (
                <div className="maintenance-state">
                    <RefreshCw
                        className="spinning"
                        size={28}
                    />

                    <p>
                        Loading maintenance requests...
                    </p>
                </div>

            ) : error ? (

                <div className="maintenance-state error-state">
                    <AlertCircle size={32} />

                    <h3>
                        Unable to load maintenance requests
                    </h3>

                    <p>{error}</p>

                    <button
                        type="button"
                        className="maintenance-retry-btn"
                        onClick={fetchMaintenanceRequests}
                    >
                        Try Again
                    </button>
                </div>

            ) : filteredRequests.length === 0 ? (

                <div className="maintenance-state">
                    <Wrench size={40} />

                    <h3>
                        {searchTerm
                            ? "No matching requests"
                            : "No maintenance requests"}
                    </h3>

                    <p>
                        {searchTerm
                            ? "Try a different search term."
                            : "There are currently no maintenance requests for your properties."}
                    </p>
                </div>

            ) : (

                <div className="maintenance-table-container">
                    <table className="maintenance-table">

                        <thead>
                            <tr>
                                <th>Property</th>
                                <th>Category</th>
                                <th>Priority</th>
                                <th>Assigned Staff</th>
                                <th>Status</th>
                                <th>Estimated Cost</th>
                                <th>Actual Cost</th>
                                <th>Request Date</th>
                                <th>Completed Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredRequests.map(
                                (request, index) => {

                                    const property =
                                        getValue(request, [
                                            "PropertyName",
                                            "propertyName",
                                            "Property",
                                            "property",
                                        ]);

                                    const category =
                                        getValue(request, [
                                            "Category",
                                            "category",
                                            "MaintenanceCategory",
                                            "maintenanceCategory",
                                        ]);

                                    const priority =
                                        getValue(request, [
                                            "Priority",
                                            "priority",
                                        ]);

                                    const assignedStaff =
                                        getValue(request, [
                                            "AssignedStaffName",
                                            "assignedStaffName",
                                            "AssignedStaff",
                                            "assignedStaff",
                                            "MaintenanceStaff",
                                            "maintenanceStaff",
                                            "StaffName",
                                            "staffName",
                                        ]);

                                    const status =
                                        getValue(request, [
                                            "Status",
                                            "status",
                                            "RequestStatus",
                                            "requestStatus",
                                        ]);

                                    const estimated =
                                        getValue(request, [
                                            "EstimatedCost",
                                            "estimatedCost",
                                        ]);

                                    const actual =
                                        getValue(request, [
                                            "ActualCost",
                                            "actualCost",
                                        ]);

                                    const requestDate =
                                        getValue(request, [
                                            "RequestDate",
                                            "requestDate",
                                            "CreatedAt",
                                            "createdAt",
                                        ]);

                                    const completedDate =
                                        getValue(request, [
                                            "CompletionDate",
                                            "completionDate",
                                            "CompletedDate",
                                            "completedDate",
                                            "ResolvedDate",
                                            "resolvedDate",
                                        ]);

                                    const requestId =
                                        request.MaintenanceRequestID ||
                                        request.maintenanceRequestID ||
                                        request.MaintenanceID ||
                                        request.RequestID;

                                    return (
                                        <tr
                                            key={
                                                requestId ||
                                                index
                                            }
                                        >

                                            {/* PROPERTY */}
                                            <td>
                                                <div className="property-cell">
                                                    <div className="property-icon">
                                                        <Wrench
                                                            size={16}
                                                        />
                                                    </div>

                                                    <strong>
                                                        {property}
                                                    </strong>
                                                </div>
                                            </td>

                                            {/* CATEGORY */}
                                            <td>
                                                {category}
                                            </td>

                                            {/* PRIORITY */}
                                            <td>
                                                <span
                                                    className={`priority-badge ${String(
                                                        priority
                                                    ).toLowerCase()}`}
                                                >
                                                    {priority}
                                                </span>
                                            </td>

                                            {/* ASSIGNED STAFF */}
                                            <td>
                                                {assignedStaff}
                                            </td>

                                            {/* STATUS */}
                                            <td>
                                                <span
                                                    className={`status-badge ${getStatusClass(
                                                        status
                                                    )}`}
                                                >
                                                    {getStatusIcon(
                                                        status
                                                    )}

                                                    {status}
                                                </span>
                                            </td>

                                            {/* ESTIMATED COST */}
                                            <td>
                                                {formatCurrency(
                                                    estimated
                                                )}
                                            </td>

                                            {/* ACTUAL COST */}
                                            <td>
                                                {formatCurrency(
                                                    actual
                                                )}
                                            </td>

                                            {/* REQUEST DATE */}
                                            <td>
                                                {formatDate(
                                                    requestDate
                                                )}
                                            </td>

                                            {/* COMPLETION DATE */}
                                            <td>
                                                {formatDate(
                                                    completedDate
                                                )}
                                            </td>

                                            {/* ACTIONS */}
                                            <td>
                                                <div className="maintenance-actions">

                                                    <button
                                                        type="button"
                                                        className="view-request-btn"
                                                        onClick={() =>
                                                            handleViewDetails(
                                                                request
                                                            )
                                                        }
                                                        title="View request details"
                                                    >
                                                        <Eye size={15} />
                                                        View
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="manage-cost-btn"
                                                        onClick={() =>
                                                            handleManageCost(
                                                                request
                                                            )
                                                        }
                                                        title="Manage maintenance cost"
                                                    >
                                                        <DollarSign
                                                            size={15}
                                                        />
                                                        Cost
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>
                                    );
                                }
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* =================================================
                VIEW DETAILS MODAL
            ================================================= */}
            {showDetailsModal && selectedRequest && (
                <div className="maintenance-modal-overlay">

                    <div className="maintenance-modal">

                        <div className="maintenance-modal-header">
                            <div>
                                <h2>
                                    <Eye size={20} />
                                    Maintenance Request Details
                                </h2>

                                <p>
                                    Review the maintenance request,
                                    assigned staff, progress and cost.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="maintenance-modal-close"
                                onClick={closeDetailsModal}
                                disabled={approvingCost}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="request-summary">

                            <div>
                                <span>Property</span>
                                <strong>
                                    {getValue(
                                        selectedRequest,
                                        [
                                            "PropertyName",
                                            "propertyName",
                                            "Property",
                                            "property",
                                        ]
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Category</span>
                                <strong>
                                    {getValue(
                                        selectedRequest,
                                        [
                                            "Category",
                                            "category",
                                            "MaintenanceCategory",
                                            "maintenanceCategory",
                                        ]
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Priority</span>
                                <strong>
                                    {getValue(
                                        selectedRequest,
                                        [
                                            "Priority",
                                            "priority",
                                        ]
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Status</span>
                                <strong>
                                    {getValue(
                                        selectedRequest,
                                        [
                                            "Status",
                                            "status",
                                            "RequestStatus",
                                            "requestStatus",
                                        ]
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Assigned Staff</span>
                                <strong>
                                    {getValue(
                                        selectedRequest,
                                        [
                                            "AssignedStaffName",
                                            "assignedStaffName",
                                            "AssignedStaff",
                                            "assignedStaff",
                                            "StaffName",
                                            "staffName",
                                        ]
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Responsible Party</span>
                                <strong>
                                    {getValue(
                                        selectedRequest,
                                        [
                                            "ResponsibleParty",
                                            "responsibleParty",
                                        ]
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Request Date</span>
                                <strong>
                                    {formatDate(
                                        getValue(
                                            selectedRequest,
                                            [
                                                "RequestDate",
                                                "requestDate",
                                                "CreatedAt",
                                                "createdAt",
                                            ]
                                        )
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Completion Date</span>
                                <strong>
                                    {formatDate(
                                        getValue(
                                            selectedRequest,
                                            [
                                                "CompletionDate",
                                                "completionDate",
                                                "CompletedDate",
                                                "completedDate",
                                            ]
                                        )
                                    )}
                                </strong>
                            </div>

                        </div>

                        {/* DESCRIPTION */}
                        <div className="maintenance-detail-section">
                            <h3>Description</h3>

                            <p>
                                {getValue(
                                    selectedRequest,
                                    [
                                        "Description",
                                        "description",
                                    ]
                                )}
                            </p>
                        </div>

                        {/* MAINTENANCE NOTES */}
                        <div className="maintenance-detail-section">
                            <h3>Maintenance Notes</h3>

                            <p>
                                {getValue(
                                    selectedRequest,
                                    [
                                        "MaintenanceNotes",
                                        "maintenanceNotes",
                                    ]
                                )}
                            </p>
                        </div>

                        {/* COMPLETION DETAILS */}
                        <div className="maintenance-detail-section">
                            <h3>Completion Details</h3>

                            <p>
                                {getValue(
                                    selectedRequest,
                                    [
                                        "CompletionDetails",
                                        "completionDetails",
                                    ]
                                )}
                            </p>
                        </div>

                        {/* COST INFORMATION */}
                        <div className="maintenance-cost-summary">

                            <div>
                                <span>Estimated Cost</span>

                                <strong>
                                    {formatCurrency(
                                        getValue(
                                            selectedRequest,
                                            [
                                                "EstimatedCost",
                                                "estimatedCost",
                                            ]
                                        )
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Actual Cost</span>

                                <strong>
                                    {formatCurrency(
                                        getValue(
                                            selectedRequest,
                                            [
                                                "ActualCost",
                                                "actualCost",
                                            ]
                                        )
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Cost Approval</span>

                                <strong
                                    className={`cost-approval-badge ${getCostApprovalClass(
                                        getValue(
                                            selectedRequest,
                                            [
                                                "CostApprovalStatus",
                                                "costApprovalStatus",
                                            ]
                                        )
                                    )}`}
                                >
                                    {getValue(
                                        selectedRequest,
                                        [
                                            "CostApprovalStatus",
                                            "costApprovalStatus",
                                        ]
                                    )}
                                </strong>
                            </div>

                        </div>

                        {/* COST APPROVAL */}
                        {getValue(
                            selectedRequest,
                            [
                                "CostApprovalStatus",
                                "costApprovalStatus",
                            ]
                        ) !== "Approved" && (
                            <div className="maintenance-modal-actions">

                                <button
                                    type="button"
                                    className="modal-cancel-btn"
                                    onClick={closeDetailsModal}
                                    disabled={approvingCost}
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    className="modal-assign-btn"
                                    onClick={() =>
                                        handleCostApproval(
                                            "Rejected"
                                        )
                                    }
                                    disabled={approvingCost}
                                >
                                    <X size={15} />

                                    {approvingCost
                                        ? "Processing..."
                                        : "Reject Cost"}
                                </button>

                                <button
                                    type="button"
                                    className="modal-assign-btn"
                                    onClick={() =>
                                        handleCostApproval(
                                            "Approved"
                                        )
                                    }
                                    disabled={approvingCost}
                                >
                                    <Check size={15} />

                                    {approvingCost
                                        ? "Processing..."
                                        : "Approve Cost"}
                                </button>

                            </div>
                        )}

                        {getValue(
                            selectedRequest,
                            [
                                "CostApprovalStatus",
                                "costApprovalStatus",
                            ]
                        ) === "Approved" && (
                            <div className="maintenance-modal-actions">

                                <button
                                    type="button"
                                    className="modal-cancel-btn"
                                    onClick={closeDetailsModal}
                                >
                                    Close
                                </button>

                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* =================================================
                MANAGE COST MODAL
            ================================================= */}
            {showCostModal && selectedRequest && (
                <div className="maintenance-modal-overlay">

                    <div className="maintenance-modal">

                        <div className="maintenance-modal-header">

                            <div>
                                <h2>
                                    <DollarSign size={20} />
                                    Manage Maintenance Cost
                                </h2>

                                <p>
                                    Enter and monitor the estimated
                                    and actual maintenance cost.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="maintenance-modal-close"
                                onClick={closeCostModal}
                                disabled={savingCost}
                            >
                                <X size={20} />
                            </button>

                        </div>

                        {/* REQUEST SUMMARY */}
                        <div className="request-summary">

                            <div>
                                <span>Property</span>
                                <strong>
                                    {getValue(
                                        selectedRequest,
                                        [
                                            "PropertyName",
                                            "propertyName",
                                            "Property",
                                            "property",
                                        ]
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Category</span>
                                <strong>
                                    {getValue(
                                        selectedRequest,
                                        [
                                            "Category",
                                            "category",
                                            "MaintenanceCategory",
                                            "maintenanceCategory",
                                        ]
                                    )}
                                </strong>
                            </div>

                        </div>

                        {/* ESTIMATED COST */}
                        <div className="assign-form-group">

                            <label htmlFor="estimated-cost">
                                Estimated Maintenance Cost
                            </label>

                            <input
                                id="estimated-cost"
                                type="number"
                                min="0"
                                step="0.01"
                                value={estimatedCost}
                                onChange={(e) =>
                                    setEstimatedCost(
                                        e.target.value
                                    )
                                }
                                disabled={savingCost}
                                placeholder="Enter estimated cost"
                            />

                        </div>

                        {/* ACTUAL COST */}
                        <div className="assign-form-group">

                            <label htmlFor="actual-cost">
                                Actual Maintenance Cost
                            </label>

                            <input
                                id="actual-cost"
                                type="number"
                                min="0"
                                step="0.01"
                                value={actualCost}
                                onChange={(e) =>
                                    setActualCost(
                                        e.target.value
                                    )
                                }
                                disabled={savingCost}
                                placeholder="Enter actual cost"
                            />

                        </div>

                        {/* COST COMPARISON */}
                        {estimatedCost !== "" &&
                            actualCost !== "" && (
                                <div className="request-summary">

                                    <div>
                                        <span>Estimated</span>
                                        <strong>
                                            {formatCurrency(
                                                estimatedCost
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Actual</span>
                                        <strong>
                                            {formatCurrency(
                                                actualCost
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Difference</span>
                                        <strong>
                                            {formatCurrency(
                                                Number(actualCost) -
                                                    Number(
                                                        estimatedCost
                                                    )
                                            )}
                                        </strong>
                                    </div>

                                </div>
                            )}

                        {/* MESSAGE */}
                        {message && (
                            <div className="assign-message">
                                {message}
                            </div>
                        )}

                        {/* ACTIONS */}
                        <div className="maintenance-modal-actions">

                            <button
                                type="button"
                                className="modal-cancel-btn"
                                onClick={closeCostModal}
                                disabled={savingCost}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="modal-assign-btn"
                                onClick={handleSaveCost}
                                disabled={
                                    savingCost ||
                                    estimatedCost === "" ||
                                    actualCost === ""
                                }
                            >
                                <DollarSign size={15} />

                                {savingCost
                                    ? "Saving..."
                                    : "Save Cost"}
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

export default OwnerMaintenance;
