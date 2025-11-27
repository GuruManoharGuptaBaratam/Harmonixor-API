const { exec } = require("child_process");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const searchVideoId = require("../utils/searchVideoIdPlaywright");
const extractYouTubeAudioURL = require("../utils/playwrightExtractor");
const ytdl = require("ytdl-core");
const FFMPEG_PATH = "/opt/homebrew/bin/ffmpeg"

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


    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");


    const ytdlp = spawn("yt-dlp", [
      "--cookies", tempCookiePath,
      "--default-search", "ytsearch",
      "--no-playlist",
      "-f", "bestaudio[ext=m4a]/bestaudio",
      "-o", "-",              
      `${songName} lyrical`   
    ]);


    const ffmpeg = spawn(FFMPEG_PATH, [
      "-i", "pipe:0",
      "-vn",
      "-f", "mp3",
      "-b:a", "192k",
      "pipe:1"
    ]);


    ytdlp.stdout.pipe(ffmpeg.stdin);
    ffmpeg.stdout.pipe(res);


    ytdlp.stderr.on("data", d => console.log("[yt-dlp]", d.toString()));
    ffmpeg.stderr.on("data", d => console.log("[ffmpeg]", d.toString()));


    ytdlp.on("error", err => {
      console.error("yt-dlp error:", err);
      if (!res.headersSent) res.status(500).end("yt-dlp failed");
      cleanup();
    });


    ffmpeg.on("error", err => {
      console.error("ffmpeg error:", err);
      if (!res.headersSent) res.status(500).end("ffmpeg failed");
      cleanup();
    });


    function cleanup() {
      if (fs.existsSync(tempCookiePath)) {
        fs.unlink(tempCookiePath, () => {});
      }
      try { ytdlp.kill("SIGKILL"); } catch {}
      try { ffmpeg.kill("SIGKILL"); } catch {}
    }


    ffmpeg.on("close", () => {
      cleanup();
      if (!res.writableEnded) res.end();
    });


    req.on("close", () => {
      cleanup();
      if (!res.writableEnded) res.end();
    });

  } catch (err) {
    console.error("handleSongSearch error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}




async function handleSongStream(req, res,songUrlParam) {
  try {
    const id = songUrlParam || req.query.song || req.body.songName;
    console.log(id)
    if (!id || id.length !== 11)
      return res.status(400).send("Invalid YouTube video id");

    const url = `https://www.youtube.com/watch?v=${id}`;

    res.setHeader("Content-Type", "audio/mp4");
    res.setHeader("Transfer-Encoding", "chunked");

    ytdl(url, {
      filter: "audioonly",
      quality: "140",
      requestOptions: {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://www.youtube.com",
        },
      },
    })
      .on("error", (err) => {
        console.error("YTDL error:", err);
        res.status(500).end("Stream error");
      })
      .pipe(res);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).send("Streaming Error: " + err.message);
  }
}
module.exports = { handleSongSearch, handleSongStream };

