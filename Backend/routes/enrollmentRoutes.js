const express = require("express");
const router = express.Router();

const {
    enrollStudent,
    getCourseStudents
} = require("../controllers/enrollmentController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

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