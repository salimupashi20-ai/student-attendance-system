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

module.exports = {
    createSession
};