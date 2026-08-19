import { useNavigate } from "react-router-dom";

function LecturerDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div>
      <h1>Lecturer Dashboard</h1>

      <p>
        Welcome, {user?.full_name}
      </p>

      <p>
        Staff ID: {user?.staff_id}
      </p>

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default LecturerDashboard;