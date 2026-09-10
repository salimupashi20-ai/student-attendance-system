const db = require("../config/db");

// =====================================
// LECTURER: ENROLL STUDENT
// =====================================

const enrollStudent = (req, res) => {
    const lecturerId = req.user.id;

    const {
        student_id,
        course_id
    } = req.body;

    if (!student_id || !course_id) {
        return res.status(400).json({
            message:
                "Student ID and course ID are required."
        });
    }

    // Confirm lecturer owns the course
    const courseQuery = `
        SELECT *
        FROM courses
        WHERE id = ?
        AND lecturer_id = ?
    `;

    db.query(
        courseQuery,
        [course_id, lecturerId],
        (err, courseResults) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (courseResults.length === 0) {
                return res.status(403).json({
                    message:
                        "You are not authorized to manage this course."
                });
            }

            // Confirm user is a student
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
                        return res.status(404).json({
                            message:
                                "Student not found."
                        });
                    }

                    // Check duplicate enrollment
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
                        (err, duplicateResults) => {
                            if (err) {
                                return res
                                    .status(500)
                                    .json({
                                        error:
                                            err.message
                                    });
                            }

                            if (
                                duplicateResults.length > 0
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


// =====================================
// LECTURER: VIEW COURSE STUDENTS
// =====================================

const getCourseStudents = (req, res) => {
    const lecturerId = req.user.id;
    const courseId = req.params.courseId;

    const courseQuery = `
        SELECT *
        FROM courses
        WHERE id = ?
        AND lecturer_id = ?
    `;

    db.query(
        courseQuery,
        [courseId, lecturerId],
        (err, courseResults) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (courseResults.length === 0) {
                return res.status(403).json({
                    message:
                        "You are not authorized to view students for this course."
                });
            }

            const studentsQuery = `
                SELECT
                    users.id,
                    users.full_name,
                    users.student_number,
                    course_enrollments.enrolled_at
                FROM course_enrollments
                INNER JOIN users
                    ON course_enrollments.student_id = users.id
                WHERE course_enrollments.course_id = ?
                ORDER BY users.full_name ASC
            `;

            db.query(
                studentsQuery,
                [courseId],
                (err, results) => {
                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    return res.status(200).json({
                        message:
                            "Course students retrieved successfully.",
                        students: results
                    });
                }
            );
        }
    );
};


// =====================================
// STUDENT: VIEW MY COURSES
// =====================================

const getMyCourses = (req, res) => {
    const studentId = req.user.id;

    const query = `
        SELECT
            courses.id,
            courses.course_code,
            courses.course_name,

            lecturer.full_name AS lecturer_name,
            lecturer.staff_id AS lecturer_staff_id,

            course_enrollments.enrolled_at

        FROM course_enrollments

        INNER JOIN courses
            ON course_enrollments.course_id = courses.id

        LEFT JOIN users lecturer
            ON courses.lecturer_id = lecturer.id

        WHERE course_enrollments.student_id = ?

        ORDER BY courses.course_code ASC
    `;

    db.query(
        query,
        [studentId],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            return res.status(200).json({
                message:
                    "Enrolled courses retrieved successfully.",
                courses: results
            });
        }
    );
};


module.exports = {
    enrollStudent,
    getCourseStudents,
    getMyCourses
};