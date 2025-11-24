const { chromium } = require("playwright");

async function extractYouTubeAudioURL(videoId) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-features=IsolateOrigins",
      "--disable-site-isolation-trials",
      "--disable-web-security"
    ]
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
  });

  const page = await context.newPage();

  let playerResponse = null;


  page.on("response", async (res) => {
    const url = res.url();

    if (
      url.includes("/youtubei/") &&
      url.includes("player") &&
      !url.includes("adformat")
    ) {
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
  const html = await page.content();
  console.log(html.slice(0, 500));



  try {
    await page.click("button.ytp-play-button", { timeout: 1500 });
  } catch {}


  await page.waitForTimeout(3500);


  if (!playerResponse) {
    try {
      const initial = await page.evaluate(() => {
        return window.ytInitialPlayerResponse || null;
      });

      if (initial?.streamingData) {
        playerResponse = initial;
      }
    } catch {}
  }


  if (!playerResponse) {
    try {
      const cfg = await page.evaluate(() => {
        if (
          window.ytplayer &&
          window.ytplayer.config &&
          window.ytplayer.config.args &&
          window.ytplayer.config.args.player_response
        ) {
          return JSON.parse(window.ytplayer.config.args.player_response);
        }
        return null;
      });

      if (cfg?.streamingData) {
        playerResponse = cfg;
      }
    } catch {}
  }

  await browser.close();


  if (!playerResponse) {
    throw new Error("Player response missing");
  }

  const formats = playerResponse.streamingData?.adaptiveFormats;
  if (!formats || !formats.length) {
    throw new Error("adaptiveFormats missing");
  }


  const audio = formats.find((f) => f.mimeType?.startsWith("audio"));
  if (!audio?.url) {
    throw new Error("No direct audio URL");
  }

  return audio.url;
}

module.exports = extractYouTubeAudioURL;
