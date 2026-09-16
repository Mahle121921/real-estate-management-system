import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Building2,
} from "lucide-react";

import "./OwnerRevenue.css";

function OwnerRevenue() {
    const [owner, setOwner] = useState(null);
    const [revenue, setRevenue] = useState([]);
    const [expenses, setExpenses] = useState([]);

    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        const loadOwnerFinancialData = async () => {
            if (!token) {
                window.location.href = "/";
                return;
            }

            try {
                setLoading(true);
                setError("");

                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };

                // 1. Get logged-in owner
                const ownerResponse = await axios.get(
                    "http://localhost:5000/api/owners/me",
                    config
                );

                const ownerData = ownerResponse.data.owner;

                if (!ownerData) {
                    throw new Error("Owner profile not found.");
                }

                setOwner(ownerData);

                const ownerId = ownerData.OwnerID;

                // 2. Get revenue
                const revenueResponse = await axios.get(
                    `http://localhost:5000/api/owners/${ownerId}/revenue`,
                    config
                );

                setRevenue(
                    revenueResponse.data.revenue || []
                );

                // 3. Get expenses
                const expenseResponse = await axios.get(
                    `http://localhost:5000/api/owners/${ownerId}/expenses`,
                    config
                );

                setExpenses(
                    expenseResponse.data.expenses || []
                );

                // 4. Get financial summary
                const summaryResponse = await axios.get(
                    `http://localhost:5000/api/owners/${ownerId}/financial-summary`,
                    config
                );

                const financial =
                    summaryResponse.data.financialSummary;

                setSummary({
                    totalRevenue: Number(
                        financial?.totalRevenue || 0
                    ),
                    totalExpenses: Number(
                        financial?.totalExpenses || 0
                    ),
                    netIncome: Number(
                        financial?.netIncome || 0
                    ),
                });

            } catch (err) {
                console.error(
                    "Owner financial data error:",
                    err
                );

                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/";
                    return;
                }

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to load financial data."
                );
            } finally {
                setLoading(false);
            }
        };

        loadOwnerFinancialData();
    }, [token]);

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

        return new Date(date).toLocaleDateString();
    };

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const userName =
        owner?.FullName ||
        user?.fullName ||
        user?.FullName ||
        "Owner User";

    return (
        <div className="owner-revenue-page">

            {/* HEADER */}
            <header className="or-header">

                <div className="or-brand">
                    <Building2 size={26} />

                    <div>
                        <h2>REAL ESTATE</h2>
                        <p>
                            PROPERTY SALES, RENTAL & MANAGEMENT SYSTEM
                        </p>
                    </div>
                </div>

                <div className="or-user">
                    <div className="or-avatar">
                        {userName
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div>
                        <strong>{userName}</strong>
                        <span>Property Owner</span>
                    </div>
                </div>

            </header>


            {/* MAIN */}
            <main className="or-main">

                {/* PAGE HEADER */}
                <div className="or-page-header">

                    <div>
                        <Link
                            to="/owner-dashboard"
                            className="or-back"
                        >
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </Link>

                        <h1>
                            Revenue & Expenses
                        </h1>

                        <p>
                            View your property income,
                            expenses, and financial performance.
                        </p>
                    </div>

                </div>


                {/* LOADING */}
                {loading && (
                    <div className="or-message">
                        Loading financial information...
                    </div>
                )}


                {/* ERROR */}
                {error && (
                    <div className="or-error">
                        {error}
                    </div>
                )}


                {!loading && !error && (
                    <>

                        {/* SUMMARY CARDS */}
                        <div className="or-summary">

                            <div className="or-card revenue">

                                <div className="or-card-icon">
                                    <TrendingUp size={22} />
                                </div>

                                <div>
                                    <span>
                                        Total Revenue
                                    </span>

                                    <strong>
                                        {formatMoney(
                                            summary.totalRevenue
                                        )} ETB
                                    </strong>
                                </div>

                            </div>


                            <div className="or-card expense">

                                <div className="or-card-icon">
                                    <TrendingDown size={22} />
                                </div>

                                <div>
                                    <span>
                                        Total Expenses
                                    </span>

                                    <strong>
                                        {formatMoney(
                                            summary.totalExpenses
                                        )} ETB
                                    </strong>
                                </div>

                            </div>


                            <div className="or-card profit">

                                <div className="or-card-icon">
                                    <DollarSign size={22} />
                                </div>

                                <div>
                                    <span>
                                        Net Profit
                                    </span>

                                    <strong>
                                        {formatMoney(
                                            summary.netIncome
                                        )} ETB
                                    </strong>
                                </div>

                            </div>

                        </div>


                        {/* REVENUE TABLE */}
                        <section className="or-section">

                            <div className="or-section-header">

                                <div>
                                    <h2>
                                        Revenue Records
                                    </h2>

                                    <p>
                                        {revenue.length} revenue
                                        record
                                        {revenue.length !== 1
                                            ? "s"
                                            : ""}
                                    </p>
                                </div>

                            </div>

                            <div className="or-table-wrapper">

                                <table>

                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Property</th>
                                            <th>Source</th>
                                            <th>Amount</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {revenue.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="or-empty"
                                                >
                                                    No revenue records
                                                    found.
                                                </td>
                                            </tr>
                                        ) : (
                                            revenue.map((item) => (
                                                <tr
                                                    key={
                                                        item.RevenueID
                                                    }
                                                >

                                                    <td>
                                                        #
                                                        {
                                                            item.RevenueID
                                                        }
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {
                                                                item.PropertyName
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        {
                                                            item.Source ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td className="money revenue-money">
                                                        +
                                                        {formatMoney(
                                                            item.Amount
                                                        )}{" "}
                                                        ETB
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            item.DateRecorded
                                                        )}
                                                    </td>

                                                </tr>
                                            ))
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </section>


                        {/* EXPENSE TABLE */}
                        <section className="or-section">

                            <div className="or-section-header">

                                <div>
                                    <h2>
                                        Expense Records
                                    </h2>

                                    <p>
                                        {expenses.length} expense
                                        record
                                        {expenses.length !== 1
                                            ? "s"
                                            : ""}
                                    </p>
                                </div>

                            </div>

                            <div className="or-table-wrapper">

                                <table>

                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Property</th>
                                            <th>Expense Type</th>
                                            <th>Amount</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {expenses.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="or-empty"
                                                >
                                                    No expense records
                                                    found.
                                                </td>
                                            </tr>
                                        ) : (
                                            expenses.map((item) => (
                                                <tr
                                                    key={
                                                        item.ExpenseID
                                                    }
                                                >

                                                    <td>
                                                        #
                                                        {
                                                            item.ExpenseID
                                                        }
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {
                                                                item.PropertyName
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        {
                                                            item.ExpenseType ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td className="money expense-money">
                                                        -
                                                        {formatMoney(
                                                            item.Amount
                                                        )}{" "}
                                                        ETB
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            item.DateRecorded
                                                        )}
                                                    </td>

                                                </tr>
                                            ))
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </section>

                    </>
                )}

            </main>
        </div>
    );
}

export default OwnerRevenue;