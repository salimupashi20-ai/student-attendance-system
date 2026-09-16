import {
  useEffect,
  useMemo,
  useState
} from "react";

import axios from "axios";

import "../../styles/dashboard.css";

function AdminOverview() {
  const token =
    localStorage.getItem("token");

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [users, setUsers] =
    useState([]);

  const [courses, setCourses] =
    useState([]);

  const [enrollments, setEnrollments] =
    useState([]);

  const [
    attendanceOverview,
    setAttendanceOverview
  ] = useState({
    total_sessions: 0,
    active_sessions: 0,
    attendance_records: 0,
    total_enrollments: 0
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {

    const fetchDashboard = async () => {
      try {

        const [
          usersResponse,
          coursesResponse,
          enrollmentsResponse,
          attendanceResponse
        ] = await Promise.all([

          axios.get(
            "/api/admin/users",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          ),

          axios.get(
            "/api/admin/courses",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          ),

          axios.get(
            "/api/admin/enrollments",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          ),

          axios.get(
            "/api/admin/attendance/overview",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          )

        ]);

        setUsers(
          usersResponse.data.users ||
          []
        );

        setCourses(
          coursesResponse.data.courses ||
          []
        );

        setEnrollments(
          enrollmentsResponse
            .data
            .enrollments ||
          []
        );

        setAttendanceOverview(
          attendanceResponse
            .data
            .overview ||
          {
            total_sessions: 0,
            active_sessions: 0,
            attendance_records: 0,
            total_enrollments: 0
          }
        );

      } catch (err) {

        setError(
          err.response?.data?.message ||
          "Failed to load dashboard information."
        );

      } finally {

        setLoading(false);

      }
    };

    fetchDashboard();

  }, [token]);

  const statistics =
    useMemo(() => {

      return {

        students:
          users.filter(
            (u) =>
              u.role ===
              "student"
          ).length,

        lecturers:
          users.filter(
            (u) =>
              u.role ===
              "lecturer"
          ).length,

        courses:
          courses.length,

        enrollments:
          enrollments.length

      };

    }, [
      users,
      courses,
      enrollments
    ]);

  if (loading) {
    return (
      <div className="content-card">
        Loading dashboard...
      </div>
    );
  }

  return (
    <>

      {/* PAGE HEADING */}

      <section className="page-heading">

        <p className="welcome-label">
          Welcome back
        </p>

        <h1>
          {user?.full_name ||
            "Administrator"}
        </h1>

        <p>
          Here is an overview of the
          Student Attendance System.
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


      {/* SYSTEM STATS */}

      <section className="stats-grid">

        <div className="stat-card">

          <span className="stat-label">
            Students
          </span>

          <strong className="stat-value">
            {statistics.students}
          </strong>

          <span className="stat-description">
            Registered students
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Lecturers
          </span>

          <strong className="stat-value">
            {statistics.lecturers}
          </strong>

          <span className="stat-description">
            Registered lecturers
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Courses
          </span>

          <strong className="stat-value">
            {statistics.courses}
          </strong>

          <span className="stat-description">
            Courses in the system
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Enrollments
          </span>

          <strong className="stat-value">
            {statistics.enrollments}
          </strong>

          <span className="stat-description">
            Current enrollments
          </span>

        </div>

      </section>


      {/* ATTENDANCE ACTIVITY */}

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              Attendance Activity
            </h2>

            <p className="muted-text">
              Current system-wide attendance
              statistics.
            </p>

          </div>

        </div>


        <div className="stats-grid">

          <div className="stat-card">

            <span className="stat-label">
              Total Sessions
            </span>

            <strong className="stat-value">
              {
                attendanceOverview
                  .total_sessions
              }
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
              {
                attendanceOverview
                  .active_sessions
              }
            </strong>

            <span className="stat-description">
              Currently open
            </span>

          </div>


          <div className="stat-card">

            <span className="stat-label">
              Attendance Records
            </span>

            <strong className="stat-value">
              {
                attendanceOverview
                  .attendance_records
              }
            </strong>

            <span className="stat-description">
              Successful attendance scans
            </span>

          </div>


          <div className="stat-card">

            <span className="stat-label">
              Course Enrollments
            </span>

            <strong className="stat-value">
              {
                attendanceOverview
                  .total_enrollments
              }
            </strong>

            <span className="stat-description">
              Current registrations
            </span>

          </div>

        </div>

      </section>


      {/* QUICK SUMMARY */}

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              System Summary
            </h2>

            <p className="muted-text">
              Key capabilities available from
              the administration portal.
            </p>

          </div>

        </div>


        <div className="course-grid">

          <div className="course-card">

            <div>

              <span className="course-code">
                USERS
              </span>

              <h3>
                User Management
              </h3>

              <p className="muted-text">
                Create students, lecturers and
                administrators.
              </p>

            </div>

          </div>


          <div className="course-card">

            <div>

              <span className="course-code">
                COURSES
              </span>

              <h3>
                Course Management
              </h3>

              <p className="muted-text">
                Create courses and assign
                lecturers.
              </p>

            </div>

          </div>


          <div className="course-card">

            <div>

              <span className="course-code">
                ENROLL
              </span>

              <h3>
                Enrollment Management
              </h3>

              <p className="muted-text">
                Register students into the
                appropriate courses.
              </p>

            </div>

          </div>


          <div className="course-card">

            <div>

              <span className="course-code">
                REPORTS
              </span>

              <h3>
                Attendance Reporting
              </h3>

              <p className="muted-text">
                Review individual sessions and
                attendance performance.
              </p>

            </div>

          </div>

        </div>

      </section>

    </>
  );
}

export default AdminOverview;