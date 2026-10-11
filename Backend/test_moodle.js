
require("dotenv").config();

const {
    getMoodleCourses,
    getMoodleEnrolledUsers
} = require("./services/moodleService");

async function test() {
    const courses = await getMoodleCourses();

    console.log("\nMOODLE COURSES:");
    console.table(
        courses.map(course => ({
            id: course.id,
            code: course.shortname,
            name: course.fullname
        }))
    );

    const users = await getMoodleEnrolledUsers(2);

    console.log("\nCSC4035 ENROLLED USERS:");
    console.table(
        users.map(user => ({
            id: user.id,
            name: user.fullname,
            role: user.roles
                .map(role => role.shortname)
                .join(", ")
        }))
    );

    console.log("\nMoodle service test successful!");
}

test().catch(error => {
    console.error("Test failed:", error.message);
    process.exitCode = 1;
});
