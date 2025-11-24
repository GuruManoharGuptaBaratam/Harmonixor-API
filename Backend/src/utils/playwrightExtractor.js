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
        playerResponse = await res.json();
      } catch (err) {}
    }
  });

  await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
    waitUntil: "networkidle",
  });

  await page.waitForTimeout(1500);
  await browser.close();

  if (!playerResponse?.streamingData?.adaptiveFormats) {
    throw new Error("Failed to extract adaptive formats");
  }

  const audioFormat = playerResponse.streamingData.adaptiveFormats.find(
    (f) => f.mimeType?.startsWith("audio")
  );

  if (!audioFormat?.url) {
    throw new Error("Failed to extract audio URL");
  }

  return audioFormat.url;
}

module.exports = extractYouTubeAudioURL;
