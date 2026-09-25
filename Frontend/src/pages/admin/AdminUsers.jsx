import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../styles/dashboard.css";

function AdminUsers() {
  const token = localStorage.getItem("token");

  // =========================
  // STATE
  // =========================

  const [users, setUsers] = useState([]);

  const [loadingUsers, setLoadingUsers] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [formData, setFormData] =
    useState({
      full_name: "",
      student_number: "",
      staff_id: "",
      password: "",
      role: "student"
    });

  // =========================
  // FETCH USERS
  // =========================

  const fetchUsers = async () => {
    setLoadingUsers(true);

    try {
      const response = await axios.get(
        "/api/admin/users",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUsers(
        response.data.users || []
      );

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
  // LOAD USERS
  // =========================

  useEffect(() => {
    fetchUsers();
  }, []);

  // =========================
  // USER COUNTS
  // =========================

  const userStatistics =
    useMemo(() => {
      return {
        total: users.length,

        students:
          users.filter(
            (user) =>
              user.role === "student"
          ).length,

        lecturers:
          users.filter(
            (user) =>
              user.role === "lecturer"
          ).length,

        admins:
          users.filter(
            (user) =>
              user.role === "admin"
          ).length
      };
    }, [users]);

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
        [name]: value,

        ...(name === "role"
          ? {
              student_number:
                value === "student"
                  ? previous.student_number
                  : "",

              staff_id:
                value === "student"
                  ? ""
                  : previous.staff_id
            }
          : {})
      })
    );
  };

  // =========================
  // CREATE USER
  // =========================

  const handleCreateUser = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const payload = {
        full_name:
          formData.full_name.trim(),

        password:
          formData.password,

        role:
          formData.role,

        student_number:
          formData.role === "student"
            ? formData.student_number.trim()
            : null,

        staff_id:
          formData.role === "student"
            ? null
            : formData.staff_id.trim()
      };

      const response = await axios.post(
        "/api/admin/users",
        payload,
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

      setFormData({
        full_name: "",
        student_number: "",
        staff_id: "",
        password: "",
        role: "student"
      });

      fetchUsers();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to create user."
      );
    }
  };

  return (
    <>

      {/* =========================
          PAGE HEADING
      ========================= */}

      <section className="page-heading">

        <h1>
          User Management
        </h1>

        <p>
          Create and review student,
          lecturer and administrator
          accounts.
        </p>

      </section>


      {/* =========================
          MESSAGES
      ========================= */}

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


      {/* =========================
          USER STATISTICS
      ========================= */}

      <section className="stats-grid">

        <div className="stat-card">

          <span className="stat-label">
            Total Users
          </span>

          <strong className="stat-value">
            {userStatistics.total}
          </strong>

          <span className="stat-description">
            Registered system accounts
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Students
          </span>

          <strong className="stat-value">
            {userStatistics.students}
          </strong>

          <span className="stat-description">
            Student accounts
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Lecturers
          </span>

          <strong className="stat-value">
            {userStatistics.lecturers}
          </strong>

          <span className="stat-description">
            Lecturer accounts
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Administrators
          </span>

          <strong className="stat-value">
            {userStatistics.admins}
          </strong>

          <span className="stat-description">
            Admin accounts
          </span>

        </div>

      </section>


      {/* =========================
          CREATE USER
      ========================= */}

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              Create User
            </h2>

            <p className="muted-text">
              Register a new student,
              lecturer or administrator.
            </p>

          </div>

        </div>


        <form
          onSubmit={handleCreateUser}
        >

          <div className="form-grid">

            {/* FULL NAME */}

            <div className="form-group">

              <label>
                Full Name
              </label>

              <input
                type="text"
                name="full_name"
                value={
                  formData.full_name
                }
                onChange={
                  handleChange
                }
                placeholder="Enter full name"
                required
              />

            </div>


            {/* ROLE */}

            <div className="form-group">

              <label>
                Role
              </label>

              <select
                name="role"
                value={
                  formData.role
                }
                onChange={
                  handleChange
                }
                required
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


            {/* STUDENT NUMBER */}

            {formData.role ===
              "student" && (

              <div className="form-group">

                <label>
                  Student Number
                </label>

                <input
                  type="text"
                  name="student_number"
                  value={
                    formData.student_number
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: 2021402819"
                  required
                />

              </div>

            )}


            {/* STAFF ID */}

            {(formData.role ===
              "lecturer" ||
              formData.role ===
                "admin") && (

              <div className="form-group">

                <label>
                  Staff ID
                </label>

                <input
                  type="text"
                  name="staff_id"
                  value={
                    formData.staff_id
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: STAFF003"
                  required
                />

              </div>

            )}


            {/* PASSWORD */}

            <div className="form-group">

              <label>
                Temporary Password
              </label>

              <input
                type="password"
                name="password"
                value={
                  formData.password
                }
                onChange={
                  handleChange
                }
                placeholder="Enter temporary password"
                required
              />

            </div>

          </div>


          <div
            style={{
              marginTop: "20px"
            }}
          >

            <button
              className="primary-button"
              type="submit"
            >
              Create User
            </button>

          </div>

        </form>

      </section>


      {/* =========================
          SYSTEM USERS
      ========================= */}

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              System Users
            </h2>

            <p className="muted-text">
              All accounts currently
              registered in the system.
            </p>

          </div>

        </div>


        {loadingUsers ? (

          <p className="muted-text">
            Loading users...
          </p>

        ) : users.length === 0 ? (

          <div className="empty-state">

            <h3>
              No users found
            </h3>

            <p>
              Registered users will
              appear here.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="dashboard-table">

              <thead>

                <tr>
                  <th>Name</th>
                  <th>Identifier</th>
                  <th>Role</th>
                  <th>Created</th>
                </tr>

              </thead>


              <tbody>

                {users.map(
                  (systemUser) => (

                    <tr
                      key={
                        systemUser.id
                      }
                    >

                      <td>

                        <strong>
                          {
                            systemUser
                              .full_name
                          }
                        </strong>

                      </td>


                      <td>

                        {
                          systemUser
                            .student_number ||
                          systemUser
                            .staff_id ||
                          "N/A"
                        }

                      </td>


                      <td>

                        <span
                          className={
                            `role-badge role-${systemUser.role}`
                          }
                        >
                          {
                            systemUser.role
                          }
                        </span>

                      </td>


                      <td>

                        {systemUser.created_at
                          ? new Date(
                              systemUser.created_at
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

export default AdminUsers;