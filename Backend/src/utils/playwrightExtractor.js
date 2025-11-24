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
    const url = res.url();


    if (url.includes("youtubei") && url.includes("player")) {
      try {
        const json = await res.json();
        playerResponse = json;
      } catch (err) {
        console.log("Failed to parse player response");
      }
    }
  });


  await page.goto(`https://www.youtube.com/watch?v=${videoId}&bpctr=9999999999`, {
    waitUntil: "domcontentloaded"
  });

  try {
    await page.click("button.ytp-play-button", { timeout: 3000 });
  } catch (_) {}


  await page.waitForTimeout(3500);

  await browser.close();

  if (!playerResponse || !playerResponse.streamingData) {
    throw new Error("Player response missing");
  }

  const formats = playerResponse.streamingData.adaptiveFormats;
  if (!formats || formats.length === 0) {
    throw new Error("adaptiveFormats empty");
  }

  const audioFormat = formats.find((f) => f.mimeType?.startsWith("audio"));

  if (!audioFormat || !audioFormat.url) {
    throw new Error("Failed to extract audio URL");
  }

  return audioFormat.url;
}

module.exports = extractYouTubeAudioURL;
