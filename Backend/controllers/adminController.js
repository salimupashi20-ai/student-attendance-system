const db = require("../config/db");
const bcrypt = require("bcryptjs");

// =====================================
// USERS
// =====================================

const getAllUsers = (req, res) => {
    const query = `
        SELECT
            id,
            full_name,
            student_number,
            staff_id,
            role,
            created_at
        FROM users
        ORDER BY created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        return res.status(200).json({
            message: "Users retrieved successfully.",
            users: results
        });
    });
};


const createUser = async (req, res) => {
    try {
        const {
            full_name,
            student_number,
            staff_id,
            password,
            role
        } = req.body;

        if (!full_name || !password || !role) {
            return res.status(400).json({
                message:
                    "Full name, password and role are required."
            });
        }

        if (
            !["student", "lecturer", "admin"].includes(role)
        ) {
            return res.status(400).json({
                message: "Invalid user role."
            });
        }

        if (role === "student" && !student_number) {
            return res.status(400).json({
                message:
                    "Student number is required for students."
            });
        }

        if (
            (role === "lecturer" || role === "admin") &&
            !staff_id
        ) {
            return res.status(400).json({
                message:
                    "Staff ID is required for staff accounts."
            });
        }

        const checkQuery = `
            SELECT *
            FROM users
            WHERE student_number = ?
            OR staff_id = ?
        `;

        db.query(
            checkQuery,
            [
                student_number || null,
                staff_id || null
            ],
            async (err, results) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (results.length > 0) {
                    return res.status(400).json({
                        message:
                            "A user with this identifier already exists."
                    });
                }

                const hashedPassword =
                    await bcrypt.hash(password, 10);

                const insertQuery = `
                    INSERT INTO users
                    (
                        full_name,
                        student_number,
                        staff_id,
                        password,
                        role
                    )
                    VALUES (?, ?, ?, ?, ?)
                `;

                db.query(
                    insertQuery,
                    [
                        full_name,
                        student_number || null,
                        staff_id || null,
                        hashedPassword,
                        role
                    ],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        return res.status(201).json({
                            message:
                                "User created successfully.",
                            user: {
                                id: result.insertId,
                                full_name,
                                student_number:
                                    student_number || null,
                                staff_id:
                                    staff_id || null,
                                role
                            }
                        });
                    }
                );
            }
        );

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
};


// =====================================
// LECTURERS
// =====================================

const getLecturers = (req, res) => {
    const query = `
        SELECT
            id,
            full_name,
            staff_id
        FROM users
        WHERE role = 'lecturer'
        ORDER BY full_name ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        return res.status(200).json({
            message:
                "Lecturers retrieved successfully.",
            lecturers: results
        });
    });
};


// =====================================
// COURSES
// =====================================

const getAllCourses = (req, res) => {
    const query = `
        SELECT
            courses.id,
            courses.course_code,
            courses.course_name,
            courses.lecturer_id,
            users.full_name AS lecturer_name,
            users.staff_id AS lecturer_staff_id,
            courses.created_at
        FROM courses
        LEFT JOIN users
            ON courses.lecturer_id = users.id
        ORDER BY courses.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        return res.status(200).json({
            message:
                "Courses retrieved successfully.",
            courses: results
        });
    });
};


const createCourseAdmin = (req, res) => {
    const {
        course_code,
        course_name,
        lecturer_id
    } = req.body;

    if (
        !course_code ||
        !course_name ||
        !lecturer_id
    ) {
        return res.status(400).json({
            message:
                "Course code, course name and lecturer are required."
        });
    }

    const lecturerQuery = `
        SELECT id
        FROM users
        WHERE id = ?
        AND role = 'lecturer'
    `;

    db.query(
        lecturerQuery,
        [lecturer_id],
        (err, lecturerResults) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (lecturerResults.length === 0) {
                return res.status(400).json({
                    message:
                        "Selected lecturer does not exist."
                });
            }

            const checkCourseQuery = `
                SELECT id
                FROM courses
                WHERE course_code = ?
            `;

            db.query(
                checkCourseQuery,
                [course_code],
                (err, courseResults) => {
                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (courseResults.length > 0) {
                        return res.status(400).json({
                            message:
                                "A course with this code already exists."
                        });
                    }

                    const insertQuery = `
                        INSERT INTO courses
                        (
                            course_code,
                            course_name,
                            lecturer_id
                        )
                        VALUES (?, ?, ?)
                    `;

                    db.query(
                        insertQuery,
                        [
                            course_code,
                            course_name,
                            lecturer_id
                        ],
                        (err, result) => {
                            if (err) {
                                return res
                                    .status(500)
                                    .json({
                                        error:
                                            err.message
                                    });
                            }

                            return res
                                .status(201)
                                .json({
                                    message:
                                        "Course created successfully.",
                                    course: {
                                        id:
                                            result.insertId,
                                        course_code,
                                        course_name,
                                        lecturer_id
                                    }
                                });
                        }
                    );
                }
            );
        }
    );
};


const updateCourseAdmin = (req, res) => {
    const courseId = req.params.courseId;

    const {
        course_code,
        course_name,
        lecturer_id
    } = req.body;

    if (
        !course_code ||
        !course_name ||
        !lecturer_id
    ) {
        return res.status(400).json({
            message:
                "Course code, course name and lecturer are required."
        });
    }

    const lecturerQuery = `
        SELECT id
        FROM users
        WHERE id = ?
        AND role = 'lecturer'
    `;

    db.query(
        lecturerQuery,
        [lecturer_id],
        (err, lecturerResults) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (lecturerResults.length === 0) {
                return res.status(400).json({
                    message:
                        "Selected lecturer does not exist."
                });
            }

            const duplicateQuery = `
                SELECT id
                FROM courses
                WHERE course_code = ?
                AND id != ?
            `;

            db.query(
                duplicateQuery,
                [course_code, courseId],
                (err, duplicateResults) => {
                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (
                        duplicateResults.length > 0
                    ) {
                        return res.status(400).json({
                            message:
                                "Another course already uses this course code."
                        });
                    }

                    const updateQuery = `
                        UPDATE courses
                        SET
                            course_code = ?,
                            course_name = ?,
                            lecturer_id = ?
                        WHERE id = ?
                    `;

                    db.query(
                        updateQuery,
                        [
                            course_code,
                            course_name,
                            lecturer_id,
                            courseId
                        ],
                        (err, result) => {
                            if (err) {
                                return res
                                    .status(500)
                                    .json({
                                        error:
                                            err.message
                                    });
                            }

                            if (
                                result.affectedRows === 0
                            ) {
                                return res
                                    .status(404)
                                    .json({
                                        message:
                                            "Course not found."
                                    });
                            }

                            return res
                                .status(200)
                                .json({
                                    message:
                                        "Course updated successfully."
                                });
                        }
                    );
                }
            );
        }
    );
};


// =====================================
// ENROLLMENTS
// =====================================

const getAllEnrollments = (req, res) => {
    const query = `
        SELECT
            ce.id,
            ce.student_id,
            ce.course_id,
            ce.enrolled_at,

            student.full_name AS student_name,
            student.student_number,

            courses.course_code,
            courses.course_name,

            lecturer.full_name AS lecturer_name,
            lecturer.staff_id AS lecturer_staff_id

        FROM course_enrollments ce

        INNER JOIN users student
            ON ce.student_id = student.id

        INNER JOIN courses
            ON ce.course_id = courses.id

        LEFT JOIN users lecturer
            ON courses.lecturer_id = lecturer.id

        ORDER BY ce.enrolled_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        return res.status(200).json({
            message:
                "Enrollments retrieved successfully.",
            enrollments: results
        });
    });
};


const createEnrollmentAdmin = (req, res) => {
    const {
        student_id,
        course_id
    } = req.body;

    if (!student_id || !course_id) {
        return res.status(400).json({
            message:
                "Student and course are required."
        });
    }

    // Confirm selected user is actually a student
    const studentQuery = `
        SELECT id
        FROM users
        WHERE id = ?
        AND role = 'student'
    `;

    db.query(
        studentQuery,
        [student_id],
        (err, studentResults) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (studentResults.length === 0) {
                return res.status(400).json({
                    message:
                        "Selected student does not exist."
                });
            }

            // Confirm course exists
            const courseQuery = `
                SELECT id
                FROM courses
                WHERE id = ?
            `;

            db.query(
                courseQuery,
                [course_id],
                (err, courseResults) => {
                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (
                        courseResults.length === 0
                    ) {
                        return res.status(400).json({
                            message:
                                "Selected course does not exist."
                        });
                    }

                    // Prevent duplicate enrollment
                    const duplicateQuery = `
                        SELECT id
                        FROM course_enrollments
                        WHERE student_id = ?
                        AND course_id = ?
                    `;

                    db.query(
                        duplicateQuery,
                        [
                            student_id,
                            course_id
                        ],
                        (
                            err,
                            enrollmentResults
                        ) => {
                            if (err) {
                                return res
                                    .status(500)
                                    .json({
                                        error:
                                            err.message
                                    });
                            }

                            if (
                                enrollmentResults.length >
                                0
                            ) {
                                return res
                                    .status(400)
                                    .json({
                                        message:
                                            "Student is already enrolled in this course."
                                    });
                            }

                            const insertQuery = `
                                INSERT INTO course_enrollments
                                (
                                    student_id,
                                    course_id
                                )
                                VALUES (?, ?)
                            `;

                            db.query(
                                insertQuery,
                                [
                                    student_id,
                                    course_id
                                ],
                                (err, result) => {
                                    if (err) {
                                        return res
                                            .status(500)
                                            .json({
                                                error:
                                                    err.message
                                            });
                                    }

                                    return res
                                        .status(201)
                                        .json({
                                            message:
                                                "Student enrolled successfully.",
                                            enrollmentId:
                                                result.insertId
                                        });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};


const deleteEnrollmentAdmin = (req, res) => {
    const enrollmentId =
        req.params.enrollmentId;

    const query = `
        DELETE FROM course_enrollments
        WHERE id = ?
    `;

    db.query(
        query,
        [enrollmentId],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message:
                        "Enrollment not found."
                });
            }

            return res.status(200).json({
                message:
                    "Student removed from course successfully."
            });
        }
    );
};
// =====================================
// ADMIN ATTENDANCE REPORTING
// =====================================

// View every attendance session in the system
const getAllAttendanceSessions = (req, res) => {

    const query = `
        SELECT
            ls.id,
            ls.course_id,
            ls.session_date,
            ls.start_time,
            ls.end_time,
            ls.qr_expires_at,
            ls.allowed_radius,
            ls.is_active,
            ls.created_at,

            c.course_code,
            c.course_name,

            lecturer.id AS lecturer_id,
            lecturer.full_name AS lecturer_name,
            lecturer.staff_id AS lecturer_staff_id,

            (
                SELECT COUNT(*)
                FROM course_enrollments ce
                WHERE ce.course_id = ls.course_id
            ) AS total_enrolled,

            (
                SELECT COUNT(*)
                FROM attendance a
                WHERE a.session_id = ls.id
                AND a.status = 'present'
            ) AS total_present

        FROM lecture_sessions ls

        INNER JOIN courses c
            ON ls.course_id = c.id

        LEFT JOIN users lecturer
            ON c.lecturer_id = lecturer.id

        ORDER BY
            ls.session_date DESC,
            ls.start_time DESC
    `;

    db.query(query, (err, results) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        const sessions = results.map((session) => {

            const totalEnrolled =
                Number(session.total_enrolled) || 0;

            const totalPresent =
                Number(session.total_present) || 0;

            const totalAbsent =
                Math.max(
                    totalEnrolled - totalPresent,
                    0
                );

            const attendancePercentage =
                totalEnrolled === 0
                    ? 0
                    : Number(
                        (
                            (
                                totalPresent /
                                totalEnrolled
                            ) *
                            100
                        ).toFixed(2)
                    );

            return {
                ...session,

                total_enrolled:
                    totalEnrolled,

                total_present:
                    totalPresent,

                total_absent:
                    totalAbsent,

                attendance_percentage:
                    attendancePercentage
            };
        });

        return res.status(200).json({
            message:
                "Attendance sessions retrieved successfully.",

            sessions
        });
    });
};


// =====================================
// VIEW ONE SESSION'S ATTENDANCE
// =====================================

const getAdminSessionAttendance = (req, res) => {

    const sessionId =
        req.params.sessionId;

    const sessionQuery = `
        SELECT
            ls.id,
            ls.course_id,
            ls.session_date,
            ls.start_time,
            ls.end_time,
            ls.is_active,

            c.course_code,
            c.course_name,

            lecturer.full_name AS lecturer_name,
            lecturer.staff_id AS lecturer_staff_id

        FROM lecture_sessions ls

        INNER JOIN courses c
            ON ls.course_id = c.id

        LEFT JOIN users lecturer
            ON c.lecturer_id = lecturer.id

        WHERE ls.id = ?
    `;

    db.query(
        sessionQuery,
        [sessionId],
        (err, sessionResults) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (sessionResults.length === 0) {
                return res.status(404).json({
                    message:
                        "Attendance session not found."
                });
            }

            const attendanceQuery = `
                SELECT
                    a.id,
                    a.student_id,
                    a.scan_time,
                    a.status,
                    a.distance_from_lecturer,
                    a.student_latitude,
                    a.student_longitude,

                    student.full_name AS student_name,
                    student.student_number

                FROM attendance a

                INNER JOIN users student
                    ON a.student_id = student.id

                WHERE a.session_id = ?

                ORDER BY a.scan_time ASC
            `;

            db.query(
                attendanceQuery,
                [sessionId],
                (err, attendanceResults) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    return res.status(200).json({
                        message:
                            "Session attendance retrieved successfully.",

                        session:
                            sessionResults[0],

                        attendance:
                            attendanceResults
                    });
                }
            );
        }
    );
};


// =====================================
// ADMIN SESSION SUMMARY
// =====================================

const getAdminSessionSummary = (req, res) => {

    const sessionId =
        req.params.sessionId;

    const query = `
        SELECT
            ls.id AS session_id,
            ls.course_id,

            c.course_code,
            c.course_name,

            lecturer.full_name AS lecturer_name,
            lecturer.staff_id AS lecturer_staff_id,

            (
                SELECT COUNT(*)
                FROM course_enrollments ce
                WHERE ce.course_id = ls.course_id
            ) AS total_enrolled,

            (
                SELECT COUNT(*)
                FROM attendance a
                WHERE a.session_id = ls.id
                AND a.status = 'present'
            ) AS total_present

        FROM lecture_sessions ls

        INNER JOIN courses c
            ON ls.course_id = c.id

        LEFT JOIN users lecturer
            ON c.lecturer_id = lecturer.id

        WHERE ls.id = ?
    `;

    db.query(
        query,
        [sessionId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message:
                        "Attendance session not found."
                });
            }

            const session = results[0];

            const totalEnrolled =
                Number(session.total_enrolled) || 0;

            const totalPresent =
                Number(session.total_present) || 0;

            const totalAbsent =
                Math.max(
                    totalEnrolled - totalPresent,
                    0
                );

            const attendancePercentage =
                totalEnrolled === 0
                    ? 0
                    : Number(
                        (
                            (
                                totalPresent /
                                totalEnrolled
                            ) *
                            100
                        ).toFixed(2)
                    );

            return res.status(200).json({
                message:
                    "Attendance summary retrieved successfully.",

                summary: {
                    session_id:
                        Number(session.session_id),

                    course_id:
                        session.course_id,

                    course_code:
                        session.course_code,

                    course_name:
                        session.course_name,

                    lecturer_name:
                        session.lecturer_name,

                    lecturer_staff_id:
                        session.lecturer_staff_id,

                    total_enrolled:
                        totalEnrolled,

                    total_present:
                        totalPresent,

                    total_absent:
                        totalAbsent,

                    attendance_percentage:
                        attendancePercentage
                }
            });
        }
    );
};


// =====================================
// SYSTEM-WIDE ATTENDANCE OVERVIEW
// =====================================

const getAdminAttendanceOverview = (req, res) => {

    const query = `
        SELECT

            (
                SELECT COUNT(*)
                FROM lecture_sessions
            ) AS total_sessions,

            (
                SELECT COUNT(*)
                FROM lecture_sessions
                WHERE is_active = 1
            ) AS active_sessions,

            (
                SELECT COUNT(*)
                FROM attendance
                WHERE status = 'present'
            ) AS attendance_records,

            (
                SELECT COUNT(*)
                FROM course_enrollments
            ) AS total_enrollments
    `;

    db.query(query, (err, results) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        const data = results[0];

        return res.status(200).json({
            message:
                "Attendance overview retrieved successfully.",

            overview: {
                total_sessions:
                    Number(data.total_sessions) || 0,

                active_sessions:
                    Number(data.active_sessions) || 0,

                attendance_records:
                    Number(data.attendance_records) || 0,

                total_enrollments:
                    Number(data.total_enrollments) || 0
            }
        });
    });
};

module.exports = {
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
};