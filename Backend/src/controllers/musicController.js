const { exec } = require("child_process");
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
    if (!fs.existsSync(cookiesDir)) fs.mkdirSync(cookiesDir, { recursive: true });

    const tempCookiePath = path.join(cookiesDir, `temp_cookie_${Date.now()}.txt`);
    await fs.promises.writeFile(tempCookiePath, buffer);

    const songName = songNameParam || req.query.song || req.body.songName;
    if (!songName || typeof songName !== "string") {
      await fs.promises.unlink(tempCookiePath);
      return res.status(400).json({ error: "Invalid song name" });
    }

    // 🔄 Retry logic with exponential backoff
    const maxRetries = 3;

    const runYtDlp = (attempt = 1) => {
      return new Promise((resolve, reject) => {
        const command = `yt-dlp --cookies "${tempCookiePath}" -f "bestaudio/best" --default-search "ytsearch" -j "${songName} lyrical"`;
        exec(command, async (error, stdout, stderr) => {
          if (error || !stdout) {
            const errMsg = stderr || error.message;

            // Retry on 429 or common transient errors
            if ((errMsg.includes("429") || errMsg.includes("format")) && attempt < maxRetries) {
              const delay = 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s
              console.warn(`Retrying yt-dlp (attempt ${attempt + 1}) after ${delay}ms...`);
              return setTimeout(() => {
                runYtDlp(attempt + 1).then(resolve).catch(reject);
              }, delay);
            }

            return reject(new Error(errMsg));
          }

          try {
            const data = JSON.parse(stdout);
            resolve(data);
          } catch (parseErr) {
            reject(new Error("Failed to parse yt-dlp JSON output"));
          }
        });
      });
    };

    try {
      const data = await runYtDlp();

      // Pick best audio stream dynamically
      let streamUrl = "";
      if (data.formats && data.formats.length > 0) {
        const audioFormats = data.formats.filter(f => f.acodec !== "none" && !f.vcodec);
        const preferred = audioFormats.find(f => f.ext === "m4a") ||
                          audioFormats.find(f => f.ext === "webm") ||
                          audioFormats[0];
        streamUrl = preferred ? preferred.url : data.url;
      } else {
        streamUrl = data.url;
      }

      if (!streamUrl) {
        return res.status(500).json({ error: "No valid audio stream found" });
      }

      res.status(200).json({
        title: data.title || "Unknown Title",
        thumbnail: data.thumbnail || null,
        streamUrl: encodeURIComponent(streamUrl)
      });

    } catch (ytErr) {
      console.error("yt-dlp final error:", ytErr);
      res.status(500).json({ error: "Error extracting media", details: ytErr.message });
    } finally {
      try { await fs.promises.unlink(tempCookiePath); } catch {}
    }

  } catch (err) {
    console.error("handleSongSearch error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

module.exports = { handleSongSearch };


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
