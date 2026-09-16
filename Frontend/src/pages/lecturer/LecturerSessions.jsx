import {
  useEffect,
  useState
} from "react";

import axios from "axios";
import "../../styles/dashboard.css";

function LecturerSessions() {
  const token =
    localStorage.getItem("token");

  // =========================
  // STATE
  // =========================

  const [sessions, setSessions] =
    useState([]);

  const [loadingSessions, setLoadingSessions] =
    useState(true);

  const [selectedSession, setSelectedSession] =
    useState(null);

  const [attendanceRecords, setAttendanceRecords] =
    useState([]);

  const [attendanceSummary, setAttendanceSummary] =
    useState(null);

  const [loadingAttendance, setLoadingAttendance] =
    useState(false);

  const [closingSession, setClosingSession] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // =========================
  // AUTH HEADERS
  // =========================

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  // =========================
  // FETCH SESSIONS
  // =========================

  const fetchSessions = async () => {
    setLoadingSessions(true);

    try {
      const response =
        await axios.get(
          "/api/sessions",
          authHeaders
        );

      setSessions(
        response.data.sessions || []
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to retrieve attendance sessions."
      );

    } finally {
      setLoadingSessions(false);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    fetchSessions();
  }, []);

  // =========================
  // VIEW ATTENDANCE
  // =========================

  const handleViewAttendance =
    async (session) => {

      setSelectedSession(session);
      setAttendanceRecords([]);
      setAttendanceSummary(null);
      setLoadingAttendance(true);
      setError("");

      try {
        const [
          attendanceResponse,
          summaryResponse
        ] = await Promise.all([
          axios.get(
            `/api/attendance/session/${session.id}`,
            authHeaders
          ),

          axios.get(
            `/api/attendance/session/${session.id}/summary`,
            authHeaders
          )
        ]);

        setAttendanceRecords(
          attendanceResponse.data.attendance ||
          []
        );

        setAttendanceSummary(
          summaryResponse.data.summary ||
          null
        );

      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to retrieve session attendance."
        );

      } finally {
        setLoadingAttendance(false);
      }
    };

  // =========================
  // CLOSE SESSION
  // =========================

  const handleCloseSession =
    async (session) => {

      const confirmed =
        window.confirm(
          `Close attendance for ${session.course_code}?`
        );

      if (!confirmed) {
        return;
      }

      setClosingSession(session.id);
      setMessage("");
      setError("");

      try {
        const response =
          await axios.patch(
            `/api/sessions/${session.id}/close`,
            {},
            authHeaders
          );

        setMessage(
          response.data.message ||
          "Attendance session closed successfully."
        );

        await fetchSessions();

        if (
          selectedSession?.id ===
          session.id
        ) {
          setSelectedSession(
            (previous) => ({
              ...previous,
              is_active: 0
            })
          );
        }

      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to close attendance session."
        );

      } finally {
        setClosingSession(null);
      }
    };

  // =========================
  // CLOSE REPORT
  // =========================

  const handleCloseReport = () => {
    setSelectedSession(null);
    setAttendanceRecords([]);
    setAttendanceSummary(null);
  };

  return (
    <>

      {/* PAGE HEADING */}

      <section className="page-heading">

        <h1>
          Attendance Sessions
        </h1>

        <p>
          Review your lecture sessions,
          close active attendance and
          inspect student attendance.
        </p>

      </section>


      {/* MESSAGES */}

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


      {/* SESSION STATISTICS */}

      <section className="stats-grid">

        <div className="stat-card">

          <span className="stat-label">
            Total Sessions
          </span>

          <strong className="stat-value">
            {sessions.length}
          </strong>

          <span className="stat-description">
            Attendance sessions created
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Active
          </span>

          <strong className="stat-value">
            {
              sessions.filter(
                (session) =>
                  Number(
                    session.is_active
                  ) === 1
              ).length
            }
          </strong>

          <span className="stat-description">
            Sessions currently open
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Closed
          </span>

          <strong className="stat-value">
            {
              sessions.filter(
                (session) =>
                  Number(
                    session.is_active
                  ) !== 1
              ).length
            }
          </strong>

          <span className="stat-description">
            Completed attendance sessions
          </span>

        </div>

      </section>


      {/* SESSION HISTORY */}

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              Session History
            </h2>

            <p className="muted-text">
              All attendance sessions
              created from your lecturer
              account.
            </p>

          </div>

        </div>


        {loadingSessions ? (

          <p className="muted-text">
            Loading attendance sessions...
          </p>

        ) : sessions.length === 0 ? (

          <div className="empty-state">

            <h3>
              No sessions found
            </h3>

            <p>
              Start attendance from the
              My Courses page and your
              sessions will appear here.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="dashboard-table">

              <thead>

                <tr>
                  <th>Course</th>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>QR Expiry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>

              </thead>


              <tbody>

                {sessions.map(
                  (session) => {

                    const isActive =
                      Number(
                        session.is_active
                      ) === 1;

                    return (

                      <tr
                        key={
                          session.id
                        }
                      >

                        <td>

                          <span className="course-code">
                            {
                              session.course_code
                            }
                          </span>

                          {" "}

                          <strong>
                            {
                              session.course_name
                            }
                          </strong>

                        </td>


                        <td>

                          {session.session_date
                            ? new Date(
                                session.session_date
                              ).toLocaleDateString()
                            : "N/A"}

                        </td>


                        <td>

                          {
                            session.start_time ||
                            "N/A"
                          }

                        </td>


                        <td>

                          {session.qr_expires_at
                            ? new Date(
                                session.qr_expires_at
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour:
                                    "2-digit",
                                  minute:
                                    "2-digit"
                                }
                              )
                            : "N/A"}

                        </td>


                        <td>

                          <span
                            className={
                              isActive
                                ? "status-badge status-present"
                                : "status-badge"
                            }
                          >
                            {
                              isActive
                                ? "Active"
                                : "Closed"
                            }
                          </span>

                        </td>


                        <td>

                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap"
                            }}
                          >

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                handleViewAttendance(
                                  session
                                )
                              }
                            >
                              View Attendance
                            </button>


                            {isActive && (

                              <button
                                type="button"
                                className="danger-button"
                                disabled={
                                  closingSession ===
                                  session.id
                                }
                                onClick={() =>
                                  handleCloseSession(
                                    session
                                  )
                                }
                              >

                                {closingSession ===
                                session.id
                                  ? "Closing..."
                                  : "Close Session"}

                              </button>

                            )}

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* SELECTED SESSION REPORT */}

      {selectedSession && (

        <section className="content-card">

          <div className="section-header">

            <div>

              <h2>
                Session Attendance
              </h2>

              <p className="muted-text">
                {
                  selectedSession.course_code
                }
                {" — "}
                {
                  selectedSession.course_name
                }
              </p>

            </div>


            <button
              type="button"
              className="secondary-button"
              onClick={
                handleCloseReport
              }
            >
              Close
            </button>

          </div>


          {loadingAttendance ? (

            <p className="muted-text">
              Loading attendance...
            </p>

          ) : (

            <>

              {/* SUMMARY */}

              {attendanceSummary && (

                <div
                  className="stats-grid"
                  style={{
                    marginBottom: "24px"
                  }}
                >

                  <div className="stat-card">

                    <span className="stat-label">
                      Enrolled
                    </span>

                    <strong className="stat-value">
                      {
                        attendanceSummary
                          .total_enrolled ??
                        0
                      }
                    </strong>

                    <span className="stat-description">
                      Eligible students
                    </span>

                  </div>


                  <div className="stat-card">

                    <span className="stat-label">
                      Present
                    </span>

                    <strong className="stat-value">
                      {
                        attendanceSummary
                          .total_present ??
                        0
                      }
                    </strong>

                    <span className="stat-description">
                      Students who attended
                    </span>

                  </div>


                  <div className="stat-card">

                    <span className="stat-label">
                      Absent
                    </span>

                    <strong className="stat-value">
                      {
                        attendanceSummary
                          .total_absent ??
                        0
                      }
                    </strong>

                    <span className="stat-description">
                      Students who missed session
                    </span>

                  </div>


                  <div className="stat-card">

                    <span className="stat-label">
                      Attendance Rate
                    </span>

                    <strong className="stat-value">
                      {
                        attendanceSummary
                          .attendance_percentage ??
                        0
                      }
                      %
                    </strong>

                    <span className="stat-description">
                      Session performance
                    </span>

                  </div>

                </div>

              )}


              {/* ATTENDANCE TABLE */}

              {attendanceRecords.length === 0 ? (

                <div className="empty-state">

                  <h3>
                    No attendance recorded
                  </h3>

                  <p>
                    No eligible students
                    have marked attendance
                    for this session.
                  </p>

                </div>

              ) : (

                <div className="table-wrapper">

                  <table className="dashboard-table">

                    <thead>

                      <tr>
                        <th>Student</th>
                        <th>Student Number</th>
                        <th>Scan Time</th>
                        <th>Distance</th>
                        <th>Status</th>
                      </tr>

                    </thead>


                    <tbody>

                      {attendanceRecords.map(
                        (record, index) => (

                          <tr
                            key={
                              record.id ||
                              `${record.student_id}-${index}`
                            }
                          >

                            <td>

                              <strong>
                                {
                                  record.student_name ||
                                  record.full_name ||
                                  "N/A"
                                }
                              </strong>

                            </td>


                            <td>

                              {
                                record.student_number ||
                                "N/A"
                              }

                            </td>


                            <td>

                              {record.scan_time
                                ? new Date(
                                    record.scan_time
                                  ).toLocaleTimeString(
                                    [],
                                    {
                                      hour:
                                        "2-digit",
                                      minute:
                                        "2-digit"
                                    }
                                  )
                                : "N/A"}

                            </td>


                            <td>

                              {
                                record
                                  .distance_from_lecturer !=
                                null
                                  ? `${Number(
                                      record
                                        .distance_from_lecturer
                                    ).toFixed(
                                      1
                                    )} m`
                                  : "N/A"
                              }

                            </td>


                            <td>

                              <span className="status-badge status-present">
                                {
                                  record.status ||
                                  "Present"
                                }
                              </span>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </>

          )}

        </section>

      )}

    </>
  );
}

export default LecturerSessions;