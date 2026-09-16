import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import {
    Home,
    Building2,
    ShoppingCart,
    DollarSign,
    Wrench,
    Calendar,
    CalendarCheck,
    FileText,
    CreditCard,
    BarChart3,
    ClipboardList,
    Settings,
    LogOut,
    Search,
    Mail,
    Bell,
    ChevronDown,
    Printer,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Wallet,
    FileBarChart,
} from "lucide-react";

import "./OwnerReports.css";

function OwnerReports() {
    const location = useLocation();

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const token = localStorage.getItem("token");

    const [owner, setOwner] = useState(null);

    const [summary, setSummary] = useState({
        properties: {
            total: 0,
            available: 0,
            reserved: 0,
            rented: 0,
            sold: 0,
        },
        sales: {
            count: 0,
            amount: 0,
        },
        rentals: {
            count: 0,
            amount: 0,
        },
        revenue: {
            count: 0,
            amount: 0,
        },
        expenses: {
            count: 0,
            amount: 0,
        },
        netProfit: 0,
    });

const [reports, setReports] = useState({
    properties: [],
    sales: [],
    rentals: [],
    revenues: [],
    expenses: [],
    maintenance: [],
    appointments: [],
});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [activeReport, setActiveReport] = useState("overview");

    const userName =
        user?.FullName ||
        user?.fullName ||
        user?.name ||
        "Owner User";

    // ======================================================
    // LOGOUT
    // ======================================================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        window.location.href = "/";
    };

    // ======================================================
    // LOAD OWNER REPORT
    // ======================================================

    const loadOwnerReport = async () => {
        if (!token) {
            window.location.href = "/";
            return;
        }

        try {
            setLoading(true);
            setError("");

const response = await axios.get(
    "http://localhost:5000/api/owners/owner/reports",
    {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
);

console.log("=================================");
console.log("OWNER REPORT API RESPONSE:");
console.log(response.data);
console.log("=================================");

const data = response.data;

            setOwner(data.owner || null);

            setSummary(
                data.summary || {
                    properties: {
                        total: 0,
                        available: 0,
                        reserved: 0,
                        rented: 0,
                        sold: 0,
                    },
                    sales: {
                        count: 0,
                        amount: 0,
                    },
                    rentals: {
                        count: 0,
                        amount: 0,
                    },
                    revenue: {
                        count: 0,
                        amount: 0,
                    },
                    expenses: {
                        count: 0,
                        amount: 0,
                    },
                    netProfit: 0,
                }
            );

setReports(
    data.reports || {
        properties: [],
        sales: [],
        rentals: [],
        revenues: [],
        expenses: [],
        maintenance: [],
        appointments: [],
    }
);
        } catch (err) {
            console.error("Owner reports error:", err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");

                window.location.href = "/";
                return;
            }

            setError(
                err.response?.data?.message ||
                "Failed to load owner reports."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOwnerReport();
    }, []);

    // ======================================================
    // FORMATTERS
    // ======================================================

    const formatMoney = (amount) => {
        return Number(amount || 0).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );
    };

    const formatDate = (date) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "—";
        }

        return parsedDate.toLocaleDateString();
    };

    // ======================================================
    // SIDEBAR
    // ======================================================

    const menuItems = [
        {
            name: "Dashboard",
            path: "/owner-dashboard",
            icon: <Home size={18} />,
        },
        {
            name: "My Properties",
            path: "/owner/properties",
            icon: <Building2 size={18} />,
        },
        {
            name: "Sales",
            path: "/owner/sales",
            icon: <ShoppingCart size={18} />,
        },
        {
            name: "Revenue & Expenses",
            path: "/owner/revenue",
            icon: <DollarSign size={18} />,
        },
        {
            name: "Maintenance Requests",
            path: "/owner/maintenance",
            icon: <Wrench size={18} />,
        },
        {
            name: "Appointments",
            path: "/owner/appointments",
            icon: <Calendar size={18} />,
        },
        {
            name: "Reservations",
            path: "/owner/reservations",
            icon: <CalendarCheck size={18} />,
        },
        {
            name: "Rental Agreements",
            path: "/owner/rental-agreements",
            icon: <FileText size={18} />,
        },
        {
            name: "Payments",
            path: "/owner/payments",
            icon: <CreditCard size={18} />,
        },
        {
            name: "Reports",
            path: "/owner/reports",
            icon: <BarChart3 size={18} />,
        },
        {
            name: "Settings",
            path: "/owner/settings",
            icon: <Settings size={18} />,
        },
        {
            name: "Activity Log",
            path: "/owner/activity",
            icon: <ClipboardList size={18} />,
        },
    ];

    // ======================================================
    // PRINT
    // ======================================================

    const handlePrint = () => {
        window.print();
    };

    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {
        return (
            <div className="or-page-loading">
                <RefreshCw
                    size={30}
                    className="or-loading-icon"
                />

                <h2>Loading Owner Reports...</h2>

                <p>
                    Preparing your property and financial reports.
                </p>
            </div>
        );
    }

    // ======================================================
    // PAGE
    // ======================================================

    return (
        <div className="or-container">

            {/* ==================================================
                SIDEBAR
            ================================================== */}

            <aside className="or-sidebar">

                <div className="or-logo">
                    <Building2 size={26} />

                    <div>
                        <h2>REAL ESTATE</h2>

                        <p>
                            PROPERTY SALES, RENTAL & MANAGEMENT SYSTEM
                        </p>
                    </div>
                </div>

                <nav className="or-nav">

                    {menuItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`or-menu-item ${
                                location.pathname === item.path
                                    ? "active"
                                    : ""
                            }`}
                        >
                            <span className="or-menu-icon">
                                {item.icon}
                            </span>

                            <span>{item.name}</span>
                        </Link>
                    ))}

                </nav>

                <button
                    className="or-logout"
                    onClick={handleLogout}
                >
                    <LogOut size={18} />
                    Logout
                </button>

                <div className="or-user-footer">

                    <div className="or-avatar-sm">
                        {userName
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div>
                        <div className="or-user-name">
                            {owner?.OwnerName || userName}
                        </div>

                        <div className="or-user-role">
                            Property Owner
                        </div>
                    </div>

                    <ChevronDown size={14} />

                </div>

            </aside>

            {/* ==================================================
                MAIN
            ================================================== */}

            <main className="or-main">

                {/* HEADER */}

                <header className="or-header">

                    <div className="or-welcome">

                        <span className="or-welcome-title">
                            Owner Reports
                        </span>

                        <span className="or-welcome-subtitle">
                            Financial & Operational Reports
                        </span>

                    </div>

                    <div className="or-header-right">

                        <div className="or-search">
                            <Search size={16} />

                            <input
                                placeholder="Search reports..."
                            />
                        </div>

                        <button className="or-icon-btn">
                            <Mail size={18} />
                        </button>

                        <button className="or-icon-btn or-notification">
                            <Bell size={18} />
                            <span>3</span>
                        </button>

                        <div className="or-user-chip">

                            <div className="or-avatar">
                                {(
                                    owner?.OwnerName ||
                                    userName
                                )
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div>
                                <div className="or-chip-name">
                                    {owner?.OwnerName ||
                                        userName}
                                </div>

                                <div className="or-chip-role">
                                    Property Owner
                                </div>
                            </div>

                        </div>

                    </div>

                </header>

                {/* CONTENT */}

                <div className="or-content">

                    {/* PAGE TITLE */}

                    <div className="or-page-heading">

                        <div>
                            <h1>Reports</h1>

                            <p>
                                View your property,
                                sales, rental,
                                financial and
                                operational reports.
                            </p>
                        </div>

                        <button
                            className="or-print-btn"
                            onClick={handlePrint}
                        >
                            <Printer size={17} />
                            Print Report
                        </button>

                    </div>

                    {error && (
                        <div className="or-error">
                            {error}
                        </div>
                    )}

                    {/* ==================================================
                        SUMMARY CARDS
                    ================================================== */}

                    <div className="or-summary-grid">

                        <div className="or-summary-card">

                            <div className="or-summary-icon blue">
                                <Building2 size={21} />
                            </div>

                            <div>
                                <span>Total Properties</span>

                                <strong>
                                    {
                                        summary.properties.total
                                    }
                                </strong>
                            </div>

                        </div>

                        <div className="or-summary-card">

                            <div className="or-summary-icon green">
                                <ShoppingCart size={21} />
                            </div>

                            <div>
                                <span>Total Sales</span>

                                <strong>
                                    {summary.sales.count}
                                </strong>
                            </div>

                        </div>

                        <div className="or-summary-card">

                            <div className="or-summary-icon purple">
                                <Wallet size={21} />
                            </div>

                            <div>
                                <span>Total Revenue</span>

                                <strong>
                                    {formatMoney(
                                        summary.revenue.amount
                                    )}{" "}
                                    ETB
                                </strong>
                            </div>

                        </div>

                        <div className="or-summary-card">

                            <div className="or-summary-icon orange">
                                <TrendingDown size={21} />
                            </div>

                            <div>
                                <span>Total Expenses</span>

                                <strong>
                                    {formatMoney(
                                        summary.expenses.amount
                                    )}{" "}
                                    ETB
                                </strong>
                            </div>

                        </div>

                        <div className="or-summary-card">

                            <div className="or-summary-icon green">
                                <TrendingUp size={21} />
                            </div>

                            <div>
                                <span>Net Profit</span>

                                <strong>
                                    {formatMoney(
                                        summary.netProfit
                                    )}{" "}
                                    ETB
                                </strong>
                            </div>

                        </div>

                        <div className="or-summary-card">

                            <div className="or-summary-icon purple">
                                <FileText size={21} />
                            </div>

                            <div>
                                <span>Rental Agreements</span>

                                <strong>
                                    {summary.rentals.count}
                                </strong>
                            </div>

                        </div>

                    </div>

                    {/* ==================================================
                        REPORT NAVIGATION
                    ================================================== */}

                    <div className="or-report-tabs">

                        <button
                            className={
                                activeReport === "overview"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveReport("overview")
                            }
                        >
                            <FileBarChart size={17} />
                            Overview
                        </button>

                        <button
                            className={
                                activeReport === "sales"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveReport("sales")
                            }
                        >
                            <ShoppingCart size={17} />
                            Sales
                        </button>

                        <button
                            className={
                                activeReport === "rentals"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveReport("rentals")
                            }
                        >
                            <FileText size={17} />
                            Rentals
                        </button>

                        <button
                            className={
                                activeReport === "financial"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveReport("financial")
                            }
                        >
                            <DollarSign size={17} />
                            Financial
                        </button>

                        <button
                            className={
                                activeReport === "maintenance"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveReport("maintenance")
                            }
                        >
                            <Wrench size={17} />
                            Maintenance
                        </button>

                        <button
                            className={
                                activeReport === "appointments"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveReport("appointments")
                            }
                        >
                            <Calendar size={17} />
                            Appointments
                        </button>

                    </div>

                    {/* ==================================================
                        OVERVIEW
                    ================================================== */}

                    {activeReport === "overview" && (
                        <>

                            <div className="or-section-title">
                                <h2>Property Overview</h2>
                                <span>
                                    {summary.properties.total} properties
                                </span>
                            </div>

                            <div className="or-property-status-grid">

                                <div className="or-status-card available">
                                    <span>Available</span>
                                    <strong>
                                        {summary.properties.available}
                                    </strong>
                                </div>

                                <div className="or-status-card reserved">
                                    <span>Reserved</span>
                                    <strong>
                                        {summary.properties.reserved}
                                    </strong>
                                </div>

                                <div className="or-status-card rented">
                                    <span>Rented</span>
                                    <strong>
                                        {summary.properties.rented}
                                    </strong>
                                </div>

                                <div className="or-status-card sold">
                                    <span>Sold</span>
                                    <strong>
                                        {summary.properties.sold}
                                    </strong>
                                </div>

                            </div>

                            <div className="or-financial-overview">

                                <div className="or-financial-card revenue">

                                    <div className="or-financial-card-header">
                                        <div>
                                            <span>Total Revenue</span>
                                            <strong>
                                                {formatMoney(
                                                    summary.revenue.amount
                                                )}{" "}
                                                ETB
                                            </strong>
                                        </div>

                                        <TrendingUp size={24} />
                                    </div>

                                    <p>
                                        {
                                            summary.revenue.count
                                        } revenue records
                                    </p>

                                </div>

                                <div className="or-financial-card expense">

                                    <div className="or-financial-card-header">
                                        <div>
                                            <span>Total Expenses</span>
                                            <strong>
                                                {formatMoney(
                                                    summary.expenses.amount
                                                )}{" "}
                                                ETB
                                            </strong>
                                        </div>

                                        <TrendingDown size={24} />
                                    </div>

                                    <p>
                                        {
                                            summary.expenses.count
                                        } expense records
                                    </p>

                                </div>

                                <div className="or-financial-card profit">

                                    <div className="or-financial-card-header">
                                        <div>
                                            <span>Net Profit</span>
                                            <strong>
                                                {formatMoney(
                                                    summary.netProfit
                                                )}{" "}
                                                ETB
                                            </strong>
                                        </div>

                                        <Wallet size={24} />
                                    </div>

                                    <p>
                                        Revenue minus expenses
                                    </p>

                                </div>

                            </div>

                        </>
                    )}

                    {/* ==================================================
                        SALES REPORT
                    ================================================== */}

                    {activeReport === "sales" && (
                        <section className="or-report-section">

                            <div className="or-section-title">
                                <div>
                                    <h2>Sales Report</h2>
                                    <p>
                                        Sales belonging to your properties.
                                    </p>
                                </div>

                                <span>
                                    {reports.sales.length} records
                                </span>
                            </div>

                            <div className="or-table-card">

                                <div className="or-table-wrapper">

                                    <table>

                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Property</th>
                                                <th>Customer</th>
                                                <th>Sale Date</th>
                                                <th>Sale Price</th>
                                                <th>Payment Status</th>
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {reports.sales.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="6"
                                                        className="or-empty"
                                                    >
                                                        No sales records found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                reports.sales.map(
                                                    (sale) => (
                                                        <tr
                                                            key={
                                                                sale.SaleID
                                                            }
                                                        >
                                                            <td>
                                                                #
                                                                {
                                                                    sale.SaleID
                                                                }
                                                            </td>

                                                            <td>
                                                                <strong>
                                                                    {
                                                                        sale.PropertyName
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    {
                                                                        sale.PropertyType
                                                                    }
                                                                </small>
                                                            </td>

                                                            <td>
                                                                {
                                                                    sale.CustomerName ||
                                                                    "—"
                                                                }
                                                            </td>

                                                            <td>
                                                                {formatDate(
                                                                    sale.SaleDate
                                                                )}
                                                            </td>

                                                            <td className="money">
                                                                +
                                                                {formatMoney(
                                                                    sale.SalePrice
                                                                )}{" "}
                                                                ETB
                                                            </td>

                                                            <td>
                                                                <span
                                                                    className={`or-status-badge ${
                                                                        String(
                                                                            sale.PaymentStatus ||
                                                                            ""
                                                                        ).toLowerCase() ===
                                                                        "paid"
                                                                            ? "paid"
                                                                            : "pending"
                                                                    }`}
                                                                >
                                                                    {
                                                                        sale.PaymentStatus ||
                                                                        "—"
                                                                    }
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )
                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </section>
                    )}

                    {/* ==================================================
                        RENTAL REPORT
                    ================================================== */}

                    {activeReport === "rentals" && (
                        <section className="or-report-section">

                            <div className="or-section-title">

                                <div>
                                    <h2>Rental Report</h2>

                                    <p>
                                        Rental agreements for your properties.
                                    </p>
                                </div>

                                <span>
                                    {reports.rentals.length} records
                                </span>

                            </div>

                            <div className="or-table-card">

                                <div className="or-table-wrapper">

                                    <table>

                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Property</th>
                                                <th>Tenant / Customer</th>
                                                <th>Start Date</th>
                                                <th>End Date</th>
                                                <th>Rent Amount</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {reports.rentals.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="7"
                                                        className="or-empty"
                                                    >
                                                        No rental records found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                reports.rentals.map(
                                                    (rental) => (
                                                        <tr
                                                            key={
                                                                rental.RentalAgreementID
                                                            }
                                                        >
                                                            <td>
                                                                #
                                                                {
                                                                    rental.RentalAgreementID
                                                                }
                                                            </td>

                                                            <td>
                                                                <strong>
                                                                    {
                                                                        rental.PropertyName
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    {
                                                                        rental.PropertyType
                                                                    }
                                                                </small>
                                                            </td>

                                                            <td>
                                                                {
                                                                    rental.CustomerName ||
                                                                    "—"
                                                                }
                                                            </td>

                                                            <td>
                                                                {formatDate(
                                                                    rental.StartDate
                                                                )}
                                                            </td>

                                                            <td>
                                                                {formatDate(
                                                                    rental.EndDate
                                                                )}
                                                            </td>

                                                            <td className="money">
                                                                formatMoney(
    rental.MonthlyRent
)
                                                                ETB
                                                            </td>

                                                            <td>
                                                                <span className="or-status-badge">
                                                                    {
                                                                        rental.Status ||
                                                                        "—"
                                                                    }
                                                                </span>
                                                            </td>

                                                        </tr>
                                                    )
                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </section>
                    )}

                    {/* ==================================================
                        FINANCIAL REPORT
                    ================================================== */}

                    {activeReport === "financial" && (
                        <section className="or-report-section">

                            <div className="or-section-title">

                                <div>
                                    <h2>Financial Report</h2>

                                    <p>
                                        Revenue, expenses and profitability.
                                    </p>
                                </div>

                            </div>

                            <div className="or-financial-report-grid">

                                <div className="or-big-financial revenue">

                                    <span>Total Revenue</span>

                                    <strong>
                                        {formatMoney(
                                            summary.revenue.amount
                                        )}{" "}
                                        ETB
                                    </strong>

                                    <small>
                                        {
                                            summary.revenue.count
                                        } revenue records
                                    </small>

                                </div>

                                <div className="or-big-financial expense">

                                    <span>Total Expenses</span>

                                    <strong>
                                        {formatMoney(
                                            summary.expenses.amount
                                        )}{" "}
                                        ETB
                                    </strong>

                                    <small>
                                        {
                                            summary.expenses.count
                                        } expense records
                                    </small>

                                </div>

                                <div className="or-big-financial profit">

                                    <span>Net Profit</span>

                                    <strong>
                                        {formatMoney(
                                            summary.netProfit
                                        )}{" "}
                                        ETB
                                    </strong>

                                    <small>
                                        Revenue − Expenses
                                    </small>

                                </div>

                            </div>

                            <div className="or-table-card">

                                <div className="or-table-wrapper">

                                    <table>

                                        <thead>
                                            <tr>
                                                <th>Type</th>
                                                <th>Property</th>
                                                <th>Source / Expense Type</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {[
                                                ...reports.revenues.map(
                                                    (item) => ({
                                                        type: "Revenue",
                                                        property:
                                                            item.PropertyName,
                                                        source:
                                                            item.Source,
                                                        amount:
                                                            item.Amount,
                                                        date:
                                                            item.DateRecorded,
                                                        id:
                                                            `revenue-${item.RevenueID}`,
                                                    })
                                                ),

                                                ...reports.expenses.map(
                                                    (item) => ({
                                                        type: "Expense",
                                                        property:
                                                            item.PropertyName,
                                                        source:
                                                            item.ExpenseType,
                                                        amount:
                                                            item.Amount,
                                                        date:
                                                            item.DateRecorded,
                                                        id:
                                                            `expense-${item.ExpenseID}`,
                                                    })
                                                ),
                                            ]
                                                .sort(
                                                    (a, b) =>
                                                        new Date(
                                                            b.date
                                                        ) -
                                                        new Date(
                                                            a.date
                                                        )
                                                )
                                                .map((item) => (
                                                    <tr key={item.id}>

                                                        <td>
                                                            <span
                                                                className={`or-finance-type ${item.type.toLowerCase()}`}
                                                            >
                                                                {item.type}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            {
                                                                item.property ||
                                                                "—"
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                item.source ||
                                                                "—"
                                                            }
                                                        </td>

                                                        <td
                                                            className={
                                                                item.type ===
                                                                "Revenue"
                                                                    ? "money"
                                                                    : "expense-money"
                                                            }
                                                        >
                                                            {item.type ===
                                                            "Revenue"
                                                                ? "+"
                                                                : "-"}
                                                            {formatMoney(
                                                                item.amount
                                                            )}{" "}
                                                            ETB
                                                        </td>

                                                        <td>
                                                            {formatDate(
                                                                item.date
                                                            )}
                                                        </td>

                                                    </tr>
                                                ))}

                                            {reports.revenues.length ===
                                                0 &&
                                                reports.expenses.length ===
                                                    0 && (
                                                    <tr>
                                                        <td
                                                            colSpan="5"
                                                            className="or-empty"
                                                        >
                                                            No financial records found.
                                                        </td>
                                                    </tr>
                                                )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </section>
                    )}

                    {/* ==================================================
                        MAINTENANCE REPORT
                    ================================================== */}

                    {activeReport === "maintenance" && (
                        <section className="or-report-section">

                            <div className="or-section-title">

                                <div>
                                    <h2>Maintenance Report</h2>

                                    <p>
                                        Maintenance activity for your properties.
                                    </p>
                                </div>

                                <span>
                                    {reports.maintenance.length} records
                                </span>

                            </div>

                            <div className="or-table-card">

                                <div className="or-table-wrapper">

                                    <table>

                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Property</th>
                                                <th>Description</th>
                                                <th>Priority</th>
                                                <th>Status</th>
                                                <th>Cost</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {reports.maintenance.length ===
                                            0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="7"
                                                        className="or-empty"
                                                    >
                                                        No maintenance records found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                reports.maintenance.map(
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
                                                                    item.Description ||
                                                                    "—"
                                                                }
                                                            </td>

                                                            <td>
                                                                <span className="or-status-badge">
                                                                    {
                                                                        item.Priority ||
                                                                        "—"
                                                                    }
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <span className="or-status-badge">
                                                                    {
                                                                        item.Status ||
                                                                        "—"
                                                                    }
                                                                </span>
                                                            </td>

                                                            <td className="expense-money">
    -
    {formatMoney(
        item.ActualCost ?? item.EstimatedCost
    )}{" "}
    ETB
</td>

                                                            <td>
                                                                {formatDate(
                                                                    item.RequestDate
                                                                )}
                                                            </td>

                                                        </tr>
                                                    )
                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </section>
                    )}

                    {/* ==================================================
                        APPOINTMENT REPORT
                    ================================================== */}

                    {activeReport === "appointments" && (
                        <section className="or-report-section">

                            <div className="or-section-title">

                                <div>
                                    <h2>Appointment Report</h2>

                                    <p>
                                        Appointments associated with your properties.
                                    </p>
                                </div>

                                <span>
                                    {reports.appointments.length} records
                                </span>

                            </div>

                            <div className="or-table-card">

                                <div className="or-table-wrapper">

                                    <table>

                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Property</th>
                                                <th>Customer</th>
                                                <th>Date</th>
                                                <th>Time</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {reports.appointments.length ===
                                            0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="6"
                                                        className="or-empty"
                                                    >
                                                        No appointment records found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                reports.appointments.map(
                                                    (item) => (
                                                        <tr
                                                            key={
                                                                item.AppointmentID
                                                            }
                                                        >

                                                            <td>
                                                                #
                                                                {
                                                                    item.AppointmentID
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
                                                                    item.CustomerName ||
                                                                    "—"
                                                                }
                                                            </td>

                                                            <td>
                                                                {formatDate(
                                                                    item.AppointmentDate
                                                                )}
                                                            </td>

                                                            <td>
                                                                {item.AppointmentTime
                                                                    ? String(
                                                                          item.AppointmentTime
                                                                      ).substring(
                                                                          0,
                                                                          5
                                                                      )
                                                                    : "—"}
                                                            </td>

                                                            <td>
                                                                <span className="or-status-badge">
                                                                    {
                                                                        item.Status ||
                                                                        "—"
                                                                    }
                                                                </span>
                                                            </td>

                                                        </tr>
                                                    )
                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </section>
                    )}

                </div>

            </main>

        </div>
    );
}

export default OwnerReports;