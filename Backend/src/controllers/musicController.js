const { exec } = require("child_process");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const { chromium } = require("playwright");

async function handleSongSearch(req, res, songNameParam) {
  try {
    const APIKEY = req.apiKey;
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


    const command = `yt-dlp --cookies "${tempCookiePath}" -f "bestaudio[ext=m4a]/bestaudio" --default-search "ytsearch" --dump-json --sponsorblock-remove all "${songName} lyrical"`;

    exec(command, async (error, stdout, stderr) => {
      try {
        await fs.promises.unlink(tempCookiePath);
      } catch (unlinkErr) {
        console.error("Failed to delete temp cookie:", unlinkErr);
      }

      if (error || !stdout) {
        console.error("yt-dlp error:", error || stderr);
        return res.status(500).json({
          error: "Error extracting media",
          details: stderr || error.message,
        });
      }


      let info;
      try {
        info = JSON.parse(stdout.trim());
      } catch (jsonErr) {
        return res.status(500).json({ error: "Failed to parse yt-dlp JSON" });
      }

      const title = info.title || "";
      const songUrl = info.url || ""; 
      const thumbnail = info.thumbnail || "";

      if (!songUrl) {
        return res.status(500).json({ error: "Failed to get song URL from yt-dlp" });
      }

      const streamUrl = encodeURIComponent(songUrl);

      res.status(200).json({
        title,
        thumbnail,
        streamUrl,
      });
    });
  } catch (err) {
    console.error("handleSongSearch error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}


async function handleSongStream(req, res, songUrlParam) {
 try {
    const encodedUrl = songUrlParam || req.query.songUrl || req.body.songUrl;
    if (!encodedUrl) {
      return res.status(400).json({ error: "Missing url" });
    }

    // ⭐ MUST DECODE OTHERWISE FETCH WILL FAIL
    const url = decodeURIComponent(encodedUrl);

    console.log("Decoded URL:", url);
    const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Range": "bytes=0-",
    "Referer": "https://www.youtube.com", 
    "Origin": "https://www.youtube.com",
  };

    const response = await fetch(url, {
  method: "GET",
  headers
});

    if (!response.ok) {
      console.log("Fetch failed:", response.status);
      return res.status(500).json({ error: "GoogleVideo fetch failed" });
    }

    // Start ffmpeg to convert into MP3
    const ffmpeg = spawn("ffmpeg", [
      "-i", "pipe:0",
      "-f", "mp3",
      "-ab", "192k",
      "pipe:1"
    ]);

    res.setHeader("Content-Type", "audio/mpeg");

    // Pipe googlevideo → ffmpeg → client
    response.body.pipe(ffmpeg.stdin);
    ffmpeg.stdout.pipe(res);

    ffmpeg.on("close", () => {
      console.log("FFmpeg finished");
    });

  } catch (err) {
    console.error("Stream error:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { handleSongSearch, handleSongStream };
