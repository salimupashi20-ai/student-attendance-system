import {
  useEffect,
  useMemo,
  useState
} from "react";

import axios from "axios";
import "../../styles/dashboard.css";

function LecturerOverview() {
  const token =
    localStorage.getItem("token");

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [courses, setCourses] =
    useState([]);

  const [sessions, setSessions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          coursesResponse,
          sessionsResponse
        ] = await Promise.all([
          axios.get(
            "/api/courses",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          ),

          axios.get(
            "/api/sessions",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          )
        ]);

        setCourses(
          coursesResponse.data.courses || []
        );

        setSessions(
          sessionsResponse.data.sessions || []
        );

      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to load lecturer dashboard."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const stats = useMemo(() => {
    const activeSessions =
      sessions.filter(
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

  if (loading) {
    return (
      <section className="content-card">
        Loading lecturer dashboard...
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
          {user?.full_name || "Lecturer"}
        </h1>

        <p>
          Manage your courses and
          attendance sessions.
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
            Sessions created
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
            Completed sessions
          </span>
        </div>

      </section>

    </>
  );
}

export default LecturerOverview;