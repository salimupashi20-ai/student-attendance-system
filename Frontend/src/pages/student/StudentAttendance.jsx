import {
  useEffect,
  useState
} from "react";

import axios from "axios";
import "../../styles/dashboard.css";

function StudentAttendance() {
  const token =
    localStorage.getItem("token");

  const [summary, setSummary] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const [
          summaryResponse,
          historyResponse
        ] = await Promise.all([
          axios.get(
            "/api/attendance/my-summary",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          ),

          axios.get(
            "/api/attendance/my-history",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          )
        ]);

        setSummary(
          summaryResponse.data.summary ||
          null
        );

        setHistory(
          historyResponse.data.attendance ||
          historyResponse.data.history ||
          []
        );

      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to retrieve attendance information."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [token]);

  if (loading) {
    return (
      <section className="content-card">
        Loading attendance...
      </section>
    );
  }

  return (
    <>

      {/* PAGE HEADING */}

      <section className="page-heading">

        <h1>
          My Attendance
        </h1>

        <p>
          Review your attendance summary
          and previous lecture sessions.
        </p>

      </section>


      {/* ERROR */}

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


      {/* SUMMARY */}

      <section className="stats-grid">

        <div className="stat-card">

          <span className="stat-label">
            Attendance Rate
          </span>

          <strong className="stat-value">
            {
              summary?.attendance_percentage ??
              0
            }
            %
          </strong>

          <span className="stat-description">
            Overall attendance performance
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Present
          </span>

          <strong className="stat-value">
            {
              summary?.total_present ??
              0
            }
          </strong>

          <span className="stat-description">
            Sessions attended
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Absent
          </span>

          <strong className="stat-value">
            {
              summary?.total_absent ??
              0
            }
          </strong>

          <span className="stat-description">
            Eligible sessions missed
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Total Sessions
          </span>

          <strong className="stat-value">
            {
              summary?.total_sessions ??
              0
            }
          </strong>

          <span className="stat-description">
            Eligible completed sessions
          </span>

        </div>

      </section>


      {/* HISTORY */}

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              Attendance History
            </h2>

            <p className="muted-text">
              Your recorded attendance
              across eligible lecture
              sessions.
            </p>

          </div>

        </div>


        {history.length === 0 ? (

          <div className="empty-state">

            <h3>
              No attendance history
            </h3>

            <p>
              Your attendance records
              will appear here after
              you scan a lecturer's QR
              code.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="dashboard-table">

              <thead>

                <tr>
                  <th>Course</th>
                  <th>Date</th>
                  <th>Scan Time</th>
                  <th>Distance</th>
                  <th>Status</th>
                </tr>

              </thead>


              <tbody>

                {history.map(
                  (record, index) => (

                    <tr
                      key={
                        record.id ||
                        `${record.session_id}-${index}`
                      }
                    >

                      <td>

                        <span className="course-code">
                          {
                            record.course_code
                          }
                        </span>

                        {" "}

                        <strong>
                          {
                            record.course_name
                          }
                        </strong>

                      </td>


                      <td>

                        {record.session_date
                          ? new Date(
                              record.session_date
                            ).toLocaleDateString()
                          : "N/A"}

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

      </section>


      {/* QR EXPLANATION */}

      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              How Attendance Works
            </h2>

          </div>

        </div>

        <p className="muted-text">
          To mark attendance, scan the
          QR code displayed by your
          lecturer. The system checks
          the session token, course
          enrollment, QR expiry and your
          physical distance from the
          lecturer before recording the
          attendance.
        </p>

      </section>

    </>
  );
}

export default StudentAttendance;