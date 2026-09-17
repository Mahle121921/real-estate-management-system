const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");

const {
    authenticateToken,
    authorizeRole
} = require("./middleware/authMiddleware");

// ===============================
// ROUTES
// ===============================

const authRoutes = require("./routes/authRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const buildingRoutes = require("./routes/buildingRoutes");
const floorRoutes = require("./routes/floorRoutes");
const roomRoutes = require("./routes/roomRoutes");
const roomImageRoutes = require("./routes/roomImageRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const salesRoutes = require("./routes/salesRoutes");
const rentalRoutes = require("./routes/rentalRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const maintenanceStaffRoutes = require("./routes/maintenanceStaffRoutes");
const revenueRoutes = require("./routes/revenueRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const reportRoutes = require("./routes/reportRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const activityLogPermissionRoutes =require("./routes/activityLogPermissionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175"
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path = require("path");

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);
// ===============================
// REQUEST LOGGER
// ===============================

app.use((req, res, next) => {
    console.log("=================================");
    console.log(`${req.method} ${req.originalUrl}`);
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Request body:", req.body);
    console.log("=================================");

    next();
});

// ===============================
// API ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/owners", ownerRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/buildings", buildingRoutes);
app.use("/api/floors", floorRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/room-images", roomImageRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/appointments", appointmentRoutes);

// IMPORTANT:
// Maintenance frontend uses /api/maintenance
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/maintenance-requests",maintenanceRoutes);
app.use("/api/maintenance-staff", maintenanceStaffRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/activity-log-permissions",activityLogPermissionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
console.log(">>> RESERVATION ROUTES LOADED");
console.log(">>> PAYMENT ROUTES LOADED");
console.log(">>> APPOINTMENT ROUTES LOADED");
// ===============================
// DATABASE TEST
// ===============================

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS connected");

        res.json({
            success: true,
            message: "Database connection successful",
            database: process.env.DB_NAME,
            result: rows
        });

    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

// ===============================
// PROTECTED TEST ROUTE
// ===============================

app.get("/protected", authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: "You accessed a protected route",
        user: req.user
    });
});

// ===============================
// OWNER-ONLY TEST ROUTE
// ===============================

app.get(
    "/owner-only",
    authenticateToken,
    authorizeRole("Owner"),
    (req, res) => {
        res.json({
            success: true,
            message: "Owner access granted",
            user: req.user
        });
    }
);

// ===============================
// JSON ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
    if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        "body" in err
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body"
        });
    }

    console.error("Server error:", err);

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

server.on("error", (error) => {
    console.error("******** SERVER ERROR ********");
    console.error(error);
});

server.on("close", () => {
    console.error("******** SERVER CLOSED ********");
});

process.on("exit", (code) => {
    console.error("******** PROCESS EXIT ********");
    console.error("Exit code:", code);
});

process.on("uncaughtException", (error) => {
    console.error("******** UNCAUGHT EXCEPTION ********");
    console.error(error);
});

process.on("unhandledRejection", (reason) => {
    console.error("******** UNHANDLED REJECTION ********");
    console.error(reason);
});
