const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");

function getRandomProxy() {
  const proxyFile = path.join(__dirname, "../models/proxies.json");
  if (!fs.existsSync(proxyFile)) return null;

  const proxies = JSON.parse(fs.readFileSync(proxyFile, "utf8"));
  if (!proxies || proxies.length === 0) return null;

  const idx = Math.floor(Math.random() * proxies.length);
  return proxies[idx];
}

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
    await fs.promises.writeFile(tempCookiePath, buffer, { encoding: "utf8" });

    const songName = songNameParam || req.query.song || req.body.songName;
    if (!songName || typeof songName !== "string") {
      await fs.promises.unlink(tempCookiePath).catch(()=>{});
      return res.status(400).json({ error: "Invalid song name" });
    }

    const proxy = user.proxy || getRandomProxy();
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
    const safeQuery = songName.replace(/"/g, '\\"');

    let command = `yt-dlp -j --no-playlist --cookies "${tempCookiePath}" --user-agent "${userAgent}" --add-header "Accept-Language: en-US,en;q=0.9" --sleep-interval 2 --max-sleep-interval 4 "ytsearch1:${safeQuery} lyrical" -f "bestaudio/best"`;

    if (proxy) {
      command += ` --proxy "${proxy}"`;
    }

    const maxRetries = 4;
    const runYtDlp = (attempt = 1) => {
      return new Promise((resolve, reject) => {
        exec(command, { maxBuffer: 40 * 1024 * 1024 }, async (error, stdout, stderr) => {
          const stderrStr = (stderr || "").toString();
          const stdoutStr = (stdout || "").toString();
          const signInBlocked = /Sign in to confirm you|confirm you're not a bot|sign in to continue/i.test(stderrStr + stdoutStr);
          const is429 = /429|Too Many Requests/i.test(stderrStr) || /HTTP Error 429/i.test(stderrStr);
          const transient = /timed out|temporary failure|502|503|504|Connection reset/i.test(stderrStr);

          if (error || !stdoutStr) {
            if (signInBlocked) {
              return reject(new Error("YOUTUBE_SIGNIN_REQUIRED: The cookie appears invalid/expired or account needs CAPTCHA. Export fresh cookies in Netscape format and retry."));
            }
            if ((is429 || transient) && attempt < maxRetries) {
              const delay = 1500 * Math.pow(2, attempt - 1);
              return setTimeout(() => {
                runYtDlp(attempt + 1).then(resolve).catch(reject);
              }, delay);
            }
            const combined = stderrStr || (error && error.message) || "Unknown yt-dlp error";
            return reject(new Error(combined));
          }

          try {
            const data = JSON.parse(stdoutStr);
            return resolve(data);
          } catch (parseErr) {
            const firstJsonIndex = stdoutStr.indexOf('{');
            if (firstJsonIndex !== -1) {
              try {
                const maybeJson = JSON.parse(stdoutStr.slice(firstJsonIndex));
                return resolve(maybeJson);
              } catch (e) {}
            }
            return reject(new Error("Failed to parse yt-dlp JSON output"));
          }
        });
      });
    };

    try {
      const data = await runYtDlp();
      let streamUrl = "";
      if (data.formats && Array.isArray(data.formats) && data.formats.length) {
        const audioFormats = data.formats.filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'));
        let preferred = audioFormats.find(f => f.ext === "m4a") ||
                        audioFormats.find(f => f.ext === "webm");
        if (!preferred) {
          preferred = audioFormats.sort((a,b) => (b.abr || 0) - (a.abr || 0))[0];
        }
        streamUrl = preferred ? preferred.url : (data.url || "");
      } else {
        streamUrl = data.url || "";
      }

      if (!streamUrl) {
        return res.status(500).json({ error: "No valid audio stream found" });
      }

      res.status(200).json({
        title: data.title || "Unknown Title",
        thumbnail: data.thumbnail || null,
        streamUrl: encodeURIComponent(streamUrl)
      });

    } catch (ytErr) {
      if (ytErr.message && ytErr.message.startsWith("YOUTUBE_SIGNIN_REQUIRED")) {
        return res.status(400).json({ error: "Cookie/Auth required", details: ytErr.message });
      }
      res.status(500).json({ error: "Error extracting media", details: ytErr.message || String(ytErr) });
    } finally {
      try { await fs.promises.unlink(tempCookiePath); } catch (e) {}
    }

  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
}


function handleSongStream(req, res, songUrlParam) {
  try {
    const songUrl = songUrlParam || req.query.songUrl || req.body.songUrl;
    if (!songUrl) return res.status(400).send("URL missing");

    const ytdlp = spawn("yt-dlp", ["-f", "bestaudio", "-o", "-", songUrl]);
    const ffmpeg = spawn("ffmpeg", ["-i", "pipe:0", "-f", "mp3", "-ab", "192k", "-vn", "pipe:1"]);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");

    ytdlp.stdout.pipe(ffmpeg.stdin);
    ffmpeg.stdout.pipe(res);

    ytdlp.stderr.on("data", (data) => console.error("yt-dlp error:", data.toString()));
    ffmpeg.stderr.on("data", (data) => console.error("ffmpeg error:", data.toString()));

    ytdlp.on("error", (err) => {
      console.error("yt-dlp process error:", err);
      res.end();
    });

    ffmpeg.on("error", (err) => {
      console.error("ffmpeg process error:", err);
      res.end();
    });

  } catch (err) {
    console.error("handleSongStream error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

module.exports = { handleSongSearch, handleSongStream };
