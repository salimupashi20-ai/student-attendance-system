const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { moodleLogin } = require("../controllers/moodleAuthController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please try again later." }
});

// Moodle is the only accepted credential provider.
// Legacy /login and unauthenticated /register endpoints are removed.
router.post("/moodle-login", loginLimiter, moodleLogin);

router.get("/profile", protect, (req, res) => {
    res.status(200).json({
        message: "Protected route accessed successfully",
        user: req.user
    });
});

router.get("/lecturer-test", protect, authorizeRoles("lecturer"), (req, res) => {
    res.status(200).json({ message: "Welcome lecturer!" });
});

module.exports = router;
