import React, { useState } from "react";
import axios from "axios";
import "./Login.css"; 
import { Link } from "react-router-dom";

const Signup = ({ onSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false); // ✅ new state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true)

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}harmonixor/users/signup`,
        { email, password }
      );

      if (response.data.success) {
        setSuccess(response.data.message);

        localStorage.setItem("token", response.data.token);

        if (onSignup) onSignup(response.data.user);

        window.location.href = "/dashboard";
      } else {
        setError(response.data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.response?.data?.message || "Something went wrong");
    } 
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2 className="login-title">Sign Up</h2>

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
        {success && <p className="success-text">{`{${success}}`}</p>}

        <button
          type="submit"
          className={`login-button ${loading ? "loading" : ""}`} 
          disabled={loading} 
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p className="signup-text">
          Already have an account? <Link to={'/login'}>Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
