const express = require("express");
const router = express.Router();

const {
    scanQRCode,
    getSessionAttendance,
    getAttendanceSummary,
    getMyAttendanceHistory,
    getCourseAttendanceStats
} = require("../controllers/attendanceController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Student scans QR
router.post(
    "/scan",
    protect,
    authorizeRoles("student"),
    scanQRCode
);
router.get(
    "/my-history",
    protect,
    authorizeRoles("student"),
    getMyAttendanceHistory
);

// Lecturer views attendance records for a session
router.get(
    "/session/:sessionId",
    protect,
    authorizeRoles("lecturer"),
    getSessionAttendance
);

// Lecturer views attendance summary for a session
router.get(
    "/session/:sessionId/summary",
    protect,
    authorizeRoles("lecturer"),
    getAttendanceSummary
);
router.get(
    "/course/:courseId/stats",
    protect,
    authorizeRoles("lecturer"),
    getCourseAttendanceStats
);

module.exports = router;