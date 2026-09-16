const db = require("../config/db");

// =====================================================
// 1. GET ALL APPOINTMENTS
// =====================================================
exports.getAllAppointments = async (req, res) => {
    try {
        let query = `
            SELECT
                a.AppointmentID,
                a.CustomerID,
                c.FullName AS CustomerName,
                a.HandledBy,
                u.FullName AS HandledByName,
                a.PropertyID,
                p.PropertyName,
                a.AppointmentDate,
                a.AppointmentTime,
                a.Status
            FROM appointments a
            JOIN customers c
                ON a.CustomerID = c.CustomerID
            JOIN users u
                ON a.HandledBy = u.UserID
            JOIN properties p
                ON a.PropertyID = p.PropertyID
        `;

        const params = [];

        // Sales Agent sees only appointments handled by them
        if (req.user.role === "Sales Agent") {
            query += ` WHERE a.HandledBy = ?`;
            params.push(req.user.userId);
        }

        query += ` ORDER BY a.AppointmentDate ASC, a.AppointmentTime ASC`;

        const [appointments] = await db.query(query, params);

        res.status(200).json({
            success: true,
            count: appointments.length,
            appointments
        });

    } catch (error) {
        console.error("Get all appointments error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve appointments",
            error: error.message
        });
    }
};
// =====================================================
// 1B. GET MY APPOINTMENTS - CUSTOMER
// =====================================================
exports.getMyAppointments = async (req, res) => {
    console.log(">>> getMyAppointments CONTROLLER REACHED");
    console.log(">>> User:", req.user);

    try {
        // ==============================================
        // FIND CUSTOMER ID FOR LOGGED-IN USER
        // ==============================================
        const [customers] = await db.query(
            `
            SELECT CustomerID
            FROM customers
            WHERE UserID = ?
            LIMIT 1
            `,
            [req.user.userId]
        );

        console.log(">>> Customer lookup:", customers);

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found"
            });
        }

        const customerId = customers[0].CustomerID;

        // ==============================================
        // GET CUSTOMER APPOINTMENTS
        // ==============================================
        const [appointments] = await db.query(
            `
            SELECT
                a.AppointmentID,
                a.CustomerID,
                c.FullName AS CustomerName,
                a.HandledBy,
                u.FullName AS HandledByName,
                a.PropertyID,
                p.PropertyName,
                a.AppointmentDate,
                a.AppointmentTime,
                a.Status
            FROM appointments a

            INNER JOIN customers c
                ON a.CustomerID = c.CustomerID

            LEFT JOIN users u
                ON a.HandledBy = u.UserID

            INNER JOIN properties p
                ON a.PropertyID = p.PropertyID

            WHERE a.CustomerID = ?

            ORDER BY
                a.AppointmentDate ASC,
                a.AppointmentTime ASC
            `,
            [customerId]
        );

        console.log(">>> Customer appointments:", appointments);

        return res.status(200).json({
            success: true,
            count: appointments.length,
            appointments
        });

    } catch (error) {
        console.error("Get my appointments error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your appointments",
            error: error.message
        });
    }
};

// =====================================================
// 2. GET APPOINTMENT BY ID
// =====================================================
exports.getAppointmentById = async (req, res) => {
    const { id } = req.params;

    try {
        // Get appointment
        const [appointments] = await db.query(`
            SELECT
                a.AppointmentID,
                a.CustomerID,
                c.FullName AS CustomerName,
                a.HandledBy,
                u.FullName AS HandledByName,
                a.PropertyID,
                p.PropertyName,
                a.AppointmentDate,
                a.AppointmentTime,
                a.Status
            FROM appointments a
            JOIN customers c
                ON a.CustomerID = c.CustomerID
            JOIN users u
                ON a.HandledBy = u.UserID
            JOIN properties p
                ON a.PropertyID = p.PropertyID
            WHERE a.AppointmentID = ?
        `, [id]);

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        const appointment = appointments[0];

        // =====================================================
        // CUSTOMER OWNERSHIP CHECK
        // =====================================================

        if (req.user.role === "Customer") {

            // Find CustomerID belonging to logged-in user
            const [customers] = await db.query(`
                SELECT CustomerID
                FROM customers
                WHERE UserID = ?
            `, [req.user.userId]);

            if (customers.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "Customer profile not found"
                });
            }

            const customerId = customers[0].CustomerID;

            // Customer can only access their own appointments
            if (appointment.CustomerID !== customerId) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });
            }
        }

        // Administrator, Owner and Sales Agent can access it
        return res.status(200).json({
            success: true,
            appointment
        });

    } catch (error) {
        console.error("Get appointment by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve appointment",
            error: error.message
        });
    }
};


// =====================================================
// 3. REQUEST APPOINTMENT
// =====================================================
// =====================================================
// 3. REQUEST APPOINTMENT
// =====================================================
exports.createAppointment = async (req, res) => {

    const {
        CustomerID: requestedCustomerID,
        PropertyID,
        AppointmentDate,
        AppointmentTime
    } = req.body;

    const HandledBy = req.user.userId;

    if (
        !PropertyID ||
        !AppointmentDate ||
        !AppointmentTime
    ) {
        return res.status(400).json({
            success: false,
            message: "PropertyID, AppointmentDate and AppointmentTime are required"
        });
    }

    try {

        // =====================================================
        // DETERMINE CUSTOMER
        // =====================================================

        let CustomerID;

        if (req.user.role === "Customer") {

            // CustomerID MUST come from logged-in account
            const [customers] = await db.query(
                `
                SELECT CustomerID
                FROM customers
                WHERE UserID = ?
                LIMIT 1
                `,
                [req.user.userId]
            );

            if (customers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Customer profile not found"
                });
            }

            CustomerID = customers[0].CustomerID;

        } else {

            // Administrator / Owner / Sales Agent
            // may create an appointment for a selected customer
            if (!requestedCustomerID) {
                return res.status(400).json({
                    success: false,
                    message: "CustomerID is required"
                });
            }

            CustomerID = requestedCustomerID;
        }


        // =====================================================
        // CHECK CUSTOMER
        // =====================================================

        const [customers] = await db.query(
            `
            SELECT CustomerID, FullName
            FROM customers
            WHERE CustomerID = ?
            LIMIT 1
            `,
            [CustomerID]
        );

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }


        // =====================================================
        // CHECK PROPERTY
        // =====================================================

        const [properties] = await db.query(
            `
            SELECT
                PropertyID,
                PropertyName,
                Status
            FROM properties
            WHERE PropertyID = ?
            LIMIT 1
            `,
            [PropertyID]
        );

        if (properties.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }


        // =====================================================
        // PREVENT APPOINTMENT FOR SOLD PROPERTY
        // =====================================================

        if (properties[0].Status === "Sold") {
            return res.status(400).json({
                success: false,
                message: "Cannot schedule an appointment for a sold property"
            });
        }


        // =====================================================
        // INSERT APPOINTMENT
        // =====================================================

        const [result] = await db.query(
            `
            INSERT INTO appointments
            (
                CustomerID,
                HandledBy,
                PropertyID,
                AppointmentDate,
                AppointmentTime,
                Status
            )
            VALUES (?, ?, ?, ?, ?, 'Pending')
            `,
            [
                CustomerID,
                HandledBy,
                PropertyID,
                AppointmentDate,
                AppointmentTime
            ]
        );


        // =====================================================
        // ACTIVITY LOG
        // =====================================================

        await db.query(
            `
            INSERT INTO activity_logs
            (
                UserID,
                Activity,
                Module,
                IPAddress
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                HandledBy,
                `Appointment #${result.insertId} requested for property ${PropertyID}`,
                "Appointments",
                req.ip
            ]
        );


        return res.status(201).json({
            success: true,
            message: "Appointment requested successfully",
            appointmentId: result.insertId,
            customerId: CustomerID,
            status: "Pending"
        });

    } catch (error) {

        console.error("Create appointment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to request appointment",
            error: error.message
        });
    }
};


// =====================================================
// 4. APPROVE APPOINTMENT
// =====================================================
exports.approveAppointment = async (req, res) => {

    const { id } = req.params;

    const HandledBy = req.user.userId;

    try {

let appointments;

if (req.user.role === "Customer") {

    const [customers] = await db.query(
        `
        SELECT CustomerID
        FROM customers
        WHERE UserID = ?
        LIMIT 1
        `,
        [req.user.userId]
    );

    if (customers.length === 0) {
        return res.status(403).json({
            success: false,
            message: "Customer profile not found"
        });
    }

    const customerId = customers[0].CustomerID;

    [appointments] = await db.query(
        `
        SELECT AppointmentID, CustomerID, Status
        FROM appointments
        WHERE AppointmentID = ?
          AND CustomerID = ?
        `,
        [id, customerId]
    );

} else {

    [appointments] = await db.query(
        `
        SELECT AppointmentID, CustomerID, Status
        FROM appointments
        WHERE AppointmentID = ?
        `,
        [id]
    );
}
        if (appointments.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }


        if (appointments[0].Status !== "Pending") {

            return res.status(400).json({
                success: false,
                message: `Appointment cannot be approved because its current status is ${appointments[0].Status}`
            });
        }


        await db.query(`
            UPDATE appointments
            SET Status = 'Approved',
                HandledBy = ?
            WHERE AppointmentID = ?
        `, [
            HandledBy,
            id
        ]);


        await db.query(`
            INSERT INTO activity_logs
            (
                UserID,
                Activity,
                Module,
                IPAddress
            )
            VALUES (?, ?, ?, ?)
        `, [
            HandledBy,
            `Appointment #${id} approved`,
            "Appointments",
            req.ip
        ]);


        res.status(200).json({
            success: true,
            message: "Appointment approved successfully",
            appointmentId: id,
            status: "Approved"
        });

    } catch (error) {

        console.error("Approve appointment error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to approve appointment",
            error: error.message
        });
    }
};


// =====================================================
// 5. REJECT APPOINTMENT
// =====================================================
exports.rejectAppointment = async (req, res) => {

    const { id } = req.params;

    const HandledBy = req.user.userId;

    try {

        const [appointments] = await db.query(`
            SELECT AppointmentID, Status
            FROM appointments
            WHERE AppointmentID = ?
        `, [id]);

        if (appointments.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }


        if (
            appointments[0].Status === "Completed" ||
            appointments[0].Status === "Rejected"
        ) {

            return res.status(400).json({
                success: false,
                message: `Appointment cannot be rejected because its current status is ${appointments[0].Status}`
            });
        }


        await db.query(`
            UPDATE appointments
            SET Status = 'Rejected',
                HandledBy = ?
            WHERE AppointmentID = ?
        `, [
            HandledBy,
            id
        ]);


        await db.query(`
            INSERT INTO activity_logs
            (
                UserID,
                Activity,
                Module,
                IPAddress
            )
            VALUES (?, ?, ?, ?)
        `, [
            HandledBy,
            `Appointment #${id} rejected`,
            "Appointments",
            req.ip
        ]);


        res.status(200).json({
            success: true,
            message: "Appointment rejected successfully",
            appointmentId: id,
            status: "Rejected"
        });

    } catch (error) {

        console.error("Reject appointment error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to reject appointment",
            error: error.message
        });
    }
};


// =====================================================
// 6. RESCHEDULE APPOINTMENT
// =====================================================
exports.rescheduleAppointment = async (req, res) => {

    const { id } = req.params;

    const {
        AppointmentDate,
        AppointmentTime
    } = req.body;

    const HandledBy = req.user.userId;

    if (!AppointmentDate || !AppointmentTime) {

        return res.status(400).json({
            success: false,
            message: "AppointmentDate and AppointmentTime are required"
        });
    }

    try {

        const [appointments] = await db.query(`
            SELECT AppointmentID, Status
            FROM appointments
            WHERE AppointmentID = ?
        `, [id]);

        if (appointments.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }


        if (appointments[0].Status === "Completed") {

            return res.status(400).json({
                success: false,
                message: "Completed appointment cannot be rescheduled"
            });
        }


        if (appointments[0].Status === "Rejected") {

            return res.status(400).json({
                success: false,
                message: "Rejected appointment cannot be rescheduled"
            });
        }


        await db.query(`
            UPDATE appointments
            SET
                AppointmentDate = ?,
                AppointmentTime = ?,
                Status = 'Pending',
                HandledBy = ?
            WHERE AppointmentID = ?
        `, [
            AppointmentDate,
            AppointmentTime,
            HandledBy,
            id
        ]);


        await db.query(`
            INSERT INTO activity_logs
            (
                UserID,
                Activity,
                Module,
                IPAddress
            )
            VALUES (?, ?, ?, ?)
        `, [
            HandledBy,
            `Appointment #${id} rescheduled`,
            "Appointments",
            req.ip
        ]);


        res.status(200).json({
            success: true,
            message: "Appointment rescheduled successfully",
            appointmentId: id,
            appointmentDate: AppointmentDate,
            appointmentTime: AppointmentTime,
            status: "Pending"
        });

    } catch (error) {

        console.error("Reschedule appointment error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to reschedule appointment",
            error: error.message
        });
    }
};


// =====================================================
// 7. COMPLETE APPOINTMENT
// =====================================================
exports.completeAppointment = async (req, res) => {

    const { id } = req.params;

    const HandledBy = req.user.userId;

    try {

        const [appointments] = await db.query(`
            SELECT AppointmentID, Status
            FROM appointments
            WHERE AppointmentID = ?
        `, [id]);

        if (appointments.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }


        if (appointments[0].Status !== "Approved") {

            return res.status(400).json({
                success: false,
                message: "Only approved appointments can be completed"
            });
        }


        await db.query(`
            UPDATE appointments
            SET Status = 'Completed',
                HandledBy = ?
            WHERE AppointmentID = ?
        `, [
            HandledBy,
            id
        ]);


        await db.query(`
            INSERT INTO activity_logs
            (
                UserID,
                Activity,
                Module,
                IPAddress
            )
            VALUES (?, ?, ?, ?)
        `, [
            HandledBy,
            `Appointment #${id} completed`,
            "Appointments",
            req.ip
        ]);


        res.status(200).json({
            success: true,
            message: "Appointment completed successfully",
            appointmentId: id,
            status: "Completed"
        });

    } catch (error) {

        console.error("Complete appointment error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to complete appointment",
            error: error.message
        });
    }
};