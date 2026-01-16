const generateApiKey = require("../utils/keyGenerator");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function generateKey(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "User email required" });


    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found. API key can only be generated for registered users." });
    }

    let apiKey = user.apiKey;

    if (!apiKey) {

      apiKey = generateApiKey(10);
      user.apiKey = apiKey;
      await user.save();
    }

    res.json({ apiKey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate key" });
  }
}





async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "mysecret",
      { expiresIn: "1d" }
    );


    res.json({ success: true, message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Login failed" , error : err});
  }
}


async function signup(req, res) {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }


    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const newUser = await User.create({
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || "mysecret",
      { expiresIn: "1d" }
    );
    
    res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Signup failed" });
  }
}



module.exports = { generateKey,login, signup}
