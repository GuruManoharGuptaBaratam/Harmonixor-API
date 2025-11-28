const { exec } = require("child_process");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const axios = require('axios')
const searchVideoIdPlaywright = require("../utils/searchVideoIdPlaywright");
const { chromium } = require("playwright");

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


async function handleSongStream(req, res, songUrlParam) {
  const id = songUrlParam || req.query.songUrl;
  const url = `https://www.youtube.com/watch?v=${id}`;

  exec(`yt-dlp --youtube-client TVHTML5 --no-check-certificates -g "https://www.youtube.com/watch?v=${id}"`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });

    const [videoUrl, audioUrl] = stdout.trim().split("\n");

    res.json({ videoUrl, audioUrl });
  });
}

module.exports = { handleSongSearch, handleSongStream };

