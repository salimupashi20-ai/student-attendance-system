import {
  useEffect,
  useRef,
  useState
} from "react";

import axios from "axios";
import "../../styles/dashboard.css";

function LecturerCourses() {
  const token =
    localStorage.getItem("token");

  // A laptop reading better than this
  // can be used directly.
  const GOOD_LAPTOP_ACCURACY = 80;

  const [courses, setCourses] =
    useState([]);

  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [startingSession, setStartingSession] =
    useState(null);

  const [activeSession, setActiveSession] =
    useState(null);

  // The backend is the source of truth for whether
  // an attendance session is still active.
  const [serverActiveSession, setServerActiveSession] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // Poor laptop reading saved here
  // so the lecturer can choose the
  // mobile fallback.
  const [pendingCourse, setPendingCourse] =
    useState(null);

  const [pendingSessionData, setPendingSessionData] =
    useState(null);

  const [laptopAccuracy, setLaptopAccuracy] =
    useState(null);

  // Mobile setup request
  const [mobileRequest, setMobileRequest] =
    useState(null);

  const [creatingMobileRequest, setCreatingMobileRequest] =
    useState(false);

  const [mobileStatus, setMobileStatus] =
    useState("");

  const [mobileAccuracy, setMobileAccuracy] =
    useState(null);

  const pollingRef =
    useRef(null);

  const processingMobileRef =
    useRef(false);

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  // =========================================
  // RESTORE ACTIVE ATTENDANCE QR FROM SERVER
  // =========================================

  const fetchActiveSession =
    async (showQr = true) => {

      try {
        const response =
          await axios.get(
            "/api/sessions/active",
            authHeaders
          );

        const session =
          response.data.activeSession;

        if (!session) {
          setServerActiveSession(null);

          if (showQr) {
            setActiveSession(null);
          }

          localStorage.removeItem(
            "lecturerActiveSession"
          );

          return null;
        }

        setServerActiveSession(
          session
        );

        if (showQr) {
          setActiveSession(
            session
          );

          localStorage.setItem(
            "lecturerActiveSession",
            JSON.stringify(
              session
            )
          );
        }

        return session;

      } catch (err) {
        console.error(
          "FAILED TO RESTORE ACTIVE SESSION:",
          err
        );

        return null;
      }
    };

  useEffect(() => {
    fetchActiveSession(true);
  }, []);

  // =========================================
  // CLEAN UP POLLING
  // =========================================

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(
          pollingRef.current
        );
      }
    };
  }, []);

  // =========================================
  // FETCH COURSES
  // =========================================

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

  // =========================================
  // DATE + TIME VALUES
  // =========================================

  const buildSessionData = () => {
    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      );

    const sessionDate =
      `${year}-${month}-${day}`;

    const startHours =
      String(
        now.getHours()
      ).padStart(
        2,
        "0"
      );

    const startMinutes =
      String(
        now.getMinutes()
      ).padStart(
        2,
        "0"
      );

    const startSeconds =
      String(
        now.getSeconds()
      ).padStart(
        2,
        "0"
      );

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
      ).padStart(
        2,
        "0"
      );

    const endMinutes =
      String(
        endDate.getMinutes()
      ).padStart(
        2,
        "0"
      );

    const endSeconds =
      String(
        endDate.getSeconds()
      ).padStart(
        2,
        "0"
      );

    const endTime =
      `${endHours}:${endMinutes}:${endSeconds}`;

    return {
      session_date:
        sessionDate,

      start_time:
        startTime,

      end_time:
        endTime
    };
  };

  // =========================================
  // GET BEST LAPTOP LOCATION
  // =========================================

  const getBestLaptopLocation = () => {
    return new Promise(
      (resolve, reject) => {

        if (
          !navigator.geolocation
        ) {
          reject(
            new Error(
              "Geolocation is not supported by this browser."
            )
          );

          return;
        }

        let bestPosition = null;
        let finished = false;
        let watchId = null;
        let timeoutId = null;

        const finish = (
          position,
          geoError = null
        ) => {
          if (finished) {
            return;
          }

          finished = true;

          if (
            watchId !== null
          ) {
            navigator.geolocation
              .clearWatch(
                watchId
              );
          }

          if (
            timeoutId !== null
          ) {
            clearTimeout(
              timeoutId
            );
          }

          if (position) {
            resolve(position);
          } else {
            reject(
              geoError ||
              new Error(
                "Unable to determine your location."
              )
            );
          }
        };

        watchId =
          navigator.geolocation
            .watchPosition(
              (position) => {

                if (
                  !bestPosition ||
                  position.coords.accuracy <
                    bestPosition.coords.accuracy
                ) {
                  bestPosition =
                    position;
                }

                // Excellent laptop reading:
                // finish early.
                if (
                  position.coords.accuracy <=
                  40
                ) {
                  finish(position);
                }
              },

              (geoError) => {

                if (
                  geoError.code === 1
                ) {
                  finish(
                    null,
                    geoError
                  );
                }
              },

              {
                enableHighAccuracy:
                  true,

                maximumAge:
                  0,

                timeout:
                  12000
              }
            );

        timeoutId =
          setTimeout(
            () => {

              if (
                bestPosition
              ) {
                finish(
                  bestPosition
                );
              } else {
                finish(
                  null,
                  new Error(
                    "The laptop could not determine its location."
                  )
                );
              }

            },
            10000
          );
      }
    );
  };

  // =========================================
  // CREATE ACTUAL ATTENDANCE SESSION
  // =========================================

  const createAttendanceSession =
    async ({
      course,
      sessionData,
      latitude,
      longitude,
      accuracy,
      source
    }) => {

      const response =
        await axios.post(
          "/api/sessions",
          {
            course_id:
              course.id,

            session_date:
              sessionData.session_date,

            start_time:
              sessionData.start_time,

            end_time:
              sessionData.end_time,

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
          course.course_name,

        lecturer_accuracy:
          Math.round(
            Number(accuracy)
          ),

        location_source:
          source
      };

      setActiveSession(
        newActiveSession
      );

      setServerActiveSession(
        newActiveSession
      );

      localStorage.setItem(
        "lecturerActiveSession",
        JSON.stringify(
          newActiveSession
        )
      );

      return newActiveSession;
    };

  // =========================================
  // START ATTENDANCE
  // =========================================

  const handleStartAttendance =
    async (course) => {

      setMessage("");
      setError("");

      setPendingCourse(null);
      setPendingSessionData(null);

      setLaptopAccuracy(null);

      setMobileRequest(null);
      setMobileStatus("");
      setMobileAccuracy(null);

      setStartingSession(
        course.id
      );

      try {
        const sessionData =
          buildSessionData();

        const position =
          await getBestLaptopLocation();

        const {
          latitude,
          longitude,
          accuracy
        } = position.coords;

        setLaptopAccuracy(
          Math.round(
            accuracy
          )
        );

        // =================================
        // GOOD LAPTOP LOCATION
        // =================================

        if (
          accuracy <=
          GOOD_LAPTOP_ACCURACY
        ) {
          await createAttendanceSession({
            course,
            sessionData,
            latitude,
            longitude,
            accuracy,
            source:
              "Laptop"
          });

          setMessage(
            `Attendance session started successfully using the laptop location (±${Math.round(
              accuracy
            )} m).`
          );

          return;
        }

        // =================================
        // POOR LAPTOP LOCATION
        // =================================

        setPendingCourse(
          course
        );

        setPendingSessionData(
          sessionData
        );

        setError(
          `The laptop location accuracy is approximately ±${Math.round(
            accuracy
          )} metres, which is not reliable enough to anchor a 50-metre attendance zone. Use the mobile location option below.`
        );

      } catch (err) {

        if (
          err.code === 1
        ) {
          setError(
            "Location permission was denied. Please allow location access and try again."
          );

        } else if (
          err.code === 2
        ) {
          setError(
            "The laptop could not determine its location."
          );

        } else if (
          err.code === 3
        ) {
          setError(
            "The laptop location request timed out."
          );

        } else {
          setError(
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Failed to prepare the attendance session."
          );
        }

      } finally {
        setStartingSession(
          null
        );
      }
    };

  // =========================================
  // CREATE MOBILE LOCATION REQUEST
  // =========================================

  const handleUseMobileLocation =
    async () => {

      if (
        !pendingCourse ||
        !pendingSessionData
      ) {
        setError(
          "No pending attendance session is available."
        );

        return;
      }

      setCreatingMobileRequest(
        true
      );

      setMessage("");
      setError("");

      try {
        const response =
          await axios.post(
            "/api/location-requests",
            {
              course_id:
                pendingCourse.id,

              session_date:
                pendingSessionData
                  .session_date,

              start_time:
                pendingSessionData
                  .start_time,

              end_time:
                pendingSessionData
                  .end_time
            },
            authHeaders
          );

        const request = {
          ...response.data.request,

          setup_qr_code:
            response.data
              .setup_qr_code,

          mobile_url:
            response.data
              .mobile_url
        };

        setMobileRequest(
          request
        );

        setMobileStatus(
          "pending"
        );

        setMessage(
          "Mobile location setup QR created. Scan it using the lecturer's phone."
        );

        startPollingMobileRequest(
          request.id
        );

      } catch (err) {
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create the mobile location request."
        );

      } finally {
        setCreatingMobileRequest(
          false
        );
      }
    };

  // =========================================
  // POLL PHONE LOCATION STATUS
  // =========================================

  const startPollingMobileRequest =
    (requestId) => {

      if (
        pollingRef.current
      ) {
        clearInterval(
          pollingRef.current
        );
      }

      pollingRef.current =
        setInterval(
          async () => {

            try {
              const response =
                await axios.get(
                  `/api/location-requests/${requestId}/status`,
                  authHeaders
                );

              const request =
                response.data.request;

              setMobileStatus(
                request.status
              );

              if (
                request.accuracy !==
                  null &&
                request.accuracy !==
                  undefined
              ) {
                setMobileAccuracy(
                  Math.round(
                    Number(
                      request.accuracy
                    )
                  )
                );
              }

              // Phone has submitted GPS
              if (
                request.status ===
                "completed"
              ) {
                clearInterval(
                  pollingRef.current
                );

                pollingRef.current =
                  null;

                await handleMobileLocationCompleted(
                  request
                );
              }

              if (
                request.status ===
                "expired"
              ) {
                clearInterval(
                  pollingRef.current
                );

                pollingRef.current =
                  null;

                setError(
                  "The mobile location setup request expired. Please create a new one."
                );
              }

            } catch (err) {
              console.error(
                "LOCATION POLLING ERROR:",
                err
              );
            }

          },
          2000
        );
    };

  // =========================================
  // PHONE LOCATION RECEIVED
  // =========================================

  const handleMobileLocationCompleted =
    async (request) => {

      if (
        processingMobileRef.current
      ) {
        return;
      }

      processingMobileRef.current =
        true;

      try {
        if (
          !pendingCourse ||
          !pendingSessionData
        ) {
          throw new Error(
            "The pending course information is no longer available."
          );
        }

        setMobileStatus(
          "creating-session"
        );

        await createAttendanceSession({
          course:
            pendingCourse,

          sessionData:
            pendingSessionData,

          latitude:
            Number(
              request.latitude
            ),

          longitude:
            Number(
              request.longitude
            ),

          accuracy:
            Number(
              request.accuracy || 0
            ),

          source:
            "Mobile Phone"
        });

        // Mark setup request as used
        await axios.patch(
          `/api/location-requests/${request.id}/used`,
          {},
          authHeaders
        );

        setMobileStatus(
          "used"
        );

        setMobileAccuracy(
          Math.round(
            Number(
              request.accuracy || 0
            )
          )
        );

        setMessage(
          `Attendance session started successfully using the lecturer phone location (±${Math.round(
            Number(
              request.accuracy || 0
            )
          )} m).`
        );

        setError("");

        setPendingCourse(
          null
        );

        setPendingSessionData(
          null
        );

      } catch (err) {
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "The phone location was received, but the attendance session could not be created."
        );

      } finally {
        processingMobileRef.current =
          false;
      }
    };

  // =========================================
  // CANCEL MOBILE SETUP UI
  // =========================================

  const handleCancelMobileSetup =
    () => {

      if (
        pollingRef.current
      ) {
        clearInterval(
          pollingRef.current
        );

        pollingRef.current =
          null;
      }

      setMobileRequest(
        null
      );

      setMobileStatus(
        ""
      );

      setMobileAccuracy(
        null
      );

      setPendingCourse(
        null
      );

      setPendingSessionData(
        null
      );

      setLaptopAccuracy(
        null
      );

      setError("");
      setMessage("");
    };

  // =========================================
  // PRINT STUDENT QR
  // =========================================

  const handlePrintQr = () => {
    if (
      !activeSession ||
      !activeSession.qr_code
    ) {
      setError(
        "No QR code is currently available to print."
      );

      return;
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=800,height=900"
      );

    if (!printWindow) {
      setError(
        "The print window was blocked. Please allow pop-ups and try again."
      );

      return;
    }

    const sessionDate =
      activeSession.session_date
        ? new Date(
            activeSession.session_date
          ).toLocaleDateString()
        : "N/A";

    const expiry =
      activeSession.qr_expires_at
        ? new Date(
            activeSession.qr_expires_at
          ).toLocaleTimeString(
            [],
            {
              hour:
                "2-digit",
              minute:
                "2-digit"
            }
          )
        : "N/A";

    const radius =
      activeSession.allowed_radius ??
      50;

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <title>
            ${activeSession.course_code}
            Attendance QR
          </title>

          <style>

            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 40px;
              text-align: center;
              color: #1f2933;
            }

            .sheet {
              max-width: 700px;
              margin: 0 auto;
              padding: 36px;
              border: 2px solid #1f6b4f;
              border-radius: 18px;
            }

            h1 {
              color: #1f6b4f;
            }

            .course-name {
              color: #555;
              font-size: 18px;
            }

            .qr {
              margin: 30px 0;
            }

            .qr img {
              width: 340px;
              max-width: 100%;
            }

            .details {
              display: inline-block;
              text-align: left;
              font-size: 17px;
              line-height: 1.8;
            }

            .notice {
              margin-top: 28px;
              padding: 14px;
              border-radius: 10px;
              background: #fbf2dc;
              color: #654d1f;
              font-weight: 600;
            }

            @media print {

              body {
                padding: 0;
              }

              .sheet {
                border: none;
              }

            }

          </style>

        </head>

        <body>

          <div class="sheet">

            <h1>
              Student Attendance System
            </h1>

            <h2>
              ${activeSession.course_code}
            </h2>

            <p class="course-name">
              ${activeSession.course_name}
            </p>

            <div class="qr">

              <img
                src="${activeSession.qr_code}"
                alt="Attendance QR Code"
              />

            </div>

            <div class="details">

              <div>
                <strong>Session Date:</strong>
                ${sessionDate}
              </div>

              <div>
                <strong>QR Expires:</strong>
                ${expiry}
              </div>

              <div>
                <strong>Attendance Radius:</strong>
                ${radius} metres
              </div>

            </div>

            <div class="notice">
              This QR code is time-limited.
              Students must also pass location
              verification.
            </div>

          </div>

          <script>

            window.onload =
              function () {

                setTimeout(
                  function () {
                    window.print();
                  },
                  300
                );

              };

          </script>

        </body>

      </html>
    `);

    printWindow.document.close();
  };

  // =========================================
  // HIDE STUDENT QR
  // =========================================

  const handleDismissSession =
    () => {

      // Only hide the QR visually.
      // The attendance session remains active
      // on the backend until it expires or is closed.
      setActiveSession(
        null
      );

      localStorage.removeItem(
        "lecturerActiveSession"
      );

      setMessage(
        "QR code hidden. The attendance session is still active."
      );

      setError("");
    };

  // =========================================
  // SHOW ACTIVE QR AGAIN
  // =========================================

  const handleShowActiveQr =
    async () => {

      setMessage("");
      setError("");

      try {
        const session =
          await fetchActiveSession(true);

        if (!session) {
          setError(
            "There is no active attendance QR code to display."
          );

          return;
        }

        setMessage(
          "Active attendance QR restored successfully."
        );

      } catch {
        setError(
          "Failed to restore the active QR code."
        );
      }
    };

  return (
    <>

      {/* PAGE TITLE */}

      <section className="page-heading">

        <h1>
          My Courses
        </h1>

        <p>
          Review your assigned courses and
          start secure attendance sessions.
        </p>

      </section>


      {/* MESSAGES */}

      {message && (
        <div
          className="success-message"
          style={{
            marginBottom:
              "20px"
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          className="error-message"
          style={{
            marginBottom:
              "20px"
          }}
        >
          {error}
        </div>
      )}


      {/* =====================================
          MOBILE FALLBACK OPTION
      ===================================== */}

      {pendingCourse &&
       !mobileRequest &&
       !activeSession && (

        <section className="content-card">

          <div className="section-header">

            <div>

              <h2>
                Improve Lecturer Location
              </h2>

              <p className="muted-text">
                The laptop location is not
                accurate enough for the
                configured attendance area.
              </p>

            </div>

          </div>

          <div
            style={{
              padding:
                "18px",
              background:
                "#fbf2dc",
              borderRadius:
                "12px",
              marginBottom:
                "20px"
            }}
          >

            <strong>
              Laptop accuracy:
              {" "}
              ±
              {
                laptopAccuracy
              }
              {" metres"}
            </strong>

            <p
              style={{
                marginBottom:
                  0
              }}
            >
              The student geofence is only
              50 metres, so using this
              laptop coordinate could
              incorrectly reject students
              who are physically in class.
            </p>

          </div>


          <div
            style={{
              display:
                "flex",

              gap:
                "10px",

              flexWrap:
                "wrap"
            }}
          >

            <button
              type="button"
              className="primary-button"
              disabled={
                creatingMobileRequest
              }
              onClick={
                handleUseMobileLocation
              }
            >
              {creatingMobileRequest
                ? "Creating Mobile QR..."
                : "Use Mobile Location"}
            </button>


            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                handleStartAttendance(
                  pendingCourse
                )
              }
            >
              Try Laptop Again
            </button>


            <button
              type="button"
              className="secondary-button"
              onClick={
                handleCancelMobileSetup
              }
            >
              Cancel
            </button>

          </div>

        </section>

      )}


      {/* =====================================
          MOBILE SETUP QR
      ===================================== */}

      {mobileRequest &&
       !activeSession && (

        <section className="content-card">

          <div className="section-header">

            <div>

              <h2>
                Use Lecturer Phone Location
              </h2>

              <p className="muted-text">
                Scan this temporary setup QR
                using the lecturer's phone.
              </p>

            </div>

            <span className="status-badge status-present">
              Waiting for Phone
            </span>

          </div>


          <div className="qr-session-layout">

            <div
              style={{
                textAlign:
                  "center"
              }}
            >

              <img
                src={
                  mobileRequest
                    .setup_qr_code
                }
                alt="Mobile Location Setup QR"
                style={{
                  width:
                    "100%",

                  maxWidth:
                    "300px",

                  background:
                    "#ffffff",

                  padding:
                    "14px",

                  borderRadius:
                    "16px",

                  border:
                    "1px solid #dfe5e1"
                }}
              />

              <p
                className="muted-text"
                style={{
                  marginTop:
                    "12px"
                }}
              >
                Setup QR — not for students
              </p>

            </div>


            <div>

              <h3>
                Waiting for the lecturer's phone
              </h3>

              <p className="muted-text">
                Open the QR on the lecturer's
                phone, allow location access,
                then tap
                <strong>
                  {" "}Use My Current Location
                </strong>.
              </p>


              <div
                style={{
                  marginTop:
                    "20px",

                  padding:
                    "16px",

                  background:
                    "#eef6f1",

                  borderRadius:
                    "12px"
                }}
              >

                <strong>
                  Status:
                </strong>{" "}

                {mobileStatus ===
                  "pending" &&
                  "Waiting for phone location..."}

                {mobileStatus ===
                  "completed" &&
                  "Location received."}

                {mobileStatus ===
                  "creating-session" &&
                  "Creating attendance session..."}

                {mobileStatus ===
                  "used" &&
                  "Location successfully used."}

                {mobileStatus ===
                  "expired" &&
                  "Setup request expired."}

              </div>


              {mobileAccuracy !==
                null && (

                <p
                  style={{
                    marginTop:
                      "16px"
                  }}
                >
                  <strong>
                    Phone GPS accuracy:
                  </strong>{" "}

                  ±
                  {
                    mobileAccuracy
                  }
                  {" metres"}
                </p>

              )}


              <div
                style={{
                  marginTop:
                    "22px"
                }}
              >

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    handleCancelMobileSetup
                  }
                >
                  Cancel Mobile Setup
                </button>

              </div>

            </div>

          </div>

        </section>

      )}


      {/* =====================================
          HIDDEN BUT STILL ACTIVE QR
      ===================================== */}

      {serverActiveSession &&
       !activeSession && (

        <section className="content-card">

          <div className="section-header">

            <div>

              <h2>
                Active Attendance Session
              </h2>

              <p className="muted-text">
                {serverActiveSession.course_code}
                {" — "}
                {serverActiveSession.course_name}
              </p>

            </div>

            <span className="status-badge status-present">
              Active
            </span>

          </div>

          <p className="muted-text">
            This attendance session is still active,
            but its QR code is currently hidden.
          </p>

          {serverActiveSession.qr_expires_at && (

            <p>
              <strong>
                QR Expires:
              </strong>{" "}

              {new Date(
                serverActiveSession.qr_expires_at
              ).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit"
                }
              )}
            </p>

          )}

          <div
            style={{
              marginTop: "20px"
            }}
          >

            <button
              type="button"
              className="primary-button"
              onClick={
                handleShowActiveQr
              }
            >
              Show Active QR
            </button>

          </div>

        </section>

      )}


      {/* =====================================
          REAL STUDENT ATTENDANCE QR
      ===================================== */}

      {activeSession && (

        <section className="content-card">

          <div className="section-header">

            <div>

              <h2>
                Attendance Session Started
              </h2>

              <p className="muted-text">
                {
                  activeSession.course_code
                }

                {" — "}

                {
                  activeSession.course_name
                }
              </p>

            </div>

            <span className="status-badge status-present">
              Active
            </span>

          </div>


          <div className="qr-session-layout">

            <div
              style={{
                textAlign:
                  "center"
              }}
            >

              {activeSession.qr_code ? (

                <img
                  src={
                    activeSession.qr_code
                  }
                  alt="Student Attendance QR Code"
                  style={{
                    width:
                      "100%",

                    maxWidth:
                      "300px",

                    background:
                      "#ffffff",

                    padding:
                      "14px",

                    borderRadius:
                      "16px",

                    border:
                      "1px solid #dfe5e1"
                  }}
                />

              ) : (

                <div className="empty-state">
                  QR code unavailable.
                </div>

              )}

            </div>


            <div>

              <h3>
                Students can now scan this QR code
              </h3>

              <p className="muted-text">
                Students must be enrolled,
                use the valid QR token and
                pass the 50-metre location
                verification.
              </p>


              <div
                style={{
                  marginTop:
                    "22px",

                  display:
                    "grid",

                  gap:
                    "14px"
                }}
              >

                <div>

                  <strong>
                    Course:
                  </strong>{" "}

                  {
                    activeSession.course_code
                  }

                  {" — "}

                  {
                    activeSession.course_name
                  }

                </div>


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
                        hour:
                          "2-digit",

                        minute:
                          "2-digit"
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


                <div>

                  <strong>
                    Location Source:
                  </strong>{" "}

                  {
                    activeSession.location_source ||
                    "Lecturer Device"
                  }

                </div>


                {activeSession.lecturer_accuracy !==
                  undefined && (

                  <div>

                    <strong>
                      Location Accuracy:
                    </strong>{" "}

                    ±
                    {
                      activeSession.lecturer_accuracy
                    }

                    {" metres"}

                  </div>

                )}

              </div>


              <div
                style={{
                  marginTop:
                    "26px",

                  display:
                    "flex",

                  gap:
                    "10px",

                  flexWrap:
                    "wrap"
                }}
              >

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    handlePrintQr
                  }
                >
                  Print QR Code
                </button>


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


      {/* COURSE COUNT */}

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


      {/* ASSIGNED COURSES */}

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
              account will appear here.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="dashboard-table">

              <thead>

                <tr>

                  <th>
                    Course Code
                  </th>

                  <th>
                    Course Name
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {courses.map(
                  (course) => (

                    <tr
                      key={
                        course.id
                      }
                    >

                      <td>

                        <span className="course-code">
                          {
                            course.course_code
                          }
                        </span>

                      </td>


                      <td>

                        <strong>
                          {
                            course.course_name
                          }
                        </strong>

                      </td>


                      <td>

                        <button
                          type="button"
                          className="primary-button"
                          disabled={
                            startingSession === course.id ||
                            Boolean(serverActiveSession)
                          }
                          onClick={() =>
                            handleStartAttendance(
                              course
                            )
                          }
                        >

                          {startingSession === course.id
                            ? "Checking Location..."
                            : serverActiveSession
                              ? "Session Already Active"
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