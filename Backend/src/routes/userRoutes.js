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
router.get("/check",(req,res)=>{
  res.json({
    message: "working"
  })
}) 


module.exports = router;
