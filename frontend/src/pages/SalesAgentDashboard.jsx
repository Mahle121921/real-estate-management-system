import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";

import {
    Users,
    Building2,
    CalendarCheck,
    ShoppingCart,
    CreditCard,
    Bell,
    UserPlus,
    ArrowRight,
    TrendingUp,
    Clock3,
    BriefcaseBusiness,
    FileText
} from "lucide-react";

import "./SalesAgentDashboard.css";

function SalesAgentDashboard() {
    const [customerCount, setCustomerCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError("");
const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");

if (!token) {
    return;
}

                const response = await fetch(
                    "http://localhost:5000/api/customers",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to load customers"
                    );
                }

                setCustomerCount(
                    Number(data.count) ||
                    data.customers?.length ||
                    0
                );
            } catch (err) {
                console.error(
                    "Sales Agent dashboard error:",
                    err
                );
                
if (err.name === "AbortError") {
    return;
}

setError(
    err.message ||
    "Failed to load dashboard data"
);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    let currentUser = {};

    try {
        currentUser = JSON.parse(
            localStorage.getItem("user") || "{}"
        );
    } catch {
        currentUser = {};
    }

    const agentName =
        currentUser?.FullName ||
        currentUser?.fullName ||
        currentUser?.name ||
        "Sales Agent";

return (
    <div className="dashboard-layout">
        <Sidebar />

        <main className="sales-agent-dashboard">

            {/* =====================================================
                WELCOME HEADER
            ===================================================== */}
            <section className="sales-agent-welcome">

                <div className="welcome-content">

                    <div className="welcome-icon">
                        <BriefcaseBusiness size={28} />
                    </div>

                    <div>
                        <p className="welcome-label">
                            SALES AGENT PORTAL
                        </p>

                        <h1>
                            Welcome back, {agentName}
                        </h1>

                        <p className="welcome-description">
                            Manage customers, properties,
                            reservations, rental agreements
                            and sales from one place.
                        </p>
                    </div>

                </div>

                <div className="welcome-date">
                    <Clock3 size={18} />
                    <span>Sales Management</span>
                </div>

            </section>

            {/* =====================================================
                ERROR
            ===================================================== */}
            {error && (
                <div className="dashboard-error">
                    {error}
                </div>
            )}

            {/* =====================================================
                STATISTICS
            ===================================================== */}
            <section className="dashboard-section">

                <div className="section-heading">
                    <div>
                        <p className="section-eyebrow">
                            OVERVIEW
                        </p>

                        <h2>
                            Sales Performance
                        </h2>
                    </div>

                    <TrendingUp size={22} />
                </div>

                <div className="sales-agent-stats">

                    {/* CUSTOMERS */}
                    <div className="sales-agent-stat-card customers-card">

                        <div className="stat-card-top">
                            <div className="stat-icon">
                                <Users size={23} />
                            </div>

                            <span className="stat-badge">
                                Active
                            </span>
                        </div>

                        <div className="stat-card-content">
                            <span className="stat-label">
                                Total Customers
                            </span>

                            <h2>
                                {loading ? "..." : customerCount}
                            </h2>

                            <p>
                                Registered customers
                            </p>
                        </div>

                    </div>

                    {/* PROPERTIES */}
                    <div className="sales-agent-stat-card properties-card">

                        <div className="stat-card-top">
                            <div className="stat-icon">
                                <Building2 size={23} />
                            </div>

                            <span className="stat-badge">
                                Available
                            </span>
                        </div>

                        <div className="stat-card-content">
                            <span className="stat-label">
                                Properties
                            </span>

                            <h2>0</h2>

                            <p>
                                Properties available
                            </p>
                        </div>

                    </div>

{/* APPOINTMENTS */}
<div className="sales-agent-stat-card appointments-card">

    <div className="stat-card-top">
        <div className="stat-icon">
            <CalendarCheck size={23} />
        </div>

        <span className="stat-badge">
            Schedule
        </span>
    </div>

    <div className="stat-card-content">
        <span className="stat-label">
            Appointments
        </span>

        <h2>0</h2>

        <p>
            Customer appointments
        </p>
    </div>

</div>

                    {/* SALES */}
                    <div className="sales-agent-stat-card sales-card">

                        <div className="stat-card-top">
                            <div className="stat-icon">
                                <ShoppingCart size={23} />
                            </div>

                            <span className="stat-badge">
                                Sales
                            </span>
                        </div>

                        <div className="stat-card-content">
                            <span className="stat-label">
                                Completed Sales
                            </span>

                            <h2>0</h2>

                            <p>
                                Property sales
                            </p>
                        </div>

                    </div>

                </div>

            </section>

            {/* =====================================================
                QUICK ACTIONS
            ===================================================== */}
            <section className="dashboard-section">

                <div className="section-heading">
                    <div>
                        <p className="section-eyebrow">
                            QUICK ACCESS
                        </p>

                        <h2>
                            What would you like to do?
                        </h2>
                    </div>
                </div>

                <div className="sales-agent-actions">

                    {/* 01 REGISTER CUSTOMER */}
                    <Link
                        to="/sales/customer-register"
                        className="sales-agent-action customer-action"
                    >
                        <div className="action-icon">
                            <UserPlus size={25} />
                        </div>

                        <div className="action-content">
                            <span className="action-number">
                                01
                            </span>

                            <h3>
                                Register Customer
                            </h3>

                            <p>
                                Add a new customer to the system.
                            </p>
                        </div>

                        <ArrowRight
                            className="action-arrow"
                            size={20}
                        />
                    </Link>

                    {/* 02 VIEW PROPERTIES */}
                    <Link
                        to="/sales/properties"
                        className="sales-agent-action property-action"
                    >
                        <div className="action-icon">
                            <Building2 size={25} />
                        </div>

                        <div className="action-content">
                            <span className="action-number">
                                02
                            </span>

                            <h3>
                                View Properties
                            </h3>

                            <p>
                                Browse properties available for sale.
                            </p>
                        </div>

                        <ArrowRight
                            className="action-arrow"
                            size={20}
                        />
                    </Link>
{/* 03 APPOINTMENTS */}
<Link
    to="/sales/appointments"
    className="sales-agent-action appointment-action"
>
    <div className="action-icon">
        <CalendarCheck size={25} />
    </div>

    <div className="action-content">
        <span className="action-number">
            03
        </span>

        <h3>
            Schedule Appointment
        </h3>

        <p>
            Schedule and manage customer appointments.
        </p>
    </div>

    <ArrowRight
        className="action-arrow"
        size={20}
    />
</Link>

                    {/* 04 SALES */}
                    <Link
                        to="/sales"
                        className="sales-agent-action sales-action"
                    >
                        <div className="action-icon">
                            <ShoppingCart size={25} />
                        </div>

                        <div className="action-content">
                            <span className="action-number">
                                04
                            </span>

                            <h3>
                                Manage Sales
                            </h3>

                            <p>
                                Manage property sales and transactions.
                            </p>
                        </div>

                        <ArrowRight
                            className="action-arrow"
                            size={20}
                        />
                    </Link>

                    {/* 05 RENTAL AGREEMENTS */}
                    <Link
                        to="/sales/rental-agreements"
                        className="sales-agent-action rental-action"
                    >
                        <div className="action-icon">
                            <FileText size={25} />
                        </div>

                        <div className="action-content">
                            <span className="action-number">
                                05
                            </span>

                            <h3>
                                Rental Agreements
                            </h3>

                            <p>
                                Create and manage customer rental agreements.
                            </p>
                        </div>

                        <ArrowRight
                            className="action-arrow"
                            size={20}
                        />
                    </Link>
                    {/* 06 PAYMENTS */}

<Link
    to="/sales/payments"
    className="sales-agent-action payment-action"
>
    <div className="action-icon">
        <CreditCard size={25} />
    </div>

    <div className="action-content">
        <span className="action-number">
            06
        </span>

        <h3>
            Record Customer Payment
        </h3>

        <p>
            Record and manage customer payments.
        </p>
    </div>

    <ArrowRight
        className="action-arrow"
        size={20}
    />
</Link>

                </div>

            </section>

            {/* =====================================================
                BOTTOM INFORMATION
            ===================================================== */}
            <section className="dashboard-bottom">

                <div className="activity-card">

                    <div className="activity-header">
                        <div>
                            <p className="section-eyebrow">
                                TODAY
                            </p>

                            <h2>
                                Sales Agent Workspace
                            </h2>
                        </div>

                        <div className="activity-icon">
                            <TrendingUp size={21} />
                        </div>
                    </div>

                    <div className="activity-list">

                        {/* CUSTOMER */}
                        <div className="activity-item">
                            <div className="activity-dot">
                                <Users size={17} />
                            </div>

                            <div>
                                <strong>
                                    Customer Management
                                </strong>

                                <p>
                                    Register and manage your customers.
                                </p>
                            </div>

                            <Link to="/sales/customer-register">
                                Open
                            </Link>
                        </div>

                        {/* PROPERTY */}
                        <div className="activity-item">
                            <div className="activity-dot">
                                <Building2 size={17} />
                            </div>

                            <div>
                                <strong>
                                    Property Management
                                </strong>

                                <p>
                                    Find properties suitable for customers.
                                </p>
                            </div>

                            <Link to="/sales/properties">
                                Open
                            </Link>
                        </div>

                        {/* APPOINTMENTS */}
                        <div className="activity-item">
                            <div className="activity-dot">
                                <CalendarCheck size={17} />
                            </div>

                            <div>
                                <strong>
                                    Appointments
                                </strong>

                                <p>
                                    Keep track of customer appointments.
                                </p>
                            </div>

                            <Link to="/sales/appointments">
                                Open
                            </Link>
                        </div>

                        {/* RENTAL AGREEMENTS */}
                        <div className="activity-item">
                            <div className="activity-dot">
                                <FileText size={17} />
                            </div>

                            <div>
                                <strong>
                                    Rental Agreements
                                </strong>

                                <p>
                                    Create and manage customer rental agreements.
                                </p>
                            </div>

                            <Link to="/sales/rental-agreements">
                                Open
                            </Link>
                        </div>

                    </div>

                </div>

                {/* NOTIFICATIONS */}
                <div className="notification-card">

                    <div className="notification-card-icon">
                        <Bell size={25} />
                    </div>

                    <p className="section-eyebrow">
                        NOTIFICATIONS
                    </p>

                    <h2>
                        Stay up to date
                    </h2>

                    <p>
                        Check your latest notifications,
                        customer updates and important
                        sales information.
                    </p>

                    <Link to="/sales/notifications">
                        View Notifications
                        <ArrowRight size={17} />
                    </Link>

                </div>

            </section>

               </main>
    </div>
    );
}

export default SalesAgentDashboard;