import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../styles/dashboard.css";

function AdminEnrollments() {
  const token = localStorage.getItem("token");

  // =========================
  // STATE
  // =========================

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    student_id: "",
    course_id: ""
  });

  // =========================
  // FETCH DATA
  // =========================

  const fetchData = async () => {
    setLoading(true);

    try {
      const [
        usersResponse,
        coursesResponse,
        enrollmentsResponse
      ] = await Promise.all([
        axios.get(
          "/api/admin/users",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        ),

        axios.get(
          "/api/admin/courses",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        ),

        axios.get(
          "/api/admin/enrollments",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      ]);

      setUsers(
        usersResponse.data.users || []
      );

      setCourses(
        coursesResponse.data.courses || []
      );

      setEnrollments(
        enrollmentsResponse.data.enrollments || []
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to retrieve enrollment information."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    fetchData();
  }, []);

  // =========================
  // STUDENTS
  // =========================

  const students = useMemo(() => {
    return users.filter(
      (user) =>
        user.role === "student"
    );
  }, [users]);

  // =========================
  // STATS
  // =========================

  const stats = useMemo(() => {
    const enrolledStudentIds =
      new Set(
        enrollments.map(
          (enrollment) =>
            enrollment.student_id
        )
      );

    const enrolledCourseIds =
      new Set(
        enrollments.map(
          (enrollment) =>
            enrollment.course_id
        )
      );

    return {
      totalEnrollments:
        enrollments.length,

      enrolledStudents:
        enrolledStudentIds.size,

      coursesWithEnrollments:
        enrolledCourseIds.size,

      availableStudents:
        students.length
    };
  }, [
    enrollments,
    students
  ]);

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (e) => {
    const {
      name,
      value
    } = e.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value
      })
    );
  };

  // =========================
  // CREATE ENROLLMENT
  // =========================

  const handleCreateEnrollment = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await axios.post(
        "/api/admin/enrollments",
        {
          student_id:
            Number(
              formData.student_id
            ),

          course_id:
            Number(
              formData.course_id
            )
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage(
        response.data.message ||
        "Student enrolled successfully."
      );

      setFormData({
        student_id: "",
        course_id: ""
      });

      fetchData();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to enroll student."
      );
    }
  };

  // =========================
  // REMOVE ENROLLMENT
  // =========================

  const handleRemoveEnrollment =
    async (enrollmentId) => {

      const confirmed =
        window.confirm(
          "Remove this student from the course?"
        );

      if (!confirmed) {
        return;
      }

      setMessage("");
      setError("");

      try {
        const response =
          await axios.delete(
            `/api/admin/enrollments/${enrollmentId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        setMessage(
          response.data.message ||
          "Enrollment removed successfully."
        );

        fetchData();

      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to remove enrollment."
        );
      }
    };

  return (
    <>

      {/* PAGE HEADING */}

      <section className="page-heading">

        <h1>
          Enrollment Management
        </h1>

        <p>
          Enroll students into courses
          and manage current course
          registrations.
        </p>

      </section>


      {/* MESSAGES */}

      {message && (
        <div
          className="success-message"
          style={{
            marginBottom: "20px"
          }}
        >
          {message}
        </div>
      )}

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


      {/* STATISTICS */}

      <section className="stats-grid">

        <div className="stat-card">

          <span className="stat-label">
            Total Enrollments
          </span>

          <strong className="stat-value">
            {stats.totalEnrollments}
          </strong>

          <span className="stat-description">
            Active course registrations
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Enrolled Students
          </span>

          <strong className="stat-value">
            {stats.enrolledStudents}
          </strong>

          <span className="stat-description">
            Students with at least one course
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Courses Used
          </span>

          <strong className="stat-value">
            {stats.coursesWithEnrollments}
          </strong>

          <span className="stat-description">
            Courses with registrations
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Students
          </span>

          <strong className="stat-value">
            {stats.availableStudents}
          </strong>

          <span className="stat-description">
            Registered student accounts
          </span>

        </div>

      </section>


      {/* CREATE ENROLLMENT */}

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              Enroll Student
            </h2>

            <p className="muted-text">
              Select a student and the
              course they should be
              registered for.
            </p>

          </div>

        </div>


        <form
          onSubmit={
            handleCreateEnrollment
          }
        >

          <div className="form-grid">

            {/* STUDENT */}

            <div className="form-group">

              <label>
                Student
              </label>

              <select
                name="student_id"
                value={
                  formData.student_id
                }
                onChange={
                  handleChange
                }
                required
              >

                <option value="">
                  Select student
                </option>

                {students.map(
                  (student) => (

                    <option
                      key={
                        student.id
                      }
                      value={
                        student.id
                      }
                    >
                      {
                        student.full_name
                      }
                      {" — "}
                      {
                        student.student_number
                      }
                    </option>

                  )
                )}

              </select>

            </div>


            {/* COURSE */}

            <div className="form-group">

              <label>
                Course
              </label>

              <select
                name="course_id"
                value={
                  formData.course_id
                }
                onChange={
                  handleChange
                }
                required
              >

                <option value="">
                  Select course
                </option>

                {courses.map(
                  (course) => (

                    <option
                      key={
                        course.id
                      }
                      value={
                        course.id
                      }
                    >
                      {
                        course.course_code
                      }
                      {" — "}
                      {
                        course.course_name
                      }
                    </option>

                  )
                )}

              </select>

            </div>

          </div>


          <div
            style={{
              marginTop: "20px"
            }}
          >

            <button
              type="submit"
              className="primary-button"
            >
              Enroll Student
            </button>

          </div>

        </form>

      </section>


      {/* CURRENT ENROLLMENTS */}

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              Current Enrollments
            </h2>

            <p className="muted-text">
              Students currently
              registered for courses.
            </p>

          </div>

        </div>


        {loading ? (

          <p className="muted-text">
            Loading enrollments...
          </p>

        ) : enrollments.length === 0 ? (

          <div className="empty-state">

            <h3>
              No enrollments found
            </h3>

            <p>
              Student course
              registrations will appear
              here.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="dashboard-table">

              <thead>

                <tr>
                  <th>Student</th>
                  <th>Student Number</th>
                  <th>Course</th>
                  <th>Lecturer</th>
                  <th>Enrolled</th>
                  <th>Action</th>
                </tr>

              </thead>


              <tbody>

                {enrollments.map(
                  (enrollment) => (

                    <tr
                      key={
                        enrollment.id
                      }
                    >

                      <td>

                        <strong>
                          {
                            enrollment
                              .student_name
                          }
                        </strong>

                      </td>


                      <td>

                        {
                          enrollment
                            .student_number ||
                          "N/A"
                        }

                      </td>


                      <td>

                        <span className="course-code">
                          {
                            enrollment
                              .course_code
                          }
                        </span>

                        {" "}

                        {
                          enrollment
                            .course_name
                        }

                      </td>


                      <td>

                        {
                          enrollment
                            .lecturer_name ||
                          "N/A"
                        }

                      </td>


                      <td>

                        {enrollment.enrolled_at
                          ? new Date(
                              enrollment.enrolled_at
                            ).toLocaleDateString()
                          : "N/A"}

                      </td>


                      <td>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            handleRemoveEnrollment(
                              enrollment.id
                            )
                          }
                        >
                          Remove
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

    </>
  );
}

export default AdminEnrollments;