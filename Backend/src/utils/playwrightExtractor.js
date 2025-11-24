const { chromium } = require("playwright");

async function searchVideoIdPlaywright(query) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer"
    ]
  });

  const page = await browser.newPage();

  await page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`, {
    waitUntil: "networkidle"
  });

  // Extract ONLY real videos (exclude Shorts, Mixes, Playlists)
  const videoId = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll("script"));
    for (const s of scripts) {
      if (!s.innerText.includes("ytInitialData")) continue;

      const jsonText = s.innerText
        .replace("var ytInitialData = ", "")
        .replace(/;$/, "");
      const data = JSON.parse(jsonText);

      const contents =
        data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;

      if (!contents) return null;

      for (const item of contents) {
        const v = item.videoRenderer;


        if (
          v &&
          v.videoId &&
          !v.isShort &&
          !v.lengthText?.simpleText?.includes("Scheduled") &&
          v.lengthText // avoid live streams
        ) {
          return v.videoId;
        }
      }
    }
    return null;
  });

  await browser.close();

  if (!videoId) throw new Error("Could not find a valid video");
  return videoId;
}

module.exports = searchVideoIdPlaywright;
