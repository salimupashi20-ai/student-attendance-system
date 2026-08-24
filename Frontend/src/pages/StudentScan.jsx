import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

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
      setMessage("Geolocation is not supported by this browser.");
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
        console.log("Location accuracy:", accuracy, "metres");

        // Reject very inaccurate GPS readings
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

  return (
    <div>
      <h1>Mark Attendance</h1>

      <p>
        Student: {user?.full_name || "Not logged in"}
      </p>

      <p>
        Session ID: {sessionId || "Missing"}
      </p>

      {!token ? (
        <div>
          <p>
            You need to log in before you can mark attendance.
          </p>

          <button onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      ) : (
        <button
          onClick={handleMarkAttendance}
          disabled={loading}
        >
          {loading
            ? "Checking location..."
            : "Mark Attendance"}
        </button>
      )}

      {message && (
        <p>{message}</p>
      )}

      {attendanceResult?.attendance && (
        <div>
          <h2>Attendance Confirmed</h2>

          <p>
            Status: {attendanceResult.attendance.status}
          </p>

          <p>
            Distance from lecturer:{" "}
            {attendanceResult.attendance.distance} metres
          </p>
        </div>
      )}
    </div>
  );
}

export default StudentScan;