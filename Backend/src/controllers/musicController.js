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
  const url = songUrlParam;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📥 Incoming stream request");
  console.log("GoogleVideo URL:", url);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (!url) {
    console.log("❌ Missing URL");
    return res.status(400).json({ error: "Missing URL" });
  }

  let browser;

  try {
    console.log("🚀 Launching Playwright browser...");
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-web-security", "--disable-features=IsolateOrigins"],
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("🌐 Fetching googlevideo resource via browser…");

    const response = await page.request.fetch(url);

    console.log("📡 GoogleVideo Response Status:", response.status());

    if (!response.ok()) {
      console.log("❌ GoogleVideo fetch failed:", response.status());
      await browser.close();
      return res.status(500).json({ error: "GoogleVideo fetch failed" });
    }

    const headers = response.headers();
    console.log("📦 GoogleVideo Headers:", headers);

    console.log("📥 Obtaining readable stream from Playwright…");
    const browserStream = await response.body();

    // Start ffmpeg
    console.log("🎧 Starting ffmpeg conversion...");
    const ffmpeg = spawn("ffmpeg", [
      "-loglevel", "debug",   // ⬅ debug mode ON
      "-i", "pipe:0",
      "-f", "mp3",
      "-ab", "192k",
      "-vn",
      "pipe:1",
    ]);

    ffmpeg.on("error", (err) => {
      console.log("❌ FFmpeg spawn failed:", err);
    });

    ffmpeg.stderr.on("data", (data) => {
      console.log("🎙 FFmpeg DEBUG:", data.toString());
    });

    res.setHeader("Content-Type", "audio/mpeg");

    console.log("🔁 Piping data: browser → ffmpeg → response");
    browserStream.pipe(ffmpeg.stdin);
    ffmpeg.stdout.pipe(res);

    ffmpeg.on("close", (code) => {
      console.log("🛑 FFmpeg closed with code:", code);
      browser.close();
      console.log("🧹 Browser closed.");
    });

    browserStream.on("error", (err) => {
      console.log("❌ BrowserStream error:", err);
    });

    res.on("close", () => {
      console.log("🚪 Client connection closed.");
    });

  } catch (err) {
    console.log("💥 UNCAUGHT ERROR:", err);
    if (browser) await browser.close();
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { handleSongSearch, handleSongStream };
