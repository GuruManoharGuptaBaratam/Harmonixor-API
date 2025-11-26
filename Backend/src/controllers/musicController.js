const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const searchVideoId = require("../utils/searchVideoIdPlaywright");
const extractYouTubeAudioURL = require("../utils/playwrightExtractor");
const ytdl = require("ytdl-core");

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



async function handleSongStream(req, res, songUrlParam) {
  try {
        // Match your query parameter correctly
        const id = songUrlParam || req.query.Song_url || req.body.Song_url;

        if (!id || id.length !== 11) return res.status(400).send("Invalid YouTube video id");

        const URL = `https://www.youtube.com/watch?v=${id}`;

        const info = await ytdl.getInfo(URL); // optional, can be removed if not needed

        res.setHeader("Content-Type", "audio/mp4");
        res.setHeader("Transfer-Encoding", "chunked"); // prevents buffering issues

        ytdl(URL, {
            filter: "audioonly",
            quality: "140",
            requestOptions: {
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "Referer": "https://www.youtube.com"
                }
            }
        }).on("error", err => {
            console.log("YTDL error:", err);
            res.status(500).end("Stream error");
        })
        .pipe(res);

    } catch (err) {
        console.log("SERVER ERROR:", err);
        res.status(500).send("Streaming Error: " + err.message);
    }
}
module.exports = { handleSongSearch, handleSongStream };

