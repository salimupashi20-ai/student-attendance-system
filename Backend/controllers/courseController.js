const db = require("../config/db");

const createCourse = (req, res) => {
    const { course_code, course_name } = req.body;

    if (!course_code || !course_name) {
        return res.status(400).json({
            message: "Course code and course name are required."
        });
    }

    const lecturerId = req.user.id;

    const checkQuery = `
        SELECT * FROM courses
        WHERE course_code = ?
    `;

    db.query(checkQuery, [course_code], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (results.length > 0) {
            return res.status(400).json({
                message: "Course already exists."
            });
        }

        const insertQuery = `
            INSERT INTO courses
            (course_code, course_name, lecturer_id)
            VALUES (?, ?, ?)
        `;

        db.query(
            insertQuery,
            [course_code, course_name, lecturerId],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                res.status(201).json({
                    message: "Course created successfully",
                    courseId: result.insertId
                });
            }
        );
    });
};

const getMyCourses = (req, res) => {
    const lecturerId = req.user.id;

    const query = `
        SELECT id, course_code, course_name, created_at
        FROM courses
        WHERE lecturer_id = ?
        ORDER BY created_at DESC
    `;

    db.query(query, [lecturerId], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.status(200).json({
            message: "Courses retrieved successfully",
            courses: results
        });
    });
};

module.exports = {
    createCourse,
    getMyCourses
};
