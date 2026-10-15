const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Tokens created by the previous SAS-password endpoint are not accepted.
        if (decoded.auth_provider !== "moodle") {
            return res.status(401).json({
                message: "Please sign in again using your Moodle credentials."
            });
        }
        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

module.exports = protect;
