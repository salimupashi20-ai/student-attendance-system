import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import "../styles/scan.css";

function StudentScan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const sessionId = searchParams.get("session_id");
  const qrToken = searchParams.get("token");

  const isValidQr = Boolean(sessionId && qrToken);

  const handleMarkAttendance = () => {
    if (!sessionId || !qrToken) {
      setMessage("Invalid QR code.");
      return;
    }

    if (!token || !user) {
      setMessage("You must log in before marking attendance.");
      return;
    }

    if (user.role !== "student") {
      setMessage("Only students can mark attendance.");
      return;
    }

    if (!navigator.geolocation) {
      setMessage(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    setLoading(true);
    setAttendanceResult(null);
    setMessage("Getting an accurate location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        console.log("Student latitude:", latitude);
        console.log("Student longitude:", longitude);
        console.log(
          "Location accuracy:",
          accuracy,
          "metres"
        );

        if (accuracy > 50) {
          setMessage(
            `Your location is currently only accurate to about ${Math.round(
              accuracy
            )} metres. Please wait a few seconds and try again.`
          );

          setLoading(false);
          return;
        }

        try {
          const response = await axios.post(
            "/api/attendance/scan",
            {
              session_id: Number(sessionId),
              token: qrToken,
              latitude,
              longitude
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          setAttendanceResult(response.data);

          setMessage(
            response.data.message ||
            "Attendance recorded successfully."
          );
        } catch (error) {
          setMessage(
            error.response?.data?.message ||
            "Failed to mark attendance."
          );
        } finally {
          setLoading(false);
        }
      },

      (error) => {
        console.error("Geolocation error:", error);

        if (error.code === 1) {
          setMessage(
            "Location permission was denied. Please allow location access and try again."
          );
        } else if (error.code === 2) {
          setMessage(
            "Your location could not be determined. Please try again."
          );
        } else if (error.code === 3) {
          setMessage(
            "Location request timed out. Please try again."
          );
        } else {
          setMessage(
            "Location permission is required to mark attendance."
          );
        }

        setLoading(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

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
            Attendance Verification
          </p>
        </div>

        {token && (
          <button
            className="secondary-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </header>

      <main className="scan-container">

        <section className="scan-card">

          <div className="scan-header">

            <div className="scan-icon">
              ✓
            </div>

            <p className="welcome-label">
              Attendance Session
            </p>

            <h1>
              Mark Attendance
            </h1>

            <p className="muted-text">
              Verify your identity and current location
              to record attendance.
            </p>

          </div>

          <div className="scan-info-grid">

            <div className="scan-info-item">
              <span>
                Student
              </span>

              <strong>
                {user?.full_name || "Not logged in"}
              </strong>
            </div>

            <div className="scan-info-item">
              <span>
                Student Number
              </span>

              <strong>
                {user?.student_number || "N/A"}
              </strong>
            </div>

            <div className="scan-info-item">
              <span>
                Session ID
              </span>

              <strong>
                {sessionId || "Missing"}
              </strong>
            </div>

            <div className="scan-info-item">
              <span>
                QR Status
              </span>

              <strong
                className={
                  isValidQr
                    ? "scan-valid"
                    : "scan-invalid"
                }
              >
                {isValidQr
                  ? "Detected"
                  : "Invalid"}
              </strong>
            </div>

          </div>

          {!token ? (
            <div className="scan-action-section">

              <div className="info-box">
                You need to sign in before attendance
                can be recorded.
              </div>

              <button
                className="primary-button scan-main-button"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </button>

            </div>
          ) : (
            <div className="scan-action-section">

              <div className="scan-location-note">
                <strong>
                  Location verification required
                </strong>

                <p>
                  Your device will request high-accuracy
                  location access. You must be within the
                  lecturer's permitted attendance radius.
                </p>
              </div>

              <button
                className="primary-button scan-main-button"
                onClick={handleMarkAttendance}
                disabled={loading || !isValidQr}
              >
                {loading
                  ? "Checking Location..."
                  : "Mark Attendance"}
              </button>

            </div>
          )}

          {message && (
            <div
              className={`scan-message ${
                attendanceResult
                  ? "scan-message-success"
                  : ""
              }`}
            >
              {loading && (
                <div className="loading-dot" />
              )}

              <span>
                {message}
              </span>
            </div>
          )}

          {attendanceResult?.attendance && (
            <div className="attendance-confirmation">

              <div className="confirmation-icon">
                ✓
              </div>

              <h2>
                Attendance Confirmed
              </h2>

              <p>
                Your attendance has been recorded
                successfully.
              </p>

              <div className="confirmation-details">

                <div>
                  <span>
                    Status
                  </span>

                  <strong className="status-present">
                    {attendanceResult.attendance.status}
                  </strong>
                </div>

                <div>
                  <span>
                    Distance from lecturer
                  </span>

                  <strong>
                    {attendanceResult.attendance.distance}
                    {" "}
                    metres
                  </strong>
                </div>

              </div>

              <button
                className="secondary-button"
                onClick={() =>
                  navigate("/student/dashboard")
                }
              >
                Return to Dashboard
              </button>

            </div>
          )}

        </section>

      </main>
    </div>
  );
}

export default StudentScan;