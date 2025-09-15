async function apiKeyAuth(req, res, next) {
  const apiKey = req.query.KEY; // API key from URL
  if (!apiKey) return res.status(401).json({ error: "API key missing" });

  try {
    const user = await User.findOne({ where: { apiKey } });
    if (!user) return res.status(403).json({ error: "Invalid API key" });

    // ✅ attach user info and API key to req
    req.user = user;
    req.apiKey = apiKey;

    // ✅ proceed to next middleware/controller
    next();
  } catch (err) {
    console.error("API Key Auth Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = apiKeyAuth;
