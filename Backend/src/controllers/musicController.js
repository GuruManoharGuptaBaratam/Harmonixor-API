const { exec, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const User = require("../models/User"); // Sequelize model

async function handleSongSearch(req, res, songNameParam) {
  try {
    const APIKEY = req.apiKey
    if (!APIKEY) return res.status(401).json({ error: "API key missing" });


    const user = await User.findOne({ where: { apiKey: APIKEY } });
    if (!user) return res.status(403).json({ error: "Invalid API key" });


    const cookieBase64 = user.cookieFile;
    if (!cookieBase64) return res.status(400).json({ error: "No cookie found for this user" });


    const buffer = Buffer.from(cookieBase64, "base64");
    const cookiesDir = path.join(__dirname, "../../UserCookies");


    if (!fs.existsSync(cookiesDir)) {
      fs.mkdirSync(cookiesDir, { recursive: true });
    }

    const tempCookiePath = path.join(cookiesDir, `temp_cookie_${Date.now()}.txt`);

    await fs.promises.writeFile(tempCookiePath, buffer);

    const songName = songNameParam || req.query.song || req.body.songName;
    if (!songName || typeof songName !== "string") {
      await fs.promises.unlink(tempCookiePath);
      return res.status(400).json({ error: "Invalid song name" });
    }

  
    const command = `yt-dlp --cookies "${tempCookiePath}" -f "bestaudio[ext=m4a]/bestaudio" --default-search "ytsearch" --get-title --get-thumbnail --get-url --sponsorblock-remove all "${songName} lyrical"`;

    exec(command, async (error, stdout, stderr) => {

      try {
        await fs.promises.unlink(tempCookiePath);
      } catch (unlinkErr) {
        console.error("Failed to delete temp cookie:", unlinkErr);
      }

      if (error || !stdout) {
        console.error("yt-dlp error:", error || stderr);
        return res.status(500).json({ error: "Error extracting media", details: stderr || error.message });
      }

      const lines = stdout.trim().split("\n");
      const title = lines[0] || "";
      const songUrl = lines[1] || "";
      const thumbnail = lines[2] || "";

      if (!songUrl) {
        return res.status(500).json({ error: "Failed to get song URL from yt-dlp" });
      }

      const streamUrl = encodeURIComponent(songUrl);

      res.status(200).json({ title, thumbnail, streamUrl });
    });

  } catch (err) {
    console.error("handleSongSearch error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

const { exec } = require("child_process");

function handleSongStream(req, res, songUrlParam) {
  try {
    const songUrl = songUrlParam || req.query.songUrl || req.body.songUrl;
    if (!songUrl) return res.status(400).json({ error: "URL missing" });

    // Use yt-dlp to get the best audio URL
    exec(`yt-dlp -f bestaudio -g "${songUrl}"`, (err, stdout, stderr) => {
      if (err) {
        console.error("yt-dlp error:", stderr);
        return res.status(500).json({ error: "Failed to get audio URL" });
      }

      const directAudioUrl = stdout.trim(); // This is a temporary direct URL
      res.json({ downloadUrl: directAudioUrl });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { handleSongSearch, handleSongStream };

