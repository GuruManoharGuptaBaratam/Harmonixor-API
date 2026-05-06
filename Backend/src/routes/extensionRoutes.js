const express = require("express")
const router = express.Router()
const User = require('../models/User');
const { normalizeCookieForStorage } = require("../utils/cookieStorage");


router.post("/validate", async (req, res) => {
  try {
    const { email, apiKey } = req.body;

    if (!email || !apiKey) {
      return res.status(400).json({ success: false, error: "Email and API key required" });
    }


    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, error: "user_not_found" });
    }

    if (user.apiKey !== apiKey) {
      return res.status(401).json({ success: false, error: "invalid_api_key" });
    }

    res.status(200).json({ success: true, message: "Validation successful" });

  } catch (err) {
    console.error("Validation Error:", err);
    res.status(500).json({ success: false, error: "Server error during validation" });
    console.log("error occured")
  }
});


router.post("/save-cookie", async (req, res) => {
  try {
    const { email, cookie, apiKey } = req.body; 

    if (!email || !cookie || !apiKey) {
      return res.status(400).json({ success: false, error: "Email, cookie, and API key required" });
    }


    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, error: "user_not_found" });
    }


    if (user.apiKey !== apiKey) {
      return res.status(401).json({ success: false, error: "invalid_api_key" });
    }
    user.cookieFile = normalizeCookieForStorage(cookie);
    await user.save();

    res.status(200).json({ success: true, message: "Cookie saved successfully" });

  } catch (err) {
    console.error("Save Cookie Error:", err);
    res.status(500).json({ success: false, error: "Server error while saving cookie" });
  }
});

module.exports = router;
