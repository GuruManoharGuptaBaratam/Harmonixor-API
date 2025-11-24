const { chromium } = require("playwright");
const fs = require("fs");
const { parseNetscapeCookies } = require("./cookieParser");

async function extractYouTubeAudioURL(videoId, cookieFilePath) {
  // FIX 1: Load actual cookie text properly
  if (!fs.existsSync(cookieFilePath)) {
    throw new Error("Cookie file does not exist: " + cookieFilePath);
  }

  const cookieText = fs.readFileSync(cookieFilePath, "utf8");
  const cookies = parseNetscapeCookies(cookieText);

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });

  const context = await browser.newContext({
    // FIX 2: Force desktop environment
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    locale: "en-US"
  });

  // FIX 3: Force desktop layout (block miniplayer)
  await context.addInitScript(() => {
    Object.defineProperty(window, "matchMedia", {
      value: () => ({ matches: false })
    });
    Object.defineProperty(navigator, "platform", {
      get: () => "Win32"
    });
  });

  // FIX 4: Add cookies BEFORE creating pages
  if (cookies.length) await context.addCookies(cookies);

  const page = await context.newPage();
  let playerResponse = null;

  // Capture player JSON
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/youtubei/") && url.includes("player")) {
      try {
        const json = await res.json();
        if (json.streamingData) playerResponse = json;
      } catch {}
    }
  });

  // FIX 5: Force full desktop player
  await page.goto(
    `https://www.youtube.com/watch?v=${videoId}&disable_polymer=true&bpctr=9999999999`,
    { waitUntil: "networkidle", timeout: 45000 }
  );

  // Uncomment for debugging
  // console.log((await page.content()).slice(0, 600));

  // Trigger playback
  try { await page.click("button.ytp-play-button"); } catch {}

  await page.waitForTimeout(3000);

  // Fallback 1
  if (!playerResponse) {
    const init = await page.evaluate(() => window.ytInitialPlayerResponse || null);
    if (init?.streamingData) playerResponse = init;
  }

  // Fallback 2
  if (!playerResponse) {
    const cfg = await page.evaluate(() => {
      try {
        return window.ytplayer?.config?.args?.player_response
          ? JSON.parse(window.ytplayer.config.args.player_response)
          : null;
      } catch { return null; }
    });
    if (cfg?.streamingData) playerResponse = cfg;
  }

  await browser.close();

  if (!playerResponse)
    throw new Error("Player response missing");

  const formats = playerResponse.streamingData?.adaptiveFormats;
  if (!formats) throw new Error("Formats missing");

  const audio = formats.find((f) => f.mimeType?.startsWith("audio"));
  if (!audio?.url)
    throw new Error("No audio URL found");

  return audio.url;
}

module.exports = extractYouTubeAudioURL;
