const { chromium } = require("playwright");

async function extractYouTubeAudioURL(videoId) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-features=IsolateOrigins",
      "--disable-site-isolation-trials"
    ]
  });

  const page = await browser.newPage();

  let playerResponse = null;

  page.on("response", async (res) => {
    try {
      const url = res.url();

      // Capture ANY version of YouTube player API
      if (url.includes("/youtubei/") && url.includes("player")) {
        const json = await res.json();

        // Ensure we capture the FIRST valid player response
        if (json.streamingData) {
          playerResponse = json;
        }
      }
    } catch (err) {
      console.log("Player API parse failed");
    }
  });

  // Force normal watch page
  await page.goto(`https://www.youtube.com/watch?v=${videoId}&bpctr=9999999999`, {
    waitUntil: "domcontentloaded"
  });

  // Trigger playback to force player API call (SABR workaround)
  try {
    await page.click("button.ytp-play-button", { timeout: 2000 });
  } catch (_) {}

  // Wait long enough for all player APIs to fire
  await page.waitForTimeout(4000);

  await browser.close();

  if (!playerResponse || !playerResponse.streamingData) {
    throw new Error("Player response missing");
  }

  const formats = playerResponse.streamingData.adaptiveFormats;
  if (!formats || formats.length === 0) {
    throw new Error("adaptiveFormats empty");
  }

  const audioFormat = formats.find(f => f.mimeType?.startsWith("audio"));
  if (!audioFormat?.url) {
    throw new Error("Failed to extract audio URL");
  }

  return audioFormat.url;
}

module.exports = extractYouTubeAudioURL;
