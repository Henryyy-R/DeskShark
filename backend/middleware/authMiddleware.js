const authorizeRole = (requiredRole) => {
    return (req, res, next) => {
        // Extract the role from Clerk's session claims
        const userRole = req.auth.sessionClaims.metadata?.role;

        if (userRole !== requiredRole) {
            return res.status(403).json({ message: "Access Denied: Insufficient permissions." });
        }
        next(); // User is authorized, proceed to the requested route
    };
};
module.exports = authorizeRole;