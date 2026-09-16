const pool = require("../config/db"); 
// ====================================================== 
// FR17 – ACTIVITY LOG // 
// Administrator:
//  - Always has access //
//  Other users: 
//  - Must be explicitly authorized by Administrator
//  
// GET /api/activity-logs 
// ====================================================== 
// 
 const getActivityLogs = async (req, res) => {
     try {
         const userId = req.user.userId;
          const role = req.user.role;
           console.log("========== ACTIVITY LOG ACCESS =========="); 
           console.log("User ID:", userId); 
           console.log("User Role:", role);
            // ================================================== 
            // ADMINISTRATOR HAS ACCESS BY DEFAULT 
            // ==================================================   
            if (role !== "Administrator") { 
                // ============================================== 
                //  CHECK EXPLICIT PERMISSION 
                //  ============================================== 
                // 
                const [permissions] = await pool.query( 
                    `
                     SELECT
                      PermissionID, 
                      CanViewActivityLogs,
                     AuthorizedBy,
                      AuthorizedAt 
                      FROM activity_log_permissions
                       WHERE UserID = ? 
                       LIMIT 1 
                    `, 
                    [userId]
                );
                     const hasPermission =
                      permissions.length > 0 && 
                      Number(permissions[0].CanViewActivityLogs) === 1; 
                    if (!hasPermission) { 
                        console.log(
                             "ACCESS DENIED - UserID:",
                              userId 
                            );
                         return res.status(403).json({
                             success: false,
                              message: 
                              "You are not authorized to view activity logs." 
                            });
                         }
                    }
                          // ================================================== 
                          // GET ACTIVITY LOGS 
                           // ================================================== 
                           const [rows] = await pool.query(`
                             SELECT
                              al.LogID, 
                              al.UserID, 
                              u.FullName AS UserName, 
                              u.Email AS UserEmail, 
                              u.Role AS UserRole, 
                              al.Activity, 
                              al.Module, 
                              al.IPAddress, 
                              al.LogDate 
                              FROM activity_logs al 
                              LEFT JOIN users u
                                ON al.UserID = u.UserID 
                              ORDER BY al.LogDate DESC 
                        `); 
                        console.log(
                             "Activity logs returned:", 
                             rows.length 
                        ); 
                        return res.status(200).json({ 
                            success: true, 
                            count: rows.length, 
                            activityLogs: rows
                        });
                    }catch (error) {
                             console.error( 
                                "========== ACTIVITY LOG ERROR =========="
                             ); 
                            console.error("Message:", error.message);
                            console.error("Code:", error.code); 
                            console.error("SQL State:", error.sqlState);
                            console.error("SQL Message:", error.sqlMessage);
                            
                            console.error( 
                                "========================================" 
                            ); 
                            return res.status(500).json({
                             success: false,
                              message:
                                "Server error while retrieving activity logs"

                            });
                         } 
                    }; 
                    module.exports = {
                             getActivityLogs
                    };