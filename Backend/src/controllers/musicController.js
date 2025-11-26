const { exec, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");

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

    const command = `yt-dlp --cookies "${tempCookiePath}" -f "bestaudio[ext=m4a]/bestaudio" --default-search "ytsearch" --get-title --get-thumbnail --get-url --sponsorblock-remove all "${songName} lyrical"`;

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

      const lines = stdout.trim().split("\n");
      const title = lines[0] || "";
      const songUrl = lines[1] || "";
      const thumbnail = lines[2] || "";

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
    const url = decodeURIComponent(
      songUrlParam || req.query.songUrl || req.body.songUrl
    );
;
    if (!url) {
      return res.status(400).json({ error: "Missing googlevideo URL" });
    }


  console.log("FETCHING GOOGLEVIDEO:", url);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)",
      "Accept": "*/*",
      "Referer": "https://www.youtube.com/",
      "Origin": "https://www.youtube.com",
      "Range": "bytes=0-" 
    }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "no body");
    
    console.log("\n====== GOOGLEVIDEO DEBUG ======");
    console.log("URL:", url);
    console.log("STATUS:", response.status);
    console.log("HEADERS:", Object.fromEntries(response.headers.entries()));
    console.log("BODY:", body);
    console.log("=================================\n");

    return res.status(500).json({
      error: "GoogleVideo rejected the request",
      status: response.status,
      body
    });
}

    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch googlevideo audio" });
    }

    const fileName = `audio_${Date.now()}.mp3`;
    const filePath = path.join(process.cwd(), "tmp", fileName);

    const ffmpeg = spawn("ffmpeg", [
      "-i", "pipe:0",
      "-vn",
      "-ac", "2",
      "-ar", "44100",
      "-b:a", "192k",
      "-f", "mp3",
      filePath
    ]);

    response.body.pipe(ffmpeg.stdin);

    ffmpeg.stderr.on("data", d => console.log("FFmpeg:", d.toString()));

    ffmpeg.on("close", () => {
      const fileUrl = `${req.protocol}://${req.get("host")}/tmp/${fileName}`;

      return res.json({
        status: "success",
        audioUrl: fileUrl,
        message: "Audio ready to play"
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}


module.exports = { handleSongSearch, handleSongStream };
