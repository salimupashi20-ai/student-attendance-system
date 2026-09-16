import {
  useEffect,
  useState
} from "react";

import axios from "axios";
import "../../styles/dashboard.css";

function StudentCourses() {
  const token =
    localStorage.getItem("token");

  const [courses, setCourses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response =
          await axios.get(
            "/api/enrollments/my-courses",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        setCourses(
          response.data.courses ||
          response.data.enrollments ||
          []
        );

      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to retrieve enrolled courses."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [token]);

  return (
    <>

      <section className="page-heading">

        <h1>
          My Courses
        </h1>

        <p>
          View the courses you are
          currently enrolled in.
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
              Current Courses
            </h2>

            <p className="muted-text">
              Courses available to your
              student account.
            </p>

          </div>

        </div>

        {loading ? (

          <p className="muted-text">
            Loading courses...
          </p>

        ) : courses.length === 0 ? (

          <div className="empty-state">

            <h3>
              No courses found
            </h3>

            <p>
              You are not currently
              enrolled in any courses.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="dashboard-table">

              <thead>

                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Lecturer</th>
                  <th>Enrolled</th>
                </tr>

              </thead>

              <tbody>

                {courses.map(
                  (course) => (

                    <tr
                      key={
                        course.enrollment_id ||
                        course.id
                      }
                    >

                      <td>

                        <span className="course-code">
                          {
                            course.course_code
                          }
                        </span>

                      </td>

                      <td>

                        <strong>
                          {
                            course.course_name
                          }
                        </strong>

                      </td>

                      <td>

                        {
                          course.lecturer_name ||
                          "N/A"
                        }

                      </td>

                      <td>

                        {course.enrolled_at
                          ? new Date(
                              course.enrolled_at
                            ).toLocaleDateString()
                          : "N/A"}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </>
  );
}

export default StudentCourses;