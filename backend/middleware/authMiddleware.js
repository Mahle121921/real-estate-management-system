const jwt = require("jsonwebtoken");


// =====================================================
// JWT AUTHENTICATION
// =====================================================
const authenticateToken = (req, res, next) => {

    console.log("Authorization header:", req.headers.authorization);

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Access token required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        console.log("Authenticated user:", req.user);

        next();

    } catch (error) {
        console.error("JWT verification error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};


// =====================================================
// ROLE AUTHORIZATION
// =====================================================
const authorizeRole = (...allowedRoles) => {

    return (req, res, next) => {

        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: "Access denied. User role not found."
            });
        }

        console.log("User role:", req.user.role);
        console.log("Allowed roles:", allowedRoles);

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You do not have permission to access this resource."
            });
        }

        next();
    };
};


module.exports = {
    authenticateToken,
    authorizeRole
};