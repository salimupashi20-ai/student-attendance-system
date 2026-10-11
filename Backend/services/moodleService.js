
const MOODLE_URL = process.env.MOODLE_BASE_URL;
const MOODLE_TOKEN = process.env.MOODLE_TOKEN;

async function callMoodle(functionName, parameters = {}) {
    if (!MOODLE_URL || !MOODLE_TOKEN) {
        throw new Error("Moodle configuration is missing.");
    }

    const body = new URLSearchParams({
        wstoken: MOODLE_TOKEN,
        wsfunction: functionName,
        moodlewsrestformat: "json",
        ...parameters
    });

    const response = await fetch(
        `${MOODLE_URL.replace(/\/+$/, "")}/webservice/rest/server.php`,
        {
            method: "POST",
            body,
            signal: AbortSignal.timeout(10000)
        }
    );

    if (!response.ok) {
        throw new Error(`Moodle HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.exception || data.errorcode) {
        throw new Error(data.message || "Moodle API error");
    }

    return data;
}

async function getMoodleCourses() {
    const courses = await callMoodle("core_course_get_courses");

    if (!Array.isArray(courses)) {
        throw new Error("Invalid Moodle course response.");
    }

    return courses.filter(course => course.id !== 1);
}

async function getMoodleEnrolledUsers(courseId) {
    const id = Number(courseId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Invalid Moodle course ID.");
    }

    const users = await callMoodle(
        "core_enrol_get_enrolled_users",
        { courseid: String(id) }
    );

    if (!Array.isArray(users)) {
        throw new Error("Invalid Moodle enrolment response.");
    }

    return users;
}

module.exports = {
    getMoodleCourses,
    getMoodleEnrolledUsers
};
