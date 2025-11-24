const { chromium } = require("playwright");
const fs = require("fs");
const { parseNetscapeCookies } = require("./cookieParser");

async function extractYouTubeAudioURL(videoId, cookieFilePath) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });

  const cookies = parseNetscapeCookies(fs.readFileSync(cookieFilePath, "utf8"));

  // FORCE desktop player fully
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "America/New_York",
  });

  // Force disable mobile/miniplayer detection
  await context.addInitScript(() => {
    Object.defineProperty(window, "matchMedia", {
      value: () => ({ matches: false })
    });
    Object.defineProperty(navigator, "platform", {
      get: () => "Win32"
    });
  });

  await context.addCookies(cookies);

  const page = await context.newPage();

  let playerResponse = null;

  // Catch the FULL player JSON
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/youtubei/") && url.includes("player")) {
      try {
        const json = await res.json();
        if (json.streamingData) {
          playerResponse = json;
        }
      } catch {}
    }
  });

  // Force FULL desktop player load
  await page.goto(
    `https://www.youtube.com/watch?v=${videoId}&disable_polymer=true&bpctr=9999999999`,
    { waitUntil: "networkidle", timeout: 45000 }
  );

  console.log((await page.content()).slice(0, 600)); // DEBUG

  // Click play to force streamingData load
  try {
    await page.click("button.ytp-play-button", { timeout: 2000 });
  } catch {}

  await page.waitForTimeout(3000);

  // fallback 1 — from window object
  if (!playerResponse) {
    const initial = await page.evaluate(() => window.ytInitialPlayerResponse || null);
    if (initial?.streamingData) playerResponse = initial;
  }

  // fallback 2 — from ytplayer.config
  if (!playerResponse) {
    const cfg = await page.evaluate(() => {
      try {
        return window.ytplayer?.config?.args?.player_response
          ? JSON.parse(window.ytplayer.config.args.player_response)
          : null;
      } catch {
        return null;
      }
    });
    if (cfg?.streamingData) playerResponse = cfg;
  }

  await browser.close();

  if (!playerResponse)
    throw new Error("Player response missing");

  const formats = playerResponse.streamingData.adaptiveFormats;
  if (!formats) throw new Error("Formats missing");

  const audio = formats.find((f) => f.mimeType?.startsWith("audio"));
  if (!audio?.url) {
    throw new Error("No audio URL");
  }

  return audio.url;
}

module.exports = extractYouTubeAudioURL;
