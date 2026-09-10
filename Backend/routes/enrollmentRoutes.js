const express = require("express");

const router = express.Router();

const {
    enrollStudent,
    getCourseStudents,
    getMyCourses
} = require("../controllers/enrollmentController");

const protect =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");


// =====================================
// STUDENT
// =====================================

router.get(
    "/my-courses",
    protect,
    authorizeRoles("student"),
    getMyCourses
);


// =====================================
// LECTURER
// =====================================

router.post(
    "/",
    protect,
    authorizeRoles("lecturer"),
    enrollStudent
);

router.get(
    "/course/:courseId",
    protect,
    authorizeRoles("lecturer"),
    getCourseStudents
);


module.exports = router;