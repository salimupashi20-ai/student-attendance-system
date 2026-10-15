import { useEffect, useState } from "react";
import axios from "axios";
import "./ClassroomAttendanceStarter.css";

function ClassroomAttendanceStarter({ courses = [], hasActiveSession, onSessionCreated }) {
  const [classrooms, setClassrooms] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/classrooms", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (mounted) setClassrooms(response.data.classrooms || []);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || "Unable to load approved classrooms.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const selectedCourse = courses.find(course => String(course.id) === String(courseId));
  const selectedRoom = classrooms.find(room => String(room.id) === String(classroomId));
  const ready = !loading && !creating && !hasActiveSession && Boolean(selectedCourse && selectedRoom);

  const time = (date) => [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map(value => String(value).padStart(2, "0")).join(":");

  const start = async () => {
    if (!ready) return;
    setError("");
    setMessage("");
    setCreating(true);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      const pad = number => String(number).padStart(2, "0");
      const sessionDate = [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join("-");
      const response = await axios.post("/api/sessions", {
        course_id: Number(courseId),
        session_date: sessionDate,
        start_time: time(now),
        end_time: time(end),
        location_method: "classroom",
        classroom_id: Number(classroomId)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (onSessionCreated) await onSessionCreated(response.data, selectedCourse);
      setMessage("Attendance QR is ready. Scroll up to display it.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to start attendance.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="classroom-launch" aria-labelledby="classroom-launch-title">
      <div className="classroom-launch__top">
        <div className="classroom-launch__emblem" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20h16M6 20V5l6-2 6 2v15M9 8h1M14 8h1M9 12h1M14 12h1M10 20v-4h4v4" />
          </svg>
        </div>
        <div className="classroom-launch__heading">
          <div className="classroom-launch__eyebrow">CLASSROOM ATTENDANCE <span>•</span> QUICK START</div>
          <h2 id="classroom-launch-title">Start a lecture session</h2>
          <p>Choose your course and approved room. We'll handle the location and generate a secure QR for your students.</p>
        </div>
        <span className="classroom-launch__pill">Registered location</span>
      </div>

      {error && <div className="classroom-launch__notice classroom-launch__notice--error" role="alert">{error}</div>}
      {message && <div className="classroom-launch__notice classroom-launch__notice--success" role="status">{message}</div>}

      <div className="classroom-launch__fields">
        <div className="classroom-launch__field">
          <label htmlFor="classroom-launch-course"><span className="classroom-launch__step">01</span> Select a course</label>
          <select id="classroom-launch-course" value={courseId}
            onChange={event => setCourseId(event.target.value)}
            disabled={creating || hasActiveSession}>
            <option value="">Choose your course...</option>
            {courses.map(course => (
              <option value={course.id} key={course.id}>{course.course_code} — {course.course_name}</option>
            ))}
          </select>
        </div>
        <div className="classroom-launch__field">
          <label htmlFor="classroom-launch-room"><span className="classroom-launch__step">02</span> Select a classroom</label>
          <select id="classroom-launch-room" value={classroomId}
            onChange={event => setClassroomId(event.target.value)}
            disabled={creating || loading || hasActiveSession}>
            <option value="">{loading ? "Loading classrooms..." : "Choose an approved room..."}</option>
            {classrooms.map(room => (
              <option value={room.id} key={room.id}>{room.building_name} — {room.room_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="classroom-launch__preview">
        <div className="classroom-launch__previewIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1116 0Z"/><circle cx="12" cy="10" r="2.5"/>
          </svg>
        </div>
        <div className="classroom-launch__previewText">
          <strong>{selectedRoom ? `${selectedRoom.building_name} · ${selectedRoom.room_name}` : "Your classroom location"}</strong>
          <span>{selectedRoom ? "Approved coordinates loaded securely from the database" : "Select a room to use its approved attendance location"}</span>
        </div>
        <div className="classroom-launch__radius">
          <strong>{selectedRoom ? Math.min(50, Number(selectedRoom.allowed_radius)) : "50"} m</strong>
          <span>Attendance radius</span>
        </div>
      </div>

      <div className="classroom-launch__footer">
        <div className="classroom-launch__safety">
          <span className="classroom-launch__dot" aria-hidden="true" />
          Moodle enrolment, QR expiry and student GPS are still verified.
        </div>
        <button type="button" className="classroom-launch__submit" disabled={!ready} onClick={start}>
          {creating ? "Generating secure QR..." : hasActiveSession ? "An attendance session is already active" : "Generate attendance QR"}
          {!creating && !hasActiveSession && <span aria-hidden="true">→</span>}
        </button>
      </div>
      <p className="classroom-launch__alternative">Need an unregistered location? Use <strong>Start with Current GPS</strong> under Assigned Courses below.</p>
    </section>
  );
}

export default ClassroomAttendanceStarter;
