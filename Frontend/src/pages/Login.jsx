import { useState } from "react";
import axios from "axios";
import {
  useNavigate,
  useLocation
} from "react-router-dom";

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "/api/auth/login",
        {
          identifier,
          password
        }
      );

      const token = response.data.token;
      const user = response.data.user;

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      // Page user originally tried to visit
      const originalLocation =
        location.state?.from;

      if (user.role === "student") {

        // If student arrived through QR,
        // return them to the scan page
        if (
          originalLocation &&
          originalLocation.pathname === "/student/scan"
        ) {
          navigate(
            originalLocation.pathname +
              originalLocation.search,
            { replace: true }
          );

          return;
        }

        // Normal student login
        navigate(
          "/student/dashboard",
          { replace: true }
        );

      } else if (user.role === "lecturer") {

        navigate(
          "/lecturer/dashboard",
          { replace: true }
        );
      }

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Login failed."
      );
    }
  };

  return (
    <div>
      <h2>Student Attendance System</h2>

      <form onSubmit={handleLogin}>

        <div>
          <label>
            Student Number / Staff ID
          </label>

          <input
            type="text"
            value={identifier}
            onChange={(e) =>
              setIdentifier(e.target.value)
            }
            required
          />
        </div>

        <div>
          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />
        </div>

        <button type="submit">
          Login
        </button>

      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Login;