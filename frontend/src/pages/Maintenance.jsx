
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  DollarSign,
  Eye,
  History,
  Loader2,
  Search,
  Users,
  Wrench,
  X,
  UserPlus,
  RefreshCw,
} from "lucide-react";

import "./Maintenance.css";

const API_URL = "http://localhost:5000/api/maintenance";
const STAFF_API_URL = "http://localhost:5000/api/maintenance-staff";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Pending", "In Progress", "Completed", "Rejected"];

function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("Medium");
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [actualCost, setActualCost] = useState("");

  // =====================================================
  // AUTH CONFIG
  // =====================================================

  const getConfig = useCallback(() => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // =====================================================
  // LOAD MAINTENANCE REQUESTS
  // =====================================================

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API_URL, getConfig());

      console.log("MAINTENANCE API RESPONSE:", response.data);

      const data =
        response.data?.maintenanceRequests ||
        response.data?.data ||
        (Array.isArray(response.data) ? response.data : []);

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD MAINTENANCE ERROR:", err);
      console.error("SERVER RESPONSE:", err.response?.data);

      setError(
        err.response?.data?.message ||
          "Failed to load maintenance requests."
      );

      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [getConfig]);

  // =====================================================
  // LOAD MAINTENANCE STAFF
  // =====================================================

  const loadStaff = useCallback(async () => {
    try {
      setStaffLoading(true);

      const response = await axios.get(
        STAFF_API_URL,
        getConfig()
      );

      console.log(
        "MAINTENANCE STAFF API RESPONSE:",
        response.data
      );

      const data =
        response.data?.maintenanceStaff ||
        response.data?.staff ||
        response.data?.data ||
        (Array.isArray(response.data)
          ? response.data
          : []);

      console.log("EXTRACTED STAFF:", data);

      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD STAFF ERROR:", err);
      console.error("SERVER RESPONSE:", err.response?.data);

      setStaff([]);
    } finally {
      setStaffLoading(false);
    }
  }, [getConfig]);

  useEffect(() => {
    loadRequests();
    loadStaff();
  }, [loadRequests, loadStaff]);

  // =====================================================
  // HELPERS
  // =====================================================

  const formatCurrency = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    const num = Number(value);

    if (Number.isNaN(num)) {
      return "—";
    }

    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString();
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "Critical":
        return "priority-critical";

      case "High":
        return "priority-high";

      case "Medium":
        return "priority-medium";

      case "Low":
        return "priority-low";

      default:
        return "";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "status-pending";

      case "In Progress":
        return "status-progress";

      case "Completed":
        return "status-completed";

      case "Rejected":
        return "status-rejected";

      default:
        return "";
    }
  };

  const getStaffId = (person) =>
    person.StaffID ||
    person.staffId ||
    person.id;

  const getStaffName = (person) =>
    person.FullName ||
    person.fullName ||
    person.Name ||
    "Unknown Staff";

  // =====================================================
  // FILTER
  // =====================================================

  const filteredRequests = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return requests.filter((request) => {
      const matchSearch =
        !search ||
        String(
          request.MaintenanceRequestID || ""
        )
          .toLowerCase()
          .includes(search) ||
        String(request.PropertyName || "")
          .toLowerCase()
          .includes(search) ||
        String(request.Category || "")
          .toLowerCase()
          .includes(search) ||
        String(request.AssignedStaffName || "")
          .toLowerCase()
          .includes(search) ||
        String(request.ReportedByName || "")
          .toLowerCase()
          .includes(search);

      const matchStatus =
        statusFilter === "All" ||
        request.Status === statusFilter;

      const matchPriority =
        priorityFilter === "All" ||
        request.Priority === priorityFilter;

      return (
        matchSearch &&
        matchStatus &&
        matchPriority
      );
    });
  }, [
    requests,
    searchTerm,
    statusFilter,
    priorityFilter,
  ]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const stats = useMemo(() => {
    return {
      total: requests.length,

      pending: requests.filter(
        (request) => request.Status === "Pending"
      ).length,

      inProgress: requests.filter(
        (request) => request.Status === "In Progress"
      ).length,

      completed: requests.filter(
        (request) => request.Status === "Completed"
      ).length,

      critical: requests.filter(
        (request) => request.Priority === "Critical"
      ).length,

      totalCost: requests.reduce(
        (sum, request) =>
          sum + Number(request.ActualCost || 0),
        0
      ),
    };
  }, [requests]);

  // =====================================================
  // ASSIGN STAFF
  // =====================================================

  const handleOpenAssign = (request) => {
    clearMessages();

    console.log(
      "OPENING ASSIGN STAFF MODAL FOR REQUEST:",
      request.MaintenanceRequestID
    );

    setSelectedRequest(request);

    setSelectedStaffId(
      request.AssignedStaffID
        ? String(request.AssignedStaffID)
        : ""
    );

    setShowAssignModal(true);
  };

  const handleAssignStaff = async (event) => {
    event.preventDefault();

    if (!selectedRequest) {
      setError("No maintenance request selected.");
      return;
    }

    if (!selectedStaffId) {
      setError(
        "Please select a maintenance staff member."
      );
      return;
    }

    try {
      setActionLoading(true);
      clearMessages();

      console.log(
        "ASSIGN STAFF REQUEST:",
        selectedRequest.MaintenanceRequestID
      );

      console.log(
        "STAFF ID:",
        selectedStaffId
      );

      const response = await axios.put(
        `${API_URL}/${selectedRequest.MaintenanceRequestID}/assign-staff`,
        {
          AssignedStaffID: Number(selectedStaffId),
        },
        getConfig()
      );

      console.log(
        "ASSIGN STAFF RESPONSE:",
        response.data
      );

      setSuccess(
        "Maintenance staff assigned successfully."
      );

      setShowAssignModal(false);
      setSelectedRequest(null);
      setSelectedStaffId("");

      await loadRequests();
    } catch (err) {
      console.error("ASSIGN STAFF ERROR:", err);
      console.error(
        "STATUS:",
        err.response?.status
      );
      console.error(
        "SERVER RESPONSE:",
        err.response?.data
      );

      setError(
        err.response?.data?.message ||
          "Failed to assign maintenance staff."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // PRIORITY
  // =====================================================

  const handleOpenPriority = (request) => {
    clearMessages();

    setSelectedRequest(request);

    setSelectedPriority(
      request.Priority || "Medium"
    );

    setShowPriorityModal(true);
  };

  const handleUpdatePriority = async (event) => {
    event.preventDefault();

    if (!selectedRequest) {
      return;
    }

    try {
      setActionLoading(true);
      clearMessages();

      await axios.put(
        `${API_URL}/${selectedRequest.MaintenanceRequestID}/priority`,
        {
          priority: selectedPriority,
        },
        getConfig()
      );

      setSuccess("Priority updated successfully.");

      setShowPriorityModal(false);
      setSelectedRequest(null);

      await loadRequests();
    } catch (err) {
      console.error("UPDATE PRIORITY ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update priority."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // STATUS
  // =====================================================

  const handleOpenStatus = (request) => {
    clearMessages();

    setSelectedRequest(request);

    setSelectedStatus(
      request.Status || "Pending"
    );

    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (event) => {
    event.preventDefault();

    if (!selectedRequest) {
      return;
    }

    try {
      setActionLoading(true);
      clearMessages();

      await axios.put(
        `${API_URL}/${selectedRequest.MaintenanceRequestID}/status`,
        {
          status: selectedStatus,
        },
        getConfig()
      );

      setSuccess("Status updated successfully.");

      setShowStatusModal(false);
      setSelectedRequest(null);

      await loadRequests();
    } catch (err) {
      console.error("UPDATE STATUS ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // COST
  // =====================================================

  const handleOpenCost = (request) => {
    clearMessages();

    setSelectedRequest(request);

    setActualCost(
      request.ActualCost !== null &&
        request.ActualCost !== undefined
        ? String(request.ActualCost)
        : ""
    );

    setShowCostModal(true);
  };

  const handleRecordCost = async (event) => {
    event.preventDefault();

    if (
      !selectedRequest ||
      actualCost === "" ||
      Number(actualCost) < 0
    ) {
      setError("Enter a valid maintenance cost.");
      return;
    }

    try {
      setActionLoading(true);
      clearMessages();

      console.log(
        "RECORDING COST:",
        selectedRequest.MaintenanceRequestID
      );

      console.log(
        "ACTUAL COST:",
        Number(actualCost)
      );

      const response = await axios.put(
        `${API_URL}/${selectedRequest.MaintenanceRequestID}/cost`,
        {
          actualCost: Number(actualCost),
        },
        getConfig()
      );

      console.log(
        "RECORD COST RESPONSE:",
        response.data
      );

      setSuccess(
        "Maintenance cost recorded successfully."
      );

      setShowCostModal(false);
      setSelectedRequest(null);
      setActualCost("");

      await loadRequests();
    } catch (err) {
      console.error("RECORD COST ERROR:", err);
      console.error(
        "STATUS:",
        err.response?.status
      );
      console.error(
        "SERVER RESPONSE:",
        err.response?.data
      );

      setError(
        err.response?.data?.message ||
          "Failed to record maintenance cost."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // VIEW
  // =====================================================

  const handleView = (request) => {
    clearMessages();

    setSelectedRequest(request);
    setShowViewModal(true);
  };

  // =====================================================
  // HISTORY
  // =====================================================

  const handleOpenHistory = async () => {
    clearMessages();

    setShowHistoryModal(true);

    try {
      setHistoryLoading(true);

      const response = await axios.get(
        `${API_URL}/history`,
        getConfig()
      );

      const data =
        response.data?.history ||
        response.data?.data ||
        (Array.isArray(response.data)
          ? response.data
          : []);

      setHistory(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "LOAD HISTORY ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load maintenance history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // =====================================================
  // CLOSE MODALS
  // =====================================================

  const closeModals = () => {
    if (actionLoading) {
      return;
    }

    setShowAssignModal(false);
    setShowPriorityModal(false);
    setShowStatusModal(false);
    setShowCostModal(false);
    setShowViewModal(false);
    setShowHistoryModal(false);

    setSelectedRequest(null);
    setSelectedStaffId("");
    setActualCost("");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="mnt-page">
        <div className="mnt-loading">
          <Loader2
            size={32}
            className="spin"
          />

          <p>
            Loading maintenance requests...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="mnt-page">

      {/* HEADER */}

      <div className="mnt-header">

        <div className="mnt-title">

          <div className="mnt-title-icon">
            <Wrench size={24} />
          </div>

          <div>
            <h1>
              Maintenance Management
            </h1>

            <p>
              Assign staff, update status,
              priority and costs
            </p>
          </div>

        </div>

        <div className="mnt-header-actions">

          <button
            type="button"
            className="mnt-btn secondary"
            onClick={() => {
              loadRequests();
              loadStaff();
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            className="mnt-btn secondary"
            onClick={handleOpenHistory}
          >
            <History size={16} />
            History
          </button>

        </div>

      </div>

      {/* MESSAGES */}

      {error && (
        <div className="mnt-alert error">

          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>

        </div>
      )}

      {success && (
        <div className="mnt-alert success">

          <CheckCircle2 size={18} />

          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* STATISTICS */}

      <div className="mnt-stats">

        <div className="mnt-stat">
          <div className="stat-icon blue">
            <Wrench size={20} />
          </div>

          <div>
            <span>Total</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="mnt-stat">
          <div className="stat-icon yellow">
            <Clock3 size={20} />
          </div>

          <div>
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </div>
        </div>

        <div className="mnt-stat">
          <div className="stat-icon purple">
            <Loader2 size={20} />
          </div>

          <div>
            <span>In Progress</span>
            <strong>
              {stats.inProgress}
            </strong>
          </div>
        </div>

        <div className="mnt-stat">
          <div className="stat-icon green">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Completed</span>
            <strong>
              {stats.completed}
            </strong>
          </div>
        </div>

        <div className="mnt-stat">
          <div className="stat-icon red">
            <AlertCircle size={20} />
          </div>

          <div>
            <span>Critical</span>
            <strong>
              {stats.critical}
            </strong>
          </div>
        </div>

        <div className="mnt-stat">
          <div className="stat-icon teal">
            <DollarSign size={20} />
          </div>

          <div>
            <span>Total Cost</span>
            <strong>
              {formatCurrency(
                stats.totalCost
              )}
            </strong>
          </div>
        </div>

      </div>

      {/* TOOLBAR */}

      <div className="mnt-toolbar">

        <div className="mnt-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search property, staff, category..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />

        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="All">
            All Statuses
          </option>

          {STATUSES.map((status) => (
            <option
              key={status}
              value={status}
            >
              {status}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(
              event.target.value
            )
          }
        >
          <option value="All">
            All Priorities
          </option>

          {PRIORITIES.map((priority) => (
            <option
              key={priority}
              value={priority}
            >
              {priority}
            </option>
          ))}
        </select>

      </div>

      {/* REQUEST TABLE */}

      <div className="mnt-card">

        <div className="mnt-card-header">

          <h2>
            Maintenance Requests
          </h2>

          <span>
            {filteredRequests.length} request
            {filteredRequests.length !== 1
              ? "s"
              : ""}
          </span>

        </div>

        {filteredRequests.length === 0 ? (

          <div className="mnt-empty">

            <Wrench size={40} />

            <h3>
              No requests found
            </h3>

            <p>
              Try changing search or filters.
            </p>

          </div>

        ) : (

          <div className="mnt-table-wrap">

            <table className="mnt-table">

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Property</th>
                  <th>Category</th>
                  <th>Reported By</th>
                  <th>Assigned Staff</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Est. Cost</th>
                  <th>Actual Cost</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {filteredRequests.map(
                  (request) => (

                    <tr
                      key={
                        request.MaintenanceRequestID
                      }
                    >

                      <td>
                        <strong>
                          #
                          {
                            request.MaintenanceRequestID
                          }
                        </strong>
                      </td>

                      <td>

                        <div className="prop-cell">

                          <strong>
                            {
                              request.PropertyName ||
                              "N/A"
                            }
                          </strong>

                          <span>
                            {
                              request.Address ||
                              request.PropertyLocation ||
                              ""
                            }
                          </span>

                        </div>

                      </td>

                      <td>
                        {request.Category || "—"}
                      </td>

                      <td>
                        {
                          request.ReportedByName ||
                          request.ReportedBy ||
                          "—"
                        }
                      </td>

                      <td>

                        {request.AssignedStaffName ? (

                          <span className="staff-assigned">
                            <Users size={14} />
                            {
                              request.AssignedStaffName
                            }
                          </span>

                        ) : (

                          <span className="staff-none">
                            Not assigned
                          </span>

                        )}

                      </td>

                      <td>

                        <span
                          className={`badge ${getPriorityClass(
                            request.Priority
                          )}`}
                        >
                          {request.Priority || "—"}
                        </span>

                      </td>

                      <td>

                        <span
                          className={`badge ${getStatusClass(
                            request.Status
                          )}`}
                        >
                          {request.Status || "—"}
                        </span>

                      </td>

                      <td>
                        {formatCurrency(
                          request.EstimatedCost
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          request.ActualCost
                        )}
                      </td>

                      <td>
                        {formatDate(
                          request.RequestDate
                        )}
                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div className="actions">

                          <button
                            type="button"
                            className="act-btn view"
                            title="View Request"
                            onClick={() =>
                              handleView(request)
                            }
                          >
                            <Eye size={15} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            className="act-btn assign"
                            title="Assign Maintenance Staff"
                            onClick={() =>
                              handleOpenAssign(
                                request
                              )
                            }
                          >
                            <UserPlus size={15} />
                            <span>Assign</span>
                          </button>

                          <button
                            type="button"
                            className="act-btn priority"
                            title="Change Priority"
                            onClick={() =>
                              handleOpenPriority(
                                request
                              )
                            }
                          >
                            <AlertCircle size={15} />
                            <span>Priority</span>
                          </button>

                          <button
                            type="button"
                            className="act-btn status"
                            title="Change Status"
                            onClick={() =>
                              handleOpenStatus(
                                request
                              )
                            }
                          >
                            <Clock3 size={15} />
                            <span>Status</span>
                          </button>

                          <button
                            type="button"
                            className="act-btn cost"
                            title="Record Maintenance Cost"
                            onClick={() =>
                              handleOpenCost(
                                request
                              )
                            }
                          >
                            <DollarSign size={15} />
                            <span>Cost</span>
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =====================================================
          ASSIGN STAFF MODAL
      ===================================================== */}

      {showAssignModal &&
        selectedRequest && (

          <div className="mnt-overlay">

            <div className="mnt-modal">

              <div className="mnt-modal-header">

                <div>
                  <h2>
                    Assign Maintenance Staff
                  </h2>

                  <p>
                    Request #
                    {
                      selectedRequest.MaintenanceRequestID
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="mnt-close"
                  onClick={closeModals}
                  disabled={actionLoading}
                >
                  <X size={20} />
                </button>

              </div>

              <form
                onSubmit={handleAssignStaff}
              >

                <div className="mnt-modal-body">

                  <div className="mnt-summary">

                    <div>
                      <strong>
                        Property
                      </strong>

                      <span>
                        {
                          selectedRequest.PropertyName ||
                          "N/A"
                        }
                      </span>
                    </div>

                    <div>
                      <strong>
                        Category
                      </strong>

                      <span>
                        {
                          selectedRequest.Category ||
                          "N/A"
                        }
                      </span>
                    </div>

                    <div>
                      <strong>
                        Priority
                      </strong>

                      <span>
                        {
                          selectedRequest.Priority ||
                          "N/A"
                        }
                      </span>
                    </div>

                    <div>
                      <strong>
                        Status
                      </strong>

                      <span>
                        {
                          selectedRequest.Status ||
                          "N/A"
                        }
                      </span>
                    </div>

                  </div>

                  <div className="mnt-field">

                    <label>
                      Select Staff Member
                    </label>

                    <select
                      value={selectedStaffId}
                      onChange={(event) =>
                        setSelectedStaffId(
                          event.target.value
                        )
                      }
                      disabled={
                        actionLoading ||
                        staffLoading
                      }
                    >

                      <option value="">
                        {staffLoading
                          ? "Loading staff..."
                          : "-- Select Staff --"}
                      </option>

                      {staff.map(
                        (person) => (

                          <option
                            key={getStaffId(
                              person
                            )}
                            value={getStaffId(
                              person
                            )}
                          >
                            {getStaffName(
                              person
                            )}

                            {person.PhoneNumber ||
                            person.Phone
                              ? ` — ${
                                  person.PhoneNumber ||
                                  person.Phone
                                }`
                              : ""}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  {staff.length === 0 &&
                    !staffLoading && (

                      <p className="mnt-warn">
                        No active maintenance
                        staff found.
                      </p>

                    )}

                  {selectedRequest.AssignedStaffName && (

                    <p className="mnt-info">
                      Currently assigned to:{" "}
                      <strong>
                        {
                          selectedRequest.AssignedStaffName
                        }
                      </strong>
                    </p>

                  )}

                </div>

                <div className="mnt-modal-footer">

                  <button
                    type="button"
                    className="mnt-btn secondary"
                    onClick={closeModals}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="mnt-btn primary"
                    disabled={
                      actionLoading ||
                      staffLoading ||
                      !selectedStaffId
                    }
                  >
                    {actionLoading
                      ? "Assigning..."
                      : "Assign Staff"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      {/* =====================================================
          PRIORITY MODAL
      ===================================================== */}

      {showPriorityModal &&
        selectedRequest && (

          <div className="mnt-overlay">

            <div className="mnt-modal small">

              <div className="mnt-modal-header">

                <div>
                  <h2>
                    Update Priority
                  </h2>

                  <p>
                    Request #
                    {
                      selectedRequest.MaintenanceRequestID
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="mnt-close"
                  onClick={closeModals}
                >
                  <X size={20} />
                </button>

              </div>

              <form
                onSubmit={handleUpdatePriority}
              >

                <div className="mnt-modal-body">

                  <div className="mnt-field">

                    <label>
                      Priority
                    </label>

                    <select
                      value={selectedPriority}
                      onChange={(event) =>
                        setSelectedPriority(
                          event.target.value
                        )
                      }
                      disabled={actionLoading}
                    >

                      {PRIORITIES.map(
                        (priority) => (

                          <option
                            key={priority}
                            value={priority}
                          >
                            {priority}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                </div>

                <div className="mnt-modal-footer">

                  <button
                    type="button"
                    className="mnt-btn secondary"
                    onClick={closeModals}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="mnt-btn primary"
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? "Saving..."
                      : "Update Priority"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      {/* =====================================================
          STATUS MODAL
      ===================================================== */}

      {showStatusModal &&
        selectedRequest && (

          <div className="mnt-overlay">

            <div className="mnt-modal small">

              <div className="mnt-modal-header">

                <div>
                  <h2>
                    Update Status
                  </h2>

                  <p>
                    Request #
                    {
                      selectedRequest.MaintenanceRequestID
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="mnt-close"
                  onClick={closeModals}
                >
                  <X size={20} />
                </button>

              </div>

              <form
                onSubmit={handleUpdateStatus}
              >

                <div className="mnt-modal-body">

                  <div className="mnt-field">

                    <label>
                      Status
                    </label>

                    <select
                      value={selectedStatus}
                      onChange={(event) =>
                        setSelectedStatus(
                          event.target.value
                        )
                      }
                      disabled={actionLoading}
                    >

                      {STATUSES.map(
                        (status) => (

                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                </div>

                <div className="mnt-modal-footer">

                  <button
                    type="button"
                    className="mnt-btn secondary"
                    onClick={closeModals}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="mnt-btn primary"
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? "Saving..."
                      : "Update Status"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      {/* =====================================================
          COST MODAL
      ===================================================== */}

      {showCostModal &&
        selectedRequest && (

          <div className="mnt-overlay">

            <div className="mnt-modal small">

              <div className="mnt-modal-header">

                <div>
                  <h2>
                    Record Maintenance Cost
                  </h2>

                  <p>
                    Request #
                    {
                      selectedRequest.MaintenanceRequestID
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="mnt-close"
                  onClick={closeModals}
                >
                  <X size={20} />
                </button>

              </div>

              <form
                onSubmit={handleRecordCost}
              >

                <div className="mnt-modal-body">

                  <div className="mnt-summary">

                    <div>
                      <strong>
                        Property
                      </strong>

                      <span>
                        {
                          selectedRequest.PropertyName ||
                          "N/A"
                        }
                      </span>
                    </div>

                    <div>
                      <strong>
                        Estimated Cost
                      </strong>

                      <span>
                        ETB{" "}
                        {formatCurrency(
                          selectedRequest.EstimatedCost
                        )}
                      </span>
                    </div>

                    <div>
                      <strong>
                        Current Actual Cost
                      </strong>

                      <span>
                        ETB{" "}
                        {formatCurrency(
                          selectedRequest.ActualCost
                        )}
                      </span>
                    </div>

                  </div>

                  <div className="mnt-field">

                    <label>
                      Actual Maintenance Cost (ETB)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={actualCost}
                      onChange={(event) =>
                        setActualCost(
                          event.target.value
                        )
                      }
                      placeholder="Enter actual cost"
                      disabled={actionLoading}
                    />

                  </div>

                  <p className="mnt-info">
                    After saving, the cost will be
                    marked as <strong>Pending</strong>
                    for Owner approval.
                  </p>

                </div>

                <div className="mnt-modal-footer">

                  <button
                    type="button"
                    className="mnt-btn secondary"
                    onClick={closeModals}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="mnt-btn primary"
                    disabled={
                      actionLoading ||
                      actualCost === ""
                    }
                  >
                    {actionLoading
                      ? "Saving..."
                      : "Save Cost"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {showViewModal &&
        selectedRequest && (

          <div className="mnt-overlay">

            <div className="mnt-modal">

              <div className="mnt-modal-header">

                <div>
                  <h2>
                    Maintenance Request Details
                  </h2>

                  <p>
                    Request #
                    {
                      selectedRequest.MaintenanceRequestID
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="mnt-close"
                  onClick={closeModals}
                >
                  <X size={20} />
                </button>

              </div>

              <div className="mnt-modal-body">

                <div className="mnt-summary">

                  <div>
                    <strong>
                      Property
                    </strong>

                    <span>
                      {
                        selectedRequest.PropertyName ||
                        "—"
                      }
                    </span>
                  </div>

                  <div>
                    <strong>
                      Category
                    </strong>

                    <span>
                      {
                        selectedRequest.Category ||
                        "—"
                      }
                    </span>
                  </div>

                  <div>
                    <strong>
                      Reported By
                    </strong>

                    <span>
                      {
                        selectedRequest.ReportedByName ||
                        "—"
                      }
                    </span>
                  </div>

                  <div>
                    <strong>
                      Assigned Staff
                    </strong>

                    <span>
                      {
                        selectedRequest.AssignedStaffName ||
                        "Not assigned"
                      }
                    </span>
                  </div>

                  <div>
                    <strong>
                      Priority
                    </strong>

                    <span>
                      {
                        selectedRequest.Priority ||
                        "—"
                      }
                    </span>
                  </div>

                  <div>
                    <strong>
                      Status
                    </strong>

                    <span>
                      {
                        selectedRequest.Status ||
                        "—"
                      }
                    </span>
                  </div>

                  <div>
                    <strong>
                      Estimated Cost
                    </strong>

                    <span>
                      ETB{" "}
                      {formatCurrency(
                        selectedRequest.EstimatedCost
                      )}
                    </span>
                  </div>

                  <div>
                    <strong>
                      Actual Cost
                    </strong>

                    <span>
                      ETB{" "}
                      {formatCurrency(
                        selectedRequest.ActualCost
                      )}
                    </span>
                  </div>

                  <div>
                    <strong>
                      Cost Approval
                    </strong>

                    <span>
                      {
                        selectedRequest.CostApprovalStatus ||
                        "Pending"
                      }
                    </span>
                  </div>

                  <div>
                    <strong>
                      Request Date
                    </strong>

                    <span>
                      {formatDate(
                        selectedRequest.RequestDate
                      )}
                    </span>
                  </div>

                  <div>
                    <strong>
                      Completion Date
                    </strong>

                    <span>
                      {formatDate(
                        selectedRequest.CompletionDate
                      )}
                    </span>
                  </div>

                </div>

                {selectedRequest.Description && (

                  <div className="mnt-field">

                    <label>
                      Description
                    </label>

                    <p>
                      {selectedRequest.Description}
                    </p>

                  </div>

                )}

                {selectedRequest.MaintenanceNotes && (

                  <div className="mnt-field">

                    <label>
                      Maintenance Notes
                    </label>

                    <p>
                      {
                        selectedRequest.MaintenanceNotes
                      }
                    </p>

                  </div>

                )}

                {selectedRequest.CompletionDetails && (

                  <div className="mnt-field">

                    <label>
                      Completion Details
                    </label>

                    <p>
                      {
                        selectedRequest.CompletionDetails
                      }
                    </p>

                  </div>

                )}

              </div>

              <div className="mnt-modal-footer">

                <button
                  type="button"
                  className="mnt-btn secondary"
                  onClick={closeModals}
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

      {/* =====================================================
          HISTORY MODAL
      ===================================================== */}

      {showHistoryModal && (

        <div className="mnt-overlay">

          <div className="mnt-modal large">

            <div className="mnt-modal-header">

              <div>
                <h2>
                  Maintenance History
                </h2>

                <p>
                  Completed and closed requests
                </p>
              </div>

              <button
                type="button"
                className="mnt-close"
                onClick={closeModals}
              >
                <X size={20} />
              </button>

            </div>

            <div className="mnt-modal-body">

              {historyLoading ? (

                <div className="mnt-loading">

                  <Loader2
                    size={28}
                    className="spin"
                  />

                  <p>
                    Loading history...
                  </p>

                </div>

              ) : history.length === 0 ? (

                <div className="mnt-empty">

                  <History size={36} />

                  <h3>
                    No maintenance history
                  </h3>

                </div>

              ) : (

                <div className="mnt-table-wrap">

                  <table className="mnt-table">

                    <thead>

                      <tr>
                        <th>ID</th>
                        <th>Property</th>
                        <th>Category</th>
                        <th>Staff</th>
                        <th>Status</th>
                        <th>Completed</th>
                      </tr>

                    </thead>

                    <tbody>

                      {history.map(
                        (item) => (

                          <tr
                            key={
                              item.MaintenanceRequestID
                            }
                          >

                            <td>
                              #
                              {
                                item.MaintenanceRequestID
                              }
                            </td>

                            <td>
                              {
                                item.PropertyName ||
                                "—"
                              }
                            </td>

                            <td>
                              {
                                item.Category ||
                                "—"
                              }
                            </td>

                            <td>
                              {
                                item.AssignedStaffName ||
                                "—"
                              }
                            </td>

                            <td>

                              <span
                                className={`badge ${getStatusClass(
                                  item.Status
                                )}`}
                              >
                                {item.Status}
                              </span>

                            </td>

                            <td>
                              {formatDate(
                                item.CompletionDate
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

            <div className="mnt-modal-footer">

              <button
                type="button"
                className="mnt-btn secondary"
                onClick={closeModals}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Maintenance;

