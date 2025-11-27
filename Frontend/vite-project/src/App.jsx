import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";



import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Docs from "./pages/Docs";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Profile from "./pages/Profile";
import Background from "./components/Background";
import Player from "./pages/Player";

function App() {
  return (
    <Router>
      <div className="main-content">
        <Background/>
        <Navbar/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/player" element={<Player />} />
        </Routes>
        <Footer/>
      </div>

    </Router>
  );
}

export default App;
