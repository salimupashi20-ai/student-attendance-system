import {
  useEffect,
  useState
} from "react";

import axios from "axios";
import "../../styles/dashboard.css";

function LecturerAnalytics() {
  const token =
    localStorage.getItem("token");

  const [courses, setCourses] =
    useState([]);

  const [selectedCourse, setSelectedCourse] =
    useState(null);

  const [analytics, setAnalytics] =
    useState(null);

  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [loadingAnalytics, setLoadingAnalytics] =
    useState(false);

  const [error, setError] =
    useState("");

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);

    try {
      const response = await axios.get(
        "/api/courses",
        authHeaders
      );

      setCourses(
        response.data.courses || []
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to retrieve courses."
      );

    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleViewAnalytics =
    async (course) => {

      setSelectedCourse(course);
      setAnalytics(null);
      setLoadingAnalytics(true);
      setError("");

      try {
        const response =
          await axios.get(
            `/api/attendance/course/${course.id}/stats`,
            authHeaders
          );

        setAnalytics(
          response.data.stats ||
          response.data
        );

      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to retrieve course analytics."
        );

      } finally {
        setLoadingAnalytics(false);
      }
    };

  return (
    <>

      <section className="page-heading">

        <h1>
          Course Analytics
        </h1>

        <p>
          Review attendance performance
          across your assigned courses.
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

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              Select Course
            </h2>

            <p className="muted-text">
              Choose a course to inspect
              attendance statistics.
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
              No courses assigned
            </h3>

            <p>
              Your assigned courses will
              appear here.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="dashboard-table">

              <thead>

                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {courses.map(
                  (course) => (

                    <tr key={course.id}>

                      <td>

                        <span className="course-code">
                          {course.course_code}
                        </span>

                      </td>

                      <td>

                        <strong>
                          {course.course_name}
                        </strong>

                      </td>

                      <td>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            handleViewAnalytics(
                              course
                            )
                          }
                        >
                          View Analytics
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {selectedCourse && (

        <section className="content-card">

          <div className="section-header">

            <div>

              <h2>
                {selectedCourse.course_code}
                {" — "}
                {selectedCourse.course_name}
              </h2>

              <p className="muted-text">
                Attendance performance
                for this course.
              </p>

            </div>

          </div>

          {loadingAnalytics ? (

            <p className="muted-text">
              Loading analytics...
            </p>

          ) : analytics ? (

            <>

              <div
                className="stats-grid"
                style={{
                  marginBottom: "24px"
                }}
              >

                <div className="stat-card">

                  <span className="stat-label">
                    Enrolled Students
                  </span>

                  <strong className="stat-value">
                    {
                      analytics.total_enrolled ??
                      0
                    }
                  </strong>

                  <span className="stat-description">
                    Current course enrollment
                  </span>

                </div>

                <div className="stat-card">

                  <span className="stat-label">
                    Total Sessions
                  </span>

                  <strong className="stat-value">
                    {
                      analytics.total_sessions ??
                      0
                    }
                  </strong>

                  <span className="stat-description">
                    Attendance sessions created
                  </span>

                </div>

                <div className="stat-card">

                  <span className="stat-label">
                    Average Attendance
                  </span>

                  <strong className="stat-value">
                    {
                      analytics.average_attendance_percentage ??
                      analytics.average_attendance ??
                      0
                    }
                    %
                  </strong>

                  <span className="stat-description">
                    Overall attendance performance
                  </span>

                </div>

              </div>

              {Array.isArray(
                analytics.sessions
              ) &&
              analytics.sessions.length >
                0 ? (

                <div className="table-wrapper">

                  <table className="dashboard-table">

                    <thead>

                      <tr>
                        <th>Date</th>
                        <th>Eligible</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Attendance Rate</th>
                        <th>Status</th>
                      </tr>

                    </thead>

                    <tbody>

                      {analytics.sessions.map(
                        (session) => {

                          const isActive =
                            Number(
                              session.is_active
                            ) === 1;

                          return (

                            <tr
                              key={
                                session.id
                              }
                            >

                              <td>
                                {session.session_date
                                  ? new Date(
                                      session.session_date
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>

                              <td>
                                {
                                  session.total_enrolled ??
                                  0
                                }
                              </td>

                              <td>
                                {
                                  session.total_present ??
                                  0
                                }
                              </td>

                              <td>
                                {
                                  session.total_absent ??
                                  0
                                }
                              </td>

                              <td>
                                <strong>
                                  {
                                    session.attendance_percentage ??
                                    0
                                  }
                                  %
                                </strong>
                              </td>

                              <td>

                                <span
                                  className={
                                    isActive
                                      ? "status-badge status-present"
                                      : "status-badge"
                                  }
                                >
                                  {
                                    isActive
                                      ? "Active"
                                      : "Closed"
                                  }
                                </span>

                              </td>

                            </tr>

                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              ) : (

                <div className="empty-state">

                  <h3>
                    No session analytics yet
                  </h3>

                  <p>
                    Course session statistics
                    will appear here once
                    attendance sessions exist.
                  </p>

                </div>

              )}

            </>

          ) : (

            <div className="empty-state">

              <h3>
                No analytics available
              </h3>

              <p>
                Select a course to load
                its attendance statistics.
              </p>

            </div>

          )}

        </section>

      )}

    </>
  );
}

export default LecturerAnalytics;