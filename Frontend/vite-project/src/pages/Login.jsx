import React, { useState } from "react";
import axios from "axios";
import "./Login.css";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); 
    setLoading(true); 

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}harmonixor/users/login`,
        { email, password }
      );

      if (response.data.success) {
        console.log("Login successful:", response.data);

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("apiKey", response.data.apiKey);
        if (onLogin) onLogin({ email });

        window.location.href = "/dashboard";
      } else {
        setError(response.data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("❌ Login failed:", err);
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false); 
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

        {error && <p className="error-text">{`{${error}}`}</p>}

        <button
          type="submit"
          className={`login-button ${loading ? "loading" : ""}`}
          disabled={loading}
        >
          <span>{loading ? "Sign In" : "Sign In"}</span>
        </button>


        <p className="signup-text">
          Don’t have an account? <Link to={'/signup'}>Sign up</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
