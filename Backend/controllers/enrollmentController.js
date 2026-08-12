const db = require("../config/db");

const enrollStudent = (req, res) => {
    const { student_id, course_id } = req.body;
    const lecturerId = req.user.id;

    if (!student_id || !course_id) {
        return res.status(400).json({
            message: "Student ID and course ID are required."
        });
    }

    const courseQuery = `
        SELECT * FROM courses
        WHERE id = ? AND lecturer_id = ?
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
                    message: "You are not authorized to manage this course."
                });
            }

            const studentQuery = `
                SELECT * FROM users
                WHERE id = ? AND role = 'student'
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
                            message: "Student not found."
                        });
                    }

                    const enrollmentQuery = `
                        INSERT INTO course_enrollments
                        (student_id, course_id)
                        VALUES (?, ?)
                    `;

                    db.query(
                        enrollmentQuery,
                        [student_id, course_id],
                        (err, result) => {
                            if (err) {
                                if (err.code === "ER_DUP_ENTRY") {
                                    return res.status(400).json({
                                        message: "Student is already enrolled in this course."
                                    });
                                }

                                return res.status(500).json({
                                    error: err.message
                                });
                            }

                            res.status(201).json({
                                message: "Student enrolled successfully",
                                enrollmentId: result.insertId
                            });
                        }
                    );
                }
            );
        }
    );
};

const getCourseStudents = (req, res) => {
    const courseId = req.params.courseId;
    const lecturerId = req.user.id;

    const courseQuery = `
        SELECT * FROM courses
        WHERE id = ? AND lecturer_id = ?
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
                    message: "You are not authorized to view this course."
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

                    res.status(200).json({
                        message: "Enrolled students retrieved successfully",
                        students: results
                    });
                }
            );
        }
    );
};

module.exports = {
    enrollStudent,
    getCourseStudents
};