import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/dashboard.css";
import "./AdminClassrooms.css";

const blankForm = {
  building_name: "",
  room_name: "",
  latitude: "",
  longitude: "",
  allowed_radius: "50",
  is_active: true
};

const validCoordinates = (lat, lng) =>
  lat !== "" && lng !== "" &&
  Number.isFinite(Number(lat)) && Number(lat) >= -90 && Number(lat) <= 90 &&
  Number.isFinite(Number(lng)) && Number(lng) >= -180 && Number(lng) <= 180;

function AdminClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const refresh = async () => {
    try {
      const { data } = await axios.get("/api/classrooms/manage", auth());
      setClassrooms(data.classrooms || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load classrooms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const change = (event) => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const reset = () => {
    setForm({ ...blankForm });
    setEditingId(null);
    setAccuracy(null);
    setError("");
  };

  const fillFromDevice = () => {
    setError("");
    setNotice("");
    if (!navigator.geolocation) {
      setError("This browser does not support geolocation. Enter coordinates manually.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude, longitude, accuracy: reportedAccuracy } = position.coords;
        setAccuracy(Math.round(reportedAccuracy));
        if (reportedAccuracy > 50) {
          setError(`GPS accuracy is ±${Math.round(reportedAccuracy)} m, too broad for our 50 m attendance area. Try a phone outdoors or enter a verified coordinate.`);
          return;
        }
        setForm(current => ({
          ...current,
          latitude: latitude.toFixed(7),
          longitude: longitude.toFixed(7)
        }));
        setNotice(`Location captured (reported accuracy ±${Math.round(reportedAccuracy)} m). Verify it before saving.`);
      },
      (geoError) => {
        setLocating(false);
        setError(geoError.code === 1
          ? "Location access denied. Allow location permission or enter coordinates manually."
          : "Unable to get your location. Enter coordinates manually or retry outside.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!validCoordinates(form.latitude, form.longitude)) {
      setError("Enter valid latitude and longitude values before saving.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        building_name: form.building_name.trim(),
        room_name: form.room_name.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        allowed_radius: Number(form.allowed_radius),
        is_active: Boolean(form.is_active)
      };
      const result = editingId == null
        ? await axios.post("/api/classrooms", payload, auth())
        : await axios.put(`/api/classrooms/${editingId}`, payload, auth());
      setForm({ ...blankForm });
      setEditingId(null);
      setAccuracy(null);
      await refresh();
      setNotice(result.data.message || "Classroom saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save classroom.");
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (room) => {
    setEditingId(room.id);
    setForm({
      building_name: room.building_name,
      room_name: room.room_name,
      latitude: String(room.latitude),
      longitude: String(room.longitude),
      allowed_radius: String(room.allowed_radius),
      is_active: Boolean(room.is_active)
    });
    setError("");
    setNotice("");
    setAccuracy(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (room) => {
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const { data } = await axios.put(`/api/classrooms/${room.id}`, {
        building_name: room.building_name,
        room_name: room.room_name,
        latitude: Number(room.latitude),
        longitude: Number(room.longitude),
        allowed_radius: Number(room.allowed_radius),
        is_active: !Boolean(room.is_active)
      }, auth());
      await refresh();
      setNotice(data.message || "Status changed.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to change classroom status.");
    } finally {
      setSaving(false);
    }
  };

  const mapUrl = validCoordinates(form.latitude, form.longitude)
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${form.latitude},${form.longitude}`)}`
    : null;

  const activeCount = classrooms.filter(room => Boolean(room.is_active)).length;

  return (
    <div className="room-admin">
      <section className="page-heading">
        <p className="room-admin__kicker">LOCATION MANAGEMENT</p>
        <h1>Classroom Locations</h1>
        <p>Add and maintain the approved places lecturers can select when generating attendance QR codes.</p>
      </section>

      <div className="room-admin__summary" aria-label="Classroom statistics">
        <div><span>Registered locations</span><strong>{classrooms.length}</strong></div>
        <div><span>Available to lecturers</span><strong>{activeCount}</strong></div>
        <div><span>Attendance geofence</span><strong>Up to 50 m</strong></div>
      </div>

      {error && <div className="error-message room-admin__message" role="alert">{error}</div>}
      {notice && <div className="success-message room-admin__message" role="status">{notice}</div>}

      <section className="room-admin__card">
        <div className="room-admin__sectionHeading">
          <div className="room-admin__icon">⌖</div>
          <div>
            <span className="room-admin__eyebrow">{editingId == null ? "NEW LOCATION" : `EDIT LOCATION #${editingId}`}</span>
            <h2>{editingId == null ? "Register an approved classroom" : "Update classroom details"}</h2>
            <p>Enter verified classroom coordinates, or capture your current location while physically inside the room.</p>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="room-admin__fields">
            <label>Building or department
              <input name="building_name" maxLength={100} minLength={2} required
                placeholder="e.g. Computing and Informatics" value={form.building_name} onChange={change}/>
            </label>
            <label>Room or location name
              <input name="room_name" maxLength={100} minLength={2} required
                placeholder="e.g. Computer Lab 1" value={form.room_name} onChange={change}/>
            </label>
            <label>Latitude
              <input name="latitude" type="number" step="any" required min={-90} max={90}
                placeholder="e.g. -15.3900000" value={form.latitude} onChange={change}/>
            </label>
            <label>Longitude
              <input name="longitude" type="number" step="any" required min={-180} max={180}
                placeholder="e.g. 28.3300000" value={form.longitude} onChange={change}/>
            </label>
          </div>

          <div className="room-admin__helpers">
            <button type="button" className="room-admin__locate" disabled={locating || saving} onClick={fillFromDevice}>
              {locating ? "Getting your location…" : "◎ Use my current location"}
            </button>
            {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer">Preview location on map ↗</a>}
          </div>
          {accuracy != null && <p className="room-admin__hint">Last device GPS reading: approximately ±{accuracy} metres</p>}

          <div className="room-admin__fields room-admin__fields--bottom">
            <label>Attendance radius
              <select name="allowed_radius" value={form.allowed_radius} onChange={change}>
                {[10, 20, 30, 40, 50].map(radius =>
                  <option key={radius} value={radius}>{radius} metres</option>
                )}
              </select>
            </label>
            {editingId != null && <label className="room-admin__status">
              <input type="checkbox" checked={form.is_active}
                onChange={event => setForm(current => ({ ...current, is_active: event.target.checked }))}/>
              Active — visible to lecturers
            </label>}
          </div>
          <p className="room-admin__hint">Locations must be physically verified. Device GPS accuracy is an estimate and can be unreliable indoors. Updating a location affects future QR sessions, not past attendance records.</p>
          <div className="room-admin__actions">
            <button className="room-admin__submit" disabled={saving} type="submit">
              {saving ? "Saving…" : editingId == null ? "Save approved location" : "Save changes"}
            </button>
            {editingId != null && <button type="button" className="room-admin__cancel" onClick={reset} disabled={saving}>Cancel edit</button>}
          </div>
        </form>
      </section>

      <section className="room-admin__card">
        <div className="room-admin__listHeading">
          <div>
            <h2>Saved classrooms</h2>
            <p>Inactive locations are hidden from the lecturer's selection list. Existing session history is retained.</p>
          </div>
          <span>{activeCount} active</span>
        </div>
        {loading ? <p className="room-admin__hint">Loading classrooms…</p> : classrooms.length === 0 ?
          <div className="empty-state">No classrooms saved yet. Register one above.</div> :
          <div className="room-admin__tableScroll">
            <table>
              <thead><tr><th>Location</th><th>Coordinates</th><th>Radius</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{classrooms.map(room => (
                <tr key={room.id}>
                  <td><strong>{room.room_name}</strong><small>{room.building_name}</small></td>
                  <td className="room-admin__coords">{Number(room.latitude).toFixed(6)}, {Number(room.longitude).toFixed(6)}</td>
                  <td>{room.allowed_radius} m</td>
                  <td><span className={`room-admin__badge ${room.is_active ? "is-active" : "is-inactive"}`}>
                    {room.is_active ? "Active" : "Inactive"}</span></td>
                  <td><div className="room-admin__rowActions">
                    <button type="button" onClick={() => startEditing(room)} disabled={saving}>Edit</button>
                    <button type="button" onClick={() => toggleActive(room)} disabled={saving}>
                      {room.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        }
      </section>
    </div>
  );
}

export default AdminClassrooms;
