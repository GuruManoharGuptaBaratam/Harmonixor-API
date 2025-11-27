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
  console.log("==== STREAMING START ====");

  try {
    // 1. API KEY CHECK
    const APIKEY = req.apiKey;
    console.log("[DEBUG] APIKEY:", APIKEY);

    if (!APIKEY) return res.status(401).json({ error: "API key missing" });
    const user = await User.findOne({ where: { apiKey: APIKEY } });
    if (!user) return res.status(403).json({ error: "Invalid API key" });

    // 2. READ COOKIE FILE (UTF-8 TEXT)
    const cookieBase64 = user.cookieFile;
    if (!cookieBase64) return res.status(400).json({ error: "No cookie found" });

    const cookieText = Buffer.from(cookieBase64, "base64").toString("utf8");
    console.log("[DEBUG] cookieText length:", cookieText.length);

    // WRITE COOKIE AS UTF-8 TEXT (VERY IMPORTANT)
    const cookiesDir = path.join(__dirname, "../../UserCookies");
    if (!fs.existsSync(cookiesDir)) fs.mkdirSync(cookiesDir, { recursive: true });

    const tempCookiePath = path.join(cookiesDir, `temp_cookie_${Date.now()}.txt`);
    await fs.promises.writeFile(tempCookiePath, cookieText, "utf8");

    console.log("[DEBUG] Cookie written to:", tempCookiePath);


    // 3. GET SONG NAME
    const songName = songNameParam || req.query.song || req.body.songName;
    if (!songName || typeof songName !== "string") {
      await fs.promises.unlink(tempCookiePath);
      return res.status(400).json({ error: "Invalid song name" });
    }
    console.log("[DEBUG] Song:", songName);


    // 4. STREAM HEADERS
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");


    // 5. SPAWN yt-dlp (with extractor-args to bypass SABR 403)
    const ytdlpArgs = [
      "--cookies", tempCookiePath,
      "--extractor-args", "youtube:player_client=android",
      "--default-search", "ytsearch",
      "--no-playlist",
      "-f", "bestaudio[ext=m4a]/bestaudio",
      "-o", "-",
      `${songName} lyrical`
    ];

    console.log("[DEBUG] Spawning yt-dlp:", ytdlpArgs.join(" "));

    const ytdlp = spawn("yt-dlp", ytdlpArgs);
    console.log("[DEBUG] yt-dlp pid:", ytdlp.pid);


    // 6. SPAWN FFMPEG CONVERTER
    console.log("[DEBUG] Spawning ffmpeg...");
    const ffmpeg = spawn(FFMPEG_PATH, [
      "-i", "pipe:0",
      "-vn",
      "-f", "mp3",
      "-b:a", "192k",
      "pipe:1"
    ]);

    console.log("[DEBUG] ffmpeg pid:", ffmpeg.pid);


    // 7. CONNECT PIPELINES
    ytdlp.stdout.pipe(ffmpeg.stdin);
    ffmpeg.stdout.pipe(res);


    // 8. LOG DATA FLOW
    ytdlp.stdout.on("data", d =>
      console.log(`[yt-dlp stdout] ${d.length} bytes`)
    );

    ytdlp.stderr.on("data", d =>
      console.log(`[yt-dlp stderr] ${d.toString()}`)
    );

    ffmpeg.stderr.on("data", d =>
      console.log(`[ffmpeg stderr] ${d.toString()}`)
    );


    // 9. HANDLE ERRORS
    ytdlp.on("error", err => {
      console.error("[yt-dlp ERROR]", err);
      if (!res.headersSent) res.status(500).end("yt-dlp error");
      cleanup();
    });

    ffmpeg.on("error", err => {
      console.error("[ffmpeg ERROR]", err);
      if (!res.headersSent) res.status(500).end("ffmpeg error");
      cleanup();
    });


    // 10. CLOSE EVENTS
    ytdlp.on("close", code => console.log("[yt-dlp CLOSED] code:", code));
    ffmpeg.on("close", code => {
      console.log("[ffmpeg CLOSED] code:", code);
      cleanup();
      if (!res.writableEnded) res.end();
    });


    // 11. CLEANUP
    function cleanup() {
      console.log("[DEBUG] cleanup()");
      if (fs.existsSync(tempCookiePath)) {
        fs.unlink(tempCookiePath, () => console.log("[DEBUG] Cookie deleted"));
      }
      try { ytdlp.kill("SIGKILL"); } catch {}
      try { ffmpeg.kill("SIGKILL"); } catch {}
    }


    // 12. CLIENT ABORT
    req.on("close", () => {
      console.log("[DEBUG] Client disconnected");
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

