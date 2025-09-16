import { React, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png"; 
import "./Component.css";
import axios from "axios";

function Navbar({ profileName = "User" }) {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [userExisist, setUserExsist] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");

        const protectedRoutes = ["/dashboard", "/profile"];
        if (!token && protectedRoutes.includes(location.pathname)) {
          navigate("/login");
          return;
        }

        if (token) {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}harmonixor/users/me`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.data.apiKey && response.data.email) {
            setUserExsist(true);
          }
        }
      } catch (err) {
        console.error(err);
        console.log("Failed to fetch user info. Please login again.");
      }
    };

    fetchUser();
  }, [navigate, location.pathname]);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="app-name-capsule">
          <img src={logo} alt="Harmonixor Logo" className="app-logo" />
          <span>
            <Link to="/" className="logo-text">
              {"{Harmonixor}"}
            </Link>
          </span>
        </div>
      </div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/docs">Docs</Link>
        <Link to="/dashboard">Dashboard</Link>
        {!userExisist && <Link to="/login">Login</Link>}
        <Link to="/profile" className="profile-name">
          {"{"}
          {profileName}
          {"}"}
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
