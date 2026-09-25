const db = require("../config/db");
const QRCode = require("qrcode");
const crypto = require("crypto");

// ========================================
// BUILD STUDENT ATTENDANCE QR
// ========================================

const buildQrCode = async (sessionId, qrToken) => {
    const frontendUrl = process.env.FRONTEND_URL.replace(/\/$/, "");

    const qrPayload =
        `${frontendUrl}/student/scan?session_id=${sessionId}&token=${qrToken}`;

    return await QRCode.toDataURL(qrPayload);
};


// ========================================
// CREATE SESSION
// ========================================

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
                message:
                    "Course, date, start time and end time are required."
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
            async (err, courseResults) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (courseResults.length === 0) {
                    return res.status(403).json({
                        message:
                            "You are not authorized to create a session for this course."
                    });
                }

                // ----------------------------------------
                // Prevent multiple active QR sessions
                // ----------------------------------------

                const activeQuery = `
                    SELECT id
                    FROM lecture_sessions
                    WHERE created_by = ?
                    AND is_active = 1
                    AND qr_expires_at > NOW()
                    ORDER BY created_at DESC
                    LIMIT 1
                `;

                db.query(
                    activeQuery,
                    [lecturerId],
                    async (activeErr, activeResults) => {
                        if (activeErr) {
                            return res.status(500).json({
                                error: activeErr.message
                            });
                        }

                        if (activeResults.length > 0) {
                            return res.status(409).json({
                                message:
                                    "You already have an active attendance session. Close it or wait for the QR code to expire before starting another one."
                            });
                        }

                        // Generate secure QR token
                        const qrToken = crypto
                            .randomBytes(32)
                            .toString("hex");

                        // QR expires 15 minutes after creation
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
                                lecturer_latitude ?? null,
                                lecturer_longitude ?? null,
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

                                try {
                                    const sessionId =
                                        result.insertId;

                                    const qrCode =
                                        await buildQrCode(
                                            sessionId,
                                            qrToken
                                        );

                                    return res.status(201).json({
                                        message:
                                            "Lecture session created successfully",

                                        session: {
                                            id: sessionId,
                                            course_id,
                                            session_date,
                                            start_time,
                                            end_time,
                                            qr_expires_at:
                                                expiryDate,
                                            allowed_radius: 50
                                        },

                                        qr_code: qrCode
                                    });

                                } catch (qrError) {
                                    return res.status(500).json({
                                        message:
                                            "Session created, but QR generation failed.",
                                        error:
                                            qrError.message
                                    });
                                }
                            }
                        );
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


// ========================================
// GET CURRENT ACTIVE SESSION
// ========================================

const getActiveSession = (req, res) => {
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
            lecture_sessions.qr_token,
            lecture_sessions.qr_expires_at,
            lecture_sessions.allowed_radius,
            lecture_sessions.lecturer_latitude,
            lecture_sessions.lecturer_longitude,
            lecture_sessions.is_active,
            lecture_sessions.created_at
        FROM lecture_sessions
        INNER JOIN courses
            ON lecture_sessions.course_id = courses.id
        WHERE lecture_sessions.created_by = ?
        AND lecture_sessions.is_active = 1
        AND lecture_sessions.qr_expires_at > NOW()
        ORDER BY lecture_sessions.created_at DESC
        LIMIT 1
    `;

    db.query(
        query,
        [lecturerId],
        async (err, results) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(200).json({
                    message:
                        "No active attendance session found.",
                    activeSession: null
                });
            }

            try {
                const session = results[0];

                const qrCode =
                    await buildQrCode(
                        session.id,
                        session.qr_token
                    );

                // Never expose token separately to frontend
                delete session.qr_token;

                return res.status(200).json({
                    message:
                        "Active attendance session retrieved successfully.",

                    activeSession: {
                        ...session,
                        qr_code: qrCode,
                        location_source:
                            "Saved Lecturer Location"
                    }
                });

            } catch (qrError) {
                return res.status(500).json({
                    message:
                        "Active session found, but QR generation failed.",
                    error: qrError.message
                });
            }
        }
    );
};


// ========================================
// GET LECTURER SESSIONS
// ========================================

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

    db.query(
        query,
        [lecturerId],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            return res.status(200).json({
                message:
                    "Lecture sessions retrieved successfully.",
                sessions: results
            });
        }
    );
};


// ========================================
// CLOSE SESSION
// ========================================

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
                    message:
                        "Session not found or you are not authorized to manage it."
                });
            }

            if (!results[0].is_active) {
                return res.status(400).json({
                    message:
                        "Session is already closed."
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

                    return res.status(200).json({
                        message:
                            "Attendance session closed successfully."
                    });
                }
            );
        }
    );
};


module.exports = {
    createSession,
    getActiveSession,
    getMySessions,
    closeSession
};