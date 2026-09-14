const db = require("../config/db");

// =====================================
// DISTANCE CALCULATION
// =====================================

const calculateDistance = (
    lat1,
    lon1,
    lat2,
    lon2
) => {
    const earthRadius = 6371000;

    const toRadians = (degrees) => {
        return degrees * (Math.PI / 180);
    };

    const latitudeDifference =
        toRadians(lat2 - lat1);

    const longitudeDifference =
        toRadians(lon2 - lon1);

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


// =====================================
// STUDENT: SCAN QR CODE
// =====================================

const scanQRCode = (req, res) => {

    const {
        session_id,
        token,
        latitude,
        longitude
    } = req.body;

    const studentId = req.user.id;

    // Validate QR details
    if (!session_id || !token) {
        return res.status(400).json({
            message:
                "Session ID and QR token are required."
        });
    }

    // Validate GPS
    if (
        latitude == null ||
        longitude == null
    ) {
        return res.status(400).json({
            message:
                "Student location is required."
        });
    }

    // Find matching session
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
                    message:
                        "Invalid QR code."
                });
            }

            const session =
                sessionResults[0];

            // Session must still be active
            if (!session.is_active) {
                return res.status(400).json({
                    message:
                        "Attendance session is closed."
                });
            }

            // QR must still be valid
            const currentTime =
                new Date();

            const expiryTime =
                new Date(
                    session.qr_expires_at
                );

            if (currentTime > expiryTime) {
                return res.status(400).json({
                    message:
                        "QR code has expired."
                });
            }

            // Lecturer coordinates must exist
            if (
                session.lecturer_latitude == null ||
                session.lecturer_longitude == null
            ) {
                return res.status(400).json({
                    message:
                        "Lecturer location is unavailable for this session."
                });
            }

            /*
                IMPORTANT:

                Student must have already been enrolled
                when this lecture session was created.

                This prevents a student enrolled later
                from attending an older session.
            */

            const enrollmentQuery = `
                SELECT *
                FROM course_enrollments
                WHERE student_id = ?
                AND course_id = ?
                AND enrolled_at <= ?
            `;

            db.query(
                enrollmentQuery,
                [
                    studentId,
                    session.course_id,
                    session.created_at
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
                        enrollmentResults.length === 0
                    ) {
                        return res
                            .status(403)
                            .json({
                                message:
                                    "You were not enrolled in this course when this session started."
                            });
                    }

                    // Check duplicate attendance
                    const duplicateQuery = `
                        SELECT *
                        FROM attendance
                        WHERE student_id = ?
                        AND session_id = ?
                    `;

                    db.query(
                        duplicateQuery,
                        [
                            studentId,
                            session_id
                        ],
                        (
                            err,
                            attendanceResults
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
                                attendanceResults.length >
                                0
                            ) {
                                return res
                                    .status(400)
                                    .json({
                                        message:
                                            "Attendance already recorded for this session."
                                    });
                            }

                            // Calculate GPS distance
                            const distance =
                                calculateDistance(
                                    Number(
                                        latitude
                                    ),
                                    Number(
                                        longitude
                                    ),
                                    Number(
                                        session
                                            .lecturer_latitude
                                    ),
                                    Number(
                                        session
                                            .lecturer_longitude
                                    )
                                );

                            const allowedRadius =
                                Number(
                                    session.allowed_radius
                                ) || 50;

                            if (
                                distance >
                                allowedRadius
                            ) {
                                return res
                                    .status(403)
                                    .json({
                                        message:
                                            "You are outside the allowed attendance area.",

                                        distance:
                                            Math.round(
                                                distance
                                            ),

                                        allowed_radius:
                                            allowedRadius
                                    });
                            }

                            // Record attendance
                            const insertQuery = `
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
                                insertQuery,
                                [
                                    studentId,
                                    session_id,
                                    latitude,
                                    longitude,
                                    distance,
                                    "present"
                                ],
                                (
                                    err,
                                    result
                                ) => {

                                    if (err) {
                                        return res
                                            .status(
                                                500
                                            )
                                            .json({
                                                error:
                                                    err.message
                                            });
                                    }

                                    return res
                                        .status(201)
                                        .json({
                                            message:
                                                "Attendance recorded successfully.",

                                            attendance:
                                            {
                                                id:
                                                    result.insertId,

                                                student_id:
                                                    studentId,

                                                session_id:
                                                    Number(
                                                        session_id
                                                    ),

                                                status:
                                                    "present",

                                                distance:
                                                    Math.round(
                                                        distance
                                                    )
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


// =====================================
// LECTURER: SESSION ATTENDANCE
// =====================================

const getSessionAttendance = (req, res) => {

    const sessionId =
        req.params.sessionId;

    const lecturerId =
        req.user.id;

    const sessionQuery = `
        SELECT *
        FROM lecture_sessions
        WHERE id = ?
        AND created_by = ?
    `;

    db.query(
        sessionQuery,
        [
            sessionId,
            lecturerId
        ],
        (
            err,
            sessionResults
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
                sessionResults.length === 0
            ) {
                return res
                    .status(403)
                    .json({
                        message:
                            "You are not authorized to view this session."
                    });
            }

            /*
                Only show attendance belonging
                to students who were eligible
                when the session was created.
            */

            const attendanceQuery = `
                SELECT
                    attendance.id,

                    users.id
                        AS student_id,

                    users.full_name,

                    users.student_number,

                    attendance.scan_time,

                    attendance.status,

                    attendance.distance_from_lecturer

                FROM attendance

                INNER JOIN users
                    ON attendance.student_id =
                       users.id

                INNER JOIN lecture_sessions ls
                    ON attendance.session_id =
                       ls.id

                INNER JOIN course_enrollments ce
                    ON ce.student_id =
                       attendance.student_id

                    AND ce.course_id =
                       ls.course_id

                    AND ce.enrolled_at <=
                       ls.created_at

                WHERE attendance.session_id = ?

                ORDER BY
                    attendance.scan_time ASC
            `;

            db.query(
                attendanceQuery,
                [sessionId],
                (
                    err,
                    results
                ) => {

                    if (err) {
                        return res
                            .status(500)
                            .json({
                                error:
                                    err.message
                            });
                    }

                    return res
                        .status(200)
                        .json({
                            message:
                                "Attendance records retrieved successfully.",

                            attendance:
                                results
                        });
                }
            );
        }
    );
};


// =====================================
// LECTURER: ONE SESSION SUMMARY
// =====================================

const getAttendanceSummary = (
    req,
    res
) => {

    const sessionId =
        req.params.sessionId;

    const lecturerId =
        req.user.id;

    const sessionQuery = `
        SELECT *
        FROM lecture_sessions
        WHERE id = ?
        AND created_by = ?
    `;

    db.query(
        sessionQuery,
        [
            sessionId,
            lecturerId
        ],
        (
            err,
            sessionResults
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
                sessionResults.length === 0
            ) {
                return res
                    .status(403)
                    .json({
                        message:
                            "You are not authorized to view this session."
                    });
            }

            const session =
                sessionResults[0];

            /*
                Count only students who were
                enrolled before this session
                was created.
            */

            const enrolledQuery = `
                SELECT COUNT(*) AS total_enrolled
                FROM course_enrollments
                WHERE course_id = ?
                AND enrolled_at <= ?
            `;

            db.query(
                enrolledQuery,
                [
                    session.course_id,
                    session.created_at
                ],
                (
                    err,
                    enrolledResults
                ) => {

                    if (err) {
                        return res
                            .status(500)
                            .json({
                                error:
                                    err.message
                            });
                    }

                    const totalEnrolled =
                        Number(
                            enrolledResults[0]
                                .total_enrolled
                        ) || 0;

                    /*
                        Count eligible students
                        who actually attended.
                    */

                    const presentQuery = `
                        SELECT
                            COUNT(
                                DISTINCT attendance.student_id
                            ) AS total_present

                        FROM attendance

                        INNER JOIN course_enrollments ce
                            ON ce.student_id =
                               attendance.student_id

                        INNER JOIN lecture_sessions ls
                            ON ls.id =
                               attendance.session_id

                        WHERE attendance.session_id = ?

                        AND attendance.status = 'present'

                        AND ce.course_id =
                            ls.course_id

                        AND ce.enrolled_at <=
                            ls.created_at
                    `;

                    db.query(
                        presentQuery,
                        [sessionId],
                        (
                            err,
                            presentResults
                        ) => {

                            if (err) {
                                return res
                                    .status(500)
                                    .json({
                                        error:
                                            err.message
                                    });
                            }

                            const totalPresent =
                                Number(
                                    presentResults[0]
                                        .total_present
                                ) || 0;

                            const totalAbsent =
                                Math.max(
                                    totalEnrolled -
                                    totalPresent,
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
                                        ).toFixed(
                                            2
                                        )
                                    );

                            return res
                                .status(200)
                                .json({
                                    message:
                                        "Attendance summary retrieved successfully.",

                                    summary:
                                    {
                                        session_id:
                                            Number(
                                                sessionId
                                            ),

                                        course_id:
                                            session.course_id,

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
                }
            );
        }
    );
};


// =====================================
// STUDENT: ATTENDANCE HISTORY
// =====================================

const getMyAttendanceHistory = (
    req,
    res
) => {

    const studentId =
        req.user.id;

    /*
        Also verify the student was
        enrolled before each session.
    */

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
            ON attendance.session_id =
               lecture_sessions.id

        INNER JOIN courses
            ON lecture_sessions.course_id =
               courses.id

        INNER JOIN course_enrollments ce
            ON ce.student_id =
               attendance.student_id

            AND ce.course_id =
               lecture_sessions.course_id

            AND ce.enrolled_at <=
               lecture_sessions.created_at

        WHERE attendance.student_id = ?

        ORDER BY
            lecture_sessions.session_date DESC,
            lecture_sessions.start_time DESC
    `;

    db.query(
        query,
        [studentId],
        (
            err,
            results
        ) => {

            if (err) {
                return res
                    .status(500)
                    .json({
                        error:
                            err.message
                    });
            }

            return res
                .status(200)
                .json({
                    message:
                        "Attendance history retrieved successfully.",

                    attendance:
                        results
                });
        }
    );
};


// =====================================
// STUDENT: TRUE ATTENDANCE SUMMARY
// =====================================

const getMyAttendanceSummary = (
    req,
    res
) => {

    const studentId =
        req.user.id;

    /*
        Count only sessions:

        1. belonging to enrolled courses
        2. created after the student's enrollment
        3. that are already completed/closed
    */

    const query = `
        SELECT

            COUNT(
                DISTINCT ls.id
            ) AS total_sessions,

            COUNT(
                DISTINCT CASE
                    WHEN attendance.id IS NOT NULL
                    THEN ls.id
                END
            ) AS total_present

        FROM course_enrollments ce

        INNER JOIN lecture_sessions ls
            ON ce.course_id =
               ls.course_id

            AND ce.enrolled_at <=
               ls.created_at

        LEFT JOIN attendance
            ON attendance.session_id =
               ls.id

            AND attendance.student_id = ?

            AND attendance.status =
                'present'

        WHERE ce.student_id = ?

        AND
        (
            ls.is_active = 0

            OR TIMESTAMP(
                ls.session_date,
                ls.end_time
            ) <= NOW()
        )
    `;

    db.query(
        query,
        [
            studentId,
            studentId
        ],
        (
            err,
            results
        ) => {

            if (err) {
                return res
                    .status(500)
                    .json({
                        error:
                            err.message
                    });
            }

            const totalSessions =
                Number(
                    results[0]
                        .total_sessions
                ) || 0;

            const totalPresent =
                Number(
                    results[0]
                        .total_present
                ) || 0;

            const totalAbsent =
                Math.max(
                    totalSessions -
                    totalPresent,
                    0
                );

            const attendancePercentage =
                totalSessions === 0
                    ? 0
                    : Number(
                        (
                            (
                                totalPresent /
                                totalSessions
                            ) *
                            100
                        ).toFixed(2)
                    );

            return res
                .status(200)
                .json({
                    message:
                        "Student attendance summary retrieved successfully.",

                    summary:
                    {
                        total_sessions:
                            totalSessions,

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
// LECTURER: COURSE ANALYTICS
// =====================================

const getCourseAttendanceStats = (
    req,
    res
) => {

    const courseId =
        req.params.courseId;

    const lecturerId =
        req.user.id;

    // Verify ownership
    const courseQuery = `
        SELECT *
        FROM courses
        WHERE id = ?
        AND lecturer_id = ?
    `;

    db.query(
        courseQuery,
        [
            courseId,
            lecturerId
        ],
        (
            err,
            courseResults
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
                courseResults.length === 0
            ) {
                return res
                    .status(403)
                    .json({
                        message:
                            "You are not authorized to view statistics for this course."
                    });
            }

            /*
                IMPORTANT:

                Each lecture gets its OWN
                historical enrollment count.

                We do NOT use today's course
                enrollment count for every
                historical session.
            */

            const analyticsQuery = `
                SELECT
                    ls.id AS session_id,

                    ls.session_date,

                    ls.start_time,

                    ls.end_time,

                    ls.created_at,

                    ls.is_active,

                    COUNT(
                        DISTINCT ce.student_id
                    ) AS total_enrolled,

                    COUNT(
                        DISTINCT CASE
                            WHEN attendance.status =
                                'present'
                            THEN attendance.student_id
                        END
                    ) AS total_present

                FROM lecture_sessions ls

                LEFT JOIN course_enrollments ce
                    ON ce.course_id =
                       ls.course_id

                    AND ce.enrolled_at <=
                       ls.created_at

                LEFT JOIN attendance
                    ON attendance.session_id =
                       ls.id

                    AND attendance.student_id =
                       ce.student_id

                    AND attendance.status =
                        'present'

                WHERE ls.course_id = ?

                GROUP BY
                    ls.id,
                    ls.session_date,
                    ls.start_time,
                    ls.end_time,
                    ls.created_at,
                    ls.is_active

                ORDER BY
                    ls.session_date ASC,
                    ls.start_time ASC
            `;

            db.query(
                analyticsQuery,
                [courseId],
                (
                    err,
                    results
                ) => {

                    if (err) {
                        return res
                            .status(500)
                            .json({
                                error:
                                    err.message
                            });
                    }

                    const sessionStatistics =
                        results.map(
                            (
                                session
                            ) => {

                                const totalEnrolled =
                                    Number(
                                        session
                                            .total_enrolled
                                    ) || 0;

                                const totalPresent =
                                    Number(
                                        session
                                            .total_present
                                    ) || 0;

                                const totalAbsent =
                                    Math.max(
                                        totalEnrolled -
                                        totalPresent,
                                        0
                                    );

                                const percentage =
                                    totalEnrolled ===
                                    0
                                        ? 0
                                        : Number(
                                            (
                                                (
                                                    totalPresent /
                                                    totalEnrolled
                                                ) *
                                                100
                                            ).toFixed(
                                                2
                                            )
                                        );

                                return {
                                    session_id:
                                        session.session_id,

                                    session_date:
                                        session.session_date,

                                    start_time:
                                        session.start_time,

                                    end_time:
                                        session.end_time,

                                    is_active:
                                        session.is_active,

                                    total_enrolled:
                                        totalEnrolled,

                                    total_present:
                                        totalPresent,

                                    total_absent:
                                        totalAbsent,

                                    attendance_percentage:
                                        percentage
                                };
                            }
                        );

                    const totalPercentages =
                        sessionStatistics.reduce(
                            (
                                sum,
                                session
                            ) =>
                                sum +
                                session
                                    .attendance_percentage,
                            0
                        );

                    const averageAttendance =
                        sessionStatistics.length ===
                        0
                            ? 0
                            : Number(
                                (
                                    totalPercentages /
                                    sessionStatistics.length
                                ).toFixed(
                                    2
                                )
                            );

                    /*
                        Current enrollment is still
                        useful as a top-level course
                        statistic.

                        Historical sessions use their
                        own enrollment counts.
                    */

                    const currentEnrollmentQuery = `
                        SELECT
                            COUNT(*) AS total_enrolled
                        FROM course_enrollments
                        WHERE course_id = ?
                    `;

                    db.query(
                        currentEnrollmentQuery,
                        [courseId],
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

                            const currentTotalEnrolled =
                                Number(
                                    enrollmentResults[0]
                                        .total_enrolled
                                ) || 0;

                            return res
                                .status(200)
                                .json({
                                    message:
                                        "Course attendance statistics retrieved successfully.",

                                    statistics:
                                    {
                                        course_id:
                                            Number(
                                                courseId
                                            ),

                                        course_code:
                                            courseResults[0]
                                                .course_code,

                                        course_name:
                                            courseResults[0]
                                                .course_name,

                                        total_enrolled:
                                            currentTotalEnrolled,

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
};


// =====================================
// EXPORTS
// =====================================

module.exports = {
    scanQRCode,
    getSessionAttendance,
    getAttendanceSummary,
    getMyAttendanceHistory,
    getMyAttendanceSummary,
    getCourseAttendanceStats
};