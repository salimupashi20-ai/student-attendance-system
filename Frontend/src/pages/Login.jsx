import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/moodle-login", {
        username: username.trim(),
        password
      });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      const from = location.state?.from;
      if (user.role === "student" && from) {
        navigate(`${from.pathname}${from.search || ""}`, { replace: true });
      } else if (user.role === "student") {
        navigate("/student/dashboard", { replace: true });
      } else if (user.role === "lecturer") {
        navigate("/lecturer/dashboard", { replace: true });
      } else if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        setError("Your account does not have an authorized SAS role.");
      }
    } catch (err) {
      setError(err.response?.data?.message ||
        "Unable to connect to the Moodle login service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo">SA</div>
          <h1>Student Attendance System</h1>
          <p>Sign in to access your attendance portal.</p>
        </div>

        <div className="login-card">
          <div className="login-card-header">
            <h2>Welcome back</h2>
            <p>Use your Moodle username and password.</p>
          </div>

          {error && (
            <div className="error-message login-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="moodle-username">Moodle Username</label>
              <input
                id="moodle-username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your Moodle username"
                autoComplete="username"
                required
              />
            </div>
            <div className="form-group login-password-field">
              <label htmlFor="moodle-password">Moodle Password</label>
              <input
                id="moodle-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your Moodle password"
                autoComplete="current-password"
                required
              />
            </div>
            <button className="primary-button login-button" type="submit" disabled={loading}>
              {loading ? "Signing in with Moodle..." : "Sign In with Moodle"}
            </button>
          </form>
          <p className="muted-text" style={{ textAlign: "center", marginTop: "18px", fontSize: "13px" }}>
            Your Moodle account is verified securely. You do not need a separate SAS password.
          </p>
        </div>
        <p className="login-footer">
          Secure attendance access for students, lecturers and administrators.
        </p>
      </div>
    </div>
  );
}

export default Login;
