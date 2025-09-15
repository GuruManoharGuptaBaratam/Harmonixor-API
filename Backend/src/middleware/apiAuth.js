const User = require('../models/User');

async function apiKeyAuth(req, res, next) {
  const apiKey = req.query.KEY; // API key from URL
  if (!apiKey) return res.status(401).json({ error: "API key missing" });

  try {
    const user = await User.findOne({ where: { apiKey } });
    if (!user) return res.status(403).json({ error: "Invalid API key" });

    req.user = user; // attach user info
    next(); // valid API key, proceed
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
  req.apiKey = apiKey
  next()
}

module.exports = apiKeyAuth;
