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


  console.log("==== STREAMING DEBUG START ====");

  try {
    // 1. API KEY CHECK
    const APIKEY = req.apiKey;
    console.log("[DEBUG] APIKEY:", APIKEY);

    if (!APIKEY) return res.status(401).json({ error: "API key missing" });
    const user = await User.findOne({ where: { apiKey: APIKEY } });
    if (!user) return res.status(403).json({ error: "Invalid API key" });

    // 2. CREATE COOKIE FILE
    const cookieBase64 = user.cookieFile;
    console.log("[DEBUG] cookieBase64 exists?", !!cookieBase64);

    if (!cookieBase64) return res.status(400).json({ error: "No cookie found" });

    const buffer = Buffer.from(cookieBase64, "base64");
    console.log("[DEBUG] cookie buffer size:", buffer.length);

    const cookiesDir = path.join(__dirname, "../../UserCookies");
    if (!fs.existsSync(cookiesDir)) fs.mkdirSync(cookiesDir, { recursive: true });

    const tempCookiePath = path.join(cookiesDir, `temp_cookie_${Date.now()}.txt`);
    await fs.promises.writeFile(tempCookiePath, buffer);
    console.log("[DEBUG] Cookie written to:", tempCookiePath);


    // 3. GET SONG NAME
    const songName = songNameParam || req.query.song || req.body.songName;
    console.log("[DEBUG] Song name:", songName);

    if (!songName || typeof songName !== "string") {
      await fs.promises.unlink(tempCookiePath);
      return res.status(400).json({ error: "Invalid song name" });
    }


    // 4. SET STREAM HEADERS
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");


    // 5. SPAWN YT-DLP
    console.log("[DEBUG] Spawning yt-dlp...");

    const ytdlp = spawn("yt-dlp", [
      "--cookies", tempCookiePath,
      "--default-search", "ytsearch",
      "--no-playlist",
      "-f", "bestaudio[ext=m4a]/bestaudio",
      "-o", "-",
      `${songName} lyrical`
    ]);

    console.log("[DEBUG] yt-dlp pid:", ytdlp.pid);


    // 6. SPAWN FFMPEG
    console.log("[DEBUG] Spawning ffmpeg:", FFMPEG_PATH);

    const ffmpeg = spawn(FFMPEG_PATH, [
      "-i", "pipe:0",
      "-vn",
      "-f", "mp3",
      "-b:a", "192k",
      "pipe:1"
    ]);

    console.log("[DEBUG] ffmpeg pid:", ffmpeg.pid);


    // 7. PIPE DATA
    console.log("[DEBUG] Connecting pipes...");
    ytdlp.stdout.pipe(ffmpeg.stdin);
    ffmpeg.stdout.pipe(res);


    // 8. LOG OUTPUT
    let ytdlpBytes = 0;
    ytdlp.stdout.on("data", d => {
      ytdlpBytes += d.length;
      console.log(`[yt-dlp stdout] Received ${d.length} bytes (total: ${ytdlpBytes})`);
    });

    ytdlp.stderr.on("data", d => console.log("[yt-dlp stderr]", d.toString()));

    let ffmpegBytes = 0;
    ffmpeg.stdout.on("data", d => {
      ffmpegBytes += d.length;
      console.log(`[ffmpeg stdout] Streaming ${d.length} bytes (total: ${ffmpegBytes})`);
    });

    ffmpeg.stderr.on("data", d =>
      console.log("[ffmpeg stderr]", d.toString())
    );


    // 9. ERROR HANDLERS
    ytdlp.on("error", err => {
      console.error("[yt-dlp ERROR]", err);
      if (!res.headersSent) res.status(500).end("yt-dlp failed");
      cleanup();
    });

    ffmpeg.on("error", err => {
      console.error("[ffmpeg ERROR]", err);
      if (!res.headersSent) res.status(500).end("ffmpeg failed");
      cleanup();
    });


    // 10. CLOSE EVENTS
    ytdlp.on("close", code => {
      console.log("[yt-dlp CLOSED] Exit code:", code);
    });

    ffmpeg.on("close", code => {
      console.log("[ffmpeg CLOSED] Exit code:", code);
      cleanup();
      if (!res.writableEnded) res.end();
    });


    // 11. CLEANUP
    function cleanup() {
      console.log("[DEBUG] Cleanup triggered.");
      if (fs.existsSync(tempCookiePath)) {
        fs.unlink(tempCookiePath, () => console.log("[DEBUG] Cookie deleted."));
      }

      try { ytdlp.kill("SIGKILL"); } catch {}
      try { ffmpeg.kill("SIGKILL"); } catch {}
    }


    // 12. CLIENT DISCONNECT
    req.on("close", () => {
      console.log("[DEBUG] Client disconnected.");
      cleanup();
      if (!res.writableEnded) res.end();
    });


  } catch (err) {
    console.error("[handler ERROR]", err);
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

