
require("dotenv").config();

const db = require("./config/db");

const {
    getMoodleActiveEnrolledUsers
} = require("./services/moodleService");

async function testMoodleMapping() {
    const localCourseId = 2;

    // Get local students and their linked Moodle IDs
    const [students] = await db.promise().query(
        `
        SELECT
            u.id AS local_id,
            u.full_name,
            u.moodle_user_id,
            c.moodle_course_id
        FROM users u
        JOIN course_enrollments ce
            ON ce.student_id = u.id
        JOIN courses c
            ON c.id = ce.course_id
        WHERE c.id = ?
          AND u.id IN (6, 9)
          AND u.role = 'student'
        `,
        [localCourseId]
    );

    if (students.length !== 2) {
        throw new Error(
            "Expected two local CSC4035 student enrolments."
        );
    }

    const moodleCourseId = Number(
        students[0].moodle_course_id
    );

    if (!Number.isSafeInteger(moodleCourseId) ||
        moodleCourseId <= 0 ||
        students.some(
            student =>
                Number(student.moodle_course_id) !== moodleCourseId ||
                !student.moodle_user_id
        )) {
        throw new Error("Moodle account/course mappings are incomplete.");
    }

    // Retrieve enrolled users directly from Moodle
    const moodleUsers = await getMoodleActiveEnrolledUsers(
    moodleCourseId
    );

    const results = students.map(student => {
        const matchedUser = moodleUsers.find(user =>
            Number(user.id) === Number(student.moodle_user_id)
        );

        const hasStudentRole = matchedUser?.roles?.some(
            role => role.shortname === "student"
        ) || false;

        return {
            local_name: student.full_name,
            local_id: student.local_id,
            moodle_id: student.moodle_user_id,
            moodle_name: matchedUser?.fullname || "NOT FOUND",
            student_role: hasStudentRole,
            mapping_verified: Boolean(matchedUser && hasStudentRole)
        };
    });

    console.log("\nMOODLE STUDENT MAPPING RESULTS:");
    console.table(results);

    if (results.some(result => !result.mapping_verified)) {
        throw new Error("One or more Moodle mappings failed verification.");
    }

    console.log("\nAll student mappings verified!");
}

testMoodleMapping()
    .catch(error => {
        console.error("Verification failed:", error.message);
        process.exitCode = 1;
    })
    .finally(() => {
        db.end();
    });
