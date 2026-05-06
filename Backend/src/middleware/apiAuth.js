const User = require('../models/User');

async function apiKeyAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const apiKey = req.query.KEY || req.headers["x-api-key"] || bearerToken;
  if (!apiKey) return res.status(401).json({ error: "API key missing" });

  try {
    const user = await User.findOne({ where: { apiKey } });
    if (!user) return res.status(403).json({ error: "Invalid API key" });


    req.user = user;
    req.apiKey = apiKey;

  
    next();
  } catch (err) {
    console.error("API Key Auth Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = apiKeyAuth;
