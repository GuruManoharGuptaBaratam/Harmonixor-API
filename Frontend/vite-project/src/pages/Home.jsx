import React from "react";
import { Link } from "react-router-dom";
import { FaKey, FaMusic, FaGlobe } from "react-icons/fa"; // ✅ black & white icons
import "./Home.css";

const Home = () => {
  return (
    <div className="home-container">

      <header className="home-hero capsule">
        <h1 className="home-title">{"Harmonixor API"}</h1>
        <p className="home-subtitle">
          Search and play music with a simple API key.
        </p>
        <div className="home-buttons">
          <Link to="/signup" className="home-btn primary">
            Get Started
          </Link>
          <Link to="/docs" className="home-btn secondary">
            View Docs
          </Link>
        </div>
      </header>

      <section className="home-features">
        <h2>Why Harmonixor API?</h2>
        <div className="features-grid">
          <div className="feature-card capsule">
            <FaKey className="feature-icon" />
            <h3>Easy Access</h3>
            <p>Generate an API key in seconds and start using it right away.</p>
          </div>
          <div className="feature-card capsule">
            <FaMusic className="feature-icon" />
            <h3>Song Search</h3>
            <p>Find songs instantly by name with our fast backend logic.</p>
          </div>
          <div className="feature-card capsule">
            <FaGlobe className="feature-icon" />
            <h3>Play Anywhere</h3>
            <p>Stream-ready URLs for smooth integration in your projects.</p>
          </div>
        </div>
      </section>

      
    </div>
  );
};

export default Home;
