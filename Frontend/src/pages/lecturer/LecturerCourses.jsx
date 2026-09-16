import {
  useEffect,
  useState
} from "react";

import axios from "axios";
import "../../styles/dashboard.css";

function LecturerCourses() {
  const token =
    localStorage.getItem("token");

  const [courses, setCourses] =
    useState([]);

  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [startingSession, setStartingSession] =
    useState(null);

  const [activeSession, setActiveSession] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  // =========================
  // RESTORE ACTIVE SESSION
  // =========================

  useEffect(() => {
    const savedSession =
      localStorage.getItem(
        "lecturerActiveSession"
      );

    if (savedSession) {
      try {
        const parsed =
          JSON.parse(savedSession);

        const expiry =
          parsed.qr_expires_at
            ? new Date(
                parsed.qr_expires_at
              )
            : null;

        const now = new Date();

        if (
          !expiry ||
          expiry > now
        ) {
          setActiveSession(parsed);
        } else {
          localStorage.removeItem(
            "lecturerActiveSession"
          );
        }

      } catch {
        localStorage.removeItem(
          "lecturerActiveSession"
        );
      }
    }
  }, []);

  // =========================
  // FETCH COURSES
  // =========================

  const fetchCourses = async () => {
    setLoadingCourses(true);

    try {
      const response =
        await axios.get(
          "/api/courses",
          authHeaders
        );

      setCourses(
        response.data.courses || []
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to retrieve courses."
      );

    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // =========================
  // GET CURRENT LOCATION
  // =========================

  const getCurrentLocation = () => {
    return new Promise(
      (resolve, reject) => {

        if (!navigator.geolocation) {
          reject(
            new Error(
              "Geolocation is not supported by this browser."
            )
          );

          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      }
    );
  };

  // =========================
  // START ATTENDANCE
  // =========================

  const handleStartAttendance =
    async (course) => {

      setMessage("");
      setError("");
      setStartingSession(course.id);

      try {
        const position =
          await getCurrentLocation();

        const {
          latitude,
          longitude,
          accuracy
        } = position.coords;

        if (accuracy > 150) {
          setError(
            `Your current GPS accuracy is approximately ${Math.round(
              accuracy
            )} metres. Please wait for a more accurate location before starting attendance.`
          );

          return;
        }

        const now = new Date();

        const year =
          now.getFullYear();

        const month =
          String(
            now.getMonth() + 1
          ).padStart(2, "0");

        const day =
          String(
            now.getDate()
          ).padStart(2, "0");

        const sessionDate =
          `${year}-${month}-${day}`;

        const startHours =
          String(
            now.getHours()
          ).padStart(2, "0");

        const startMinutes =
          String(
            now.getMinutes()
          ).padStart(2, "0");

        const startSeconds =
          String(
            now.getSeconds()
          ).padStart(2, "0");

        const startTime =
          `${startHours}:${startMinutes}:${startSeconds}`;

        const endDate =
          new Date(
            now.getTime() +
            60 * 60 * 1000
          );

        const endHours =
          String(
            endDate.getHours()
          ).padStart(2, "0");

        const endMinutes =
          String(
            endDate.getMinutes()
          ).padStart(2, "0");

        const endSeconds =
          String(
            endDate.getSeconds()
          ).padStart(2, "0");

        const endTime =
          `${endHours}:${endMinutes}:${endSeconds}`;

        const response =
          await axios.post(
            "/api/sessions",
            {
              course_id:
                course.id,

              session_date:
                sessionDate,

              start_time:
                startTime,

              end_time:
                endTime,

              lecturer_latitude:
                latitude,

              lecturer_longitude:
                longitude
            },
            authHeaders
          );

        const session =
          response.data.session || {};

        const newActiveSession = {
          ...session,

          qr_code:
            response.data.qr_code,

          course_code:
            course.course_code,

          course_name:
            course.course_name
        };

        setActiveSession(
          newActiveSession
        );

        localStorage.setItem(
          "lecturerActiveSession",
          JSON.stringify(
            newActiveSession
          )
        );

        setMessage(
          response.data.message ||
          "Attendance session started successfully."
        );

      } catch (err) {

        if (err.code === 1) {
          setError(
            "Location permission was denied. Please allow location access and try again."
          );

        } else if (err.code === 2) {
          setError(
            "Your location could not be determined. Please check location services and try again."
          );

        } else if (err.code === 3) {
          setError(
            "Location request timed out. Please try again."
          );

        } else {
          setError(
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Failed to start attendance session."
          );
        }

      } finally {
        setStartingSession(null);
      }
    };

  // =========================
  // HIDE QR
  // =========================

  const handleDismissSession = () => {
    setActiveSession(null);

    localStorage.removeItem(
      "lecturerActiveSession"
    );
  };

  return (
    <>

      <section className="page-heading">

        <h1>
          My Courses
        </h1>

        <p>
          Review your assigned courses and
          start secure attendance sessions.
        </p>

      </section>

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

      {activeSession && (

        <section className="content-card">

          <div className="section-header">

            <div>

              <h2>
                Attendance Session Started
              </h2>

              <p className="muted-text">
                {activeSession.course_code}
                {" — "}
                {activeSession.course_name}
              </p>

            </div>

            <span className="status-badge status-present">
              Active
            </span>

          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(260px, 330px) 1fr",
              gap: "40px",
              alignItems: "center"
            }}
          >

            <div
              style={{
                textAlign: "center"
              }}
            >

              {activeSession.qr_code ? (

                <img
                  src={
                    activeSession.qr_code
                  }
                  alt="Attendance QR Code"
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "300px",
                    margin: "0 auto",
                    backgroundColor: "#ffffff",
                    padding: "14px",
                    borderRadius: "16px",
                    border:
                      "1px solid #dfe5e1"
                  }}
                />

              ) : (

                <div className="empty-state">

                  <h3>
                    QR code unavailable
                  </h3>

                  <p>
                    The session was created,
                    but no QR image was returned.
                  </p>

                </div>

              )}

            </div>

            <div>

              <h3>
                Students can now scan this QR code
              </h3>

              <p className="muted-text">
                Students must scan the secure
                QR code while the session is
                active and be within the
                allowed attendance radius.
              </p>

              <div
                style={{
                  marginTop: "22px",
                  display: "grid",
                  gap: "14px"
                }}
              >

                <div>
                  <strong>
                    Course:
                  </strong>{" "}
                  {activeSession.course_code}
                  {" — "}
                  {activeSession.course_name}
                </div>

                {activeSession.session_date && (
                  <div>
                    <strong>
                      Session Date:
                    </strong>{" "}
                    {new Date(
                      activeSession.session_date
                    ).toLocaleDateString()}
                  </div>
                )}

                {activeSession.start_time && (
                  <div>
                    <strong>
                      Start Time:
                    </strong>{" "}
                    {activeSession.start_time}
                  </div>
                )}

                {activeSession.end_time && (
                  <div>
                    <strong>
                      End Time:
                    </strong>{" "}
                    {activeSession.end_time}
                  </div>
                )}

                {activeSession.qr_expires_at && (
                  <div>
                    <strong>
                      QR Expires:
                    </strong>{" "}
                    {new Date(
                      activeSession.qr_expires_at
                    ).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit"
                      }
                    )}
                  </div>
                )}

                <div>
                  <strong>
                    Attendance Radius:
                  </strong>{" "}
                  {
                    activeSession.allowed_radius ??
                    50
                  }
                  {" metres"}
                </div>

              </div>

              <div
                style={{
                  marginTop: "26px"
                }}
              >

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    handleDismissSession
                  }
                >
                  Hide QR
                </button>

              </div>

            </div>

          </div>

        </section>

      )}

      <section className="stats-grid">

        <div className="stat-card">

          <span className="stat-label">
            Assigned Courses
          </span>

          <strong className="stat-value">
            {courses.length}
          </strong>

          <span className="stat-description">
            Courses currently assigned
            to you
          </span>

        </div>

      </section>

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              Assigned Courses
            </h2>

            <p className="muted-text">
              Start an attendance session
              for one of your courses.
            </p>

          </div>

        </div>

        {loadingCourses ? (

          <p className="muted-text">
            Loading courses...
          </p>

        ) : courses.length === 0 ? (

          <div className="empty-state">

            <h3>
              No courses assigned
            </h3>

            <p>
              Courses assigned to your
              lecturer account will appear here.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="dashboard-table">

              <thead>

                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {courses.map(
                  (course) => (

                    <tr key={course.id}>

                      <td>

                        <span className="course-code">
                          {course.course_code}
                        </span>

                      </td>

                      <td>

                        <strong>
                          {course.course_name}
                        </strong>

                      </td>

                      <td>

                        <button
                          type="button"
                          className="primary-button"
                          disabled={
                            startingSession ===
                            course.id
                          }
                          onClick={() =>
                            handleStartAttendance(
                              course
                            )
                          }
                        >

                          {startingSession ===
                          course.id
                            ? "Getting Location..."
                            : "Start Attendance"}

                        </button>

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

export default LecturerCourses;