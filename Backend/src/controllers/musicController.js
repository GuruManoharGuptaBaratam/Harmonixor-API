const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const searchVideoIdPlaywright = require("../utils/searchVideoIdPlaywright");
const extractYouTubeAudioURL = require("../utils/playwrightExtractor");
const { decodeCookieTextFromStorage } = require("../utils/cookieStorage");

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const YT_DLP_BINARY = process.env.YT_DLP_BINARY || "yt-dlp";
const BROWSER_SAFE_AUDIO_FORMAT =
  "bestaudio[ext=m4a]/bestaudio[ext=mp4]/bestaudio[acodec*=mp4a]/bestaudio/best";

function validateYouTubeVideoId(videoId) {
  return YOUTUBE_ID_PATTERN.test(String(videoId || "").trim());
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function searchVideoIdWithYtDlp(songName) {
  const args = [
    "--no-update",
    "--dump-single-json",
    "--flat-playlist",
    "--skip-download",
    `ytsearch1:${songName}`,
  ];

  const { code, stdout, stderr } = await runProcess(YT_DLP_BINARY, args);
  if (code !== 0) {
    throw new Error(stderr.trim() || "yt-dlp search failed");
  }

  const parsed = JSON.parse(stdout);
  const videoId = parsed.id || parsed.entries?.[0]?.id;

  if (!validateYouTubeVideoId(videoId)) {
    throw new Error("yt-dlp search did not return a valid video ID");
  }

  return videoId;
}

async function extractStreamUrlsWithYtDlp(videoId, cookieFilePath) {
  const args = [
    "--no-update",
    "--no-playlist",
    "--cookies",
    cookieFilePath,
    "--extractor-args",
    "youtube:player_client=default",
    "--print",
    "before_dl:%(url)s",
    "--print",
    "before_dl:%(ext)s",
    "--print",
    "before_dl:%(acodec)s",
    "--print",
    "before_dl:%(audio_ext)s",
    "-f",
    BROWSER_SAFE_AUDIO_FORMAT,
    "-g",
    `https://www.youtube.com/watch?v=${videoId}`,
  ];

  const { code, stdout, stderr } = await runProcess(YT_DLP_BINARY, args);

  if (code !== 0) {
    const error = new Error(stderr.trim() || "yt-dlp extraction failed");
    error.stderr = stderr;
    throw error;
  }

  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const urlLines = lines.filter((line) => /^https?:\/\//i.test(line));
  const metadataLines = lines.filter((line) => !/^https?:\/\//i.test(line));

  const [firstLine, secondLine] = urlLines;
  const videoUrl = secondLine ? firstLine : null;
  const audioUrl = secondLine || firstLine || null;
  const [ext, acodec, audioExt] = metadataLines;

  if (!audioUrl) {
    throw new Error("yt-dlp did not return a playable audio URL");
  }

  const normalizedExt = (audioExt || ext || "").toLowerCase();
  const mimeType = normalizedExt === "m4a" || normalizedExt === "mp4"
    ? "audio/mp4"
    : normalizedExt === "webm"
      ? "audio/webm"
      : "audio/mpeg";

  return {
    videoUrl,
    audioUrl,
    streamUrl: audioUrl,
    provider: "yt-dlp",
    mimeType,
    ext: normalizedExt || null,
    acodec: acodec || null,
  };
}

async function handleSongSearch(req, res, songNameParam) {
  try {
    const APIKEY = req.apiKey;
    if (!APIKEY) return res.status(401).json({ error: "API key missing" });

    const user = await User.findOne({ where: { apiKey: APIKEY } });
    if (!user) return res.status(403).json({ error: "Invalid API key" });

    const songName = songNameParam || req.query.song || req.body.songName;
    if (!songName) return res.status(400).json({ error: "Invalid song name" });

    let videoId;

    try {
      videoId = await searchVideoIdPlaywright(songName);
    } catch (playwrightError) {
      console.warn("Playwright search failed, falling back to yt-dlp search:", playwrightError.message);
      videoId = await searchVideoIdWithYtDlp(songName);
    }

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
  const id = (songUrlParam || req.query.songUrl || "").trim();
  const APIKEY = req.apiKey;
  if (!APIKEY) return res.status(401).json({ error: "API key missing" });
  if (!validateYouTubeVideoId(id)) {
    return res.status(400).json({ error: "Invalid YouTube video ID" });
  }

  const user = await User.findOne({ where: { apiKey: APIKEY } });
  if (!user) return res.status(403).json({ error: "Invalid API key" });

  const storedCookie = user.cookieFile;
  if (!storedCookie) return res.status(400).json({ error: "No cookie found for this user" });

  let cookieText;
  try {
    cookieText = decodeCookieTextFromStorage(storedCookie);
  } catch (cookieError) {
    return res.status(400).json({
      error: "Stored cookie is invalid",
      details: cookieError.message,
    });
  }

  const cookiesDir = path.join(__dirname, "../../UserCookies");
  if (!fs.existsSync(cookiesDir)) {
    fs.mkdirSync(cookiesDir, { recursive: true });
  }

  const tempCookiePath = path.join(cookiesDir, `temp_cookie_${Date.now()}.txt`);
  await fs.promises.writeFile(tempCookiePath, cookieText, "utf8");

  try {
    const ytDlpResult = await extractStreamUrlsWithYtDlp(id, tempCookiePath);
    return res.json(ytDlpResult);
  } catch (ytDlpError) {
    console.error("yt-dlp stream extraction failed:", ytDlpError.message);

    try {
      const audioUrl = await extractYouTubeAudioURL(id, tempCookiePath);
      return res.json({
        videoUrl: null,
        audioUrl,
        streamUrl: audioUrl,
        provider: "playwright",
        mimeType: "audio/mp4",
      });
    } catch (fallbackError) {
      console.error("Playwright stream fallback failed:", fallbackError.message);
      return res.status(500).json({
        error: "Failed to fetch song stream",
        details: fallbackError.message,
        ytDlp: ytDlpError.stderr || ytDlpError.message,
      });
    }
  } finally {
    try {
      await fs.promises.unlink(tempCookiePath);
    } catch (cleanupError) {
      console.error("Failed to remove temp cookie file:", cleanupError.message);
    }
  }
}

module.exports = { handleSongSearch, handleSongStream };
