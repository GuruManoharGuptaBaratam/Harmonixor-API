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
      "--disable-gpu",
      "--disable-features=IsolateOrigins",
      "--disable-site-isolation-trials"
    ]
  });

  const cookies = parseNetscapeCookies(cookieFilePath);

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
  });

  await context.addCookies(cookies);

  const page = await context.newPage();

  let playerResponse = null;


  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/youtubei/") && url.includes("player")) {
      try {
        const data = await res.json();
        if (data?.streamingData) {
          playerResponse = data;
        }
      } catch {}
    }
  });

  await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  // Trigger playback to force /player
  try {
    await page.click("button.ytp-play-button", { timeout: 1500 });
  } catch {}

  await page.waitForTimeout(3500);

  // Fallback 1
  if (!playerResponse) {
    const initial = await page.evaluate(() => window.ytInitialPlayerResponse || null);
    if (initial?.streamingData) playerResponse = initial;
  }

  // Fallback 2
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

  if (!playerResponse) throw new Error("Player response missing");

  const formats = playerResponse.streamingData?.adaptiveFormats;
  if (!formats) throw new Error("Formats missing");

  const audio = formats.find((f) => f.mimeType?.startsWith("audio"));
  if (!audio?.url) throw new Error("No audio URL");

  return audio.url;
}

module.exports = extractYouTubeAudioURL;
