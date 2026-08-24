import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // Not logged in
  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Logged in but wrong role
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "student") {
      return (
        <Navigate
          to="/student/dashboard"
          replace
        />
      );
    }

    if (user.role === "lecturer") {
      return (
        <Navigate
          to="/lecturer/dashboard"
          replace
        />
      );
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;