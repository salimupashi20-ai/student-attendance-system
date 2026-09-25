const crypto = require("crypto");
const QRCode = require("qrcode");
const db = require("../config/db");

// Use mysql2's promise wrapper
const promiseDb = db.promise();


// ============================================
// CREATE MOBILE LOCATION REQUEST
// POST /api/location-requests
// Lecturer only
// ============================================

exports.createLocationRequest = async (req, res) => {
  try {
    const lecturerId = req.user.id;

    const {
      course_id,
      session_date,
      start_time,
      end_time
    } = req.body;

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

    // =========================
    // VERIFY COURSE OWNERSHIP
    // =========================

    const [courses] =
      await promiseDb.query(
        `
        SELECT
          id,
          course_code,
          course_name,
          lecturer_id
        FROM courses
        WHERE id = ?
          AND lecturer_id = ?
        `,
        [
          course_id,
          lecturerId
        ]
      );

    if (courses.length === 0) {
      return res.status(403).json({
        message:
          "You are not authorized to create attendance for this course."
      });
    }

    // =========================
    // EXPIRE OLD REQUESTS
    // =========================

    await promiseDb.query(
      `
      UPDATE lecturer_location_requests
      SET status = 'expired'
      WHERE lecturer_id = ?
        AND status = 'pending'
        AND expires_at <= NOW()
      `,
      [lecturerId]
    );

    // =========================
    // GENERATE TOKEN
    // =========================

    const requestToken =
      crypto
        .randomBytes(32)
        .toString("hex");

    // 5-minute setup QR lifetime
    const expiresAt =
      new Date(
        Date.now() +
        5 * 60 * 1000
      );

    // =========================
    // CREATE REQUEST
    // =========================

    const [result] =
      await promiseDb.query(
        `
        INSERT INTO lecturer_location_requests
        (
          lecturer_id,
          course_id,
          session_date,
          start_time,
          end_time,
          request_token,
          expires_at,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        `,
        [
          lecturerId,
          course_id,
          session_date,
          start_time,
          end_time,
          requestToken,
          expiresAt
        ]
      );

    // =========================
    // BUILD PHONE URL
    // =========================

    const frontendUrl =
      process.env.FRONTEND_URL.replace(
        /\/$/,
        ""
      );

    const mobileUrl =
      `${frontendUrl}/lecturer/mobile-location` +
      `?request_id=${result.insertId}` +
      `&token=${requestToken}`;

    // =========================
    // GENERATE SETUP QR
    // =========================

    const setupQrCode =
      await QRCode.toDataURL(
        mobileUrl
      );

    return res.status(201).json({
      message:
        "Mobile location request created.",

      request: {
        id:
          result.insertId,

        course_id,

        course_code:
          courses[0].course_code,

        course_name:
          courses[0].course_name,

        expires_at:
          expiresAt
      },

      setup_qr_code:
        setupQrCode,

      mobile_url:
        mobileUrl
    });

  } catch (error) {
    console.error(
      "CREATE LOCATION REQUEST ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create mobile location request."
    });
  }
};


// ============================================
// SUBMIT MOBILE LOCATION
// POST /api/location-requests/:requestId/location
// Public but protected by random token
// ============================================

exports.submitMobileLocation =
  async (req, res) => {

    try {
      const {
        requestId
      } = req.params;

      const {
        token,
        latitude,
        longitude,
        accuracy
      } = req.body;

      if (
        !token ||
        latitude === undefined ||
        longitude === undefined
      ) {
        return res.status(400).json({
          message:
            "Token and location coordinates are required."
        });
      }

      // =========================
      // FIND REQUEST
      // =========================

      const [requests] =
        await promiseDb.query(
          `
          SELECT *
          FROM lecturer_location_requests
          WHERE id = ?
            AND request_token = ?
          LIMIT 1
          `,
          [
            requestId,
            token
          ]
        );

      if (
        requests.length === 0
      ) {
        return res.status(404).json({
          message:
            "Invalid mobile location request."
        });
      }

      const request =
        requests[0];

      // =========================
      // STATUS CHECKS
      // =========================

      if (
        request.status === "used"
      ) {
        return res.status(409).json({
          message:
            "This mobile location request has already been used."
        });
      }

      if (
        request.status ===
        "completed"
      ) {
        return res.status(409).json({
          message:
            "A location has already been submitted for this request."
        });
      }

      if (
        request.status ===
        "expired"
      ) {
        return res.status(410).json({
          message:
            "This mobile location request has expired."
        });
      }

      // =========================
      // EXPIRY CHECK
      // =========================

      if (
        new Date() >
        new Date(
          request.expires_at
        )
      ) {
        await promiseDb.query(
          `
          UPDATE lecturer_location_requests
          SET status = 'expired'
          WHERE id = ?
          `,
          [requestId]
        );

        return res.status(410).json({
          message:
            "This mobile location request has expired."
        });
      }

      // =========================
      // COORDINATE VALIDATION
      // =========================

      const numericLatitude =
        Number(latitude);

      const numericLongitude =
        Number(longitude);

      const numericAccuracy =
        accuracy !== undefined &&
        accuracy !== null
          ? Number(accuracy)
          : null;

      if (
        Number.isNaN(
          numericLatitude
        ) ||
        Number.isNaN(
          numericLongitude
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid location coordinates."
        });
      }

      if (
        numericLatitude < -90 ||
        numericLatitude > 90 ||
        numericLongitude < -180 ||
        numericLongitude > 180
      ) {
        return res.status(400).json({
          message:
            "Location coordinates are outside the valid range."
        });
      }

      // =========================
      // STORE PHONE LOCATION
      // =========================

      await promiseDb.query(
        `
        UPDATE lecturer_location_requests
        SET
          latitude = ?,
          longitude = ?,
          accuracy = ?,
          status = 'completed'
        WHERE id = ?
        `,
        [
          numericLatitude,
          numericLongitude,
          numericAccuracy,
          requestId
        ]
      );

      return res.json({
        message:
          "Lecturer location submitted successfully."
      });

    } catch (error) {
      console.error(
        "SUBMIT MOBILE LOCATION ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to submit lecturer location."
      });
    }
  };


// ============================================
// GET REQUEST STATUS
// GET /api/location-requests/:requestId/status
// Lecturer only
// ============================================

exports.getLocationRequestStatus =
  async (req, res) => {

    try {
      const lecturerId =
        req.user.id;

      const {
        requestId
      } = req.params;

      const [requests] =
        await promiseDb.query(
          `
          SELECT
            lr.*,
            c.course_code,
            c.course_name
          FROM lecturer_location_requests lr

          JOIN courses c
            ON c.id = lr.course_id

          WHERE lr.id = ?
            AND lr.lecturer_id = ?

          LIMIT 1
          `,
          [
            requestId,
            lecturerId
          ]
        );

      if (
        requests.length === 0
      ) {
        return res.status(404).json({
          message:
            "Location request not found."
        });
      }

      const request =
        requests[0];

      // =========================
      // CHECK EXPIRATION
      // =========================

      if (
        request.status ===
          "pending" &&
        new Date() >
          new Date(
            request.expires_at
          )
      ) {
        await promiseDb.query(
          `
          UPDATE lecturer_location_requests
          SET status = 'expired'
          WHERE id = ?
          `,
          [requestId]
        );

        request.status =
          "expired";
      }

      return res.json({
        request: {
          id:
            request.id,

          status:
            request.status,

          course_id:
            request.course_id,

          course_code:
            request.course_code,

          course_name:
            request.course_name,

          latitude:
            request.latitude,

          longitude:
            request.longitude,

          accuracy:
            request.accuracy,

          session_date:
            request.session_date,

          start_time:
            request.start_time,

          end_time:
            request.end_time,

          expires_at:
            request.expires_at
        }
      });

    } catch (error) {
      console.error(
        "LOCATION REQUEST STATUS ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to check mobile location request."
      });
    }
  };


// ============================================
// MARK REQUEST AS USED
// PATCH /api/location-requests/:requestId/used
// Lecturer only
// ============================================

exports.markLocationRequestUsed =
  async (req, res) => {

    try {
      const lecturerId =
        req.user.id;

      const {
        requestId
      } = req.params;

      const [requests] =
        await promiseDb.query(
          `
          SELECT
            id,
            status
          FROM lecturer_location_requests
          WHERE id = ?
            AND lecturer_id = ?
          LIMIT 1
          `,
          [
            requestId,
            lecturerId
          ]
        );

      if (
        requests.length === 0
      ) {
        return res.status(404).json({
          message:
            "Location request not found."
        });
      }

      if (
        requests[0].status !==
        "completed"
      ) {
        return res.status(400).json({
          message:
            "Only a completed location request can be marked as used."
        });
      }

      await promiseDb.query(
        `
        UPDATE lecturer_location_requests
        SET status = 'used'
        WHERE id = ?
        `,
        [requestId]
      );

      return res.json({
        message:
          "Mobile location request marked as used."
      });

    } catch (error) {
      console.error(
        "MARK LOCATION REQUEST USED ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update mobile location request."
      });
    }
  };