const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream/promises");
const User = require("../models/User");
const axios = require("axios");
const searchVideoIdPlaywright = require("../utils/searchVideoIdPlaywright");
const extractYouTubeAudioURL = require("../utils/playwrightExtractor");
const { decodeCookieTextFromStorage } = require("../utils/cookieStorage");

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const YT_DLP_BINARY = process.env.YT_DLP_BINARY || "yt-dlp";
const BROWSER_SAFE_AUDIO_FORMAT =
  "140/141/bestaudio[ext=m4a]/bestaudio[ext=mp4]/bestaudio[acodec*=mp4a]/bestaudio/best";
const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "cache-control",
  "etag",
  "last-modified",
  "content-disposition",
];

function validateYouTubeVideoId(videoId) {
  return YOUTUBE_ID_PATTERN.test(String(videoId || "").trim());
}

function encodeSourceUrl(value) {
  return Buffer.from(String(value), "utf8").toString("base64url");
}

function decodeSourceUrl(value) {
  return Buffer.from(String(value), "base64url").toString("utf8");
}

function getPublicBaseUrl(req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const protocol = forwardedProto || req.protocol || "https";
  const host = forwardedHost || req.get("host");
  return `${protocol}://${host}`;
}

function buildProxyUrl(req, sourceUrl) {
  const params = new URLSearchParams({
    KEY: req.apiKey,
    source: encodeSourceUrl(sourceUrl),
  });

  return `${getPublicBaseUrl(req)}/harmonixor/songs/proxy?${params.toString()}`;
}

function inferMimeType(audioUrl, ext, fallbackMimeType = "audio/mpeg") {
  const normalizedExt = String(ext || "").toLowerCase();
  const decodedUrl = decodeURIComponent(audioUrl);

  if (
    normalizedExt === "m4a" ||
    normalizedExt === "mp4" ||
    normalizedExt.includes("mp4") ||
    normalizedExt.includes("m4a")
  ) {
    return "audio/mp4";
  }

  if (normalizedExt === "webm" || normalizedExt.includes("webm")) {
    return "audio/webm";
  }

  if (audioUrl.includes(".m3u8") || decodedUrl.includes("mime=application/vnd.apple.mpegurl")) {
    return "application/vnd.apple.mpegurl";
  }

  if (
    audioUrl.includes("mime=audio%2Fmp4") ||
    decodedUrl.includes("mime=audio/mp4")
  ) {
    return "audio/mp4";
  }

  if (
    audioUrl.includes("itag=140") ||
    audioUrl.includes("itag=141") ||
    decodedUrl.includes("itag=140") ||
    decodedUrl.includes("itag=141")
  ) {
    return "audio/mp4";
  }

  if (
    audioUrl.includes("mime=audio%2Fwebm") ||
    decodedUrl.includes("mime=audio/webm")
  ) {
    return "audio/webm";
  }

  if (
    audioUrl.includes("mime=audio%2Fmpeg") ||
    decodedUrl.includes("mime=audio/mpeg")
  ) {
    return "audio/mpeg";
  }

  return fallbackMimeType;
}

function rewritePlaylistToProxy(req, playlistText, sourceUrl) {
  const source = new URL(sourceUrl);
  const lines = playlistText.split(/\r?\n/);

  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return line;
      }

      const absoluteUrl = new URL(trimmed, source).toString();
      return buildProxyUrl(req, absoluteUrl);
    })
    .join("\n");
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
  const mimeType = inferMimeType(audioUrl, normalizedExt);

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
    return res.json({
      ...ytDlpResult,
      upstreamUrl: ytDlpResult.streamUrl,
      streamUrl: buildProxyUrl(req, ytDlpResult.streamUrl),
    });
  } catch (ytDlpError) {
    console.error("yt-dlp stream extraction failed:", ytDlpError.message);

    try {
      const audioUrl = await extractYouTubeAudioURL(id, tempCookiePath);
      const mimeType = inferMimeType(audioUrl, "", "audio/mp4");

      return res.json({
        videoUrl: null,
        audioUrl,
        streamUrl: buildProxyUrl(req, audioUrl),
        provider: "playwright",
        mimeType,
        upstreamUrl: audioUrl,
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

async function handleSongProxy(req, res) {
  const source = req.query.source;
  const requestedMimeType = req.query.mimeType;

  if (!source) {
    return res.status(400).json({ error: "Missing media source" });
  }

  let upstreamUrl;
  try {
    upstreamUrl = decodeSourceUrl(source);
  } catch (error) {
    return res.status(400).json({ error: "Invalid media source" });
  }

  try {
    const upstreamResponse = await axios.get(upstreamUrl, {
      responseType: "stream",
      validateStatus: null,
      headers: {
        Range: req.headers.range,
        "User-Agent":
          req.headers["user-agent"] ||
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept: req.headers.accept || "*/*",
      },
      maxRedirects: 5,
      timeout: 45000,
    });

    const upstreamContentType =
      requestedMimeType ||
      upstreamResponse.headers["content-type"] ||
      "application/octet-stream";

    if (upstreamContentType.includes("mpegurl") || upstreamUrl.includes(".m3u8")) {
      const chunks = [];
      for await (const chunk of upstreamResponse.data) {
        chunks.push(Buffer.from(chunk));
      }

      const playlistBody = Buffer.concat(chunks).toString("utf8");
      const rewrittenPlaylist = rewritePlaylistToProxy(req, playlistBody, upstreamUrl);

      res.status(upstreamResponse.status);
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      return res.send(rewrittenPlaylist);
    }

    res.status(upstreamResponse.status);
    for (const headerName of FORWARDED_RESPONSE_HEADERS) {
      const headerValue = upstreamResponse.headers[headerName];
      if (headerValue) {
        res.setHeader(headerName, headerValue);
      }
    }

    if (requestedMimeType) {
      res.setHeader("Content-Type", requestedMimeType);
    }

    res.setHeader("Cache-Control", "no-store");
    await pipeline(upstreamResponse.data, res);
  } catch (error) {
    console.error("Media proxy failed:", error.message);
    if (!res.headersSent) {
      return res.status(502).json({
        error: "Failed to proxy media stream",
        details: error.message,
      });
    }
    res.destroy(error);
  }
}

module.exports = { handleSongSearch, handleSongStream, handleSongProxy };
