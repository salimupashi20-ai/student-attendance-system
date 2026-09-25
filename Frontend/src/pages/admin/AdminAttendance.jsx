import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/dashboard.css";

function AdminAttendance() {
  const token = localStorage.getItem("token");

  // =========================
  // STATE
  // =========================

  const [overview, setOverview] =
    useState({
      total_sessions: 0,
      active_sessions: 0,
      attendance_records: 0,
      total_enrollments: 0
    });

  const [sessions, setSessions] =
    useState([]);

  const [loadingSessions, setLoadingSessions] =
    useState(true);

  const [selectedSession, setSelectedSession] =
    useState(null);

  const [selectedSummary, setSelectedSummary] =
    useState(null);

  const [attendanceRecords, setAttendanceRecords] =
    useState([]);

  const [loadingSelectedSession, setLoadingSelectedSession] =
    useState(false);

  const [error, setError] =
    useState("");

  // =========================
  // FETCH OVERVIEW
  // =========================

  const fetchOverview = async () => {
    try {
      const response = await axios.get(
        "/api/admin/attendance/overview",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setOverview(
        response.data.overview || {
          total_sessions: 0,
          active_sessions: 0,
          attendance_records: 0,
          total_enrollments: 0
        }
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to retrieve attendance overview."
      );
    }
  };

  // =========================
  // FETCH ALL SESSIONS
  // =========================

  const fetchSessions = async () => {
    setLoadingSessions(true);

    try {
      const response = await axios.get(
        "/api/admin/attendance/sessions",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
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
  // LOAD PAGE
  // =========================

  useEffect(() => {
    fetchOverview();
    fetchSessions();
  }, []);

  // =========================
  // VIEW SESSION
  // =========================

  const handleViewAttendance = async (session) => {
    setSelectedSession(session);
    setSelectedSummary(null);
    setAttendanceRecords([]);
    setLoadingSelectedSession(true);
    setError("");

    try {
      const [
        attendanceResponse,
        summaryResponse
      ] = await Promise.all([
        axios.get(
          `/api/admin/attendance/sessions/${session.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        ),

        axios.get(
          `/api/admin/attendance/sessions/${session.id}/summary`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      ]);

      setAttendanceRecords(
        attendanceResponse.data.attendance || []
      );

      setSelectedSummary(
        summaryResponse.data.summary || null
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to retrieve session attendance."
      );

    } finally {
      setLoadingSelectedSession(false);
    }
  };

  // =========================
  // CLOSE SESSION VIEW
  // =========================

  const handleCloseSessionView = () => {
    setSelectedSession(null);
    setSelectedSummary(null);
    setAttendanceRecords([]);
  };

  return (
    <>

      {/* =========================
          PAGE HEADING
      ========================= */}

      <section className="page-heading">

        <h1>
          Attendance Reports
        </h1>

        <p>
          Review attendance sessions,
          student records and attendance
          performance across the system.
        </p>

      </section>


      {/* =========================
          ERROR
      ========================= */}

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


      {/* =========================
          ATTENDANCE OVERVIEW
      ========================= */}

      <section className="stats-grid">

        <div className="stat-card">

          <span className="stat-label">
            Total Sessions
          </span>

          <strong className="stat-value">
            {overview.total_sessions}
          </strong>

          <span className="stat-description">
            Attendance sessions created
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Active Sessions
          </span>

          <strong className="stat-value">
            {overview.active_sessions}
          </strong>

          <span className="stat-description">
            Sessions currently open
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Attendance Records
          </span>

          <strong className="stat-value">
            {overview.attendance_records}
          </strong>

          <span className="stat-description">
            Successful attendance scans
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Enrollments
          </span>

          <strong className="stat-value">
            {overview.total_enrollments}
          </strong>

          <span className="stat-description">
            Current course registrations
          </span>

        </div>

      </section>


      {/* =========================
          SESSION TABLE
      ========================= */}

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              Attendance Sessions
            </h2>

            <p className="muted-text">
              Review attendance performance
              for every lecture session.
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
              Attendance sessions will
              appear here after lecturers
              create them.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="dashboard-table">

              <thead>

                <tr>
                  <th>Course</th>
                  <th>Lecturer</th>
                  <th>Date</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Rate</th>
                  <th>Status</th>
                  <th>Action</th>
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

                          {
                            session.course_name
                          }

                        </td>


                        <td>

                          {
                            session.lecturer_name ||
                            "N/A"
                          }

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
                            session.total_present ??
                            0
                          }

                        </td>


                        <td>

                          {
                            session.total_absent ??
                            0
                          }

                        </td>


                        <td>

                          <strong>
                            {
                              session
                                .attendance_percentage ??
                              0
                            }
                            %
                          </strong>

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


      {/* =========================
          SESSION REPORT
      ========================= */}

      {selectedSession && (

        <section className="content-card">

          <div className="section-header">

            <div>

              <h2>
                Session Report
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
                handleCloseSessionView
              }
            >
              Close
            </button>

          </div>


          {loadingSelectedSession ? (

            <p className="muted-text">
              Loading session report...
            </p>

          ) : (

            <>

              {/* =========================
                  SUMMARY
              ========================= */}

              {selectedSummary && (

                <div
                  className="stats-grid"
                  style={{
                    marginBottom: "25px"
                  }}
                >

                  <div className="stat-card">

                    <span className="stat-label">
                      Enrolled
                    </span>

                    <strong className="stat-value">
                      {
                        selectedSummary
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
                        selectedSummary
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
                        selectedSummary
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
                        selectedSummary
                          .attendance_percentage ??
                        0
                      }
                      %
                    </strong>

                    <span className="stat-description">
                      Session attendance performance
                    </span>

                  </div>

                </div>

              )}


              {/* =========================
                  ATTENDANCE TABLE
              ========================= */}

              {attendanceRecords.length === 0 ? (

                <div className="empty-state">

                  <h3>
                    No attendance recorded
                  </h3>

                  <p>
                    No eligible students
                    marked attendance for
                    this session.
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
                                  ? `${Math.round(
                                      Number(
                                        record
                                          .distance_from_lecturer
                                      )
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

export default AdminAttendance;