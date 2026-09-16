import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/dashboard.css";

function AdminCourses() {
  const token = localStorage.getItem("token");

  // =========================
  // STATE
  // =========================

  const [courses, setCourses] =
    useState([]);

  const [lecturers, setLecturers] =
    useState([]);

  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [courseFormData, setCourseFormData] =
    useState({
      course_code: "",
      course_name: "",
      lecturer_id: ""
    });

  const [editingCourse, setEditingCourse] =
    useState(null);

  const [editCourseForm, setEditCourseForm] =
    useState({
      course_code: "",
      course_name: "",
      lecturer_id: ""
    });

  // =========================
  // FETCH COURSES
  // =========================

  const fetchCourses = async () => {
    setLoadingCourses(true);

    try {
      const response = await axios.get(
        "/api/admin/courses",
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
        "Failed to retrieve courses."
      );

    } finally {
      setLoadingCourses(false);
    }
  };

  // =========================
  // FETCH LECTURERS
  // =========================

  const fetchLecturers = async () => {
    try {
      const response = await axios.get(
        "/api/admin/lecturers",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setLecturers(
        response.data.lecturers || []
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to retrieve lecturers."
      );
    }
  };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    fetchCourses();
    fetchLecturers();
  }, []);

  // =========================
  // CREATE COURSE FORM
  // =========================

  const handleCourseChange = (e) => {
    const {
      name,
      value
    } = e.target;

    setCourseFormData(
      (previous) => ({
        ...previous,
        [name]: value
      })
    );
  };

  // =========================
  // CREATE COURSE
  // =========================

  const handleCreateCourse = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await axios.post(
        "/api/admin/courses",
        {
          course_code:
            courseFormData.course_code.trim(),

          course_name:
            courseFormData.course_name.trim(),

          lecturer_id:
            Number(
              courseFormData.lecturer_id
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
        "Course created successfully."
      );

      setCourseFormData({
        course_code: "",
        course_name: "",
        lecturer_id: ""
      });

      fetchCourses();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to create course."
      );
    }
  };

  // =========================
  // START EDIT
  // =========================

  const handleEditCourse = (course) => {
    setEditingCourse(course);

    setEditCourseForm({
      course_code:
        course.course_code || "",

      course_name:
        course.course_name || "",

      lecturer_id:
        String(
          course.lecturer_id || ""
        )
    });

    setMessage("");
    setError("");
  };

  // =========================
  // EDIT FORM
  // =========================

  const handleEditCourseChange = (e) => {
    const {
      name,
      value
    } = e.target;

    setEditCourseForm(
      (previous) => ({
        ...previous,
        [name]: value
      })
    );
  };

  // =========================
  // UPDATE COURSE
  // =========================

  const handleUpdateCourse = async (e) => {
    e.preventDefault();

    if (!editingCourse) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await axios.put(
        `/api/admin/courses/${editingCourse.id}`,
        {
          course_code:
            editCourseForm.course_code.trim(),

          course_name:
            editCourseForm.course_name.trim(),

          lecturer_id:
            Number(
              editCourseForm.lecturer_id
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
        "Course updated successfully."
      );

      setEditingCourse(null);

      setEditCourseForm({
        course_code: "",
        course_name: "",
        lecturer_id: ""
      });

      fetchCourses();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update course."
      );
    }
  };

  // =========================
  // CANCEL EDIT
  // =========================

  const handleCancelEdit = () => {
    setEditingCourse(null);

    setEditCourseForm({
      course_code: "",
      course_name: "",
      lecturer_id: ""
    });
  };

  return (
    <>

      {/* PAGE HEADING */}

      <section className="page-heading">

        <h1>
          Course Management
        </h1>

        <p>
          Create courses, assign lecturers
          and update existing course details.
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


      {/* COURSE STATISTICS */}

      <section className="stats-grid">

        <div className="stat-card">

          <span className="stat-label">
            Total Courses
          </span>

          <strong className="stat-value">
            {courses.length}
          </strong>

          <span className="stat-description">
            Courses registered in the system
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Lecturers
          </span>

          <strong className="stat-value">
            {lecturers.length}
          </strong>

          <span className="stat-description">
            Available lecturers
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Assigned Courses
          </span>

          <strong className="stat-value">
            {
              courses.filter(
                (course) =>
                  course.lecturer_id
              ).length
            }
          </strong>

          <span className="stat-description">
            Courses with lecturers assigned
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Unassigned
          </span>

          <strong className="stat-value">
            {
              courses.filter(
                (course) =>
                  !course.lecturer_id
              ).length
            }
          </strong>

          <span className="stat-description">
            Courses needing lecturer assignment
          </span>

        </div>

      </section>


      {/* CREATE COURSE */}

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              Create Course
            </h2>

            <p className="muted-text">
              Add a new course and assign
              a lecturer.
            </p>

          </div>

        </div>


        <form
          onSubmit={
            handleCreateCourse
          }
        >

          <div className="form-grid">

            <div className="form-group">

              <label>
                Course Code
              </label>

              <input
                type="text"
                name="course_code"
                value={
                  courseFormData.course_code
                }
                onChange={
                  handleCourseChange
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
                name="course_name"
                value={
                  courseFormData.course_name
                }
                onChange={
                  handleCourseChange
                }
                placeholder="Enter course name"
                required
              />

            </div>


            <div className="form-group">

              <label>
                Lecturer
              </label>

              <select
                name="lecturer_id"
                value={
                  courseFormData.lecturer_id
                }
                onChange={
                  handleCourseChange
                }
                required
              >

                <option value="">
                  Select lecturer
                </option>

                {lecturers.map(
                  (lecturer) => (

                    <option
                      key={
                        lecturer.id
                      }
                      value={
                        lecturer.id
                      }
                    >
                      {
                        lecturer.full_name
                      }
                      {" — "}
                      {
                        lecturer.staff_id
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
              Create Course
            </button>

          </div>

        </form>

      </section>


      {/* SYSTEM COURSES */}

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              System Courses
            </h2>

            <p className="muted-text">
              Review course information and
              lecturer assignments.
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
              Courses will appear here after
              they are created.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="dashboard-table">

              <thead>

                <tr>
                  <th>Course</th>
                  <th>Course Name</th>
                  <th>Lecturer</th>
                  <th>Staff ID</th>
                  <th>Action</th>
                </tr>

              </thead>


              <tbody>

                {courses.map(
                  (course) => (

                    <tr
                      key={
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
                          "Not assigned"
                        }

                      </td>


                      <td>

                        {
                          course.lecturer_staff_id ||
                          "N/A"
                        }

                      </td>


                      <td>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            handleEditCourse(
                              course
                            )
                          }
                        >
                          Edit
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


      {/* EDIT COURSE */}

      {editingCourse && (

        <section className="content-card">

          <div className="section-header">

            <div>

              <h2>
                Edit Course
              </h2>

              <p className="muted-text">
                Update the course or
                reassign its lecturer.
              </p>

            </div>

            <span className="course-code">
              {
                editingCourse.course_code
              }
            </span>

          </div>


          <form
            onSubmit={
              handleUpdateCourse
            }
          >

            <div className="form-grid">

              <div className="form-group">

                <label>
                  Course Code
                </label>

                <input
                  type="text"
                  name="course_code"
                  value={
                    editCourseForm.course_code
                  }
                  onChange={
                    handleEditCourseChange
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Course Name
                </label>

                <input
                  type="text"
                  name="course_name"
                  value={
                    editCourseForm.course_name
                  }
                  onChange={
                    handleEditCourseChange
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Lecturer
                </label>

                <select
                  name="lecturer_id"
                  value={
                    editCourseForm.lecturer_id
                  }
                  onChange={
                    handleEditCourseChange
                  }
                  required
                >

                  <option value="">
                    Select lecturer
                  </option>

                  {lecturers.map(
                    (lecturer) => (

                      <option
                        key={
                          lecturer.id
                        }
                        value={
                          lecturer.id
                        }
                      >
                        {
                          lecturer.full_name
                        }
                        {" — "}
                        {
                          lecturer.staff_id
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>


            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "20px"
              }}
            >

              <button
                type="submit"
                className="primary-button"
              >
                Save Changes
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleCancelEdit
                }
              >
                Cancel
              </button>

            </div>

          </form>

        </section>

      )}

    </>
  );
}

export default AdminCourses;