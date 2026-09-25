import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "/api/auth/login",
        {
          identifier,
          password
        }
      );

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      const previousLocation =
        location.state?.from;

      // If student scanned a QR before logging in,
      // send them back to the QR attendance page.
      if (
        user.role === "student" &&
        previousLocation
      ) {
        const destination =
          `${previousLocation.pathname}${previousLocation.search || ""}`;

        navigate(destination, {
          replace: true
        });

        return;
      }

      // Normal role-based navigation
      if (user.role === "student") {
        navigate(
          "/student/dashboard",
          { replace: true }
        );
      } else if (user.role === "lecturer") {
        navigate(
          "/lecturer/dashboard",
          { replace: true }
        );
      } else if (user.role === "admin") {
        navigate(
          "/admin/dashboard",
          { replace: true }
        );
      } else {
        setError(
          "Your account does not have a valid system role."
        );
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-container">

        <div className="login-brand">

          <div className="login-logo">
            SA
          </div>

          <h1>
            Student Attendance System
          </h1>

          <p>
            Sign in to access your attendance portal.
          </p>

        </div>

        <div className="login-card">

          <div className="login-card-header">
            <h2>
              Welcome back
            </h2>

            <p>
              Enter your student number or staff ID
              to continue.
            </p>
          </div>

          {error && (
            <div className="error-message login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label>
                Student Number / Staff ID
              </label>

              <input
                type="text"
                value={identifier}
                onChange={(e) =>
                  setIdentifier(e.target.value)
                }
                placeholder="Enter your identifier"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group login-password-field">
              <label>
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              className="primary-button login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>

        </div>

        <p className="login-footer">
          Secure attendance access for students,
          lecturers and administrators.
        </p>

      </div>

    </div>
  );
}

export default Login;