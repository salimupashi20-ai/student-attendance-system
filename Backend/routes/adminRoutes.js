const express = require("express");

const router = express.Router();

const {
    getAllUsers,
    createUser,

    getLecturers,

    getAllCourses,
    createCourseAdmin,
    updateCourseAdmin,

    getAllEnrollments,
    createEnrollmentAdmin,
    deleteEnrollmentAdmin,

    getAllAttendanceSessions,
    getAdminSessionAttendance,
    getAdminSessionSummary,
    getAdminAttendanceOverview

} = require("../controllers/adminController");

const protect =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");


// =====================================
// USERS
// =====================================

router.get(
    "/users",
    protect,
    authorizeRoles("admin"),
    getAllUsers
);

router.post(
    "/users",
    protect,
    authorizeRoles("admin"),
    createUser
);


// =====================================
// LECTURERS
// =====================================

router.get(
    "/lecturers",
    protect,
    authorizeRoles("admin"),
    getLecturers
);


// =====================================
// COURSES
// =====================================

router.get(
    "/courses",
    protect,
    authorizeRoles("admin"),
    getAllCourses
);

router.post(
    "/courses",
    protect,
    authorizeRoles("admin"),
    createCourseAdmin
);

router.put(
    "/courses/:courseId",
    protect,
    authorizeRoles("admin"),
    updateCourseAdmin
);


// =====================================
// ENROLLMENTS
// =====================================

router.get(
    "/enrollments",
    protect,
    authorizeRoles("admin"),
    getAllEnrollments
);

router.post(
    "/enrollments",
    protect,
    authorizeRoles("admin"),
    createEnrollmentAdmin
);

router.delete(
    "/enrollments/:enrollmentId",
    protect,
    authorizeRoles("admin"),
    deleteEnrollmentAdmin
);


// =====================================
// ATTENDANCE REPORTING
// =====================================

// System-wide overview
router.get(
    "/attendance/overview",
    protect,
    authorizeRoles("admin"),
    getAdminAttendanceOverview
);

// All lecture sessions
router.get(
    "/attendance/sessions",
    protect,
    authorizeRoles("admin"),
    getAllAttendanceSessions
);

// Individual session attendance records
router.get(
    "/attendance/sessions/:sessionId",
    protect,
    authorizeRoles("admin"),
    getAdminSessionAttendance
);

// Individual session statistics
router.get(
    "/attendance/sessions/:sessionId/summary",
    protect,
    authorizeRoles("admin"),
    getAdminSessionSummary
);


module.exports = router;