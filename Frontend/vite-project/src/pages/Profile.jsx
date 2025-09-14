import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaKey, FaLock } from "react-icons/fa";
import "./Profile.css";

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggleApiKeys, setToggle] = useState(false)
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get("/harmonixor/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserInfo(response.data);

        if (response.data.apiKey) {
            setKeys([
              {
                id: 1,
                key: response.data.apiKey,
                createdAt: new Date().toISOString(),
              },
            ]);
          }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch user info. Please login again.");
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (error) return <p style={{ textAlign: "center", color: "red" }}>{error}</p>;

  return (
    <div className="profile-container">
      <div className="profile-box capsule">
        <h1 className="profile-title">Your Profile</h1>

        {toggleApiKeys ? (
          <pre className="profile-json">
            {JSON.stringify(keys, null, 2)}
          </pre>
        ) : (
          <pre className="profile-json">y
            {JSON.stringify(userInfo, null, 2)}
          </pre>
        )}

        <div className="profile-actions">
          <button className="profile-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
          <button className="profile-btn" onClick={() => setToggle((prev) => !prev)}>
            <FaKey /> Your API Keys
          </button>
          <button className="profile-btn">
            <FaLock /> Change Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
