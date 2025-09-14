import React, { useState } from "react";
import axios from "axios";
import "./Login.css";


const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); 

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/harmonixor/users/login`, {
        email,
        password,
      });

      if (response.data.success) {
        console.log("✅ Login successful:", response.data);
        
        // Optional: store token locally
        localStorage.setItem("token", response.data.token);

        if (onLogin) onLogin({ email });

        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        setError(response.data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("❌ Login failed:", err);
      console.log(err)

      // Axios HTTP error response (404/401/500)
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    }
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2 className="login-title">Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="login-button">
          Sign In
        </button>

        <p className="signup-text">
          Don’t have an account? <a href="/signup">Sign up</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
