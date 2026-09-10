import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const token = localStorage.getItem("token");

  // =========================
  // STATE
  // =========================

  const [attendanceHistory, setAttendanceHistory] =
    useState([]);

  const [courses, setCourses] =
    useState([]);

  const [attendanceSummary, setAttendanceSummary] =
    useState({
      total_sessions: 0,
      total_present: 0,
      total_absent: 0,
      attendance_percentage: 0
    });

  const [loadingAttendance, setLoadingAttendance] =
    useState(true);

  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [loadingSummary, setLoadingSummary] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================
  // FETCH ATTENDANCE HISTORY
  // =========================

  const fetchAttendanceHistory = async () => {
    try {
      const response = await axios.get(
        "/api/attendance/my-history",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAttendanceHistory(
        response.data.attendance ||
        response.data.history ||
        response.data.records ||
        []
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load attendance history."
      );

    } finally {
      setLoadingAttendance(false);
    }
  };

  // =========================
  // FETCH ENROLLED COURSES
  // =========================

  const fetchCourses = async () => {
    try {
      const response = await axios.get(
        "/api/enrollments/my-courses",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setCourses(
        response.data.courses || []
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load enrolled courses."
      );

    } finally {
      setLoadingCourses(false);
    }
  };

  // =========================
  // FETCH TRUE ATTENDANCE SUMMARY
  // =========================

  const fetchAttendanceSummary = async () => {
    try {
      const response = await axios.get(
        "/api/attendance/my-summary",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAttendanceSummary(
        response.data.summary || {
          total_sessions: 0,
          total_present: 0,
          total_absent: 0,
          attendance_percentage: 0
        }
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load attendance summary."
      );

    } finally {
      setLoadingSummary(false);
    }
  };

  // =========================
  // LOAD DASHBOARD DATA
  // =========================

  useEffect(() => {
    fetchAttendanceHistory();
    fetchCourses();
    fetchAttendanceSummary();
  }, []);

  // =========================
  // DASHBOARD STATS
  // =========================

  const stats = useMemo(() => {
    return {
      attendanceRate:
        attendanceSummary.attendance_percentage || 0,

      present:
        attendanceSummary.total_present || 0,

      absent:
        attendanceSummary.total_absent || 0,

      totalSessions:
        attendanceSummary.total_sessions || 0,

      courses:
        courses.length
    };
  }, [
    attendanceSummary,
    courses
  ]);

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

      {/* =========================
          HEADER
      ========================= */}

      <header className="topbar">

        <div>
          <h2 className="brand-title">
            Student Attendance System
          </h2>

          <p className="brand-subtitle">
            Student Portal
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

        {/* =========================
            WELCOME
        ========================= */}

        <section className="welcome-section">

          <p className="welcome-label">
            Welcome back
          </p>

          <h1>
            {user?.full_name || "Student"}
          </h1>

          <p className="muted-text">
            Student Number:{" "}
            <strong>
              {user?.student_number || "N/A"}
            </strong>
          </p>

        </section>

        {/* =========================
            STATISTICS
        ========================= */}

        <section className="stats-grid">

          <div className="stat-card">

            <span className="stat-label">
              Attendance Rate
            </span>

            <strong className="stat-value">
              {loadingSummary
                ? "..."
                : `${stats.attendanceRate}%`}
            </strong>

            <span className="stat-description">
              Overall attendance across completed sessions
            </span>

          </div>

          <div className="stat-card">

            <span className="stat-label">
              Sessions Attended
            </span>

            <strong className="stat-value">
              {loadingSummary
                ? "..."
                : stats.present}
            </strong>

            <span className="stat-description">
              Sessions marked present
            </span>

          </div>

          <div className="stat-card">

            <span className="stat-label">
              Total Sessions
            </span>

            <strong className="stat-value">
              {loadingSummary
                ? "..."
                : stats.totalSessions}
            </strong>

            <span className="stat-description">
              Completed sessions for your courses
            </span>

          </div>

          <div className="stat-card">

            <span className="stat-label">
              Enrolled Courses
            </span>

            <strong className="stat-value">
              {loadingCourses
                ? "..."
                : stats.courses}
            </strong>

            <span className="stat-description">
              Current course enrollments
            </span>

          </div>

        </section>

        {/* =========================
            ABSENCE SUMMARY
        ========================= */}

        {!loadingSummary && (
          <section className="content-card">

            <div className="section-header">

              <div>
                <h2>
                  Attendance Overview
                </h2>

                <p className="muted-text">
                  Summary of your attendance across
                  completed lecture sessions.
                </p>
              </div>

            </div>

            <div className="stats-grid">

              <div className="stat-card">

                <span className="stat-label">
                  Present
                </span>

                <strong className="stat-value">
                  {stats.present}
                </strong>

              </div>

              <div className="stat-card">

                <span className="stat-label">
                  Absent
                </span>

                <strong className="stat-value">
                  {stats.absent}
                </strong>

              </div>

              <div className="stat-card">

                <span className="stat-label">
                  Total Sessions
                </span>

                <strong className="stat-value">
                  {stats.totalSessions}
                </strong>

              </div>

              <div className="stat-card">

                <span className="stat-label">
                  Attendance Rate
                </span>

                <strong className="stat-value">
                  {stats.attendanceRate}%
                </strong>

              </div>

            </div>

          </section>
        )}

        {/* =========================
            MY COURSES
        ========================= */}

        <section className="content-card">

          <div className="section-header">

            <div>
              <h2>
                My Courses
              </h2>

              <p className="muted-text">
                Courses you are currently enrolled in.
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
                No enrolled courses
              </h3>

              <p>
                Your registered courses will appear
                here after enrollment.
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
                      Lecturer:{" "}
                      <strong>
                        {course.lecturer_name ||
                          "Not assigned"}
                      </strong>
                    </p>

                    {course.lecturer_staff_id && (
                      <p className="muted-text">
                        Staff ID:{" "}
                        {course.lecturer_staff_id}
                      </p>
                    )}

                  </div>

                  <div className="enrollment-label">
                    Enrolled
                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* =========================
            HOW ATTENDANCE WORKS
        ========================= */}

        <section className="content-card">

          <div className="section-header">

            <div>
              <h2>
                Mark Attendance
              </h2>

              <p className="muted-text">
                Attendance is recorded using the QR
                code displayed by your lecturer.
              </p>
            </div>

          </div>

          <div className="info-box">

            <strong>
              How attendance works
            </strong>

            <p>
              Scan the lecturer's QR code using your
              phone. The system verifies the session,
              confirms that you are enrolled in the
              course and checks that you are within
              the permitted attendance area before
              recording your attendance.
            </p>

          </div>

        </section>

        {/* =========================
            RECENT ATTENDANCE
        ========================= */}

        <section className="content-card">

          <div className="section-header">

            <div>
              <h2>
                Recent Attendance
              </h2>

              <p className="muted-text">
                Your latest recorded lecture sessions.
              </p>
            </div>

          </div>

          {loadingAttendance ? (

            <p className="muted-text">
              Loading attendance...
            </p>

          ) : attendanceHistory.length === 0 ? (

            <div className="empty-state">

              <h3>
                No attendance records
              </h3>

              <p>
                Your attendance history will appear
                here after marking attendance.
              </p>

            </div>

          ) : (

            <div className="table-wrapper">

              <table className="dashboard-table">

                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Course Name</th>
                    <th>Date</th>
                    <th>Scan Time</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {attendanceHistory
                    .slice(0, 10)
                    .map(
                      (record, index) => (

                        <tr
                          key={
                            record.id ||
                            `${record.session_id}-${index}`
                          }
                        >

                          <td>

                            <span className="course-code">
                              {record.course_code ||
                                "N/A"}
                            </span>

                          </td>

                          <td>
                            {record.course_name ||
                              "N/A"}
                          </td>

                          <td>
                            {record.session_date
                              ? new Date(
                                  record.session_date
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>

                          <td>
                            {record.scan_time
                              ? new Date(
                                  record.scan_time
                                ).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  }
                                )
                              : "N/A"}
                          </td>

                          <td>
                            <span
                              className="status-badge status-present"
                            >
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

        </section>

        {/* GLOBAL ERROR */}

        {error && (
          <div
            className="error-message"
            style={{
              marginBottom: "20px"
            }}
          >
            {error}
          </div>
        )}

      </main>

    </div>
  );
}

export default StudentDashboard;