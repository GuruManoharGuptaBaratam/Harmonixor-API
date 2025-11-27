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

    // if (!user.cookieFile)
    //   return res.status(400).json({ error: "User has no cookie uploaded" });

    // const cookiesDir = path.join(__dirname, "../../UserCookies");
    // if (!fs.existsSync(cookiesDir)) fs.mkdirSync(cookiesDir, { recursive: true });

    // const tempCookiePath = path.join(cookiesDir, `cookie_${Date.now()}.txt`);
    // const buffer = Buffer.from(user.cookieFile, "base64");
    // fs.writeFileSync(tempCookiePath, buffer);

    const songName = songNameParam || req.query.song || req.body.songName;
    if (!songName) return res.status(400).json({ error: "Invalid song name" });

  
    const videoId = await searchVideoId(songName);


    // const audioUrl = await extractYouTubeAudioURL(videoId, tempCookiePath);


    // try { fs.unlinkSync(tempCookiePath); } catch {}

    return res.status(200).json({
      title: songName,
      videoId
    });

  } catch (err) {
    console.error("handleSongSearch failed:", err);
    return res.status(500).json({ error: "Extraction failed", details: err.message });
  }
}


async function handleSongStream(req, res,songUrlParam) {
const videoId = songUrlParam || req.query.songUrl || req.body.songUrl;
  if (!videoId) {
    return res.status(400).json({ error: "videoId is required" });
  }
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  // 1. Use yt-dlp to get a fresh backend-valid audio URL (itag 140 = m4a)
  const ytdlp = spawn("yt-dlp", ["-g", "-f", "140", youtubeUrl]);
  let audioUrl = "";
  ytdlp.stdout.on("data", (data) => {
    audioUrl += data.toString();
  });
  ytdlp.stderr.on("data", (data) => {
    console.error("yt-dlp error:", data.toString());
  });
  ytdlp.on("close", (code) => {
    if (code !== 0 || !audioUrl.trim()) {
      return res.status(500).json({ error: "Failed to get audio URL" });
    }
    audioUrl = audioUrl.trim(); // this is the googlevideo URL — for server use only
    // 2. Stream it to the client
    res.setHeader("Content-Type", "audio/mp4");
    https
      .get(audioUrl, (streamRes) => {
        if (streamRes.statusCode !== 200) {
          console.error("Googlevideo status:", streamRes.statusCode);
          res.status(streamRes.statusCode).end("Failed to fetch audio");
          return;
        }
        streamRes.pipe(res);
      })
      .on("error", (err) => {
        console.error("Streaming error:", err);
        res.status(500).end("Streaming error");
      });
  });
  
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

