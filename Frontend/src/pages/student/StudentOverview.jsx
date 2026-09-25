import {
  useEffect,
  useState
} from "react";

import axios from "axios";
import "../../styles/dashboard.css";

function StudentOverview() {
  const token =
    localStorage.getItem("token");

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [summary, setSummary] =
    useState(null);

  const [courses, setCourses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          summaryResponse,
          coursesResponse
        ] = await Promise.all([
          axios.get(
            "/api/attendance/my-summary",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          ),

          axios.get(
            "/api/enrollments/my-courses",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          )
        ]);

        setSummary(
          summaryResponse.data.summary ||
          null
        );

        setCourses(
          coursesResponse.data.courses ||
          coursesResponse.data.enrollments ||
          []
        );

      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to load student dashboard."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <section className="content-card">
        Loading student dashboard...
      </section>
    );
  }

  return (
    <>

      <section className="page-heading">

        <p className="welcome-label">
          Welcome back
        </p>

        <h1>
          {user?.full_name || "Student"}
        </h1>

        <p>
          Review your courses and
          attendance performance.
        </p>

      </section>

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

      <section className="stats-grid">

        <div className="stat-card">

          <span className="stat-label">
            Attendance Rate
          </span>

          <strong className="stat-value">
            {
              summary?.attendance_percentage ??
              0
            }
            %
          </strong>

          <span className="stat-description">
            Overall attendance
          </span>

        </div>

        <div className="stat-card">

          <span className="stat-label">
            Sessions Attended
          </span>

          <strong className="stat-value">
            {
              summary?.total_present ??
              0
            }
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
            {
              summary?.total_sessions ??
              0
            }
          </strong>

          <span className="stat-description">
            Eligible completed sessions
          </span>

        </div>

        <div className="stat-card">

          <span className="stat-label">
            Enrolled Courses
          </span>

          <strong className="stat-value">
            {courses.length}
          </strong>

          <span className="stat-description">
            Current course registrations
          </span>

        </div>

      </section>

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              Mark Attendance
            </h2>

            <p className="muted-text">
              Attendance is recorded by
              scanning the lecturer's
              secure QR code.
            </p>

          </div>

        </div>

        <p>
          When your lecturer starts an
          attendance session, scan the QR
          code displayed in class. The
          system will verify the QR token,
          your enrollment and your
          location before recording
          attendance.
        </p>

      </section>

    </>
  );
}

export default StudentOverview;