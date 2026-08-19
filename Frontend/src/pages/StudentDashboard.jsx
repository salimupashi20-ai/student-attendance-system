import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div>
      <h1>Student Dashboard</h1>

      <p>
        Welcome, {user?.full_name}
      </p>

      <p>
        Student Number: {user?.student_number}
      </p>

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default StudentDashboard;