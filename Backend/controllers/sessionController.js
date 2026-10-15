
const db = require("../config/db");
const QRCode = require("qrcode");
const crypto = require("crypto");

// ========================================
// BUILD STUDENT ATTENDANCE QR
// ========================================

const buildQrCode = async (sessionId, qrToken) => {
    const frontendUrl =
        process.env.FRONTEND_URL.replace(/\/$/, "");

    const qrPayload =
        `${frontendUrl}/student/scan?session_id=${sessionId}&token=${qrToken}`;

    return QRCode.toDataURL(qrPayload);
};

// ========================================
// VALIDATE GPS COORDINATES
// ========================================

const validCoordinate = (value, minimum, maximum) => {
    if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
    ) {
        return false;
    }

    const number = Number(value);

    return (
        Number.isFinite(number) &&
        number >= minimum &&
        number <= maximum
    );
};

// ========================================
// CREATE ATTENDANCE SESSION
// ========================================

const createSession = async (req, res) => {
    try {
        const {
            course_id,
            session_date,
            start_time,
            end_time,
            classroom_id,
            lecturer_latitude,
            lecturer_longitude
        } = req.body;

        // Existing frontend requests do not yet send
        // a location_method, so GPS remains the default.
        const locationMethod =
            req.body.location_method ?? "live_gps";

        const lecturerId = req.user.id;

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

        if (
            !["classroom", "live_gps"].includes(locationMethod)
        ) {
            return res.status(400).json({
                message: "Invalid location method."
            });
        }

        // Lecturer must own the course.
        const [courses] = await db.promise().execute(
            `
            SELECT id
            FROM courses
            WHERE id = ?
              AND lecturer_id = ?
            LIMIT 1
            `,
            [course_id, lecturerId]
        );

        if (courses.length === 0) {
            return res.status(403).json({
                message:
                    "You are not authorized to create a session for this course."
            });
        }

        let latitude;
        let longitude;
        let selectedClassroomId = null;
        let allowedRadius = 50;
        let locationSource;

        // ====================================
        // OPTION 1: REGISTERED CLASSROOM
        // ====================================

        if (locationMethod === "classroom") {
            const numericClassroomId = Number(classroom_id);

            if (
                !Number.isSafeInteger(numericClassroomId) ||
                numericClassroomId <= 0
            ) {
                return res.status(400).json({
                    message: "Select a valid classroom."
                });
            }

            const [classrooms] = await db.promise().execute(
                `
                SELECT
                    id,
                    building_name,
                    room_name,
                    latitude,
                    longitude,
                    allowed_radius
                FROM classrooms
                WHERE id = ?
                  AND is_active = 1
                LIMIT 1
                `,
                [numericClassroomId]
            );

            if (classrooms.length === 0) {
                return res.status(404).json({
                    message:
                        "Classroom not found or is inactive."
                });
            }

            const classroom = classrooms[0];

            // Always use trusted database coordinates,
            // never coordinates supplied by the lecturer
            // for registered-classroom sessions.
            latitude = Number(classroom.latitude);
            longitude = Number(classroom.longitude);

            selectedClassroomId = classroom.id;

            // Preserve our original maximum radius
            // of 50 metres. Smaller approved radii work.
            allowedRadius = Math.min(
                50,
                Number(classroom.allowed_radius)
            );

            locationSource =
                `${classroom.building_name} - ${classroom.room_name}`;
        }

        // ====================================
        // OPTION 2: CURRENT LECTURER GPS
        // ====================================

        if (locationMethod === "live_gps") {
            if (
                !validCoordinate(
                    lecturer_latitude,
                    -90,
                    90
                ) ||
                !validCoordinate(
                    lecturer_longitude,
                    -180,
                    180
                )
            ) {
                return res.status(400).json({
                    message:
                        "A valid lecturer GPS location is required."
                });
            }

            latitude = Number(lecturer_latitude);
            longitude = Number(lecturer_longitude);

            locationSource = "Lecturer GPS Location";
        }

        // ====================================
        // PREVENT MULTIPLE ACTIVE QR SESSIONS
        // ====================================

        const [activeSessions] = await db.promise().execute(
            `
            SELECT id
            FROM lecture_sessions
            WHERE created_by = ?
              AND is_active = 1
              AND qr_expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [lecturerId]
        );

        if (activeSessions.length > 0) {
            return res.status(409).json({
                message:
                    "You already have an active attendance session. Close it or wait for the QR code to expire before starting another one."
            });
        }

        // ====================================
        // GENERATE SECURE QR TOKEN
        // ====================================

        const qrToken = crypto
            .randomBytes(32)
            .toString("hex");

        const expiryDate = new Date(
            Date.now() + 15 * 60 * 1000
        );

        // ====================================
        // SAVE ATTENDANCE SESSION
        // ====================================

        const [result] = await db.promise().execute(
            `
            INSERT INTO lecture_sessions (
                course_id,
                session_date,
                start_time,
                end_time,
                qr_token,
                qr_expires_at,
                lecturer_latitude,
                lecturer_longitude,
                allowed_radius,
                classroom_id,
                is_active,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                course_id,
                session_date,
                start_time,
                end_time,
                qrToken,
                expiryDate,
                latitude,
                longitude,
                allowedRadius,
                selectedClassroomId,
                1,
                lecturerId
            ]
        );

        const sessionId = result.insertId;

        let qrCode;

        try {
            qrCode = await buildQrCode(
                sessionId,
                qrToken
            );
        } catch (error) {
            console.error("QR generation failed:", error);

            return res.status(500).json({
                message:
                    "Session created, but QR generation failed."
            });
        }

        return res.status(201).json({
            message: "Lecture session created successfully",

            session: {
                id: sessionId,
                course_id,
                session_date,
                start_time,
                end_time,
                qr_expires_at: expiryDate,
                allowed_radius: allowedRadius,
                classroom_id: selectedClassroomId,
                location_method: locationMethod,
                location_source: locationSource
            },

            qr_code: qrCode
        });

    } catch (error) {
        console.error("Session creation failed:", error);

        return res.status(500).json({
            message: "Unable to create attendance session."
        });
    }
};

// ========================================
// GET CURRENT ACTIVE SESSION
// ========================================

const getActiveSession = async (req, res) => {
    try {
        const lecturerId = req.user.id;

        const [results] = await db.promise().execute(
            `
            SELECT
                ls.id,
                ls.course_id,
                c.course_code,
                c.course_name,
                ls.session_date,
                ls.start_time,
                ls.end_time,
                ls.qr_token,
                ls.qr_expires_at,
                ls.allowed_radius,
                ls.lecturer_latitude,
                ls.lecturer_longitude,
                ls.classroom_id,
                ls.is_active,
                ls.created_at,
                cl.building_name,
                cl.room_name
            FROM lecture_sessions ls
            INNER JOIN courses c
                ON ls.course_id = c.id
            LEFT JOIN classrooms cl
                ON ls.classroom_id = cl.id
            WHERE ls.created_by = ?
              AND ls.is_active = 1
              AND ls.qr_expires_at > NOW()
            ORDER BY ls.created_at DESC
            LIMIT 1
            `,
            [lecturerId]
        );

        if (results.length === 0) {
            return res.status(200).json({
                message: "No active attendance session found.",
                activeSession: null
            });
        }

        const session = results[0];

        const qrCode = await buildQrCode(
            session.id,
            session.qr_token
        );

        // Do not expose the raw token separately.
        delete session.qr_token;

        const isClassroomSession =
            session.classroom_id !== null;

        return res.status(200).json({
            message:
                "Active attendance session retrieved successfully.",

            activeSession: {
                ...session,
                qr_code: qrCode,

                location_method:
                    isClassroomSession
                        ? "classroom"
                        : "live_gps",

                location_source:
                    isClassroomSession
                        ? `${session.building_name} - ${session.room_name}`
                        : "Lecturer GPS Location"
            }
        });

    } catch (error) {
        console.error("Active session lookup failed:", error);

        return res.status(500).json({
            message: "Unable to retrieve active session."
        });
    }
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
                message: "Lecture sessions retrieved successfully.",
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
                    message: "Session is already closed."
                });
            }

            db.query(
                `
                UPDATE lecture_sessions
                SET is_active = 0
                WHERE id = ?
                  AND created_by = ?
                `,
                [sessionId, lecturerId],
                (updateError) => {
                    if (updateError) {
                        return res.status(500).json({
                            error: updateError.message
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
