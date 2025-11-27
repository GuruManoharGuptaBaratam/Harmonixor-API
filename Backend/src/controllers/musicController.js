const { exec } = require("child_process");
const { spawn } = require("child_process");
// const fs = require("fs");
// const path = require("path");
const User = require("../models/User");
const searchVideoIdPlaywright = require("../utils/searchVideoIdPlaywright");
// const extractYouTubeAudioURL = require("../utils/playwrightExtractor");
// const ytdl = require("ytdl-core");
// const FFMPEG_PATH = "ffmpeg";


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

  
    const videoId = await searchVideoIdPlaywright(songName);


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

}
module.exports = { handleSongSearch, handleSongStream };

