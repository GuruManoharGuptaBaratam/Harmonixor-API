import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaCopy, FaBook } from "react-icons/fa";
import "./Dashboard.css";

function Dashboard() {
  const [email, setEmail] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerateKey = async () => {
    try {
      setLoading(true);
      setError("");
      setApiKey("");
      setCopied(false);

      const response = await axios.post("https://harmonixor-api-1.onrender.com/harmonixor/users/generate-key", { email });
      setApiKey(response.data.apiKey);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Email not found. Please signup first.");
      } else {
        setError("Failed to generate key. Try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-box capsule">
        <h1 className="dashboard-title">Get Your API Key</h1>
        <p className="dashboard-subtitle">
          Enter your email to generate a new API key
        </p>

        <div className="dashboard-form">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            className="dashboard-input"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="dashboard-button"
            onClick={handleGenerateKey}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Key"}
          </button>
        </div>

        {error && <p className="dashboard-error">{error}</p>}

        {apiKey && (
          <div className="dashboard-result capsule">
            <h3>Your API Key:</h3>
            <div className="apikey-wrapper">
              <code className="dashboard-apikey">{apiKey}</code>
              <button className="copy-btn" onClick={handleCopy}>
                <FaCopy /> {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <Link to="/docs" className="dashboard-docs-btn">
              <FaBook /> View Docs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
