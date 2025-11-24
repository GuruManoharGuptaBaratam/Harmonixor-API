const { exec } = require("child_process");
const User = require("../models/User"); 

const searchVideoIdPlaywright = require("../utils/searchVideoIdPlaywright");
const extractYouTubeAudioURL = require("../utils/playwrightExtractor");

async function handleSongSearch(req, res,songNameParam) {
  try {
    const APIKEY = req.apiKey;
    if (!APIKEY) return res.status(401).json({ error: "API key missing" });

    const user = await User.findOne({ where: { apiKey: APIKEY } });
    if (!user) return res.status(403).json({ error: "Invalid API key" });

    const songName = songNameParam || req.query.song || req.body.songName;
    if (!songName) return res.status(400).json({ error: "Invalid song name" });


    const videoId = await searchVideoIdPlaywright(songName);

  
    // const directAudioUrl = await extractYouTubeAudioURL(videoId);

    return res.status(200).json({
      title: songName,
      videoId
      // streamUrl: directAudioUrl,
    });

  } catch (err) {
    console.error("handleSongSearch failed:", err);
    return res.status(500).json({ error: "Extraction failed", details: err.message });
  }
}



function handleSongStream(req, res, songUrlParam) {
  try {
    const songUrl = songUrlParam || req.query.songUrl || req.body.songUrl;
    if (!songUrl) return res.status(400).json({ error: "URL missing" });


    exec(`yt-dlp -f bestaudio -g "${songUrl}"`, (err, stdout, stderr) => {
      if (err) {
        console.error("yt-dlp error:", stderr);
        return res.status(500).json({ error: "Failed to get audio URL" });
      }

      const directAudioUrl = stdout.trim();
      res.json({ downloadUrl: directAudioUrl });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { handleSongSearch, handleSongStream };

