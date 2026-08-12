const express = require("express");
const router = express.Router();

const {
    scanQRCode
} = require("../controllers/attendanceController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.post(
    "/scan",
    protect,
    authorizeRoles("student"),
    scanQRCode
);

module.exports = router;