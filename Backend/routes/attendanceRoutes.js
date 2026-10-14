
const express = require("express");

const router = express.Router();

const {
    scanQRCode,
    getSessionAttendance,
    getAttendanceSummary,
    getMyAttendanceHistory,
    getMyAttendanceSummary,
    getCourseAttendanceStats
} = require("../controllers/attendanceController");

const protect = require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

// New Moodle verification middleware
const verifyMoodleEnrollment =
    require("../middleware/verifyMoodleEnrollment");

// =====================================
// STUDENT ROUTES
// =====================================

router.post(
    "/scan",
    protect,
    authorizeRoles("student"),
    verifyMoodleEnrollment,
    scanQRCode
);

router.get(
    "/my-history",
    protect,
    authorizeRoles("student"),
    getMyAttendanceHistory
);

router.get(
    "/my-summary",
    protect,
    authorizeRoles("student"),
    getMyAttendanceSummary
);

// =====================================
// LECTURER ROUTES
// =====================================

router.get(
    "/session/:sessionId",
    protect,
    authorizeRoles("lecturer"),
    getSessionAttendance
);

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
