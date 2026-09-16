import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  ClipboardList,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Loader2,
  Search,
  Bell,
  FileText,
  X,
  RefreshCw,
  MessageSquare,
  UserCircle,
  Phone,
  Mail,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import "./MaintenanceStaffDashboard.css";

const API_URL = "http://localhost:5000/api/maintenance-requests";

function MaintenanceStaffDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("In Progress");
  const [notes, setNotes] = useState("");
  const [completionDetails, setCompletionDetails] = useState("");

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

  // ==============================
  // LOGOUT
  // ==============================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    navigate("/", { replace: true });
  };

  // ==============================
  // LOAD ASSIGNED REQUESTS
  // ==============================
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/my-assigned`,
        getConfig()
      );

      const data = response.data;

      if (data.success) {
        setRequests(data.maintenanceRequests || []);
      } else {
        setRequests([]);
        setError(
          data.message ||
            "Failed to load assigned maintenance requests."
        );
      }
    } catch (err) {
      console.error("Load assigned requests error:", err);

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        setError(
          err.response?.data?.message ||
            "You are not authorized to view these maintenance requests."
        );
      } else if (err.response?.status === 404) {
        setError(
          "The assigned maintenance requests API was not found. Please check the backend maintenance route."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load your assigned maintenance requests."
        );
      }

      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [getConfig]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // ==============================
  // HELPERS
  // ==============================
  const formatDate = (value) => {
    if (!value) return "—";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
      return value;
    }

    return d.toLocaleDateString();
  };

  const formatCurrency = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    const n = Number(value);

    if (Number.isNaN(n)) {
      return "—";
    }

    return n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getStatusClass = (status) => {
    if (status === "Pending") return "status-pending";
    if (status === "In Progress") return "status-progress";
    if (status === "Completed") return "status-completed";
    if (
      status === "Rejected" ||
      status === "Cancelled"
    ) {
      return "status-rejected";
    }

    return "";
  };

  const getPriorityClass = (priority) => {
    if (priority === "Critical") return "priority-critical";
    if (priority === "High") return "priority-high";
    if (priority === "Medium") return "priority-medium";
    if (priority === "Low") return "priority-low";

    return "";
  };

  // ==============================
  // FILTER
  // ==============================
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return requests.filter((r) => {
      const matchSearch =
        !q ||
        String(r.MaintenanceRequestID || "")
          .toLowerCase()
          .includes(q) ||
        String(r.PropertyName || "")
          .toLowerCase()
          .includes(q) ||
        String(r.Category || "")
          .toLowerCase()
          .includes(q);

      const matchStatus =
        statusFilter === "All" ||
        r.Status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  // ==============================
  // STATS
  // ==============================
  const stats = useMemo(() => {
    return {
      total: requests.length,

      pending: requests.filter(
        (r) => r.Status === "Pending"
      ).length,

      inProgress: requests.filter(
        (r) => r.Status === "In Progress"
      ).length,

      completed: requests.filter(
        (r) => r.Status === "Completed"
      ).length,

      highPriority: requests.filter(
        (r) =>
          r.Priority === "High" ||
          r.Priority === "Critical"
      ).length,
    };
  }, [requests]);

  // ==============================
  // UPDATE STATUS
  // ==============================
  const openStatus = (request) => {
    clearMessages();

    setSelectedRequest(request);
    setSelectedStatus(
      request.Status || "In Progress"
    );
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    if (!selectedRequest) return;

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
      console.error("Update status error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==============================
  // ADD NOTES
  // ==============================
  const openNotes = (request) => {
    clearMessages();

    setSelectedRequest(request);
    setNotes("");
    setShowNotesModal(true);
  };

  const handleAddNotes = async (e) => {
    e.preventDefault();

    if (!selectedRequest || !notes.trim()) {
      setError("Please enter notes.");
      return;
    }

    try {
      setActionLoading(true);
      clearMessages();

      await axios.put(
        `${API_URL}/${selectedRequest.MaintenanceRequestID}/notes`,
        {
          maintenanceNotes: notes.trim(),
        },
        getConfig()
      );

      setSuccess("Notes added successfully.");

      setShowNotesModal(false);
      setSelectedRequest(null);
      setNotes("");

      await loadRequests();
    } catch (err) {
      console.error("Add notes error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to add notes."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==============================
  // COMPLETE
  // ==============================
  const openComplete = (request) => {
    clearMessages();

    setSelectedRequest(request);
    setCompletionDetails("");
    setShowCompleteModal(true);
  };

  const handleComplete = async (e) => {
    e.preventDefault();

    if (!selectedRequest) return;

    if (!completionDetails.trim()) {
      setError("Please enter completion details.");
      return;
    }

    try {
      setActionLoading(true);
      clearMessages();

      await axios.put(
        `${API_URL}/${selectedRequest.MaintenanceRequestID}/completion`,
        {
          completionDetails:
            completionDetails.trim(),
        },
        getConfig()
      );

      setSuccess(
        "Request marked as completed."
      );

      setShowCompleteModal(false);
      setSelectedRequest(null);
      setCompletionDetails("");

      await loadRequests();
    } catch (err) {
      console.error(
        "Complete request error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to complete request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==============================
  // VIEW
  // ==============================
  const openView = (request) => {
    clearMessages();

    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const closeModals = () => {
    if (actionLoading) return;

    setShowStatusModal(false);
    setShowNotesModal(false);
    setShowCompleteModal(false);
    setShowViewModal(false);

    setSelectedRequest(null);
    setNotes("");
    setCompletionDetails("");
  };

  // ==============================
  // LOADING
  // ==============================
  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="msd-main">
          <div className="msd-loading">
            <Loader2
              size={32}
              className="spin"
            />
            <p>
              Loading your assigned requests...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ==============================
  // MAIN
  // ==============================
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="msd-main">
        <header className="msd-header">
          <div>
            <h1>
              Maintenance Staff Dashboard
            </h1>

            <p>
              Manage your assigned maintenance
              requests
            </p>
          </div>

          <div className="msd-header-right">
            <button
              type="button"
              className="msd-icon-btn"
              onClick={loadRequests}
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            <button
              type="button"
              className="msd-icon-btn"
              title="Notifications"
            >
              <Bell size={18} />
            </button>
          </div>
        </header>
       
{/* STAFF PROFILE */}
<div className="msd-profile-card">

  <div className="msd-profile-avatar">
    <UserCircle size={42} />
  </div>

  <div className="msd-profile-info">

    <div className="msd-profile-main">

      <h2>
        {user.FullName ||
          user.fullName ||
          user.Name ||
          "Maintenance Staff"}
      </h2>

      <span className="msd-profile-role">
        Maintenance Staff
      </span>

    </div>

    <div className="msd-profile-details">

      <div className="msd-profile-detail">
        <Mail size={16} />

        <span>
          {user.Email ||
            user.email ||
            "Email not available"}
        </span>
      </div>

      <div className="msd-profile-detail">
        <Phone size={16} />

        <span>
          {user.PhoneNumber ||
            user.phoneNumber ||
            user.Phone ||
            "Phone not available"}
        </span>
      </div>

    </div>

  </div>

</div>

        <div className="msd-content">
          {error && (
            <div className="msd-alert error">
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
            <div className="msd-alert success">
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

          {/* STATS */}
          <div className="msd-stats">
            <div className="msd-stat">
              <div className="icon blue">
                <ClipboardList size={20} />
              </div>

              <div>
                <span>Assigned</span>
                <strong>{stats.total}</strong>
              </div>
            </div>

            <div className="msd-stat">
              <div className="icon yellow">
                <Clock3 size={20} />
              </div>

              <div>
                <span>Pending</span>
                <strong>{stats.pending}</strong>
              </div>
            </div>

            <div className="msd-stat">
              <div className="icon purple">
                <Loader2 size={20} />
              </div>

              <div>
                <span>In Progress</span>
                <strong>
                  {stats.inProgress}
                </strong>
              </div>
            </div>

            <div className="msd-stat">
              <div className="icon green">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <span>Completed</span>
                <strong>
                  {stats.completed}
                </strong>
              </div>
            </div>

            <div className="msd-stat">
              <div className="icon red">
                <AlertCircle size={20} />
              </div>

              <div>
                <span>High Priority</span>
                <strong>
                  {stats.highPriority}
                </strong>
              </div>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="msd-toolbar">
            <div className="msd-search">
              <Search size={17} />

              <input
                placeholder="Search by ID, property, category..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="All">
                All Statuses
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="In Progress">
                In Progress
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Rejected">
                Rejected
              </option>
            </select>
          </div>

          {/* TABLE */}
          <div className="msd-card">
            <div className="msd-card-header">
              <h2>My Assigned Requests</h2>

              <span>
                {filtered.length} request
                {filtered.length !== 1
                  ? "s"
                  : ""}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="msd-empty">
                <Wrench size={40} />

                <h3>
                  No assigned requests
                </h3>

                <p>
                  Requests assigned to you will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="msd-table-wrap">
                <table className="msd-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Property</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Est. Cost</th>
                      <th>Request Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((r) => (
                      <tr
                        key={
                          r.MaintenanceRequestID
                        }
                      >
                        <td>
                          <strong>
                            #
                            {
                              r.MaintenanceRequestID
                            }
                          </strong>
                        </td>

                        <td>
                          <div className="prop-cell">
                            <strong>
                              {r.PropertyName ||
                                "N/A"}
                            </strong>

                            <span>
                              {r.Address ||
                                r.PropertyLocation ||
                                ""}
                            </span>
                          </div>
                        </td>

                        <td>
                          {r.Category || "—"}
                        </td>

                        <td>
                          <span
                            className={`badge ${getPriorityClass(
                              r.Priority
                            )}`}
                          >
                            {r.Priority || "—"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`badge ${getStatusClass(
                              r.Status
                            )}`}
                          >
                            {r.Status || "—"}
                          </span>
                        </td>

                        <td>
                          {formatCurrency(
                            r.EstimatedCost
                          )}
                        </td>

                        <td>
                          {formatDate(
                            r.RequestDate
                          )}
                        </td>

                        <td>
                          <div className="actions">
                            <button
                              type="button"
                              className="act view"
                              title="View"
                              onClick={() =>
                                openView(r)
                              }
                            >
                              <FileText
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              className="act status"
                              title="Update Status"
                              onClick={() =>
                                openStatus(r)
                              }
                            >
                              <Clock3
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              className="act notes"
                              title="Add Notes"
                              onClick={() =>
                                openNotes(r)
                              }
                            >
                              <MessageSquare
                                size={15}
                              />
                            </button>

                            {r.Status !==
                              "Completed" && (
                              <button
                                type="button"
                                className="act complete"
                                title="Mark Complete"
                                onClick={() =>
                                  openComplete(r)
                                }
                              >
                                <CheckCircle2
                                  size={15}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* STATUS MODAL */}
      {showStatusModal &&
        selectedRequest && (
          <div className="msd-overlay">
            <div className="msd-modal">
              <div className="msd-modal-header">
                <div>
                  <h2>Update Status</h2>
                  <p>
                    Request #
                    {
                      selectedRequest.MaintenanceRequestID
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModals}
                  disabled={actionLoading}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleUpdateStatus}
              >
                <div className="msd-modal-body">
                  <p className="msd-meta">
                    <strong>
                      {
                        selectedRequest.PropertyName
                      }
                    </strong>{" "}
                    ·{" "}
                    {selectedRequest.Category}
                  </p>

                  <div className="msd-field">
                    <label>Status</label>

                    <select
                      value={selectedStatus}
                      onChange={(e) =>
                        setSelectedStatus(
                          e.target.value
                        )
                      }
                      disabled={actionLoading}
                    >
                      <option value="Pending">
                        Pending
                      </option>

                      <option value="In Progress">
                        In Progress
                      </option>

                      <option value="Completed">
                        Completed
                      </option>

                      <option value="Rejected">
                        Rejected
                      </option>
                    </select>
                  </div>
                </div>

                <div className="msd-modal-footer">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={closeModals}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn primary"
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

      {/* NOTES MODAL */}
      {showNotesModal &&
        selectedRequest && (
          <div className="msd-overlay">
            <div className="msd-modal">
              <div className="msd-modal-header">
                <div>
                  <h2>Add Progress Notes</h2>

                  <p>
                    Request #
                    {
                      selectedRequest.MaintenanceRequestID
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModals}
                  disabled={actionLoading}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleAddNotes}
              >
                <div className="msd-modal-body">
                  <div className="msd-field">
                    <label>Notes</label>

                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(e) =>
                        setNotes(e.target.value)
                      }
                      placeholder="Describe work done, parts needed, delays..."
                      disabled={actionLoading}
                    />
                  </div>
                </div>

                <div className="msd-modal-footer">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={closeModals}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn primary"
                    disabled={
                      actionLoading ||
                      !notes.trim()
                    }
                  >
                    {actionLoading
                      ? "Saving..."
                      : "Add Notes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* COMPLETE MODAL */}
      {showCompleteModal &&
        selectedRequest && (
          <div className="msd-overlay">
            <div className="msd-modal">
              <div className="msd-modal-header">
                <div>
                  <h2>Mark as Completed</h2>

                  <p>
                    Request #
                    {
                      selectedRequest.MaintenanceRequestID
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModals}
                  disabled={actionLoading}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleComplete}
              >
                <div className="msd-modal-body">
                  <p className="msd-meta">
                    <strong>
                      {
                        selectedRequest.PropertyName
                      }
                    </strong>{" "}
                    ·{" "}
                    {selectedRequest.Category}
                  </p>

                  <div className="msd-field">
                    <label>
                      Completion Details
                    </label>

                    <textarea
                      rows={4}
                      value={completionDetails}
                      onChange={(e) =>
                        setCompletionDetails(
                          e.target.value
                        )
                      }
                      placeholder="What was fixed? Parts used? Any follow-up needed?"
                      disabled={actionLoading}
                    />
                  </div>
                </div>

                <div className="msd-modal-footer">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={closeModals}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn primary"
                    disabled={
                      actionLoading ||
                      !completionDetails.trim()
                    }
                  >
                    {actionLoading
                      ? "Saving..."
                      : "Complete Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* VIEW MODAL */}
      {showViewModal &&
        selectedRequest && (
          <div className="msd-overlay">
            <div className="msd-modal">
              <div className="msd-modal-header">
                <div>
                  <h2>Request Details</h2>

                  <p>
                    #
                    {
                      selectedRequest.MaintenanceRequestID
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModals}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="msd-modal-body">
                <div className="msd-detail-grid">
                  <div>
                    <strong>Property</strong>
                    <span>
                      {
                        selectedRequest.PropertyName
                      }
                    </span>
                  </div>

                  <div>
                    <strong>Category</strong>
                    <span>
                      {
                        selectedRequest.Category
                      }
                    </span>
                  </div>

                  <div>
                    <strong>Priority</strong>

                    <span
                      className={`badge ${getPriorityClass(
                        selectedRequest.Priority
                      )}`}
                    >
                      {
                        selectedRequest.Priority
                      }
                    </span>
                  </div>

                  <div>
                    <strong>Status</strong>

                    <span
                      className={`badge ${getStatusClass(
                        selectedRequest.Status
                      )}`}
                    >
                      {selectedRequest.Status}
                    </span>
                  </div>

                  <div>
                    <strong>Reported By</strong>

                    <span>
                      {
                        selectedRequest.ReportedByName
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
                      Estimated Cost
                    </strong>

                    <span>
                      {formatCurrency(
                        selectedRequest.EstimatedCost
                      )}
                    </span>
                  </div>
                </div>

                {selectedRequest.Description && (
                  <div
                    className="msd-field"
                    style={{ marginTop: 16 }}
                  >
                    <label>
                      Description
                    </label>

                    <p>
                      {
                        selectedRequest.Description
                      }
                    </p>
                  </div>
                )}

                {selectedRequest.MaintenanceNotes && (
                  <div
                    className="msd-field"
                    style={{ marginTop: 16 }}
                  >
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
                  <div
                    className="msd-field"
                    style={{ marginTop: 16 }}
                  >
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

              <div className="msd-modal-footer">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={closeModals}
                >
                  Close
                </button>

                {selectedRequest.Status !==
                  "Completed" && (
                  <>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => {
                        closeModals();
                        openNotes(
                          selectedRequest
                        );
                      }}
                    >
                      Add Notes
                    </button>

                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => {
                        closeModals();
                        openComplete(
                          selectedRequest
                        );
                      }}
                    >
                      Mark Complete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default MaintenanceStaffDashboard;