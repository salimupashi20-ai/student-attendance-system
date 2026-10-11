
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    getMoodleCourses,
    getMoodleEnrolledUsers
} = require("../services/moodleService");

// GET ALL MOODLE COURSES
router.get(
    "/courses",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const courses = await getMoodleCourses();

            res.status(200).json({
                message: "Moodle courses retrieved successfully",
                courses: courses.map(course => ({
                    id: course.id,
                    course_code: course.shortname,
                    course_name: course.fullname
                }))
            });
        } catch (error) {
            console.error("Moodle course error:", error.message);

            res.status(502).json({
                message: "Unable to retrieve courses from Moodle."
            });
        }
    }
);

// GET USERS ENROLLED IN A MOODLE COURSE
router.get(
    "/courses/:courseId/users",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const users = await getMoodleEnrolledUsers(
                req.params.courseId
            );

            res.status(200).json({
                message: "Moodle enrolled users retrieved successfully",
                users: users.map(user => ({
                    moodle_id: user.id,
                    full_name: user.fullname,
                    roles: (user.roles || []).map(
                        role => role.shortname
                    )
                }))
            });
        } catch (error) {
            console.error("Moodle enrolment error:", error.message);

            res.status(502).json({
                message: "Unable to retrieve Moodle enrolments."
            });
        }
    }
);

module.exports = router;
