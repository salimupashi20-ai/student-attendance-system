
const db = require("../config/db");

const {
    getMoodleActiveEnrolledUsers
} = require("../services/moodleService");

const verifyMoodleEnrollment = async (req, res, next) => {
    const { session_id, token } = req.body;

    // Let the existing controller handle missing QR details.
    if (!session_id || !token) {
        return next();
    }

    try {
        // Find the local user's Moodle account and
        // the Moodle course linked to this lecture session.
        const [rows] = await db.promise().query(
            `
            SELECT
                c.moodle_course_id,
                u.moodle_user_id
            FROM lecture_sessions ls
            JOIN courses c
                ON c.id = ls.course_id
            JOIN users u
                ON u.id = ?
            WHERE ls.id = ?
              AND ls.qr_token = ?
            LIMIT 1
            `,
            [req.user.id, session_id, token]
        );

        // Let the original controller reject invalid QR codes.
        if (rows.length === 0) {
            return next();
        }

        const {
            moodle_course_id,
            moodle_user_id
        } = rows[0];

        // Temporary compatibility for courses that
        // haven't been connected to Moodle yet.
        if (moodle_course_id == null) {
            return next();
        }

        // A Moodle-linked course requires a linked student.
        if (moodle_user_id == null) {
            return res.status(403).json({
                message:
                    "Your attendance account is not linked to Moodle."
            });
        }

        // Request active enrolments directly from Moodle.
        const enrolledUsers =
            await getMoodleActiveEnrolledUsers(
                moodle_course_id
            );

        // Match the authenticated student's linked Moodle ID.
        const moodleStudent = enrolledUsers.find(
            user => Number(user.id) === Number(moodle_user_id)
        );

        const hasStudentRole =
            moodleStudent?.roles?.some(
                role => role.shortname === "student"
            ) || false;

        if (!moodleStudent || !hasStudentRole) {
            return res.status(403).json({
                message:
                    "You do not have an active student enrolment in this Moodle course."
            });
        }

        // Moodle verification successful.
        // Continue to our existing QR and GPS checks.
        return next();

    } catch (error) {
        console.error(
            "Moodle enrolment verification failed:",
            error.message
        );

        // Never approve a Moodle-linked attendance scan
        // just because Moodle is unavailable.
        return res.status(503).json({
            message:
                "Unable to verify Moodle enrolment. Please try again."
        });
    }
};

module.exports = verifyMoodleEnrollment;
