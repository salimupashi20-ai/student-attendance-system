const express = require("express");
const db = require("../config/db");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

const validText = (value) =>
  typeof value === "string" &&
  value.trim().length >= 2 &&
  value.trim().length <= 100;

const validCoordinate = (value, min, max) =>
  (typeof value === "number" ||
    (typeof value === "string" && value.trim() !== "")) &&
  Number.isFinite(Number(value)) &&
  Number(value) >= min &&
  Number(value) <= max;

function validateClassroom(body) {
  const {
    building_name,
    room_name,
    latitude,
    longitude,
    allowed_radius = 50
  } = body;

  if (!validText(building_name) || !validText(room_name)) {
    return "Provide a building and room name (2–100 characters each).";
  }

  if (
    !validCoordinate(latitude, -90, 90) ||
    !validCoordinate(longitude, -180, 180)
  ) {
    return "Provide valid latitude (-90 to 90) and longitude (-180 to 180).";
  }

  const radius = Number(allowed_radius);
  if (!Number.isInteger(radius) || radius < 10 || radius > 50) {
    return "Attendance radius must be an integer between 10 and 50 metres.";
  }

  return null;
}

function handleDbError(error, res) {
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      message: "A classroom with this building and room name already exists."
    });
  }
  console.error("Classroom management error:", error);
  return res.status(500).json({
    message: "Unable to save classroom information."
  });
}

// Lecturers see active approved classrooms for the classroom QR selector.
// Keep GPS coordinates on the server rather than revealing them in this listing.
router.get(
  "/",
  protect,
  authorizeRoles("admin", "lecturer"),
  async (req, res) => {
    try {
      const [classrooms] = await db.promise().query(`
        SELECT id, building_name, room_name, allowed_radius
        FROM classrooms
        WHERE is_active = 1
        ORDER BY building_name, room_name
      `);
      return res.json({ classrooms });
    } catch (error) {
      console.error("Classroom lookup error:", error);
      return res.status(500).json({
        message: "Unable to retrieve approved classrooms."
      });
    }
  }
);

// Administrators can list *all* classrooms including inactive ones.
router.get(
  "/manage",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const [classrooms] = await db.promise().query(`
        SELECT id, building_name, room_name, latitude, longitude,
               allowed_radius, is_active, created_at
        FROM classrooms
        ORDER BY is_active DESC, building_name, room_name
      `);
      return res.json({ classrooms });
    } catch (error) {
      console.error("Classroom admin lookup error:", error);
      return res.status(500).json({
        message: "Unable to retrieve classroom locations."
      });
    }
  }
);

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    const problem = validateClassroom(req.body);
    if (problem) return res.status(400).json({ message: problem });

    const {
      building_name,
      room_name,
      latitude,
      longitude,
      allowed_radius = 50
    } = req.body;

    try {
      const [result] = await db.promise().execute(`
        INSERT INTO classrooms (
          building_name, room_name, latitude, longitude,
          allowed_radius, is_active
        ) VALUES (?, ?, ?, ?, ?, 1)
      `, [
        building_name.trim(),
        room_name.trim(),
        Number(latitude),
        Number(longitude),
        Number(allowed_radius)
      ]);

      return res.status(201).json({
        message: "Approved classroom registered successfully.",
        classroom_id: result.insertId
      });
    } catch (error) {
      return handleDbError(error, res);
    }
  }
);

// Update details or deactivate/reactivate; NEVER delete historical classrooms.
router.put(
  "/:classroomId",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    const id = Number(req.params.classroomId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid classroom ID." });
    }

    const problem = validateClassroom(req.body);
    if (problem) return res.status(400).json({ message: problem });

    const active = req.body.is_active;
    if (![true, false, 1, 0].includes(active)) {
      return res.status(400).json({
        message: "Classroom status must be active or inactive."
      });
    }

    try {
      const [result] = await db.promise().execute(`
        UPDATE classrooms
        SET building_name = ?, room_name = ?, latitude = ?, longitude = ?,
            allowed_radius = ?, is_active = ?
        WHERE id = ?
      `, [
        req.body.building_name.trim(),
        req.body.room_name.trim(),
        Number(req.body.latitude),
        Number(req.body.longitude),
        Number(req.body.allowed_radius ?? 50),
        active ? 1 : 0,
        id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Classroom not found." });
      }

      return res.json({ message: "Classroom updated successfully." });
    } catch (error) {
      return handleDbError(error, res);
    }
  }
);

module.exports = router;
