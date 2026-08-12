const db = require("../config/db");
const QRCode = require("qrcode");
const crypto = require("crypto");

const createSession = async (req, res) => {
    try {
        const {
            course_id,
            session_date,
            start_time,
            end_time,
            lecturer_latitude,
            lecturer_longitude
        } = req.body;

        const lecturerId = req.user.id;

        // Basic validation
        if (
            !course_id ||
            !session_date ||
            !start_time ||
            !end_time
        ) {
            return res.status(400).json({
                message: "Course, date, start time and end time are required."
            });
        }

        // Confirm lecturer owns the course
        const courseQuery = `
            SELECT * FROM courses
            WHERE id = ? AND lecturer_id = ?
        `;

        db.query(
            courseQuery,
            [course_id, lecturerId],
            async (err, courseResults) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (courseResults.length === 0) {
                    return res.status(403).json({
                        message: "You are not authorized to create a session for this course."
                    });
                }

                // Generate secure unique token
                const qrToken = crypto.randomBytes(32).toString("hex");

                // QR expires 15 minutes from now
                const expiryDate = new Date(
                    Date.now() + 15 * 60 * 1000
                );

                const insertQuery = `
                    INSERT INTO lecture_sessions
                    (
                        course_id,
                        session_date,
                        start_time,
                        end_time,
                        qr_token,
                        qr_expires_at,
                        lecturer_latitude,
                        lecturer_longitude,
                        allowed_radius,
                        is_active,
                        created_by
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                db.query(
                    insertQuery,
                    [
                        course_id,
                        session_date,
                        start_time,
                        end_time,
                        qrToken,
                        expiryDate,
                        lecturer_latitude || null,
                        lecturer_longitude || null,
                        50,
                        true,
                        lecturerId
                    ],
                    async (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        const sessionId = result.insertId;

                        // This is the content encoded in the QR
                        const qrPayload = JSON.stringify({
                            session_id: sessionId,
                            token: qrToken
                        });

                        const qrCode = await QRCode.toDataURL(qrPayload);

                        res.status(201).json({
                            message: "Lecture session created successfully",
                            session: {
                                id: sessionId,
                                course_id,
                                qr_expires_at: expiryDate,
                                allowed_radius: 50
                            },
                            qr_code: qrCode
                        });
                    }
                );
            }
        );

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

const getMySessions = (req, res) => {
    const lecturerId = req.user.id;

    const query = `
        SELECT
            lecture_sessions.id,
            lecture_sessions.course_id,
            courses.course_code,
            courses.course_name,
            lecture_sessions.session_date,
            lecture_sessions.start_time,
            lecture_sessions.end_time,
            lecture_sessions.qr_expires_at,
            lecture_sessions.allowed_radius,
            lecture_sessions.is_active,
            lecture_sessions.created_at
        FROM lecture_sessions
        INNER JOIN courses
            ON lecture_sessions.course_id = courses.id
        WHERE lecture_sessions.created_by = ?
        ORDER BY lecture_sessions.created_at DESC
    `;

    db.query(query, [lecturerId], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.status(200).json({
            message: "Lecture sessions retrieved successfully.",
            sessions: results
        });
    });
};

const closeSession = (req, res) => {
    const sessionId = req.params.sessionId;
    const lecturerId = req.user.id;

    const checkQuery = `
        SELECT *
        FROM lecture_sessions
        WHERE id = ?
        AND created_by = ?
    `;

    db.query(
        checkQuery,
        [sessionId, lecturerId],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Session not found or you are not authorized to manage it."
                });
            }

            if (!results[0].is_active) {
                return res.status(400).json({
                    message: "Session is already closed."
                });
            }

            const updateQuery = `
                UPDATE lecture_sessions
                SET is_active = 0
                WHERE id = ?
            `;

            db.query(
                updateQuery,
                [sessionId],
                (err) => {
                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.status(200).json({
                        message: "Attendance session closed successfully."
                    });
                }
            );
        }
    );
};

module.exports = {
    createSession,
    getMySessions,
    closeSession
};