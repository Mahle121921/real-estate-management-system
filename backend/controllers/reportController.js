const pool = require("../config/db");

// ======================================================
// FR16 – REPORTS CONTROLLER
// ======================================================


// ======================================================
// 1. PROPERTY REPORT
// GET /api/reports/properties
// ======================================================
const getPropertyReport = async (req, res) => {
try {


    const [rows] = await pool.query(`
        SELECT
            p.PropertyID,
            p.PropertyName,
            p.PropertyType,
            p.Address,
            p.Status,
            p.SalePrice,
            p.MonthlyRent,
            p.OwnerID,
            u.FullName AS OwnerName
        FROM properties p
        LEFT JOIN owners o
            ON p.OwnerID = o.OwnerID
        LEFT JOIN users u
            ON o.UserID = u.UserID
        ORDER BY p.PropertyID DESC
    `);

    res.json({
        success: true,
        count: rows.length,
        report: rows
    });

} catch (error) {
    console.error("Property report error:", error);

    res.status(500).json({
        success: false,
        message: "Server error while generating property report"
    });
}


};


// ======================================================
// 2. SALES REPORT
// GET /api/reports/sales
// ======================================================
const getSalesReport = async (req, res) => {
    try {

        const [rows] = await pool.query(`
            SELECT
                s.SaleID,
                s.PropertyID,
                p.PropertyName,
                s.CustomerID,
                c.FullName AS CustomerName,
                s.HandledBy,
                u.FullName AS HandledByName,
                s.SalePrice,
                s.SaleDate
            FROM sales s
            LEFT JOIN properties p
                ON s.PropertyID = p.PropertyID
            LEFT JOIN customers c
                ON s.CustomerID = c.CustomerID
            LEFT JOIN users u
                ON s.HandledBy = u.UserID
            ORDER BY s.SaleDate DESC
        `);

        res.json({
            success: true,
            count: rows.length,
            report: rows
        });

    } catch (error) {
        console.error("Sales report error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while generating sales report"
        });
    }
};


// ==========================================
// RENTAL REPORT
// Administrator / Owner
// ==========================================
const getRentalReport = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                r.RentalID,
                r.PropertyID,
                p.PropertyName,

                r.CustomerID,
                c.FullName AS CustomerName,

                r.HandledBy,
                u.FullName AS HandledByName,

                r.MonthlyRent,
                r.StartDate,
                r.EndDate,
                r.DueDate,
                r.Status

            FROM rental_agreements r

            LEFT JOIN properties p
                ON r.PropertyID = p.PropertyID

            LEFT JOIN customers c
                ON r.CustomerID = c.CustomerID

            LEFT JOIN users u
                ON r.HandledBy = u.UserID

            ORDER BY r.StartDate DESC
        `);

        res.json({
            success: true,
            count: rows.length,
            report: rows
        });

    } catch (error) {
        console.error("Rental report error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while generating rental report"
        });
    }
};
const getCustomerReport = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                CustomerID,
                FullName,
                Email,
                PhoneNumber AS Phone
            FROM customers
            ORDER BY CustomerID DESC
        `);

        res.json({
            success: true,
            count: rows.length,
            report: rows
        });

    } catch (error) {
        console.error("Customer report error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while generating customer report"
        });
    }
};


// ======================================================
// 5. OWNER REPORT
// GET /api/reports/owners
// ======================================================
const getOwnerReport = async (req, res) => {
    try {

        const [rows] = await pool.query(`
            SELECT
                o.OwnerID,
                o.UserID,
                u.FullName AS OwnerName,
                u.Email,
                u.Status,
                COUNT(p.PropertyID) AS PropertyCount
            FROM owners o
            LEFT JOIN users u
                ON o.UserID = u.UserID
            LEFT JOIN properties p
                ON o.OwnerID = p.OwnerID
            GROUP BY
                o.OwnerID,
                o.UserID,
                u.FullName,
                u.Email,
                u.Status
            ORDER BY o.OwnerID DESC
        `);

        res.json({
            success: true,
            count: rows.length,
            report: rows
        });

    } catch (error) {
        console.error("Owner report error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while generating owner report"
        });
    }
};


// ======================================================
// 6. REVENUE REPORT
// GET /api/reports/revenue
// ======================================================
const getRevenueReport = async (req, res) => {
    try {

        const [rows] = await pool.query(`
            SELECT
                r.RevenueID,
                r.OwnerID,
                u.FullName AS OwnerName,
                r.PropertyID,
                p.PropertyName,
                r.Source,
                r.Amount,
                r.DateRecorded
            FROM revenue r
            LEFT JOIN owners o
                ON r.OwnerID = o.OwnerID
            LEFT JOIN users u
                ON o.UserID = u.UserID
            LEFT JOIN properties p
                ON r.PropertyID = p.PropertyID
            ORDER BY r.DateRecorded DESC
        `);

        const [summaryRows] = await pool.query(`
            SELECT
                COALESCE(SUM(Amount), 0) AS TotalRevenue,
                COUNT(*) AS RevenueCount
            FROM revenue
        `);

        res.json({
            success: true,
            summary: {
                totalRevenue: Number(
                    summaryRows[0].TotalRevenue
                ).toFixed(2),
                revenueCount: Number(
                    summaryRows[0].RevenueCount
                )
            },
            count: rows.length,
            report: rows
        });

    } catch (error) {
        console.error("Revenue report error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while generating revenue report"
        });
    }
};


// ======================================================
// 7. EXPENSE REPORT
// GET /api/reports/expenses
// ======================================================
const getExpenseReport = async (req, res) => {
    try {

        const [rows] = await pool.query(`
            SELECT
                e.ExpenseID,
                e.OwnerID,
                u.FullName AS OwnerName,
                e.PropertyID,
                p.PropertyName,
                e.ExpenseType,
                e.Amount,
                e.DateRecorded
            FROM expenses e
            LEFT JOIN owners o
                ON e.OwnerID = o.OwnerID
            LEFT JOIN users u
                ON o.UserID = u.UserID
            LEFT JOIN properties p
                ON e.PropertyID = p.PropertyID
            ORDER BY e.DateRecorded DESC
        `);

        const [summaryRows] = await pool.query(`
            SELECT
                COALESCE(SUM(Amount), 0) AS TotalExpenses,
                COUNT(*) AS ExpenseCount
            FROM expenses
        `);

        res.json({
            success: true,
            summary: {
                totalExpenses: Number(
                    summaryRows[0].TotalExpenses
                ).toFixed(2),
                expenseCount: Number(
                    summaryRows[0].ExpenseCount
                )
            },
            count: rows.length,
            report: rows
        });

    } catch (error) {
        console.error("Expense report error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while generating expense report"
        });
    }
};


// ======================================================
// 8. PROFIT REPORT
// GET /api/reports/profit
// ======================================================
const getProfitReport = async (req, res) => {
    try {
        const [revenueResult] = await pool.query(`
            SELECT
                COALESCE(SUM(Amount), 0) AS totalRevenue,
                COUNT(*) AS revenueCount
            FROM revenue
        `);

        const [expenseResult] = await pool.query(`
            SELECT
                COALESCE(SUM(Amount), 0) AS totalExpenses,
                COUNT(*) AS expenseCount
            FROM expenses
        `);

        const totalRevenue = Number(revenueResult[0].totalRevenue || 0);
        const totalExpenses = Number(expenseResult[0].totalExpenses || 0);
        const netProfit = totalRevenue - totalExpenses;

        res.json({
            success: true,

            // Keep a report record so the Reports page
            // does not show "0 records"
            report: [
                {
                    totalRevenue,
                    totalExpenses,
                    netProfit
                }
            ],

            summary: {
                totalRevenue,
                totalExpenses,
                netProfit,
                revenueCount: Number(
                    revenueResult[0].revenueCount || 0
                ),
                expenseCount: Number(
                    expenseResult[0].expenseCount || 0
                )
            }
        });

    } catch (error) {
        console.error("Profit report error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while generating profit report"
        });
    }
};
// ======================================================
// 9. MAINTENANCE REPORT
// GET /api/reports/maintenance
// ======================================================
const getMaintenanceReport = async (req, res) => {
try {

    const [rows] = await pool.query(`
        SELECT
            m.MaintenanceRequestID,
            m.PropertyID,
            p.PropertyName,
            m.ReportedBy,
            m.AssignedStaffID,
            ms.FullName AS AssignedStaffName,
            m.Description,
            m.Priority,
            m.Status,
            m.EstimatedCost,
            m.ActualCost,
            m.CostApprovalStatus,
            m.ResponsibleParty,
            m.RequestDate,
            m.CompletionDate
        FROM maintenance_requests m
        LEFT JOIN properties p
            ON m.PropertyID = p.PropertyID
        LEFT JOIN maintenance_staff ms
            ON m.AssignedStaffID = ms.StaffID
        ORDER BY m.RequestDate DESC
    `);

    const [summaryRows] = await pool.query(`
        SELECT
            COUNT(*) AS TotalRequests,

            SUM(
                CASE
                    WHEN Status = 'Pending' THEN 1
                    ELSE 0
                END
            ) AS PendingRequests,

            SUM(
                CASE
                    WHEN Status = 'In Progress' THEN 1
                    ELSE 0
                END
            ) AS InProgressRequests,

            SUM(
                CASE
                    WHEN Status = 'Completed' THEN 1
                    ELSE 0
                END
            ) AS CompletedRequests,

            SUM(
                CASE
                    WHEN Status = 'Rejected' THEN 1
                    ELSE 0
                END
            ) AS RejectedRequests,

            COALESCE(SUM(ActualCost), 0) AS TotalActualCost

        FROM maintenance_requests
    `);

    const summary = summaryRows[0];

    res.json({
        success: true,

        summary: {
            totalRequests: Number(summary.TotalRequests || 0),
            pendingRequests: Number(summary.PendingRequests || 0),
            inProgressRequests: Number(summary.InProgressRequests || 0),
            completedRequests: Number(summary.CompletedRequests || 0),
            rejectedRequests: Number(summary.RejectedRequests || 0),
            totalActualCost: Number(
                summary.TotalActualCost || 0
            ).toFixed(2)
        },

        count: rows.length,
        report: rows
    });

} catch (error) {
    console.error("Maintenance report error:", error);

    res.status(500).json({
        success: false,
        message: "Server error while generating maintenance report"
    });
}


};



// ======================================================
// 10. APPOINTMENT REPORT
// GET /api/reports/appointments
// ======================================================
const getAppointmentReport = async (req, res) => {
    try {

        const [rows] = await pool.query(`
            SELECT
                a.AppointmentID,
                a.CustomerID,
                c.FullName AS CustomerName,
                a.PropertyID,
                p.PropertyName,
                a.HandledBy,
                u.FullName AS HandledByName,
                a.AppointmentDate,
                a.AppointmentTime,
                a.Status
            FROM appointments a
            LEFT JOIN customers c
                ON a.CustomerID = c.CustomerID
            LEFT JOIN properties p
                ON a.PropertyID = p.PropertyID
            LEFT JOIN users u
                ON a.HandledBy = u.UserID
            ORDER BY a.AppointmentDate DESC
        `);

        res.json({
            success: true,
            count: rows.length,
            report: rows
        });

    } catch (error) {
        console.error("Appointment report error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while generating appointment report"
        });
    }
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    getPropertyReport,
    getSalesReport,
    getRentalReport,
    getCustomerReport,
    getOwnerReport,
    getRevenueReport,
    getExpenseReport,
    getProfitReport,
    getMaintenanceReport,
    getAppointmentReport
};