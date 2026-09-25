import {
  useMemo,
  useState
} from "react";

import {
  useSearchParams
} from "react-router-dom";

import axios from "axios";

import "../styles/dashboard.css";

function LecturerMobileLocation() {
  const [searchParams] =
    useSearchParams();

  const requestId =
    searchParams.get(
      "request_id"
    );

  const token =
    searchParams.get(
      "token"
    );

  const [status, setStatus] =
    useState("ready");

  const [bestAccuracy, setBestAccuracy] =
    useState(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const requestIsValid =
    useMemo(() => {
      return Boolean(
        requestId &&
        token
      );
    }, [
      requestId,
      token
    ]);

  // =========================
  // GET BEST PHONE LOCATION
  // =========================

  const getBestLocation = () => {
    return new Promise(
      (resolve, reject) => {

        if (
          !navigator.geolocation
        ) {
          reject(
            new Error(
              "Geolocation is not supported by this device."
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

                const accuracy =
                  position.coords
                    .accuracy;

                setBestAccuracy(
                  (current) => {
                    if (
                      current === null ||
                      accuracy <
                        current
                    ) {
                      return Math.round(
                        accuracy
                      );
                    }

                    return current;
                  }
                );

                if (
                  !bestPosition ||
                  accuracy <
                    bestPosition
                      .coords
                      .accuracy
                ) {
                  bestPosition =
                    position;
                }

                /*
                 * A reading of 30 m
                 * or better is already
                 * strong enough for our
                 * classroom anchor.
                 */
                if (
                  accuracy <= 30
                ) {
                  finish(
                    position
                  );
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
                  15000
              }
            );

        /*
         * Give the phone up to
         * 12 seconds to improve
         * its reading.
         */
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
                    "The phone could not determine a location."
                  )
                );
              }

            },
            12000
          );
      }
    );
  };

  // =========================
  // SUBMIT PHONE LOCATION
  // =========================

  const handleSubmitLocation =
    async () => {

      if (
        !requestIsValid
      ) {
        setError(
          "This location request link is invalid."
        );

        return;
      }

      setStatus(
        "locating"
      );

      setError("");
      setMessage("");
      setBestAccuracy(null);

      try {
        const position =
          await getBestLocation();

        const {
          latitude,
          longitude,
          accuracy
        } = position.coords;

        /*
         * Because this position will
         * become the centre of a
         * 50 m attendance zone,
         * don't accept a very poor
         * phone reading.
         */
        if (
          accuracy > 80
        ) {
          setStatus(
            "ready"
          );

          setError(
            `The best phone GPS reading was approximately ${Math.round(
              accuracy
            )} metres. Please move to an open area or near a window and try again.`
          );

          return;
        }

        setStatus(
          "submitting"
        );

        const response =
          await axios.post(
            `/api/location-requests/${requestId}/location`,
            {
              token,
              latitude,
              longitude,
              accuracy
            }
          );

        setStatus(
          "success"
        );

        setMessage(
          response.data.message ||
          "Lecturer location submitted successfully."
        );

      } catch (err) {

        setStatus(
          "ready"
        );

        if (
          err.code === 1
        ) {
          setError(
            "Location permission was denied. Allow location access in your browser settings and try again."
          );

        } else if (
          err.code === 2
        ) {
          setError(
            "Your phone could not determine its location. Make sure Location Services are enabled."
          );

        } else if (
          err.code === 3
        ) {
          setError(
            "The location request timed out. Please try again."
          );

        } else {
          setError(
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Failed to submit the lecturer location."
          );
        }
      }
    };

  // =========================
  // INVALID QR
  // =========================

  if (
    !requestIsValid
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "20px",
          background:
            "#f7f8f5"
        }}
      >
        <section
          className="content-card"
          style={{
            width: "100%",
            maxWidth: "520px",
            textAlign:
              "center"
          }}
        >

          <h1>
            Invalid Location Request
          </h1>

          <p className="muted-text">
            This QR code does not
            contain a valid lecturer
            location request.
          </p>

        </section>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "20px",
        background:
          "#f7f8f5"
      }}
    >

      <section
        className="content-card"
        style={{
          width: "100%",
          maxWidth: "540px",
          textAlign:
            "center"
        }}
      >

        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "18px",
            background:
              "#d6a84b",
            color:
              "#174d3a",
            display: "grid",
            placeItems: "center",
            margin:
              "0 auto 18px",
            fontWeight: "800",
            fontSize: "18px"
          }}
        >
          SAS
        </div>

        <h1
          style={{
            marginBottom:
              "8px"
          }}
        >
          Set Lecturer Location
        </h1>

        <p
          className="muted-text"
          style={{
            marginBottom:
              "26px"
          }}
        >
          Use this phone's GPS to
          establish the attendance
          session location.
        </p>


        {/* READY */}

        {status ===
          "ready" && (
          <>

            <div
              style={{
                padding:
                  "18px",
                background:
                  "#eef6f1",
                borderRadius:
                  "12px",
                marginBottom:
                  "22px"
              }}
            >

              <strong>
                Keep this phone at the
                lecturer's actual
                classroom location.
              </strong>

              <p
                className="muted-text"
                style={{
                  marginBottom: 0
                }}
              >
                The phone location will
                become the centre of the
                50-metre attendance
                area.
              </p>

            </div>

            <button
              type="button"
              className="primary-button"
              onClick={
                handleSubmitLocation
              }
              style={{
                width: "100%"
              }}
            >
              Use My Current Location
            </button>

          </>
        )}


        {/* LOCATING */}

        {status ===
          "locating" && (
          <div>

            <h3>
              Getting Accurate Location...
            </h3>

            <p className="muted-text">
              Keep the phone still while
              we improve the GPS reading.
            </p>

            {bestAccuracy !==
              null && (
              <div
                style={{
                  marginTop:
                    "18px",
                  fontSize:
                    "1.1rem"
                }}
              >
                Best accuracy so far:
                {" "}
                <strong>
                  ±
                  {bestAccuracy}
                  {" m"}
                </strong>
              </div>
            )}

          </div>
        )}


        {/* SUBMITTING */}

        {status ===
          "submitting" && (
          <div>

            <h3>
              Sending Location...
            </h3>

            <p className="muted-text">
              Please keep this page open
              for a moment.
            </p>

          </div>
        )}


        {/* SUCCESS */}

        {status ===
          "success" && (
          <div>

            <div
              style={{
                fontSize:
                  "48px",
                marginBottom:
                  "12px"
              }}
            >
              ✓
            </div>

            <h2>
              Location Sent
            </h2>

            <p>
              {message}
            </p>

            {bestAccuracy !==
              null && (
              <p className="muted-text">
                Phone GPS accuracy:
                {" "}
                approximately ±
                {bestAccuracy}
                {" metres"}
              </p>
            )}

            <div
              style={{
                padding:
                  "16px",
                marginTop:
                  "20px",
                borderRadius:
                  "12px",
                background:
                  "#eef6f1"
              }}
            >
              You can now return to the
              lecturer computer. The
              attendance QR will be
              created there.
            </div>

          </div>
        )}


        {/* ERROR */}

        {error && (
          <div
            className="error-message"
            style={{
              marginTop:
                "20px"
            }}
          >
            {error}
          </div>
        )}

      </section>

    </div>
  );
}

export default LecturerMobileLocation;