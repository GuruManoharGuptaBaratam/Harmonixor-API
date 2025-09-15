const { exec, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const User = require("../models/User"); // Sequelize model

async function handleSongSearch(req, res, songNameParam) {
  try {
    const APIKEY = req.apiKey;
    if (!APIKEY) return res.status(401).json({ error: "API key missing" });

    // ✅ Verify user
    const user = await User.findOne({ where: { apiKey: APIKEY } });
    if (!user) return res.status(403).json({ error: "Invalid API key" });

    // ✅ Check for cookie
    const cookieBase64 = user.cookieFile;
    if (!cookieBase64) return res.status(400).json({ error: "No cookie found for this user" });

    // ✅ Convert Base64 to temp cookie.txt
    const buffer = Buffer.from(cookieBase64, "base64");
    const tempCookiePath = path.join(__dirname, "../../UserCookies", `temp_cookie_${Date.now()}.txt`);
    await fs.promises.writeFile(tempCookiePath, buffer);

    // ✅ Extract song name
    const songName = songNameParam || req.query.song || req.body.songName;
    if (!songName || typeof songName !== "string") {
      await fs.promises.unlink(tempCookiePath);
      return res.status(400).json({ error: "Invalid song name" });
    }

    // ✅ yt-dlp command
    const command = `yt-dlp --cookies "${tempCookiePath}" -f "bestaudio[ext=m4a]/bestaudio" --default-search "ytsearch" --get-title --get-thumbnail --get-url --sponsorblock-remove all "${songName} lyrical"`;

    exec(command, async (error, stdout, stderr) => {
      // Clean up temp cookie regardless of success/failure
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

function handleSongStream(req, res, songUrlParam) {
  try {
    const songUrl = songUrlParam || req.query.songUrl || req.body.songUrl;
    if (!songUrl) return res.status(400).send("URL missing");

    const ytdlp = spawn("yt-dlp", ["-f", "bestaudio", "-o", "-", songUrl]);
    const ffmpeg = spawn("ffmpeg", ["-i", "pipe:0", "-f", "mp3", "-ab", "192k", "-vn", "pipe:1"]);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");

    ytdlp.stdout.pipe(ffmpeg.stdin);
    ffmpeg.stdout.pipe(res);

    ytdlp.stderr.on("data", (data) => console.error("yt-dlp error:", data.toString()));
    ffmpeg.stderr.on("data", (data) => console.error("ffmpeg error:", data.toString()));

    ytdlp.on("error", (err) => {
      console.error("yt-dlp process error:", err);
      res.end();
    });

    ffmpeg.on("error", (err) => {
      console.error("ffmpeg process error:", err);
      res.end();
    });

  } catch (err) {
    console.error("handleSongStream error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

module.exports = { handleSongSearch, handleSongStream };
