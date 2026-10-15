
require("dotenv").config();

const express = require("express");
const cors = require("cors");

require("./config/db");

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const adminRoutes = require("./routes/adminRoutes");
const locationRequestRoutes =
    require("./routes/locationRequestRoutes");

const moodleRoutes = require("./routes/moodleRoutes");

// Approved classroom locations
const classroomRoutes = require("./routes/classroomRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/location-requests", locationRequestRoutes);

app.use("/api/moodle", moodleRoutes);

// New classroom API
app.use("/api/classrooms", classroomRoutes);

app.get("/", (req, res) => {
    res.send("Student Attendance System API is running!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
