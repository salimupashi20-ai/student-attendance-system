const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../config/db");
const { getMoodleActiveEnrolledUsers } = require("../services/moodleService");

const TIMEOUT_MS = 20000;

async function postMoodleForm(url, fields) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json"
        },
        body: new URLSearchParams(fields),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "error"
    });

    const data = await response.json().catch(() => null);
    if (!data || typeof data !== "object") {
        throw new Error("Moodle returned a non-JSON response.");
    }
    return { response, data };
}

function safeName(value, fallback) {
    return typeof value === "string" && value.trim()
        ? value.trim().slice(0, 100)
        : fallback;
}

// Only create a student when Moodle itself confirms the user has
// an ACTIVE student enrolment in a Moodle-linked SAS course.
// The attendance middleware will independently recheck Moodle on scan.
async function activeStudentCourses(moodleUserId) {
    const [courses] = await db.promise().query(`
        SELECT id, moodle_course_id
        FROM courses
        WHERE moodle_course_id IS NOT NULL
    `);

    const result = [];
    for (const course of courses) {
        const enrolled = await getMoodleActiveEnrolledUsers(course.moodle_course_id);
        const moodleStudent = enrolled.find(
            user => Number(user.id) === moodleUserId &&
                Array.isArray(user.roles) &&
                user.roles.some(role => role.shortname === "student")
        );
        if (moodleStudent) {
            result.push({ localCourseId: course.id, moodleStudent });
        }
    }
    return result;
}

const moodleLogin = async (req, res) => {
    const username = req.body?.username;
    const password = req.body?.password;

    if (typeof username !== "string" ||
        typeof password !== "string" ||
        !username.trim() || username.length > 255 ||
        !password.length || password.length > 1024) {
        return res.status(400).json({ message: "Enter your Moodle username and password." });
    }

    const baseUrl = process.env.MOODLE_BASE_URL;
    const service = process.env.MOODLE_LOGIN_SERVICE;
    if (!baseUrl || !service || !/^[a-zA-Z0-9_]+$/.test(service)) {
        return res.status(503).json({ message: "Moodle login is not configured yet." });
    }

    let moodleBase;
    try {
        const url = new URL(baseUrl);
        if (!["http:", "https:"].includes(url.protocol) ||
            (process.env.NODE_ENV === "production" && url.protocol !== "https:") ||
            url.username || url.password || url.search || url.hash) {
            throw new Error("Invalid Moodle URL configuration.");
        }
        moodleBase = url.toString().replace(/\/+$/, "");
    } catch (error) {
        console.error("Moodle URL config error:", error.message);
        return res.status(503).json({ message: "Moodle login is not configured correctly." });
    }

    try {
        // Authenticate with Moodle; never store the submitted password or token.
        const login = await postMoodleForm(`${moodleBase}/login/token.php`, {
            username: username.trim(), password, service
        });

        if (login.data.errorcode === "invalidlogin") {
            return res.status(401).json({ message: "Incorrect Moodle username or password." });
        }
        if (!login.response.ok || typeof login.data.token !== "string") {
            console.error("Moodle token request failed:", login.data.errorcode || login.response.status);
            return res.status(503).json({ message: "Moodle login service is unavailable or access is not enabled." });
        }

        const info = await postMoodleForm(`${moodleBase}/webservice/rest/server.php`, {
            wstoken: login.data.token,
            wsfunction: "core_webservice_get_site_info",
            moodlewsrestformat: "json"
        });
        const moodleUserId = Number(info.data.userid);
        if (!info.response.ok || info.data.exception || info.data.errorcode ||
            !Number.isSafeInteger(moodleUserId) || moodleUserId <= 0) {
            console.error("Moodle identity lookup failed:", info.data.errorcode || info.response.status);
            return res.status(503).json({ message: "Unable to verify your Moodle user identity." });
        }

        const [accounts] = await db.promise().execute(`
            SELECT id, full_name, student_number, staff_id, role
            FROM users
            WHERE moodle_user_id = ?
            LIMIT 1
        `, [moodleUserId]);

        let user = accounts[0];
        // Existing, explicitly linked lecturer/admin accounts keep their role.
        // NEVER auto-provision a privileged account from a Moodle role.
        if (!user || user.role === "student") {
            const eligibleCourses = await activeStudentCourses(moodleUserId);
            if (!eligibleCourses.length) {
                return res.status(403).json({
                    message: "Your Moodle account has no active student enrolment in a course connected to SAS."
                });
            }

            const connection = await db.promise().getConnection();
            try {
                await connection.beginTransaction();
                if (!user) {
                    // Avoid linking by name/username, which could take over an
                    // existing SAS account. Moodle user ID is the identity key.
                    const enrolledProfile = eligibleCourses[0].moodleStudent;
                    const fullName = safeName(
                        enrolledProfile.fullname || info.data.fullname,
                        safeName(info.data.username, `Moodle Student ${moodleUserId}`)
                    );

                    // If Moodle has a genuine student ID, use it only if unused.
                    // Otherwise a CLEARLY SYNTHETIC ID is used for test accounts.
                    const idnumber = typeof enrolledProfile.idnumber === "string"
                        ? enrolledProfile.idnumber.trim() : "";
                    const [idMatches] = idnumber && /^[A-Za-z0-9._-]{1,40}$/.test(idnumber)
                        ? await connection.execute(
                            "SELECT id FROM users WHERE student_number = ? LIMIT 1", [idnumber]
                          )
                        : [[]];
                    const studentNumber = idnumber && /^[A-Za-z0-9._-]{1,40}$/.test(idnumber) && !idMatches.length
                        ? idnumber : `MOODLE-${moodleUserId}`;

                    // A random, unknown SAS password satisfies the old schema
                    // but cannot be used as the user's Moodle credential.
                    const randomPasswordHash = await bcrypt.hash(
                        crypto.randomBytes(32).toString("hex"), 12
                    );
                    const [created] = await connection.execute(`
                        INSERT INTO users
                            (full_name, student_number, staff_id, password, role, moodle_user_id)
                        VALUES (?, ?, NULL, ?, 'student', ?)
                    `, [fullName, studentNumber, randomPasswordHash, moodleUserId]);
                    user = {
                        id: created.insertId,
                        full_name: fullName,
                        student_number: studentNumber,
                        staff_id: null,
                        role: "student"
                    };
                }

                for (const { localCourseId } of eligibleCourses) {
                    // Never rewrite enrolled_at: it is needed to maintain
                    // historical attendance eligibility.
                    await connection.execute(`
                        INSERT INTO course_enrollments (student_id, course_id)
                        SELECT ?, ?
                        WHERE NOT EXISTS (
                            SELECT 1 FROM course_enrollments
                            WHERE student_id = ? AND course_id = ?
                        )
                    `, [user.id, localCourseId, user.id, localCourseId]);
                }
                await connection.commit();
            } catch (error) {
                await connection.rollback();
                if (error.code === "ER_DUP_ENTRY") {
                    console.error("Moodle account link conflict (requires admin review):", moodleUserId);
                    return res.status(409).json({
                        message: "An SAS identity conflict needs administrator review. No accounts were merged."
                    });
                }
                throw error;
            } finally {
                connection.release();
            }
        }

        if (!["student", "lecturer", "admin"].includes(user.role)) {
            return res.status(403).json({ message: "This account is not authorized to access SAS." });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, auth_provider: "moodle" },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );
        return res.status(200).json({ message: "Moodle login successful", token, user });
    } catch (error) {
        console.error("Moodle login request failed:", error.message);
        const unavailable = error.name === "TimeoutError" ||
            error.name === "AbortError" || error instanceof TypeError;
        return res.status(unavailable ? 503 : 500).json({
            message: unavailable
                ? "Moodle did not respond. Please try again."
                : "Unable to complete Moodle login."
        });
    }
};

module.exports = { moodleLogin };
