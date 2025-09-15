const express = require("express");
const { login, signup} = require("../controllers/userController");
const { authenticateToken } = require("../middleware/Authenticate");
const User = require('../models/User');

const router = express.Router();

// Login route
router.post("/login", login);
router.post("/signup", signup);



// GET user info
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      email: user.email,
      apiKey: user.apiKey,
    });
  } catch (err) {
    console.error("Error fetching user info:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/upload-cookie", async (req, res) => {
  try {
    const { email, cookieBase64 } = req.body;

    if (!email || !cookieBase64) {
      return res.status(400).json({ error: "Email and cookieBase64 are required" });
    }

    // find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // save cookie base64
    user.cookieFile = cookieBase64;
    await user.save();

    res.status(200).json({ message: "Cookie uploaded successfully", uploaded: true });

  } catch (err) {
    console.error("Upload Cookie Error:", err);
    res.status(500).json({ error: "Server error while uploading cookie", uploaded: false });
  }
});


module.exports = router;
