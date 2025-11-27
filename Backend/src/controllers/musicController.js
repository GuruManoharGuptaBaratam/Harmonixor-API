const { exec } = require("child_process");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const searchVideoId = require("../utils/searchVideoIdPlaywright");
const extractYouTubeAudioURL = require("../utils/playwrightExtractor");
const ytdl = require("ytdl-core");
const FFMPEG_PATH = "ffmpeg";


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


async function handleSongStream(req, res,songUrlParam) {
    const video = songUrlParam || req.query.songUrl || req.body.songUrl;;
  const audioUrl = await getAudioUrl(video);
  console.log("formatted_url",audioUrl)
  res.set("Content-Type", "audio/mpeg");
  const ffmpeg = spawn("ffmpeg", [
    "-i", audioUrl,
    "-f", "mp3",
    "pipe:1"
  ]);
  ffmpeg.stdout.pipe(res);
  
}
function getAudioUrl(videoUrl) {
  return new Promise((resolve, reject) => {
    exec(`yt-dlp -g -f 140 "${videoUrl}"`, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout.trim());
    });
  });
}
function convertToMp3(inputUrl, outputFile) {
  return new Promise((resolve, reject) => {
    exec(`ffmpeg -i "${inputUrl}" -vn -acodec libmp3lame "${outputFile}"`, (err) => {
      if (err) return reject(err);
      resolve(outputFile);
    });
  });
}
module.exports = { handleSongSearch, handleSongStream };

