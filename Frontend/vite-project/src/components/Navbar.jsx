import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png"; 
import "./Component.css";

function Navbar({ profileName = "User" }) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="app-name-capsule">
          <img src={logo} alt="Harmonixor Logo" className="app-logo" />
          <span className="logo-text">{"{Harmonixor}"}</span>
        </div>
      </div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/docs">Docs</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/profile" className="profile-name">
          {"{"}{profileName}{"}"}
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
