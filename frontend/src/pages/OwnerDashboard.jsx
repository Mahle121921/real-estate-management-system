import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";

import {
    Home,
    Building2,
    Wrench,
    FileText,
    Search,
    Mail,
    Bell,
    Eye,
    ArrowRight,
} from "lucide-react";

import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";

import "./OwnerDashboard.css";


function OwnerDashboard() {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

 const [owner, setOwner] = useState(null);
const [properties, setProperties] = useState([]);

const [maintenanceRequests, setMaintenanceRequests] = useState([]);
const [appointments, setAppointments] = useState([]);

const [revenueData, setRevenueData] = useState({
  revenue: 0,
  expenses: 0,
  profit: 0
});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRequest, setSelectedRequest] = useState({
  id: "REQ-003",
  property: "Grand Villa",
  area: "5 Bedrooms",
  issue: "HVAC",
  priority: "High",
  assignedTo: "Technician C",
  status: "Pending",
  requestedOn: "02/07/2021 10:30 AM",
});

const userName =
  user.FullName ||
  user.fullName ||
  user.name ||
  "Owner User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/";
};

const revenueSparkline = [
    { v: 180 }, { v: 210 }, { v: 195 }, { v: 240 }, { v: 220 }, { v: 260 }, { v: 245 },
  ];
  const expenseSparkline = [
    { v: 60 }, { v: 75 }, { v: 68 }, { v: 82 }, { v: 70 }, { v: 78 }, { v: 72 },
  ];
  
useEffect(() => {
    const loadOwnerDashboard = async () => {
        if (!token) {
            window.location.href = "/";
            return;
        }

        try {
            setLoading(true);
            setError("");

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            // 1. Get logged-in owner
            const ownerResponse = await axios.get(
                "http://localhost:5000/api/owners/me",
                config
            );

            const ownerData = ownerResponse.data.owner;

            setOwner(ownerData);

            // 2. Get owner's properties
            const propertiesResponse = await axios.get(
                `http://localhost:5000/api/owners/${ownerData.OwnerID}/properties`,
                config
            );

            const ownerProperties =
                propertiesResponse.data.properties || [];

            setProperties(ownerProperties);

            // 3. Get owner's financial summary
            const financialResponse = await axios.get(
                `http://localhost:5000/api/owners/${ownerData.OwnerID}/financial-summary`,
                config
            );

            const financial =
                financialResponse.data.financialSummary;

            setRevenueData({
                revenue: Number(financial.totalRevenue || 0),
                expenses: Number(financial.totalExpenses || 0),
                profit: Number(financial.netIncome || 0)
            });
           // 4. Get owner's maintenance requests
const maintenanceResponse = await axios.get(
    `http://localhost:5000/api/owners/${ownerData.OwnerID}/maintenance-requests`,
    config
);

const ownerMaintenanceRequests =
    maintenanceResponse.data.requests || [];

setMaintenanceRequests(ownerMaintenanceRequests);

if (ownerMaintenanceRequests.length > 0) {
    const firstRequest = ownerMaintenanceRequests[0];

    setSelectedRequest({
        id: firstRequest.MaintenanceRequestID,
        property: firstRequest.PropertyName || "—",
        area: "—",
        issue: firstRequest.Category || "—",
        priority: firstRequest.Priority || "Low",
        assignedTo: firstRequest.AssignedStaffName || "Not Assigned",
        status: firstRequest.Status || "Pending",
        requestedOn: firstRequest.RequestDate || "—"
    });
}
// 5. Get owner's appointments
const appointmentsResponse = await axios.get(
    `http://localhost:5000/api/owners/${ownerData.OwnerID}/appointments`,
    config
);

setAppointments(
    appointmentsResponse.data.appointments || []
);
        } catch (error) {
            console.error("Owner dashboard error:", error);

            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/";
                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to load owner dashboard"
            );
        } finally {
            setLoading(false);
        }
    };

    loadOwnerDashboard();
}, [token]);
const propertyOverview = {
    total: properties.length,

    available: properties.filter(
        (property) => property.Status === "Available"
    ).length,

    reserved: properties.filter(
        (property) => property.Status === "Reserved"
    ).length,

    rented: properties.filter(
        (property) => property.Status === "Rented"
    ).length,

    sold: properties.filter(
        (property) => property.Status === "Sold"
    ).length
};


  const statusChartData = [
    { name: "Available", value: 8, fill: "#22c55e" },
    { name: "Rented", value: 5, fill: "#ef4444" },
    { name: "Under Maintenance", value: 4, fill: "#f59e0b" },
  ];

  const getPriorityClass = (p) => {
    if (p === "High") return "priority-high";
    if (p === "Medium") return "priority-medium";
    return "priority-low";
  };

 const getStatusClass = (s) => {
    if (s === "Pending") return "status-pending";
    if (s === "Approved") return "status-confirmed";
    if (s === "Rejected") return "priority-high";
    if (s === "Completed") return "status-completed";

    return "";
};
return (
    <div className="app-layout">
        <Sidebar />

        <main className="app-content">
            <div className="od-container">

                {loading && (
                    <div className="dashboard-message">
                        Loading your dashboard...
                    </div>
                )}

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}

                {/* Header */}
                <header className="od-header">
                    <div className="od-welcome">
                        <span className="welcome">Welcome Back!</span>
                        <span className="system">
                            Real Estate Management System
                        </span>
                    </div>

                    <div className="od-header-right">
                        <div className="od-search">
                            <Search size={16} />
                            <input
                                placeholder="Search properties, tenants, requests..."
                            />
                        </div>

                        <button
                            type="button"
                            className="od-icon-btn"
                        >
                            <Mail size={18} />
                        </button>

                        <button
                            type="button"
                            className="od-icon-btn notification"
                        >
                            <Bell size={18} />
                            <span className="badge">3</span>
                        </button>

                        <div className="od-user-chip">
                            <div className="od-avatar">
                                {(
                                    owner?.FullName ||
                                    userName ||
                                    "O"
                                ).charAt(0).toUpperCase()}
                            </div>

                            <div>
                                <div className="name">
                                    {owner?.FullName || userName}
                                </div>

                                <div className="role">
                                    Property Owner
                                </div>
                            </div>

                            <strong>
                                {propertyOverview.total}
                            </strong>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="od-content">

                    <h1 className="page-title">
                        Owner Dashboard
                    </h1>

                    {/* =====================================================
                        KEEP YOUR EXISTING TOP-CARDS SECTION HERE
                    ====================================================== */}

                    {/* ===== TOP CARDS ===== */}
                    <div className="top-cards">

                        {/* My Properties Overview */}
                        <div className="card properties-card">
                            <div className="card-header">
                                <h3>My Properties Overview</h3>
                                <span className="reserved-badge">
                                    **Reserved
                                </span>
                            </div>

                            <div className="prop-overview">
                                <div className="prop-stats">

                                    <div className="prop-stat">
                                        <Home
                                            size={16}
                                            className="icon"
                                        />
                                        <span>
                                            Total Properties
                                        </span>
                                        <strong>
                                            {propertyOverview.total}
                                        </strong>
                                    </div>

                                    <div className="prop-stat">
                                        <span className="dot green"></span>
                                        <span>Available</span>
                                        <strong>
                                            {propertyOverview.available}
                                        </strong>
                                    </div>

                                    <div className="prop-stat">
                                        <span className="dot orange"></span>
                                        <span>Reserved</span>
                                        <strong>
                                            {propertyOverview.reserved}
                                        </strong>
                                    </div>

                                    <div className="prop-stat">
                                        <span className="dot blue"></span>
                                        <span>Rented</span>
                                        <strong>
                                            {propertyOverview.rented}
                                        </strong>
                                    </div>

                                    <div className="prop-stat">
                                        <span className="dot red"></span>
                                        <span>Sold</span>
                                        <strong>
                                            {propertyOverview.sold}
                                        </strong>
                                    </div>

                                </div>

                                <div className="prop-image">
                                    <img
                                        src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=80"
                                        alt="Property"
                                    />
                                </div>
                            </div>

                            <Link
                                to="/owner/properties"
                                className="view-link"
                            >
                                View All Properties
                                <ArrowRight size={14} />
                            </Link>
                        </div>

                        {/* Revenue & Expenses */}
                        <div className="card revenue-card">
                            <h3>Revenue & Expenses</h3>

                            <div className="rev-item">
                                <div>
                                    <div className="rev-label">
                                        Total Revenue (ETB)
                                    </div>

                                    <div className="rev-value green">
                                        {revenueData.revenue.toLocaleString()}
                                    </div>
                                </div>

                                <div className="sparkline">
                                    <ResponsiveContainer
                                        width={80}
                                        height={36}
                                    >
                                        <LineChart
                                            data={revenueSparkline}
                                        >
                                            <Line
                                                type="monotone"
                                                dataKey="v"
                                                stroke="#22c55e"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="rev-item">
                                <div>
                                    <div className="rev-label">
                                        Total Expenses (ETB)
                                    </div>

                                    <div className="rev-value orange">
                                        {revenueData.expenses.toLocaleString()}
                                    </div>
                                </div>

                                <div className="sparkline">
                                    <ResponsiveContainer
                                        width={80}
                                        height={36}
                                    >
                                        <LineChart
                                            data={expenseSparkline}
                                        >
                                            <Line
                                                type="monotone"
                                                dataKey="v"
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="net-profit">
                                <span>Net Profit (ETB)</span>
                                <strong>
                                    {revenueData.profit.toLocaleString()}
                                </strong>
                            </div>
                        </div>

                        {/* Property Status Chart */}
                        <div className="card chart-card">
                            <h3>Property Status Chart</h3>

                            <ResponsiveContainer
                                width="100%"
                                height={160}
                            >
                                <BarChart
                                    data={statusChartData}
                                    barSize={36}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#f1f5f9"
                                    />

                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11 }}
                                    />

                                    <YAxis
                                        tick={{ fontSize: 11 }}
                                    />

                                    <Tooltip />

                                    <Bar
                                        dataKey="value"
                                        radius={[6, 6, 0, 0]}
                                    >
                                        {statusChartData.map(
                                            (entry, index) => (
                                                <Cell
    key={index}
    fill={entry.fill}
/>
                                            )
                                        )}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>

                            <div className="chart-legend">
                                <span>
                                    <i className="dot green"></i>
                                    Available
                                </span>

                                <span>
                                    <i className="dot red"></i>
                                    Rented
                                </span>

                                <span>
                                    <i className="dot orange"></i>
                                    Under Maintenance
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* =====================================================
                        KEEP YOUR EXISTING MIDDLE SECTION HERE
                    ====================================================== */}

                    <div className="middle-section">

                        {/* Recent Maintenance Requests */}
                        <div className="card table-card">

                            <div className="card-header">
                                <h3>
                                    Recent Maintenance Requests (Active)
                                </h3>
                            </div>

                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Request ID</th>
                                            <th>Property</th>
                                            <th>Area / Room</th>
                                            <th>Priority</th>
                                            <th>Status</th>
                                            <th>Assigned To</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {maintenanceRequests.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="7"
                                                    style={{
                                                        textAlign: "center",
                                                        padding: "20px"
                                                    }}
                                                >
                                                    No maintenance requests
                                                </td>
                                            </tr>
                                        ) : (
                                            maintenanceRequests.map((req) => (
                                                <tr
                                                    key={
                                                        req.MaintenanceRequestID
                                                    }
                                                    className={
                                                        selectedRequest.id ===
                                                        req.MaintenanceRequestID
                                                            ? "selected"
                                                            : ""
                                                    }
                                                    onClick={() =>
                                                        setSelectedRequest({
                                                            id: req.MaintenanceRequestID,
                                                            property:
                                                                req.PropertyName ||
                                                                "—",
                                                            area: "—",
                                                            issue:
                                                                req.Category ||
                                                                "—",
                                                            priority:
                                                                req.Priority ||
                                                                "Low",
                                                            assignedTo:
                                                                req.AssignedStaffName ||
                                                                "Not Assigned",
                                                            status:
                                                                req.Status ||
                                                                "Pending",
                                                            requestedOn:
                                                                req.RequestDate ||
                                                                "—"
                                                        })
                                                    }
                                                >
                                                    <td>
                                                        {req.RequestDate
                                                            ? new Date(
                                                                  req.RequestDate
                                                              ).toLocaleDateString()
                                                            : "—"}
                                                    </td>

                                                    <td>
                                                        {
                                                            req.MaintenanceRequestID
                                                        }
                                                    </td>

                                                    <td>
                                                        {req.PropertyName ||
                                                            "—"}
                                                    </td>

                                                    <td>
                                                        {req.Category || "—"}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`priority-badge ${getPriorityClass(
                                                                req.Priority
                                                            )}`}
                                                        >
                                                            {req.Priority ||
                                                                "Low"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`status-badge ${getStatusClass(
                                                                req.Status
                                                            )}`}
                                                        >
                                                            {req.Status ||
                                                                "Pending"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {req.AssignedStaffName ||
                                                            "Not Assigned"}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <Link
                                to="/owner/maintenance"
                                className="view-link"
                            >
                                View All Requests
                                <ArrowRight size={14} />
                            </Link>
                        </div>

                        {/* Selected Request Details */}
                        <div className="card details-card">
                            <h3>
                                Selected Request Details (
                                {selectedRequest.id}
                                )
                            </h3>

                            <div className="detail-list">

                                <div className="detail-row">
                                    <span>Property</span>
                                    <strong>
                                        {selectedRequest.property}
                                    </strong>
                                </div>

                                <div className="detail-row">
                                    <span>Area / Room</span>
                                    <strong>
                                        {selectedRequest.area}
                                    </strong>
                                </div>

                                <div className="detail-row">
                                    <span>Issue</span>
                                    <strong>
                                        {selectedRequest.issue}
                                    </strong>
                                </div>

                                <div className="detail-row">
                                    <span>Priority</span>
                                    <span
                                        className={`priority-badge ${getPriorityClass(
                                            selectedRequest.priority
                                        )}`}
                                    >
                                        {selectedRequest.priority}
                                    </span>
                                </div>

                                <div className="detail-row">
                                    <span>Assigned To</span>
                                    <strong>
                                        {selectedRequest.assignedTo}
                                    </strong>
                                </div>

                                <div className="detail-row">
                                    <span>Status</span>
                                    <span
                                        className={`status-badge ${getStatusClass(
                                            selectedRequest.status
                                        )}`}
                                    >
                                        {selectedRequest.status}
                                    </span>
                                </div>

                                <div className="detail-row">
                                    <span>Requested On</span>
                                    <strong>
                                        {selectedRequest.requestedOn}
                                    </strong>
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* =====================================================
                        BOTTOM SECTION
                    ====================================================== */}

                    <div className="bottom-section">

                        {/* Upcoming Appointments */}
                        <div className="card table-card">

                            <h3>Upcoming Appointments</h3>

                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Type</th>
                                            <th>Customer / Tenant</th>
                                            <th>Property</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {appointments.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="6"
                                                    style={{
                                                        textAlign: "center",
                                                        padding: "20px"
                                                    }}
                                                >
                                                    No upcoming appointments
                                                </td>
                                            </tr>
                                        ) : (
                                            appointments.map((apt) => (
                                                <tr
                                                    key={apt.AppointmentID}
                                                >
                                                    <td>
                                                        {apt.AppointmentDate
                                                            ? new Date(
                                                                  apt.AppointmentDate
                                                              ).toLocaleDateString()
                                                            : "-"}
                                                    </td>

                                                    <td>
                                                        {apt.AppointmentTime
                                                            ? String(
                                                                  apt.AppointmentTime
                                                              ).substring(0, 5)
                                                            : "-"}
                                                    </td>

                                                    <td>
                                                        Appointment
                                                    </td>

                                                    <td>
                                                        {apt.CustomerName ||
                                                            "-"}
                                                    </td>

                                                    <td>
                                                        {apt.PropertyName ||
                                                            "-"}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`status-badge ${getStatusClass(
                                                                apt.Status
                                                            )}`}
                                                        >
                                                            {apt.Status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <Link
                                to="/owner/appointments"
                                className="view-link"
                            >
                                View All Appointments
                                <ArrowRight size={14} />
                            </Link>

                        </div>

                        {/* Quick Actions */}
                        <div className="card actions-card">

                            <h3>Quick Actions</h3>

                            <div className="quick-actions">

                                <Link
                                    to="/owner/revenue"
                                    className="qa-item green"
                                >
                                    <Eye size={18} />

                                    <div>
                                        <strong>
                                            View Revenue Report
                                        </strong>

                                        <span>
                                            See income & expense details
                                        </span>
                                    </div>
                                </Link>

                                <Link
                                    to="/owner/properties"
                                    className="qa-item blue"
                                >
                                    <Building2 size={18} />

                                    <div>
                                        <strong>
                                            Manage My Properties
                                        </strong>

                                        <span>
                                            View and update properties
                                        </span>
                                    </div>
                                </Link>

                                <Link
                                    to="/owner/rental-agreements"
                                    className="qa-item purple"
                                >
                                    <FileText size={18} />

                                    <div>
                                        <strong>
                                            View Rental Agreements
                                        </strong>

                                        <span>
                                            View active rental agreements
                                        </span>
                                    </div>
                                </Link>

                                <Link
                                    to="/owner/maintenance"
                                    className="qa-item orange"
                                >
                                    <Wrench size={18} />

                                    <div>
                                        <strong>
                                            Request Maintenance
                                        </strong>

                                        <span>
                                            Submit a new maintenance request
                                        </span>
                                    </div>
                                </Link>

                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </main>
    </div>
);
}
export default OwnerDashboard;