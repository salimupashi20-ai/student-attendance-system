const db = require("../config/db");

// Calculate distance between two GPS coordinates in metres
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const earthRadius = 6371000;

    const toRadians = (degrees) => {
        return degrees * (Math.PI / 180);
    };

    const latitudeDifference = toRadians(lat2 - lat1);
    const longitudeDifference = toRadians(lon2 - lon1);

    const a =
        Math.sin(latitudeDifference / 2) *
            Math.sin(latitudeDifference / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(longitudeDifference / 2) *
            Math.sin(longitudeDifference / 2);

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return earthRadius * c;
};

const scanQRCode = (req, res) => {
    const {
        session_id,
        token,
        latitude,
        longitude
    } = req.body;

    const studentId = req.user.id;

    // 1. Validate QR details
    if (!session_id || !token) {
        return res.status(400).json({
            message: "Session ID and QR token are required."
        });
    }

    // 2. Validate student GPS coordinates
    if (latitude == null || longitude == null) {
        return res.status(400).json({
            message: "Student location is required."
        });
    }

    // 3. Find matching lecture session
    const sessionQuery = `
        SELECT *
        FROM lecture_sessions
        WHERE id = ?
        AND qr_token = ?
    `;

    db.query(
        sessionQuery,
        [session_id, token],
        (err, sessionResults) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (sessionResults.length === 0) {
                return res.status(404).json({
                    message: "Invalid QR code."
                });
            }

            const session = sessionResults[0];

            // 4. Check session status
            if (!session.is_active) {
                return res.status(400).json({
                    message: "Attendance session is closed."
                });
            }

            // 5. Check QR expiry
            const currentTime = new Date();
            const expiryTime = new Date(session.qr_expires_at);

            if (currentTime > expiryTime) {
                return res.status(400).json({
                    message: "QR code has expired."
                });
            }

            // 6. Make sure lecturer location exists
            if (
                session.lecturer_latitude == null ||
                session.lecturer_longitude == null
            ) {
                return res.status(400).json({
                    message: "Lecturer location is unavailable for this session."
                });
            }

            // 7. Check enrollment
            const enrollmentQuery = `
                SELECT *
                FROM course_enrollments
                WHERE student_id = ?
                AND course_id = ?
            `;

            db.query(
                enrollmentQuery,
                [studentId, session.course_id],
                (err, enrollmentResults) => {
                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (enrollmentResults.length === 0) {
                        return res.status(403).json({
                            message: "You are not enrolled in this course."
                        });
                    }

                    // 8. Check duplicate attendance
                    const duplicateQuery = `
                        SELECT *
                        FROM attendance
                        WHERE student_id = ?
                        AND session_id = ?
                    `;

                    db.query(
                        duplicateQuery,
                        [studentId, session_id],
                        (err, attendanceResults) => {
                            if (err) {
                                return res.status(500).json({
                                    error: err.message
                                });
                            }

                            if (attendanceResults.length > 0) {
                                return res.status(400).json({
                                    message: "Attendance already recorded for this session."
                                });
                            }

                            // 9. Calculate GPS distance
                            const distance = calculateDistance(
                                Number(latitude),
                                Number(longitude),
                                Number(session.lecturer_latitude),
                                Number(session.lecturer_longitude)
                            );

                            const allowedRadius =
                                Number(session.allowed_radius) || 50;

                            // 10. Reject if outside geofence
                            if (distance > allowedRadius) {
                                return res.status(403).json({
                                    message: "You are outside the allowed attendance area.",
                                    distance: Math.round(distance),
                                    allowed_radius: allowedRadius
                                });
                            }

                            // 11. Record attendance
                            const insertAttendanceQuery = `
                                INSERT INTO attendance
                                (
                                    student_id,
                                    session_id,
                                    student_latitude,
                                    student_longitude,
                                    distance_from_lecturer,
                                    status
                                )
                                VALUES (?, ?, ?, ?, ?, ?)
                            `;

                            db.query(
                                insertAttendanceQuery,
                                [
                                    studentId,
                                    session_id,
                                    latitude,
                                    longitude,
                                    distance,
                                    "present"
                                ],
                                (err, result) => {
                                    if (err) {
                                        return res.status(500).json({
                                            error: err.message
                                        });
                                    }

                                    return res.status(201).json({
                                        message: "Attendance recorded successfully.",
                                        attendance: {
                                            id: result.insertId,
                                            student_id: studentId,
                                            session_id: Number(session_id),
                                            status: "present",
                                            distance: Math.round(distance)
                                        }
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

module.exports = {
    scanQRCode
};