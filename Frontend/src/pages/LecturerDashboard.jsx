import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";

function LecturerDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // =========================
  // COURSES
  // =========================

  const [courses, setCourses] = useState([]);
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(true);

  // =========================
  // SESSIONS
  // =========================

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [sessionData, setSessionData] = useState(null);
  const [sessionMessage, setSessionMessage] = useState("");

  // =========================
  // ATTENDANCE DETAILS
  // =========================

  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // =========================
  // MESSAGES
  // =========================

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================
  // FETCH COURSES
  // =========================

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

      setCourses(response.data.courses || []);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load courses."
      );

    } finally {
      setLoadingCourses(false);
    }
  };

  // =========================
  // FETCH SESSIONS
  // =========================

  const fetchSessions = async () => {
    try {
      const response = await axios.get(
        "/api/sessions",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSessions(response.data.sessions || []);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load attendance sessions."
      );

    } finally {
      setLoadingSessions(false);
    }
  };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    fetchCourses();
    fetchSessions();
  }, []);

  // =========================
  // CREATE COURSE
  // =========================

  const handleCreateCourse = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

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

      setMessage("Course created successfully.");

      setCourseCode("");
      setCourseName("");

      fetchCourses();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to create course."
      );
    }
  };

  // =========================
  // START ATTENDANCE
  // =========================

  const handleStartAttendance = (courseId) => {
    setSessionMessage("Getting your location...");
    setSessionData(null);
    setError("");

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
          const accuracy = position.coords.accuracy;

          console.log("Lecturer latitude:", latitude);
          console.log("Lecturer longitude:", longitude);
          console.log(
            "Lecturer location accuracy:",
            accuracy,
            "metres"
          );

          // Prevent creation using poor lecturer coordinates
          if (accuracy > 50) {
            setSessionMessage(
              `Your current location is only accurate to about ${Math.round(
                accuracy
              )} metres. Please wait a few seconds and try again.`
            );

            return;
          }

          const now = new Date();

          const sessionDate =
            now.toISOString().split("T")[0];

          const startTime =
            now.toTimeString().split(" ")[0];

          // Temporary default lecture duration: 90 minutes
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
            "Attendance session started successfully."
          );

          fetchSessions();

        } catch (err) {
          setSessionMessage(
            err.response?.data?.message ||
            "Failed to start attendance session."
          );
        }
      },

      (geoError) => {
        console.error(geoError);

        if (geoError.code === 1) {
          setSessionMessage(
            "Location permission was denied."
          );
        } else if (geoError.code === 2) {
          setSessionMessage(
            "Your location could not be determined."
          );
        } else if (geoError.code === 3) {
          setSessionMessage(
            "Location request timed out."
          );
        } else {
          setSessionMessage(
            "Location permission is required to start attendance."
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // =========================
  // CLOSE SESSION
  // =========================

  const handleCloseSession = async (sessionId) => {
    const confirmed = window.confirm(
      "Close this attendance session?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await axios.patch(
        `/api/sessions/${sessionId}/close`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage(
        response.data.message ||
        "Attendance session closed successfully."
      );

      if (
        sessionData?.session?.id === sessionId
      ) {
        setSessionData(null);
      }

      fetchSessions();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to close attendance session."
      );
    }
  };

  // =========================
  // VIEW SESSION ATTENDANCE
  // =========================

  const handleViewAttendance = async (session) => {
    setSelectedSession(session);
    setAttendanceRecords([]);
    setAttendanceSummary(null);
    setLoadingAttendance(true);
    setMessage("");
    setError("");

    try {
      const [attendanceResponse, summaryResponse] =
        await Promise.all([
          axios.get(
            `/api/attendance/session/${session.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          ),

          axios.get(
            `/api/attendance/session/${session.id}/summary`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )
        ]);

      setAttendanceRecords(
        attendanceResponse.data.attendance ||
        attendanceResponse.data.records ||
        []
      );

      setAttendanceSummary(
        summaryResponse.data.summary ||
        summaryResponse.data
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to retrieve session attendance."
      );

    } finally {
      setLoadingAttendance(false);
    }
  };

  // =========================
  // CLOSE ATTENDANCE DETAILS
  // =========================

  const handleCloseAttendanceDetails = () => {
    setSelectedSession(null);
    setAttendanceRecords([]);
    setAttendanceSummary(null);
  };

  // =========================
  // STATS
  // =========================

  const stats = useMemo(() => {
    const activeSessions = sessions.filter(
      (session) =>
        Number(session.is_active) === 1
    ).length;

    return {
      courses: courses.length,
      totalSessions: sessions.length,
      activeSessions,
      closedSessions:
        sessions.length - activeSessions
    };
  }, [courses, sessions]);

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="dashboard-page">

      {/* TOPBAR */}

      <header className="topbar">

        <div>
          <h2 className="brand-title">
            Student Attendance System
          </h2>

          <p className="brand-subtitle">
            Lecturer Portal
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </header>

      <main className="dashboard-container">

        {/* WELCOME */}

        <section className="welcome-section">

          <p className="welcome-label">
            Welcome back
          </p>

          <h1>
            {user?.full_name || "Lecturer"}
          </h1>

          <p className="muted-text">
            Staff ID:{" "}
            <strong>
              {user?.staff_id || "N/A"}
            </strong>
          </p>

        </section>

        {/* STATS */}

        <section className="stats-grid">

          <div className="stat-card">
            <span className="stat-label">
              My Courses
            </span>

            <strong className="stat-value">
              {stats.courses}
            </strong>

            <span className="stat-description">
              Assigned courses
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              Total Sessions
            </span>

            <strong className="stat-value">
              {stats.totalSessions}
            </strong>

            <span className="stat-description">
              Attendance sessions created
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              Active Sessions
            </span>

            <strong className="stat-value">
              {stats.activeSessions}
            </strong>

            <span className="stat-description">
              Sessions currently open
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              Closed Sessions
            </span>

            <strong className="stat-value">
              {stats.closedSessions}
            </strong>

            <span className="stat-description">
              Completed attendance sessions
            </span>
          </div>

        </section>

        {/* MESSAGES */}

        {message && (
          <div
            className="success-message"
            style={{ marginBottom: "20px" }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="error-message"
            style={{ marginBottom: "20px" }}
          >
            {error}
          </div>
        )}

        {/* CREATE COURSE */}

        <section className="content-card">

          <div className="section-header">
            <div>
              <h2>
                Create Course
              </h2>

              <p className="muted-text">
                Add a course to your lecturer account.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateCourse}>

            <div className="form-grid">

              <div className="form-group">
                <label>
                  Course Code
                </label>

                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) =>
                    setCourseCode(e.target.value)
                  }
                  placeholder="Example: CSC4035"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Course Name
                </label>

                <input
                  type="text"
                  value={courseName}
                  onChange={(e) =>
                    setCourseName(e.target.value)
                  }
                  placeholder="Enter course name"
                  required
                />
              </div>

            </div>

            <div style={{ marginTop: "20px" }}>
              <button
                className="primary-button"
                type="submit"
              >
                Create Course
              </button>
            </div>

          </form>

        </section>

        {/* MY COURSES */}

        <section className="content-card">

          <div className="section-header">
            <div>
              <h2>
                My Courses
              </h2>

              <p className="muted-text">
                Start an attendance session for a course.
              </p>
            </div>
          </div>

          {loadingCourses ? (
            <p className="muted-text">
              Loading courses...
            </p>

          ) : courses.length === 0 ? (

            <div className="empty-state">
              <h3>
                No courses found
              </h3>

              <p>
                Your assigned courses will appear here.
              </p>
            </div>

          ) : (

            <div className="course-grid">

              {courses.map((course) => (
                <div
                  className="course-card"
                  key={course.id}
                >

                  <div>
                    <span className="course-code">
                      {course.course_code}
                    </span>

                    <h3>
                      {course.course_name}
                    </h3>

                    <p className="muted-text">
                      Course ID: {course.id}
                    </p>
                  </div>

                  <button
                    className="primary-button"
                    onClick={() =>
                      handleStartAttendance(course.id)
                    }
                  >
                    Start Attendance
                  </button>

                </div>
              ))}

            </div>
          )}

        </section>

        {/* SESSION MESSAGE */}

        {sessionMessage && (
          <div
            className={
              sessionMessage
                .toLowerCase()
                .includes("success")
                ? "success-message"
                : "info-box"
            }
            style={{ marginBottom: "20px" }}
          >
            {sessionMessage}
          </div>
        )}

        {/* ACTIVE QR */}

        {sessionData && (
          <section className="content-card">

            <div className="section-header">

              <div>
                <h2>
                  Active Attendance Session
                </h2>

                <p className="muted-text">
                  Students should scan this QR code.
                </p>
              </div>

              <span className="status-badge status-present">
                Active
              </span>

            </div>

            <div className="qr-layout">

              <div className="qr-card">

                <img
                  src={sessionData.qr_code}
                  alt="Attendance QR Code"
                  className="qr-image"
                />

              </div>

              <div className="session-details">

                <div className="detail-row">
                  <span>
                    Session ID
                  </span>

                  <strong>
                    {sessionData.session.id}
                  </strong>
                </div>

                <div className="detail-row">
                  <span>
                    Course ID
                  </span>

                  <strong>
                    {sessionData.session.course_id}
                  </strong>
                </div>

                <div className="detail-row">
                  <span>
                    Allowed Radius
                  </span>

                  <strong>
                    {sessionData.session.allowed_radius}m
                  </strong>
                </div>

                <div className="detail-row">
                  <span>
                    QR Expires
                  </span>

                  <strong>
                    {new Date(
                      sessionData.session.qr_expires_at
                    ).toLocaleTimeString()}
                  </strong>
                </div>

                <button
                  className="danger-button"
                  onClick={() =>
                    handleCloseSession(
                      sessionData.session.id
                    )
                  }
                >
                  Close Attendance Session
                </button>

              </div>

            </div>

          </section>
        )}

        {/* SESSION HISTORY */}

        <section className="content-card">

          <div className="section-header">

            <div>
              <h2>
                Attendance Sessions
              </h2>

              <p className="muted-text">
                View and manage previous lecture sessions.
              </p>
            </div>

          </div>

          {loadingSessions ? (
            <p className="muted-text">
              Loading sessions...
            </p>

          ) : sessions.length === 0 ? (

            <div className="empty-state">
              <h3>
                No sessions found
              </h3>

              <p>
                Attendance sessions will appear here
                after you create one.
              </p>
            </div>

          ) : (

            <div className="table-wrapper">

              <table className="dashboard-table">

                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {sessions.map((session) => {

                    const isActive =
                      Number(session.is_active) === 1;

                    return (
                      <tr key={session.id}>

                        <td>
                          <span className="course-code">
                            {session.course_code}
                          </span>

                          {" "}

                          {session.course_name}
                        </td>

                        <td>
                          {session.session_date
                            ? new Date(
                                session.session_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>

                        <td>
                          {session.start_time}
                          {" - "}
                          {session.end_time}
                        </td>

                        <td>
                          <span
                            className={
                              isActive
                                ? "status-badge status-present"
                                : "status-badge"
                            }
                          >
                            {isActive
                              ? "Active"
                              : "Closed"}
                          </span>
                        </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap"
                            }}
                          >

                            <button
                              className="secondary-button"
                              onClick={() =>
                                handleViewAttendance(
                                  session
                                )
                              }
                            >
                              View Attendance
                            </button>

                            {isActive && (
                              <button
                                className="danger-button"
                                onClick={() =>
                                  handleCloseSession(
                                    session.id
                                  )
                                }
                              >
                                Close
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* ATTENDANCE DETAILS */}

        {selectedSession && (
          <section className="content-card">

            <div className="section-header">

              <div>
                <h2>
                  Session Attendance
                </h2>

                <p className="muted-text">
                  {selectedSession.course_code}
                  {" — "}
                  {selectedSession.course_name}
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={
                  handleCloseAttendanceDetails
                }
              >
                Close View
              </button>

            </div>

            {loadingAttendance ? (

              <p className="muted-text">
                Loading attendance...
              </p>

            ) : (

              <>
                {/* SUMMARY */}

                {attendanceSummary && (
                  <div
                    className="stats-grid"
                    style={{
                      marginBottom: "25px"
                    }}
                  >

                    <div className="stat-card">
                      <span className="stat-label">
                        Enrolled
                      </span>

                      <strong className="stat-value">
                        {attendanceSummary.total_enrolled ??
                          attendanceSummary.totalEnrolled ??
                          0}
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">
                        Present
                      </span>

                      <strong className="stat-value">
                        {attendanceSummary.present ??
                          0}
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">
                        Absent
                      </span>

                      <strong className="stat-value">
                        {attendanceSummary.absent ??
                          0}
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">
                        Attendance
                      </span>

                      <strong className="stat-value">
                        {attendanceSummary.attendance_percentage ??
                          attendanceSummary.percentage ??
                          0}
                        %
                      </strong>
                    </div>

                  </div>
                )}

                {/* ATTENDANCE TABLE */}

                {attendanceRecords.length === 0 ? (

                  <div className="empty-state">
                    <h3>
                      No attendance recorded
                    </h3>

                    <p>
                      No students have marked attendance
                      for this session yet.
                    </p>
                  </div>

                ) : (

                  <div className="table-wrapper">

                    <table className="dashboard-table">

                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Student Number</th>
                          <th>Scan Time</th>
                          <th>Distance</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>

                        {attendanceRecords.map(
                          (record, index) => (
                            <tr
                              key={
                                record.id ||
                                `${record.student_id}-${index}`
                              }
                            >

                              <td>
                                <strong>
                                  {record.full_name ||
                                    record.student_name ||
                                    "N/A"}
                                </strong>
                              </td>

                              <td>
                                {record.student_number ||
                                  "N/A"}
                              </td>

                              <td>
                                {record.scan_time
                                  ? new Date(
                                      record.scan_time
                                    ).toLocaleTimeString()
                                  : "N/A"}
                              </td>

                              <td>
                                {record.distance_from_lecturer ??
                                  record.distance ??
                                  "N/A"}
                                {" m"}
                              </td>

                              <td>
                                <span className="status-badge status-present">
                                  {record.status ||
                                    "Present"}
                                </span>
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                )}
              </>
            )}

          </section>
        )}

      </main>
    </div>
  );
}

export default LecturerDashboard;