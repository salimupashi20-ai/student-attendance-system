import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function LecturerDashboard() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");

  const [message, setMessage] = useState("");

  const [sessionData, setSessionData] = useState(null);
  const [sessionMessage, setSessionMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // Fetch lecturer's courses
  const fetchCourses = async () => {
    try {
      const response = await axios.get(
        "/api/courses",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setCourses(response.data.courses);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to load courses."
      );
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Create a new course
  const handleCreateCourse = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "/api/courses",
        {
          course_code: courseCode,
          course_name: courseName
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage("Course created successfully!");

      setCourseCode("");
      setCourseName("");

      fetchCourses();

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to create course."
      );
    }
  };

  // Start attendance session
  const handleStartAttendance = (courseId) => {
    setSessionMessage("Getting your location...");
    setSessionData(null);

    if (!navigator.geolocation) {
      setSessionMessage(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          const now = new Date();

          const sessionDate =
            now.toISOString().split("T")[0];

          const startTime =
            now.toTimeString().split(" ")[0];

          // Temporary default lecture length: 90 minutes
          const endDate = new Date(
            now.getTime() + 90 * 60 * 1000
          );

          const endTime =
            endDate.toTimeString().split(" ")[0];

          const response = await axios.post(
            "/api/sessions",
            {
              course_id: courseId,
              session_date: sessionDate,
              start_time: startTime,
              end_time: endTime,
              lecturer_latitude: latitude,
              lecturer_longitude: longitude
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          setSessionData(response.data);

          setSessionMessage(
            "Attendance session started successfully!"
          );

        } catch (error) {
          setSessionMessage(
            error.response?.data?.message ||
            "Failed to start attendance session."
          );
        }
      },

      (error) => {
        console.error(error);

        setSessionMessage(
          "Location permission is required to start attendance."
        );
      }
    );
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div>
      <h1>Lecturer Dashboard</h1>

      <p>
        Welcome, {user?.full_name}
      </p>

      <p>
        Staff ID: {user?.staff_id}
      </p>

      <button onClick={handleLogout}>
        Logout
      </button>

      <hr />

      {/* CREATE COURSE */}

      <h2>Create Course</h2>

      <form onSubmit={handleCreateCourse}>
        <div>
          <label>
            Course Code
          </label>

          <input
            type="text"
            value={courseCode}
            onChange={(e) =>
              setCourseCode(e.target.value)
            }
            required
          />
        </div>

        <div>
          <label>
            Course Name
          </label>

          <input
            type="text"
            value={courseName}
            onChange={(e) =>
              setCourseName(e.target.value)
            }
            required
          />
        </div>

        <button type="submit">
          Create Course
        </button>
      </form>

      {message && (
        <p>{message}</p>
      )}

      <hr />

      {/* COURSE LIST */}

      <h2>My Courses</h2>

      {courses.length === 0 ? (
        <p>No courses found.</p>
      ) : (
        <div>
          {courses.map((course) => (
            <div key={course.id}>

              <h3>
                {course.course_code}
              </h3>

              <p>
                {course.course_name}
              </p>

              <p>
                Course ID: {course.id}
              </p>

              <button
                onClick={() =>
                  handleStartAttendance(course.id)
                }
              >
                Start Attendance
              </button>

              <hr />

            </div>
          ))}
        </div>
      )}

      {/* SESSION / QR SECTION */}

      {sessionMessage && (
        <p>{sessionMessage}</p>
      )}

      {sessionData && (
        <div>
          <h2>
            Attendance QR Code
          </h2>

          <p>
            Session ID:{" "}
            {sessionData.session.id}
          </p>

          <p>
            Course ID:{" "}
            {sessionData.session.course_id}
          </p>

          <p>
            Allowed radius:{" "}
            {sessionData.session.allowed_radius} metres
          </p>

          <p>
            QR expires at:{" "}
            {new Date(
              sessionData.session.qr_expires_at
            ).toLocaleTimeString()}
          </p>

          <img
            src={sessionData.qr_code}
            alt="Attendance QR Code"
            width="300"
            height="300"
          />

          <p>
            Students must scan this QR code
            within the 15-minute attendance window.
          </p>
        </div>
      )}
    </div>
  );
}

export default LecturerDashboard;