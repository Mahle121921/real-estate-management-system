import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  Home,
  Users,
  UserCircle,
  ShoppingCart,
  Mail,
  Bell,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  RefreshCw,
  Building2,
  CalendarCheck,
} from "lucide-react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  // =====================================================
  // USER / AUTHENTICATION
  // =====================================================

  const getStoredUser = () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Invalid stored user:", error);
      return null;
    }
  };

  const user = getStoredUser();
  const role = user?.role || "";

  // =====================================================
  // STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [propertyStatusData, setPropertyStatusData] = useState([]);

  const [topProperties, setTopProperties] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const [stats, setStats] = useState({
    owners: 0,
    customers: 0,
    properties: 0,
    sales: 0,
    revenue: 0,
    expenses: 0,
    profit: 0,
  });

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      // -------------------------------------------------
      // TOKEN CHECK
      // -------------------------------------------------

      if (!token) {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // -------------------------------------------------
      // API REQUESTS
      // -------------------------------------------------

      const [
        ownersResponse,
        customersResponse,
        propertiesResponse,
        salesResponse,
        rentalsResponse,
        financialResponse,
      ] = await Promise.all([
        axios.get(
          "http://localhost:5000/api/owners",
          config
        ),

        axios.get(
          "http://localhost:5000/api/customers",
          config
        ),

        axios.get(
          "http://localhost:5000/api/properties",
          config
        ),

        axios.get(
          "http://localhost:5000/api/sales",
          config
        ),

        axios.get(
          "http://localhost:5000/api/rentals",
          config
        ),

        axios.get(
          "http://localhost:5000/api/revenue/summary",
          config
        ),
      ]);

      // =================================================
      // RESPONSE DATA
      // =================================================

      const owners =
        ownersResponse.data?.owners || [];

      const customers =
        customersResponse.data?.customers || [];

      const properties =
        propertiesResponse.data?.properties || [];

      const sales =
        salesResponse.data?.sales || [];

      const rentals =
        rentalsResponse.data?.rentals || [];

      const summary =
        financialResponse.data?.summary || {};

      // =================================================
      // FINANCIAL SUMMARY
      // =================================================

      const totalRevenue = Number(
        summary.totalRevenue || 0
      );

      const totalExpenses = Number(
        summary.totalExpenses || 0
      );

      const netIncome = Number(
        summary.netIncome || 0
      );

      // =================================================
      // MONTHLY SALES + RENTALS
      // =================================================

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const monthlyData = months.map(
        (month, index) => {
          const monthNumber = index + 1;

          const monthlySales = sales
            .filter((sale) => {
              if (!sale.SaleDate) {
                return false;
              }

              const date = new Date(
                sale.SaleDate
              );

              return (
                date.getMonth() + 1 ===
                monthNumber
              );
            })
            .reduce(
              (total, sale) =>
                total +
                Number(
                  sale.SalePrice || 0
                ),
              0
            );

          const monthlyRentals = rentals
            .filter((rental) => {
              if (!rental.StartDate) {
                return false;
              }

              const date = new Date(
                rental.StartDate
              );

              return (
                date.getMonth() + 1 ===
                monthNumber
              );
            })
            .reduce(
              (total, rental) =>
                total +
                Number(
                  rental.MonthlyRent || 0
                ),
              0
            );

          return {
            month,
            sales: monthlySales,
            rentals: monthlyRentals,
          };
        }
      );

      // =================================================
      // PROPERTY STATUS
      // =================================================

      const statusCounts = {
        Available: 0,
        Reserved: 0,
        Sold: 0,
        Rented: 0,
      };

      properties.forEach((property) => {
        const status = property.Status;

        if (
          Object.prototype.hasOwnProperty.call(
            statusCounts,
            status
          )
        ) {
          statusCounts[status]++;
        }
      });

      const propertyStatus = [
        {
          name: "Available",
          value: statusCounts.Available,
          color: "#22c55e",
        },
        {
          name: "Reserved",
          value: statusCounts.Reserved,
          color: "#f97316",
        },
        {
          name: "Sold",
          value: statusCounts.Sold,
          color: "#ef4444",
        },
        {
          name: "Rented",
          value: statusCounts.Rented,
          color: "#3b82f6",
        },
      ];

      // =================================================
      // TOP PROPERTIES BY SALES
      // =================================================

      const salesByProperty = {};

      sales.forEach((sale) => {
        const propertyId = sale.PropertyID;

        if (!propertyId) {
          return;
        }

        if (!salesByProperty[propertyId]) {
          salesByProperty[propertyId] = {
            propertyId,
            name:
              sale.PropertyName ||
              `Property #${propertyId}`,
            amount: 0,
            count: 0,
          };
        }

        salesByProperty[propertyId].amount +=
          Number(sale.SalePrice || 0);

        salesByProperty[propertyId].count += 1;
      });

      const topPropertyData = Object.values(
        salesByProperty
      )
        .sort(
          (a, b) =>
            b.amount - a.amount
        )
        .slice(0, 5);

      // =================================================
      // UPDATE STATE
      // =================================================

      setMonthlySalesData(monthlyData);

      setPropertyStatusData(propertyStatus);

      setTopProperties(topPropertyData);

      setStats({
        owners:
          Number(
            ownersResponse.data?.count
          ) || owners.length,

        customers:
          Number(
            customersResponse.data?.count
          ) || customers.length,

        properties:
          Number(
            propertiesResponse.data?.count
          ) || properties.length,

        sales:
          Number(
            salesResponse.data?.count
          ) || sales.length,

        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: netIncome,
      });

      setLoading(false);

      // =================================================
      // ACTIVITY LOG
      // =================================================

      /*
       * Activity logs are loaded separately because
       * access is permission-controlled.
       *
       * Administrator can always access them.
       * Authorized Owners can access them.
       */

      try {
        const activityResponse =
          await axios.get(
            "http://localhost:5000/api/activity-logs",
            config
          );

        const activityLogs =
          activityResponse.data?.activityLogs ||
          [];

        const recent = activityLogs
          .slice(0, 7)
          .map((activity) => ({
            text:
              activity.Activity ||
              "Activity recorded",
            time: formatDateTime(
              activity.LogDate
            ),
            color: getActivityColor(
              activity.Module
            ),
          }));

        setRecentActivities(recent);
      } catch (activityError) {
        console.warn(
          "Activity logs could not be loaded:",
          activityError.response?.data?.message ||
            activityError.message
        );

        setRecentActivities([]);
      }
    } catch (err) {
      console.error(
        "Dashboard error:",
        err
      );

      // -------------------------------------------------
      // INVALID / EXPIRED TOKEN
      // -------------------------------------------------

      if (
        err.response?.status === 401
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      if (!err.response) {
        setError(
          "Unable to connect to the server. Please make sure the backend is running."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to load dashboard data."
        );
      }

      setLoading(false);
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  function formatDateTime(dateValue) {
    if (!dateValue) {
      return "Unknown time";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Unknown time";
    }

    return date.toLocaleString();
  }

  // =====================================================
  // ACTIVITY COLOR
  // =====================================================

  function getActivityColor(module) {
    switch (module) {
      case "Property":
        return "green";

      case "Sale":
        return "purple";

      case "Rental":
        return "orange";

      case "Payment":
        return "teal";

      case "Maintenance":
        return "red";

      case "Reservation":
        return "blue";

      default:
        return "blue";
    }
  }

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  // =====================================================
  // REVENUE / EXPENSE CHART
  // =====================================================

  /*
   * The current revenue controller only provides
   * the TOTAL revenue and TOTAL expenses.
   *
   * Therefore we cannot honestly create a monthly
   * revenue/expense chart from the current API.
   *
   * We use the real totals as a two-column chart.
   */

  const revenueExpensesData = useMemo(
    () => [
      {
        name: "Financial Summary",
        revenue: stats.revenue,
        expenses: stats.expenses,
      },
    ],
    [stats.revenue, stats.expenses]
  );

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="dashboard-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="top-header">

        <div className="search-box">

          <Home size={18} />

          <input
            type="text"
            placeholder="Search properties, customers, reservations..."
          />

        </div>

        <div className="header-right">

          <button
            type="button"
            className="icon-btn"
            onClick={() =>
              navigate("/notifications")
            }
          >
            <Mail size={20} />
          </button>

          <button
            type="button"
            className="icon-btn notification"
            onClick={() =>
              navigate("/notifications")
            }
          >
            <Bell size={20} />

            <span className="badge">
              3
            </span>

          </button>

          <div className="user-profile">

            <div className="avatar">

              {user?.fullName
                ?.charAt(0)
                ?.toUpperCase() || "A"}

            </div>

            <div>

              <div className="user-name">
                {user?.fullName ||
                  "Administrator"}
              </div>

              <div className="user-role">
                {role ||
                  "Administrator"}
              </div>

            </div>

          </div>

        </div>

      </header>

      {/* =================================================
          BODY
      ================================================= */}

      <main className="dashboard-body">

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="dashboard-error">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={loadDashboard}
            >
              <RefreshCw size={15} />
              Retry
            </button>

          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <div className="stats-grid">

          {/* PROPERTIES */}

          <div className="stat-card">

            <div className="stat-icon green">
              <Home size={22} />
            </div>

            <div>

              <p className="stat-label">
                Total Properties
              </p>

              <h3 className="stat-value">
                {loading
                  ? "..."
                  : stats.properties}
              </h3>

              <span className="stat-change up">
                <TrendingUp size={14} />
                Properties registered
              </span>

            </div>

          </div>

          {/* OWNERS */}

          <div className="stat-card">

            <div className="stat-icon blue">
              <Users size={22} />
            </div>

            <div>

              <p className="stat-label">
                Total Owners
              </p>

              <h3 className="stat-value">
                {loading
                  ? "..."
                  : stats.owners}
              </h3>

              <span className="stat-change up">
                <TrendingUp size={14} />
                Registered owners
              </span>

            </div>

          </div>

          {/* CUSTOMERS */}

          <div className="stat-card">

            <div className="stat-icon teal">
              <UserCircle size={22} />
            </div>

            <div>

              <p className="stat-label">
                Total Customers
              </p>

              <h3 className="stat-value">
                {loading
                  ? "..."
                  : stats.customers}
              </h3>

              <span className="stat-change up">
                <TrendingUp size={14} />
                Registered customers
              </span>

            </div>

          </div>

          {/* SALES */}

          <div className="stat-card">

            <div className="stat-icon orange">
              <ShoppingCart size={22} />
            </div>

            <div>

              <p className="stat-label">
                Total Sales
              </p>

              <h3 className="stat-value">
                {loading
                  ? "..."
                  : stats.sales}
              </h3>

              <span className="stat-change up">
                <TrendingUp size={14} />
                Recorded sales
              </span>

            </div>

          </div>

          {/* REVENUE */}

          <div className="stat-card">

            <div className="stat-icon green">
              <DollarSign size={22} />
            </div>

            <div>

              <p className="stat-label">
                Total Revenue
              </p>

              <h3 className="stat-value">

                {loading
                  ? "..."
                  : `ETB ${stats.revenue.toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}`}

              </h3>

              <span className="stat-change up">
                <TrendingUp size={14} />
                Total recorded revenue
              </span>

            </div>

          </div>

          {/* EXPENSES */}

          <div className="stat-card">

            <div className="stat-icon red">
              <TrendingDown size={22} />
            </div>

            <div>

              <p className="stat-label">
                Total Expenses
              </p>

              <h3 className="stat-value">

                {loading
                  ? "..."
                  : `ETB ${stats.expenses.toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}`}

              </h3>

              <span className="stat-change down">
                <TrendingDown size={14} />
                Total recorded expenses
              </span>

            </div>

          </div>

          {/* PROFIT */}

          <div className="stat-card">

            <div className="stat-icon blue">
              <BarChart3 size={22} />
            </div>

            <div>

              <p className="stat-label">
                Net Profit
              </p>

              <h3 className="stat-value">

                {loading
                  ? "..."
                  : `ETB ${stats.profit.toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}`}

              </h3>

              <span className="stat-change up">
                <TrendingUp size={14} />
                Revenue minus expenses
              </span>

            </div>

          </div>

        </div>

        {/* =================================================
            CHARTS
        ================================================= */}

        <div className="charts-row">

          {/* MONTHLY SALES / RENTALS */}

          <div className="card chart-card">

            <div className="card-header">

              <h3>
                Monthly Sales & Rental Overview
              </h3>

            </div>

            <ResponsiveContainer
              width="100%"
              height={260}
            >

              <LineChart
                data={monthlySalesData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                />

                <XAxis
                  dataKey="month"
                />

                <YAxis />

                <Tooltip
                  formatter={(value) =>
                    `ETB ${Number(
                      value
                    ).toLocaleString()}`
                  }
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales (ETB)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                />

                <Line
                  type="monotone"
                  dataKey="rentals"
                  name="Rentals (ETB)"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

          {/* PROPERTY STATUS */}

          <div className="card chart-card">

            <div className="card-header">

              <h3>
                Property Status Distribution
              </h3>

            </div>

            <ResponsiveContainer
              width="100%"
              height={260}
            >

              <PieChart>

                <Pie
                  data={propertyStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >

                  {propertyStatusData.map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                      />
                    )
                  )}

                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* =================================================
            BOTTOM GRID
        ================================================= */}

        <div className="bottom-grid">

          {/* REVENUE VS EXPENSES */}

          <div className="card">

            <div className="card-header">

              <h3>
                Revenue vs Expenses
              </h3>

            </div>

            <ResponsiveContainer
              width="100%"
              height={240}
            >

              <BarChart
                data={revenueExpensesData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                />

                <XAxis
                  dataKey="name"
                />

                <YAxis />

                <Tooltip
                  formatter={(value) =>
                    `ETB ${Number(
                      value
                    ).toLocaleString()}`
                  }
                />

                <Legend />

                <Bar
                  dataKey="revenue"
                  name="Revenue (ETB)"
                  fill="#22c55e"
                />

                <Bar
                  dataKey="expenses"
                  name="Expenses (ETB)"
                  fill="#ef4444"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

          {/* TOP PROPERTIES */}

          <div className="card">

            <div className="card-header">

              <h3>
                Top Properties by Sales
              </h3>

              <button
                type="button"
                className="view-all"
                onClick={() =>
                  navigate("/sales")
                }
              >
                View All
              </button>

            </div>

            <div className="top-properties">

              {topProperties.length === 0 ? (

                <div className="empty-state">
                  No sales recorded yet.
                </div>

              ) : (

                topProperties.map(
                  (property) => (

                    <div
                      key={
                        property.propertyId
                      }
                      className="property-item"
                    >

                      <div className="prop-left">

                        <span className="prop-emoji">
                          🏠
                        </span>

                        <span className="prop-name">
                          {property.name}
                        </span>

                      </div>

                      <span className="prop-sales">
                        ETB{" "}
                        {property.amount.toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 2,
                          }
                        )}
                      </span>

                    </div>

                  )
                )

              )}

            </div>

          </div>

          {/* RECENT ACTIVITIES */}

          <div className="card">

            <div className="card-header">

              <h3>
                Recent Activities
              </h3>

              <button
                type="button"
                className="view-all"
                onClick={() =>
                  navigate("/activity-log")
                }
              >
                View All
              </button>

            </div>

            <div className="activity-list">

              {recentActivities.length === 0 ? (

                <div className="empty-state">

                  <Activity size={20} />

                  <span>
                    No activity logs available.
                  </span>

                </div>

              ) : (

                recentActivities.map(
                  (activity, index) => (

                    <div
                      key={index}
                      className="activity-item"
                    >

                      <span
                        className={`dot ${activity.color}`}
                      />

                      <div className="activity-content">

                        <p>
                          {activity.text}
                        </p>

                        <span className="time">
                          {activity.time}
                        </span>

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          </div>

        </div>

        {/* =================================================
            RIGHT PANEL
        ================================================= */}

        <div className="right-panel">

          {/* RECENT NOTIFICATIONS */}

          <div className="card">

            <div className="card-header">

              <h3>
                Recent Email Notifications
              </h3>

              <button
                type="button"
                className="view-all"
                onClick={() =>
                  navigate("/notifications")
                }
              >
                View All
              </button>

            </div>

            <div className="email-list">

              <div className="email-item">

                <span className="email-dot blue" />

                <div>

                  <p>
                    Open Notifications
                  </p>

                  <span className="time">
                    View your latest notifications
                  </span>

                </div>

              </div>

              <div className="email-item">

                <span className="email-dot green" />

                <div>

                  <p>
                    Email notifications
                  </p>

                  <span className="time">
                    Notification management
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* QUICK ACTIONS */}

          <div className="card">

            <div className="card-header">

              <h3>
                Quick Actions
              </h3>

            </div>

           <div className="quick-actions">

    <button
        type="button"
        onClick={() => navigate("/properties")}
    >
        <Building2 size={20} />
        <span>Manage Properties</span>
    </button>

    <button
        type="button"
        onClick={() => navigate("/reservations")}
    >
        <CalendarCheck size={20} />
        <span>Reservations</span>
    </button>

    <button
        type="button"
        onClick={() => navigate("/users")}
    >
        <Users size={20} />
        <span>Manage Users</span>
    </button>

</div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;