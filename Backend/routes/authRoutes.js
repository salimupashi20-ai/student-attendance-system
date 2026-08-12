const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", protect, (req, res) => {
    res.status(200).json({
        message: "Protected route accessed successfully",
        user: req.user
    });
});

router.get(
    "/lecturer-test",
    protect,
    authorizeRoles("lecturer"),
    (req, res) => {
        res.status(200).json({
            message: "Welcome lecturer!"
        });
    }
);

module.exports = router;