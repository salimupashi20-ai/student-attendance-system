import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import Login from "./pages/Login";

import StudentScan from "./pages/StudentScan";

import ProtectedRoute from "./components/ProtectedRoute";

// =========================
// ADMIN
// =========================

import AdminLayout from "./layouts/AdminLayout";

import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminEnrollments from "./pages/admin/AdminEnrollments";
import AdminAttendance from "./pages/admin/AdminAttendance";

// =========================
// LECTURER
// =========================

import LecturerLayout from "./layouts/LecturerLayout";

import LecturerOverview from "./pages/lecturer/LecturerOverview";
import LecturerCourses from "./pages/lecturer/LecturerCourses";
import LecturerSessions from "./pages/lecturer/LecturerSessions";
import LecturerAnalytics from "./pages/lecturer/LecturerAnalytics";

// =========================
// STUDENT
// =========================

import StudentLayout from "./layouts/StudentLayout";

import StudentOverview from "./pages/student/StudentOverview";
import StudentCourses from "./pages/student/StudentCourses";
import StudentAttendance from "./pages/student/StudentAttendance";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* DEFAULT */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* LOGIN */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* =========================
            STUDENT
        ========================= */}

        <Route
          path="/student"
          element={
            <ProtectedRoute
              allowedRoles={["student"]}
            >
              <StudentLayout />
            </ProtectedRoute>
          }
        >

          <Route
            index
            element={
              <Navigate
                to="/student/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <StudentOverview />
            }
          />

          <Route
            path="courses"
            element={
              <StudentCourses />
            }
          />

          <Route
            path="attendance"
            element={
              <StudentAttendance />
            }
          />

        </Route>

        {/* IMPORTANT:
            QR scan remains separate
            so the scan URL works directly
        */}

        <Route
          path="/student/scan"
          element={
            <ProtectedRoute
              allowedRoles={["student"]}
            >
              <StudentScan />
            </ProtectedRoute>
          }
        />

        {/* =========================
            LECTURER
        ========================= */}

        <Route
          path="/lecturer"
          element={
            <ProtectedRoute
              allowedRoles={["lecturer"]}
            >
              <LecturerLayout />
            </ProtectedRoute>
          }
        >

          <Route
            index
            element={
              <Navigate
                to="/lecturer/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <LecturerOverview />
            }
          />

          <Route
            path="courses"
            element={
              <LecturerCourses />
            }
          />

          <Route
            path="sessions"
            element={
              <LecturerSessions />
            }
          />

          <Route
            path="analytics"
            element={
              <LecturerAnalytics />
            }
          />

        </Route>

        {/* =========================
            ADMIN
        ========================= */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            >
              <AdminLayout />
            </ProtectedRoute>
          }
        >

          <Route
            index
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <AdminOverview />
            }
          />

          <Route
            path="users"
            element={
              <AdminUsers />
            }
          />

          <Route
            path="courses"
            element={
              <AdminCourses />
            }
          />

          <Route
            path="enrollments"
            element={
              <AdminEnrollments />
            }
          />

          <Route
            path="attendance"
            element={
              <AdminAttendance />
            }
          />

        </Route>

        {/* FALLBACK */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;