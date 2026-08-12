const express = require("express");
const router = express.Router();

const {
    createCourse,
    getMyCourses
} = require("../controllers/courseController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.post(
    "/",
    protect,
    authorizeRoles("lecturer"),
    createCourse
);

router.get(
    "/",
    protect,
    authorizeRoles("lecturer"),
    getMyCourses
);

module.exports = router;
