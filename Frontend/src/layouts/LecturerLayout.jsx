import {
  NavLink,
  Outlet,
  useNavigate
} from "react-router-dom";

import "../styles/dashboard.css";
import "../styles/sidebar.css";

function LecturerLayout() {
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

      <aside className="portal-sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            SAS
          </div>

          <div>
            <h2>Attendance</h2>
            <p>Lecturer Portal</p>
          </div>

        </div>

        <nav className="sidebar-navigation">

          <NavLink
            to="/lecturer/dashboard"
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
            to="/lecturer/courses"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              ▤
            </span>

            My Courses
          </NavLink>

          <NavLink
            to="/lecturer/sessions"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              ◫
            </span>

            Sessions
          </NavLink>

          <NavLink
            to="/lecturer/analytics"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              ◈
            </span>

            Analytics
          </NavLink>

        </nav>

        <div className="sidebar-footer">

          <div className="sidebar-user">

            <div className="sidebar-user-avatar">
              {user?.full_name
                ? user.full_name
                    .charAt(0)
                    .toUpperCase()
                : "L"}
            </div>

            <div className="sidebar-user-details">

              <strong>
                {user?.full_name ||
                  "Lecturer"}
              </strong>

              <span>
                {user?.staff_id ||
                  "Lecturer"}
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

      <div className="portal-main">

        <header className="portal-topbar">

          <div>
            <h1>
              Student Attendance System
            </h1>

            <p>
              Lecturer Portal
            </p>
          </div>

          <div className="portal-role">
            Lecturer
          </div>

        </header>

        <main className="portal-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default LecturerLayout;