import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/sidebar.css";

function AdminLayout() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="portal-layout">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="portal-sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            SAS
          </div>

          <div>
            <h2>
              Attendance
            </h2>

            <p>
              Admin Portal
            </p>
          </div>

        </div>

        <nav className="sidebar-navigation">

          <NavLink
            to="/admin/dashboard"
            end
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              ▦
            </span>

            Overview
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              ♙
            </span>

            Users
          </NavLink>

          <NavLink
            to="/admin/courses"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              ▤
            </span>

            Courses
          </NavLink>

          <NavLink
            to="/admin/enrollments"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              ✓
            </span>

            Enrollments
          </NavLink>

          <NavLink
            to="/admin/attendance"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              ◫
            </span>

            Attendance
          </NavLink>

        </nav>

        <div className="sidebar-footer">

          <div className="sidebar-user">

            <div className="sidebar-user-avatar">
              {user?.full_name
                ? user.full_name
                    .charAt(0)
                    .toUpperCase()
                : "A"}
            </div>

            <div className="sidebar-user-details">

              <strong>
                {user?.full_name ||
                  "Administrator"}
              </strong>

              <span>
                {user?.staff_id ||
                  "Administrator"}
              </span>

            </div>

          </div>

          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </aside>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div className="portal-main">

        <header className="portal-topbar">

          <div>

            <h1>
              Student Attendance System
            </h1>

            <p>
              Administration Portal
            </p>

          </div>

          <div className="portal-role">
            Administrator
          </div>

        </header>

        <main className="portal-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default AdminLayout;