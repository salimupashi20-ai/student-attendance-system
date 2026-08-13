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

const getSessionAttendance = (req, res) => {
    const sessionId = req.params.sessionId;
    const lecturerId = req.user.id;

    // First confirm that this session belongs to the logged-in lecturer
    const sessionQuery = `
        SELECT *
        FROM lecture_sessions
        WHERE id = ?
        AND created_by = ?
    `;

    db.query(
        sessionQuery,
        [sessionId, lecturerId],
        (err, sessionResults) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (sessionResults.length === 0) {
                return res.status(403).json({
                    message: "You are not authorized to view this session."
                });
            }

            const attendanceQuery = `
                SELECT
                    attendance.id,
                    users.id AS student_id,
                    users.full_name,
                    users.student_number,
                    attendance.scan_time,
                    attendance.status,
                    attendance.distance_from_lecturer
                FROM attendance
                INNER JOIN users
                    ON attendance.student_id = users.id
                WHERE attendance.session_id = ?
                ORDER BY attendance.scan_time ASC
            `;

            db.query(
                attendanceQuery,
                [sessionId],
                (err, results) => {
                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.status(200).json({
                        message: "Attendance records retrieved successfully.",
                        attendance: results
                    });
                }
            );
        }
    );
};

const getAttendanceSummary = (req, res) => {
    const sessionId = req.params.sessionId;
    const lecturerId = req.user.id;

    // Confirm the session belongs to this lecturer
    const sessionQuery = `
        SELECT *
        FROM lecture_sessions
        WHERE id = ?
        AND created_by = ?
    `;

    db.query(
        sessionQuery,
        [sessionId, lecturerId],
        (err, sessionResults) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (sessionResults.length === 0) {
                return res.status(403).json({
                    message: "You are not authorized to view this session."
                });
            }

            const session = sessionResults[0];

            // Count students enrolled in the course
            const enrolledQuery = `
                SELECT COUNT(*) AS total_enrolled
                FROM course_enrollments
                WHERE course_id = ?
            `;

            db.query(
                enrolledQuery,
                [session.course_id],
                (err, enrolledResults) => {
                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    const totalEnrolled =
                        Number(enrolledResults[0].total_enrolled);

                    // Count students who attended this session
                    const presentQuery = `
                        SELECT COUNT(*) AS total_present
                        FROM attendance
                        WHERE session_id = ?
                        AND status = 'present'
                    `;

                    db.query(
                        presentQuery,
                        [sessionId],
                        (err, presentResults) => {
                            if (err) {
                                return res.status(500).json({
                                    error: err.message
                                });
                            }

                            const totalPresent =
                                Number(presentResults[0].total_present);

                            const totalAbsent =
                                Math.max(totalEnrolled - totalPresent, 0);

                            const attendancePercentage =
                                totalEnrolled === 0
                                    ? 0
                                    : Number(
                                        (
                                            (totalPresent / totalEnrolled) *
                                            100
                                        ).toFixed(2)
                                    );

                            return res.status(200).json({
                                message: "Attendance summary retrieved successfully.",
                                summary: {
                                    session_id: Number(sessionId),
                                    course_id: session.course_id,
                                    total_enrolled: totalEnrolled,
                                    total_present: totalPresent,
                                    total_absent: totalAbsent,
                                    attendance_percentage: attendancePercentage
                                }
                            });
                        }
                    );
                }
            );
        }
    );
};
const getMyAttendanceHistory = (req, res) => {
    const studentId = req.user.id;

    const query = `
        SELECT
            attendance.id,
            attendance.session_id,
            attendance.scan_time,
            attendance.status,
            attendance.distance_from_lecturer,

            courses.course_code,
            courses.course_name,

            lecture_sessions.session_date,
            lecture_sessions.start_time,
            lecture_sessions.end_time

        FROM attendance

        INNER JOIN lecture_sessions
            ON attendance.session_id = lecture_sessions.id

        INNER JOIN courses
            ON lecture_sessions.course_id = courses.id

        WHERE attendance.student_id = ?

        ORDER BY lecture_sessions.session_date DESC,
                 lecture_sessions.start_time DESC
    `;

    db.query(query, [studentId], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        return res.status(200).json({
            message: "Attendance history retrieved successfully.",
            attendance: results
        });
    });
};

const getCourseAttendanceStats = (req, res) => {
    const courseId = req.params.courseId;
    const lecturerId = req.user.id;

    // First confirm the course belongs to this lecturer
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
                    message: "You are not authorized to view statistics for this course."
                });
            }

            // Count enrolled students
            const enrolledQuery = `
                SELECT COUNT(*) AS total_enrolled
                FROM course_enrollments
                WHERE course_id = ?
            `;

            db.query(
                enrolledQuery,
                [courseId],
                (err, enrolledResults) => {
                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    const totalEnrolled =
                        Number(enrolledResults[0].total_enrolled);

                    // Get all sessions for this course
                    const sessionsQuery = `
                        SELECT
                            id,
                            session_date,
                            start_time,
                            end_time,
                            is_active
                        FROM lecture_sessions
                        WHERE course_id = ?
                        ORDER BY session_date ASC,
                                 start_time ASC
                    `;

                    db.query(
                        sessionsQuery,
                        [courseId],
                        (err, sessions) => {
                            if (err) {
                                return res.status(500).json({
                                    error: err.message
                                });
                            }

                            if (sessions.length === 0) {
                                return res.status(200).json({
                                    message: "No lecture sessions found for this course.",
                                    statistics: {
                                        course_id: Number(courseId),
                                        total_enrolled: totalEnrolled,
                                        total_sessions: 0,
                                        average_attendance_percentage: 0,
                                        sessions: []
                                    }
                                });
                            }

                            // Count attendance per session
                            const attendanceQuery = `
                                SELECT
                                    lecture_sessions.id AS session_id,
                                    lecture_sessions.session_date,
                                    COUNT(attendance.id) AS total_present
                                FROM lecture_sessions

                                LEFT JOIN attendance
                                    ON lecture_sessions.id = attendance.session_id
                                    AND attendance.status = 'present'

                                WHERE lecture_sessions.course_id = ?

                                GROUP BY
                                    lecture_sessions.id,
                                    lecture_sessions.session_date

                                ORDER BY lecture_sessions.session_date ASC
                            `;

                            db.query(
                                attendanceQuery,
                                [courseId],
                                (err, attendanceResults) => {
                                    if (err) {
                                        return res.status(500).json({
                                            error: err.message
                                        });
                                    }

                                    const sessionStatistics =
                                        attendanceResults.map((session) => {

                                            const totalPresent =
                                                Number(session.total_present);

                                            const totalAbsent =
                                                Math.max(
                                                    totalEnrolled - totalPresent,
                                                    0
                                                );

                                            const percentage =
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
                                                session_id:
                                                    session.session_id,

                                                session_date:
                                                    session.session_date,

                                                total_present:
                                                    totalPresent,

                                                total_absent:
                                                    totalAbsent,

                                                attendance_percentage:
                                                    percentage
                                            };
                                        });

                                    const totalPercentages =
                                        sessionStatistics.reduce(
                                            (sum, session) =>
                                                sum +
                                                session.attendance_percentage,
                                            0
                                        );

                                    const averageAttendance =
                                        sessionStatistics.length === 0
                                            ? 0
                                            : Number(
                                                (
                                                    totalPercentages /
                                                    sessionStatistics.length
                                                ).toFixed(2)
                                            );

                                    return res.status(200).json({
                                        message: "Course attendance statistics retrieved successfully.",
                                        statistics: {
                                            course_id: Number(courseId),
                                            course_code:
                                                courseResults[0].course_code,
                                            course_name:
                                                courseResults[0].course_name,

                                            total_enrolled:
                                                totalEnrolled,

                                            total_sessions:
                                                sessionStatistics.length,

                                            average_attendance_percentage:
                                                averageAttendance,

                                            sessions:
                                                sessionStatistics
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
    scanQRCode,
    getSessionAttendance,
    getAttendanceSummary,
    getMyAttendanceHistory,
    getCourseAttendanceStats
};