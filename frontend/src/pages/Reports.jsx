import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
BarChart3,
CalendarCheck,
ChevronDown,
DollarSign,
Download,
FileText,
Home,
Loader2,
RefreshCw,
Search,
TrendingUp,
UserRound,
Users,
Wrench,
X
} from "lucide-react";

import "./Reports.css";

const API_URL = "http://localhost:5000/api/reports";

const reportOptions = [
{
key: "properties",
label: "Property Report",
icon: Home,
description: "View all properties and their current status."
},
{
key: "sales",
label: "Sales Report",
icon: DollarSign,
description: "View property sales, customers and sale amounts."
},
{
key: "rentals",
label: "Rental Report",
icon: FileText,
description: "View rental agreements and rental amounts."
},
{
key: "customers",
label: "Customer Report",
icon: Users,
description: "View registered customers."
},
{
key: "owners",
label: "Owner Report",
icon: UserRound,
description: "View property owners and their property counts."
},
{
key: "revenue",
label: "Revenue Report",
icon: TrendingUp,
description: "View recorded revenue and total revenue."
},
{
key: "expenses",
label: "Expense Report",
icon: DollarSign,
description: "View recorded expenses and total expenses."
},
{
key: "profit",
label: "Profit Report",
icon: BarChart3,
description: "Compare total revenue and expenses."
},
{
key: "maintenance",
label: "Maintenance Report",
icon: Wrench,
description: "View maintenance requests, status and costs."
},
{
key: "appointments",
label: "Appointment Report",
icon: CalendarCheck,
description: "View appointment activity and statuses."
}
];

function Reports() {
const [selectedReport, setSelectedReport] = useState("properties");
const [reportData, setReportData] = useState([]);
const [summary, setSummary] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [search, setSearch] = useState("");


const token = localStorage.getItem("token");

const selectedOption = reportOptions.find(
    (report) => report.key === selectedReport
);

const generateReport = async () => {
    try {
        setLoading(true);
        setError("");
        setReportData([]);
        setSummary(null);

        const response = await axios.get(
            `${API_URL}/${selectedReport}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.data.success) {
            setReportData(
                Array.isArray(response.data.report)
                    ? response.data.report
                    : []
            );

            setSummary(
                response.data.summary || response.data.report
            );
        } else {
            setError(
                response.data.message ||
                "Unable to generate report."
            );
        }
    } catch (err) {
        console.error("Report generation error:", err);

        setError(
            err.response?.data?.message ||
            "Failed to generate report. Check that the backend is running."
        );
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    generateReport();
}, [selectedReport]);

const filteredData = useMemo(() => {
    if (!search.trim()) {
        return reportData;
    }

    const keyword = search.toLowerCase();

    return reportData.filter((row) =>
        Object.values(row).some((value) =>
            String(value ?? "")
                .toLowerCase()
                .includes(keyword)
        )
    );
}, [reportData, search]);

const formatCurrency = (value) => {
    const number = Number(value || 0);

    return number.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString();
};

const formatTime = (value) => {
    if (!value) return "-";

    return String(value).substring(0, 5);
};

const downloadCSV = () => {
    if (!reportData.length) {
        return;
    }

    const headers = Object.keys(reportData[0]);

    const csvRows = [
        headers.join(","),
        ...filteredData.map((row) =>
            headers
                .map((header) => {
                    const value = row[header] ?? "";

                    return `"${String(value).replaceAll('"', '""')}"`;
                })
                .join(",")
        )
    ];

    const blob = new Blob(
        [csvRows.join("\n")],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedReport}-report.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
};

const renderSummary = () => {
    if (!summary) return null;

    if (selectedReport === "revenue") {
        return (
            <div className="report-summary-grid">
                <div className="report-summary-card">
                    <span>Total Revenue</span>
                    <strong>
                        {formatCurrency(summary.totalRevenue)}
                    </strong>
                </div>

                <div className="report-summary-card">
                    <span>Transactions</span>
                    <strong>
                        {summary.revenueCount || 0}
                    </strong>
                </div>
            </div>
        );
    }

    if (selectedReport === "expenses") {
        return (
            <div className="report-summary-grid">
                <div className="report-summary-card">
                    <span>Total Expenses</span>
                    <strong>
                        {formatCurrency(summary.totalExpenses)}
                    </strong>
                </div>

                <div className="report-summary-card">
                    <span>Transactions</span>
                    <strong>
                        {summary.expenseCount || 0}
                    </strong>
                </div>
            </div>
        );
    }

    if (selectedReport === "profit") {
        const profit = Number(summary.netProfit || 0);

        return (
            <div className="report-summary-grid">
                <div className="report-summary-card">
                    <span>Total Revenue</span>
                    <strong>
                        {formatCurrency(summary.totalRevenue)}
                    </strong>
                </div>

                <div className="report-summary-card">
                    <span>Total Expenses</span>
                    <strong>
                        {formatCurrency(summary.totalExpenses)}
                    </strong>
                </div>

                <div className="report-summary-card">
                    <span>Net Profit</span>
                    <strong className={profit < 0 ? "negative" : ""}>
                        {formatCurrency(summary.netProfit)}
                    </strong>
                </div>
            </div>
        );
    }

    if (selectedReport === "maintenance") {
        return (
            <div className="report-summary-grid">
                <div className="report-summary-card">
                    <span>Total Requests</span>
                    <strong>
                        {summary.totalRequests || 0}
                    </strong>
                </div>

                <div className="report-summary-card">
                    <span>Pending</span>
                    <strong>
                        {summary.pendingRequests || 0}
                    </strong>
                </div>

                <div className="report-summary-card">
                    <span>In Progress</span>
                    <strong>
                        {summary.inProgressRequests || 0}
                    </strong>
                </div>

                <div className="report-summary-card">
                    <span>Completed</span>
                    <strong>
                        {summary.completedRequests || 0}
                    </strong>
                </div>

                <div className="report-summary-card">
                    <span>Actual Cost</span>
                    <strong>
                        {formatCurrency(summary.totalActualCost)}
                    </strong>
                </div>
            </div>
        );
    }

    return null;
};

const renderTableHeaders = () => {
    switch (selectedReport) {
case "properties":
    return (
        <tr>
            <th>ID</th>
            <th>Property</th>
            <th>Type</th>
            <th>Address</th>
            <th>Status</th>
            <th>Sale Price</th>
            <th>Monthly Rent</th>
            <th>Owner</th>
        </tr>
    );

        case "sales":
            return (
                <tr>
                    <th>ID</th>
                    <th>Property</th>
                    <th>Customer</th>
                    <th>Handled By</th>
                    <th>Sale Price</th>
                    <th>Sale Date</th>
                </tr>
            );

case "rentals":
    return (
        <tr>
            <th>Rental ID</th>
            <th>Property</th>
            <th>Customer</th>
            <th>Handled By</th>
            <th>Monthly Rent</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Due Date</th>
            <th>Status</th>
        </tr>
    );

        case "customers":
            return (
                <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                </tr>
            );

        case "owners":
            return (
                <tr>
                    <th>ID</th>
                    <th>Owner</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Properties</th>
                </tr>
            );

        case "revenue":
            return (
                <tr>
                    <th>ID</th>
                    <th>Owner</th>
                    <th>Property</th>
                    <th>Source</th>
                    <th>Amount</th>
                    <th>Date</th>
                </tr>
            );

        case "expenses":
            return (
                <tr>
                    <th>ID</th>
                    <th>Owner</th>
                    <th>Property</th>
                    <th>Expense Type</th>
                    <th>Amount</th>
                    <th>Date</th>
                </tr>
            );

        case "maintenance":
            return (
                <tr>
                    <th>ID</th>
                    <th>Property</th>
                    <th>Assigned Staff</th>
                    <th>Description</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Estimated Cost</th>
                    <th>Actual Cost</th>
                    <th>Date</th>
                </tr>
            );

        case "appointments":
            return (
                <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Property</th>
                    <th>Handled By</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                </tr>
            );

        default:
            return null;
    }
};

const renderTableRow = (row) => {
    switch (selectedReport) {
        case "properties":
            return (
                <tr key={row.PropertyID}>
                    <td>{row.PropertyID}</td>
                    <td>{row.PropertyName}</td>
                    <td>{row.PropertyType}</td>
                    <td>{row.Address}</td>
                    <td>
                        <span className="report-status">
                            {row.Status}
                        </span>
                    </td>
                    <td>
                        {formatCurrency(row.SalePrice)}
                    </td>
                    <td>
    {formatCurrency(row.MonthlyRent)}
</td>
                    <td>{row.OwnerName || "-"}</td>
                </tr>
            );

        case "sales":
            return (
                <tr key={row.SaleID}>
                    <td>{row.SaleID}</td>
                    <td>{row.PropertyName || "-"}</td>
                    <td>{row.CustomerName || "-"}</td>
                    <td>{row.HandledByName || "-"}</td>
                    <td>{formatCurrency(row.SalePrice)}</td>
                    <td>{formatDate(row.SaleDate)}</td>
                </tr>
            );

       case "rentals":
    return (
        <tr key={row.RentalID}>
            <td>{row.RentalID}</td>
            <td>{row.PropertyName || "-"}</td>
            <td>{row.CustomerName || "-"}</td>
            <td>{row.HandledByName || "-"}</td>
            <td>{formatCurrency(row.MonthlyRent)}</td>
            <td>{formatDate(row.StartDate)}</td>
            <td>{formatDate(row.EndDate)}</td>
            <td>{row.DueDate || "-"}</td>
            <td>
                <span className="report-status">
                    {row.Status || "-"}
                </span>
            </td>
        </tr>
    );

        case "customers":
            return (
                <tr key={row.CustomerID}>
                    <td>{row.CustomerID}</td>
                    <td>{row.FullName}</td>
                    <td>{row.Email}</td>
                    <td>{row.Phone}</td>
                </tr>
            );

        case "owners":
            return (
                <tr key={row.OwnerID}>
                    <td>{row.OwnerID}</td>
                    <td>{row.OwnerName}</td>
                    <td>{row.Email}</td>
                    <td>{row.Status}</td>
                    <td>{row.PropertyCount}</td>
                </tr>
            );

        case "revenue":
            return (
                <tr key={row.RevenueID}>
                    <td>{row.RevenueID}</td>
                    <td>{row.OwnerName || "-"}</td>
                    <td>{row.PropertyName || "-"}</td>
                    <td>{row.Source}</td>
                    <td>{formatCurrency(row.Amount)}</td>
                    <td>{formatDate(row.DateRecorded)}</td>
                </tr>
            );

        case "expenses":
            return (
                <tr key={row.ExpenseID}>
                    <td>{row.ExpenseID}</td>
                    <td>{row.OwnerName || "-"}</td>
                    <td>{row.PropertyName || "-"}</td>
                    <td>{row.ExpenseType}</td>
                    <td>{formatCurrency(row.Amount)}</td>
                    <td>{formatDate(row.DateRecorded)}</td>
                </tr>
            );

        case "maintenance":
            return (
                <tr key={row.MaintenanceRequestID}>
                    <td>{row.MaintenanceRequestID}</td>
                    <td>{row.PropertyName || "-"}</td>
                    <td>{row.AssignedStaffName || "Unassigned"}</td>
                    <td>{row.Description}</td>
                    <td>{row.Priority}</td>
                    <td>{row.Status}</td>
                    <td>{formatCurrency(row.EstimatedCost)}</td>
                    <td>{formatCurrency(row.ActualCost)}</td>
                    <td>{formatDate(row.RequestDate)}</td>
                </tr>
            );

        case "appointments":
            return (
                <tr key={row.AppointmentID}>
                    <td>{row.AppointmentID}</td>
                    <td>{row.CustomerName || "-"}</td>
                    <td>{row.PropertyName || "-"}</td>
                    <td>{row.HandledByName || "-"}</td>
                    <td>{formatDate(row.AppointmentDate)}</td>
                    <td>{formatTime(row.AppointmentTime)}</td>
                    <td>{row.Status}</td>
                </tr>
            );

        default:
            return null;
    }
};

return (
    <div className="reports-page">

        <div className="reports-header">
            <div>
                <h1>Operational Reports</h1>
                <p>
                    Generate and review real-time operational reports
                    from the system database.
                </p>
            </div>

            <button
                className="generate-button"
                onClick={generateReport}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <Loader2 size={18} className="spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <RefreshCw size={18} />
                        Generate Report
                    </>
                )}
            </button>
        </div>

        <div className="report-selector">

            <div className="selector-label">
                <FileText size={18} />
                <span>Select Report</span>
            </div>

            <div className="select-wrapper">
                <select
                    value={selectedReport}
                    onChange={(e) => {
                        setSelectedReport(e.target.value);
                        setSearch("");
                    }}
                >
                    {reportOptions.map((report) => (
                        <option
                            key={report.key}
                            value={report.key}
                        >
                            {report.label}
                        </option>
                    ))}
                </select>

                <ChevronDown size={18} />
            </div>

            {selectedOption && (
                <p className="report-description">
                    {selectedOption.description}
                </p>
            )}
        </div>

        {error && (
            <div className="report-error">
                <div>
                    <strong>Report generation failed</strong>
                    <p>{error}</p>
                </div>

                <button
                    onClick={() => setError("")}
                    aria-label="Close error"
                >
                    <X size={18} />
                </button>
            </div>
        )}

        {renderSummary()}

        <div className="report-toolbar">

            <div className="report-result-count">
                <strong>{filteredData.length}</strong>
                <span>records</span>
            </div>

            <div className="report-actions">

                <div className="report-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search report..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />
                </div>

                <button
                    className="download-button"
                    onClick={downloadCSV}
                    disabled={!reportData.length}
                >
                    <Download size={17} />
                    Export CSV
                </button>

            </div>
        </div>

        <div className="report-card">

            <div className="report-card-header">
                <div>
                    <h2>
                        {selectedOption?.label}
                    </h2>

                    <span>
                        {selectedOption?.description}
                    </span>
                </div>

                <BarChart3 size={22} />
            </div>

            {loading ? (
                <div className="report-loading">
                    <Loader2 size={30} className="spin" />
                    <p>Generating report...</p>
                </div>
            ) : filteredData.length === 0 ? (
                <div className="report-empty">
                    <FileText size={42} />
                    <h3>No report data found</h3>
                    <p>
                        There are no records available for this report.
                    </p>
                </div>
            ) : (
                <div className="report-table-wrapper">
                    <table className="report-table">
                        <thead>
                            {renderTableHeaders()}
                        </thead>

                        <tbody>
                            {filteredData.map(renderTableRow)}
                        </tbody>
                    </table>
                </div>
            )}

        </div>

    </div>
);

}

export default Reports;
