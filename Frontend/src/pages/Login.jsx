import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/login",
                {
                    identifier,
                    password
                }
            );

            const token = response.data.token;
            const user = response.data.user;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            if (user.role === "student") {
                navigate("/student/dashboard");
            } else if (user.role === "lecturer") {
                navigate("/lecturer/dashboard");
            }

            console.log("Logged in user:", user);
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Login failed."
            );
        }
    };

    return (
        <div>
            <h2>Student Attendance System</h2>

            <form onSubmit={handleLogin}>
                <div>
                    <label>Student Number / Staff ID</label>
                    <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit">
                    Login
                </button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
}

export default Login;