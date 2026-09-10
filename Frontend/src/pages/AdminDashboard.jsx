import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user"));

  // =========================
  // USERS
  // =========================

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [userFormData, setUserFormData] = useState({
    full_name: "",
    student_number: "",
    staff_id: "",
    password: "",
    role: "student"
  });

  // =========================
  // COURSES
  // =========================

  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [courseFormData, setCourseFormData] = useState({
    course_code: "",
    course_name: "",
    lecturer_id: ""
  });

  const [editingCourse, setEditingCourse] = useState(null);

  const [editCourseForm, setEditCourseForm] = useState({
    course_code: "",
    course_name: "",
    lecturer_id: ""
  });

  // =========================
  // ENROLLMENTS
  // =========================

  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  const [enrollmentForm, setEnrollmentForm] = useState({
    student_id: "",
    course_id: ""
  });

  // =========================
  // ATTENDANCE REPORTING
  // =========================

  const [attendanceOverview, setAttendanceOverview] = useState({
    total_sessions: 0,
    active_sessions: 0,
    attendance_records: 0,
    total_enrollments: 0
  });

  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [loadingAttendanceSessions, setLoadingAttendanceSessions] =
    useState(true);

  const [selectedAttendanceSession, setSelectedAttendanceSession] =
    useState(null);

  const [selectedAttendanceRecords, setSelectedAttendanceRecords] =
    useState([]);

  const [selectedAttendanceSummary, setSelectedAttendanceSummary] =
    useState(null);

  const [loadingSelectedAttendance, setLoadingSelectedAttendance] =
    useState(false);

  // =========================
  // MESSAGES
  // =========================

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================
  // FETCH USERS
  // =========================

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUsers(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to retrieve users."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // =========================
  // FETCH LECTURERS
  // =========================

  const fetchLecturers = async () => {
    try {
      const response = await axios.get("/api/admin/lecturers", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setLecturers(response.data.lecturers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to retrieve lecturers."
      );
    }
  };

  // =========================
  // FETCH COURSES
  // =========================

  const fetchCourses = async () => {
    try {
      const response = await axios.get("/api/admin/courses", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setCourses(response.data.courses || []);
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
  // FETCH ENROLLMENTS
  // =========================

  const fetchEnrollments = async () => {
    try {
      const response = await axios.get("/api/admin/enrollments", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setEnrollments(response.data.enrollments || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to retrieve enrollments."
      );
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // =========================
  // FETCH ATTENDANCE OVERVIEW
  // =========================

  const fetchAttendanceOverview = async () => {
    try {
      const response = await axios.get(
        "/api/admin/attendance/overview",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAttendanceOverview(
        response.data.overview || {
          total_sessions: 0,
          active_sessions: 0,
          attendance_records: 0,
          total_enrollments: 0
        }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to retrieve attendance overview."
      );
    }
  };

  // =========================
  // FETCH ATTENDANCE SESSIONS
  // =========================

  const fetchAttendanceSessions = async () => {
    try {
      const response = await axios.get(
        "/api/admin/attendance/sessions",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAttendanceSessions(response.data.sessions || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to retrieve attendance sessions."
      );
    } finally {
      setLoadingAttendanceSessions(false);
    }
  };

  // =========================
  // LOAD DASHBOARD
  // =========================

  useEffect(() => {
    fetchUsers();
    fetchLecturers();
    fetchCourses();
    fetchEnrollments();
    fetchAttendanceOverview();
    fetchAttendanceSessions();
  }, []);

  // =========================
  // STUDENTS
  // =========================

  const students = useMemo(() => {
    return users.filter(
      (systemUser) => systemUser.role === "student"
    );
  }, [users]);

  // =========================
  // USER / COURSE STATS
  // =========================

  const stats = useMemo(() => {
    return {
      students: users.filter((u) => u.role === "student").length,
      lecturers: users.filter((u) => u.role === "lecturer").length,
      courses: courses.length,
      enrollments: enrollments.length
    };
  }, [users, courses, enrollments]);

  // =========================
  // FORM HANDLERS
  // =========================

  const handleUserChange = (e) => {
    const { name, value } = e.target;

    setUserFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleCourseChange = (e) => {
    const { name, value } = e.target;

    setCourseFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleEditCourseChange = (e) => {
    const { name, value } = e.target;

    setEditCourseForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleEnrollmentChange = (e) => {
    const { name, value } = e.target;

    setEnrollmentForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // =========================
  // CREATE USER
  // =========================

  const handleCreateUser = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await axios.post(
        "/api/admin/users",
        userFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage(
        response.data.message ||
          "User created successfully."
      );

      setUserFormData({
        full_name: "",
        student_number: "",
        staff_id: "",
        password: "",
        role: "student"
      });

      fetchUsers();
      fetchLecturers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create user."
      );
    }
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
          course_code: courseFormData.course_code,
          course_name: courseFormData.course_name,
          lecturer_id: Number(courseFormData.lecturer_id)
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
  // EDIT COURSE
  // =========================

  const handleEditCourse = (course) => {
    setEditingCourse(course);

    setEditCourseForm({
      course_code: course.course_code,
      course_name: course.course_name,
      lecturer_id: String(course.lecturer_id || "")
    });

    setMessage("");
    setError("");
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();

    if (!editingCourse) return;

    setMessage("");
    setError("");

    try {
      const response = await axios.put(
        `/api/admin/courses/${editingCourse.id}`,
        {
          course_code: editCourseForm.course_code,
          course_name: editCourseForm.course_name,
          lecturer_id: Number(editCourseForm.lecturer_id)
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
      fetchAttendanceSessions();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update course."
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingCourse(null);

    setEditCourseForm({
      course_code: "",
      course_name: "",
      lecturer_id: ""
    });
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
          student_id: Number(enrollmentForm.student_id),
          course_id: Number(enrollmentForm.course_id)
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

      setEnrollmentForm({
        student_id: "",
        course_id: ""
      });

      fetchEnrollments();
      fetchAttendanceOverview();
      fetchAttendanceSessions();
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

  const handleRemoveEnrollment = async (enrollmentId) => {
    const confirmed = window.confirm(
      "Remove this student from the course?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await axios.delete(
        `/api/admin/enrollments/${enrollmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage(
        response.data.message ||
          "Enrollment removed successfully."
      );

      fetchEnrollments();
      fetchAttendanceOverview();
      fetchAttendanceSessions();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to remove enrollment."
      );
    }
  };

  // =========================
  // VIEW SESSION ATTENDANCE
  // =========================

  const handleViewAttendance = async (session) => {
    setSelectedAttendanceSession(session);
    setSelectedAttendanceRecords([]);
    setSelectedAttendanceSummary(null);
    setLoadingSelectedAttendance(true);
    setError("");

    try {
      const [attendanceResponse, summaryResponse] =
        await Promise.all([
          axios.get(
            `/api/admin/attendance/sessions/${session.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          ),

          axios.get(
            `/api/admin/attendance/sessions/${session.id}/summary`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )
        ]);

      setSelectedAttendanceRecords(
        attendanceResponse.data.attendance || []
      );

      setSelectedAttendanceSummary(
        summaryResponse.data.summary || null
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to retrieve session attendance."
      );
    } finally {
      setLoadingSelectedAttendance(false);
    }
  };

  const handleCloseAttendanceView = () => {
    setSelectedAttendanceSession(null);
    setSelectedAttendanceRecords([]);
    setSelectedAttendanceSummary(null);
  };

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

      <header className="topbar">
        <div>
          <h2 className="brand-title">
            Student Attendance System
          </h2>

          <p className="brand-subtitle">
            Administration Portal
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
            {currentUser?.full_name || "Administrator"}
          </h1>

          <p className="muted-text">
            Staff ID:{" "}
            <strong>
              {currentUser?.staff_id || "N/A"}
            </strong>
          </p>
        </section>

        {/* SYSTEM STATS */}

        <section className="stats-grid">

          <div className="stat-card">
            <span className="stat-label">
              Students
            </span>

            <strong className="stat-value">
              {stats.students}
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
              {stats.lecturers}
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
              {stats.courses}
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
              {stats.enrollments}
            </strong>

            <span className="stat-description">
              Current course enrollments
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

        {/* ATTENDANCE OVERVIEW */}

        <section className="content-card">

          <div className="section-header">
            <div>
              <h2>
                Attendance Overview
              </h2>

              <p className="muted-text">
                System-wide attendance activity.
              </p>
            </div>
          </div>

          <div className="stats-grid">

            <div className="stat-card">
              <span className="stat-label">
                Total Sessions
              </span>

              <strong className="stat-value">
                {attendanceOverview.total_sessions}
              </strong>
            </div>

            <div className="stat-card">
              <span className="stat-label">
                Active Sessions
              </span>

              <strong className="stat-value">
                {attendanceOverview.active_sessions}
              </strong>
            </div>

            <div className="stat-card">
              <span className="stat-label">
                Attendance Records
              </span>

              <strong className="stat-value">
                {attendanceOverview.attendance_records}
              </strong>
            </div>

            <div className="stat-card">
              <span className="stat-label">
                Enrollments
              </span>

              <strong className="stat-value">
                {attendanceOverview.total_enrollments}
              </strong>
            </div>

          </div>

        </section>

        {/* ATTENDANCE SESSIONS */}

        <section className="content-card">

          <div className="section-header">
            <div>
              <h2>
                Attendance Sessions
              </h2>

              <p className="muted-text">
                Review attendance sessions across all courses.
              </p>
            </div>
          </div>

          {loadingAttendanceSessions ? (
            <p className="muted-text">
              Loading attendance sessions...
            </p>
          ) : attendanceSessions.length === 0 ? (
            <div className="empty-state">
              <h3>
                No attendance sessions
              </h3>

              <p>
                Sessions will appear here after lecturers
                create them.
              </p>
            </div>
          ) : (
            <div className="table-wrapper">

              <table className="dashboard-table">

                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Lecturer</th>
                    <th>Date</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Rate</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {attendanceSessions.map((session) => {
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
                          {session.lecturer_name || "N/A"}
                        </td>

                        <td>
                          {session.session_date
                            ? new Date(
                                session.session_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>

                        <td>
                          {session.total_present}
                        </td>

                        <td>
                          {session.total_absent}
                        </td>

                        <td>
                          <strong>
                            {session.attendance_percentage}%
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
                            {isActive
                              ? "Active"
                              : "Closed"}
                          </span>
                        </td>

                        <td>
                          <button
                            className="secondary-button"
                            onClick={() =>
                              handleViewAttendance(session)
                            }
                          >
                            View Attendance
                          </button>
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* SELECTED SESSION */}

        {selectedAttendanceSession && (
          <section className="content-card">

            <div className="section-header">

              <div>
                <h2>
                  Session Report
                </h2>

                <p className="muted-text">
                  {selectedAttendanceSession.course_code}
                  {" — "}
                  {selectedAttendanceSession.course_name}
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={handleCloseAttendanceView}
              >
                Close
              </button>

            </div>

            {loadingSelectedAttendance ? (
              <p className="muted-text">
                Loading session report...
              </p>
            ) : (
              <>
                {selectedAttendanceSummary && (
                  <div
                    className="stats-grid"
                    style={{ marginBottom: "25px" }}
                  >

                    <div className="stat-card">
                      <span className="stat-label">
                        Enrolled
                      </span>

                      <strong className="stat-value">
                        {selectedAttendanceSummary.total_enrolled}
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">
                        Present
                      </span>

                      <strong className="stat-value">
                        {selectedAttendanceSummary.total_present}
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">
                        Absent
                      </span>

                      <strong className="stat-value">
                        {selectedAttendanceSummary.total_absent}
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">
                        Attendance Rate
                      </span>

                      <strong className="stat-value">
                        {
                          selectedAttendanceSummary
                            .attendance_percentage
                        }
                        %
                      </strong>
                    </div>

                  </div>
                )}

                {selectedAttendanceRecords.length === 0 ? (
                  <div className="empty-state">
                    <h3>
                      No attendance records
                    </h3>

                    <p>
                      No student has marked attendance for
                      this session.
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

                        {selectedAttendanceRecords.map(
                          (record) => (
                            <tr key={record.id}>

                              <td>
                                <strong>
                                  {record.student_name}
                                </strong>
                              </td>

                              <td>
                                {record.student_number}
                              </td>

                              <td>
                                {record.scan_time
                                  ? new Date(
                                      record.scan_time
                                    ).toLocaleTimeString()
                                  : "N/A"}
                              </td>

                              <td>
                                {record.distance_from_lecturer != null
                                  ? `${Math.round(
                                      record.distance_from_lecturer
                                    )} m`
                                  : "N/A"}
                              </td>

                              <td>
                                <span className="status-badge status-present">
                                  {record.status}
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

        {/* USER MANAGEMENT */}

        <section className="content-card">

          <div className="section-header">
            <div>
              <h2>
                User Management
              </h2>

              <p className="muted-text">
                Create students, lecturers and administrators.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser}>
            <div className="form-grid">

              <div className="form-group">
                <label>Full Name</label>

                <input
                  name="full_name"
                  value={userFormData.full_name}
                  onChange={handleUserChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Role</label>

                <select
                  name="role"
                  value={userFormData.role}
                  onChange={handleUserChange}
                >
                  <option value="student">
                    Student
                  </option>

                  <option value="lecturer">
                    Lecturer
                  </option>

                  <option value="admin">
                    Administrator
                  </option>
                </select>
              </div>

              {userFormData.role === "student" && (
                <div className="form-group">
                  <label>
                    Student Number
                  </label>

                  <input
                    name="student_number"
                    value={userFormData.student_number}
                    onChange={handleUserChange}
                    required
                  />
                </div>
              )}

              {(userFormData.role === "lecturer" ||
                userFormData.role === "admin") && (
                <div className="form-group">
                  <label>
                    Staff ID
                  </label>

                  <input
                    name="staff_id"
                    value={userFormData.staff_id}
                    onChange={handleUserChange}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>
                  Temporary Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={userFormData.password}
                  onChange={handleUserChange}
                  required
                />
              </div>

            </div>

            <div style={{ marginTop: "20px" }}>
              <button className="primary-button">
                Create User
              </button>
            </div>
          </form>

        </section>

        {/* SYSTEM USERS */}

        <section className="content-card">
          <div className="section-header">
            <div>
              <h2>
                System Users
              </h2>

              <p className="muted-text">
                Registered system accounts.
              </p>
            </div>
          </div>

          {loadingUsers ? (
            <p>Loading users...</p>
          ) : (
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Identifier</th>
                    <th>Role</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((systemUser) => (
                    <tr key={systemUser.id}>
                      <td>
                        <strong>
                          {systemUser.full_name}
                        </strong>
                      </td>

                      <td>
                        {systemUser.student_number ||
                          systemUser.staff_id ||
                          "N/A"}
                      </td>

                      <td>
                        <span
                          className={`role-badge role-${systemUser.role}`}
                        >
                          {systemUser.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* COURSE MANAGEMENT */}

        <section className="content-card">
          <div className="section-header">
            <div>
              <h2>
                Course Management
              </h2>

              <p className="muted-text">
                Create courses and assign lecturers.
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
                  name="course_code"
                  value={courseFormData.course_code}
                  onChange={handleCourseChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Course Name
                </label>

                <input
                  name="course_name"
                  value={courseFormData.course_name}
                  onChange={handleCourseChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Lecturer
                </label>

                <select
                  name="lecturer_id"
                  value={courseFormData.lecturer_id}
                  onChange={handleCourseChange}
                  required
                >
                  <option value="">
                    Select lecturer
                  </option>

                  {lecturers.map((lecturer) => (
                    <option
                      key={lecturer.id}
                      value={lecturer.id}
                    >
                      {lecturer.full_name}
                      {" - "}
                      {lecturer.staff_id}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div style={{ marginTop: "20px" }}>
              <button className="primary-button">
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
                Courses and lecturer assignments.
              </p>
            </div>
          </div>

          {loadingCourses ? (
            <p>Loading courses...</p>
          ) : (
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Name</th>
                    <th>Lecturer</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <span className="course-code">
                          {course.course_code}
                        </span>
                      </td>

                      <td>
                        {course.course_name}
                      </td>

                      <td>
                        {course.lecturer_name ||
                          "Unknown"}
                      </td>

                      <td>
                        <button
                          className="secondary-button"
                          onClick={() =>
                            handleEditCourse(course)
                          }
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
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
                  Update course details or lecturer assignment.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateCourse}>
              <div className="form-grid">

                <div className="form-group">
                  <label>
                    Course Code
                  </label>

                  <input
                    name="course_code"
                    value={editCourseForm.course_code}
                    onChange={handleEditCourseChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Course Name
                  </label>

                  <input
                    name="course_name"
                    value={editCourseForm.course_name}
                    onChange={handleEditCourseChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Lecturer
                  </label>

                  <select
                    name="lecturer_id"
                    value={editCourseForm.lecturer_id}
                    onChange={handleEditCourseChange}
                    required
                  >
                    <option value="">
                      Select lecturer
                    </option>

                    {lecturers.map((lecturer) => (
                      <option
                        key={lecturer.id}
                        value={lecturer.id}
                      >
                        {lecturer.full_name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "20px"
                }}
              >
                <button className="primary-button">
                  Save Changes
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </div>
            </form>

          </section>
        )}

        {/* ENROLLMENT MANAGEMENT */}

        <section className="content-card">
          <div className="section-header">
            <div>
              <h2>
                Enrollment Management
              </h2>

              <p className="muted-text">
                Enroll students into courses.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateEnrollment}>
            <div className="form-grid">

              <div className="form-group">
                <label>
                  Student
                </label>

                <select
                  name="student_id"
                  value={enrollmentForm.student_id}
                  onChange={handleEnrollmentChange}
                  required
                >
                  <option value="">
                    Select student
                  </option>

                  {students.map((student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.full_name}
                      {" - "}
                      {student.student_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Course
                </label>

                <select
                  name="course_id"
                  value={enrollmentForm.course_id}
                  onChange={handleEnrollmentChange}
                  required
                >
                  <option value="">
                    Select course
                  </option>

                  {courses.map((course) => (
                    <option
                      key={course.id}
                      value={course.id}
                    >
                      {course.course_code}
                      {" - "}
                      {course.course_name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div style={{ marginTop: "20px" }}>
              <button className="primary-button">
                Enroll Student
              </button>
            </div>
          </form>
        </section>

        {/* ENROLLMENTS */}

        <section className="content-card">
          <div className="section-header">
            <div>
              <h2>
                Course Enrollments
              </h2>

              <p className="muted-text">
                Current student registrations.
              </p>
            </div>
          </div>

          {loadingEnrollments ? (
            <p>Loading enrollments...</p>
          ) : (
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Number</th>
                    <th>Course</th>
                    <th>Lecturer</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>
                        <strong>
                          {enrollment.student_name}
                        </strong>
                      </td>

                      <td>
                        {enrollment.student_number}
                      </td>

                      <td>
                        <span className="course-code">
                          {enrollment.course_code}
                        </span>
                        {" "}
                        {enrollment.course_name}
                      </td>

                      <td>
                        {enrollment.lecturer_name ||
                          "N/A"}
                      </td>

                      <td>
                        <button
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default AdminDashboard;