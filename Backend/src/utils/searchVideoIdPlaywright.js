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
  await page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
    waitUntil: "networkidle",
  });

  // Extract first videoId from HTML
  const videoId = await page.evaluate(() => {
    const scripts = [...document.querySelectorAll("script")];
    for (const s of scripts) {
      if (s.innerText.includes("ytInitialData")) {
        const jsonText = s.innerText
          .replace("var ytInitialData = ", "")
          .replace(/;$/, "");
        const data = JSON.parse(jsonText);

        const items = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;

        if (!items) return null;

        for (const item of items) {
          const vid = item?.videoRenderer?.videoId;
          if (vid) return vid;
        }
      }
    }
    return null;
  });

  await browser.close();

  if (!videoId) throw new Error("Failed to extract videoId");
  return videoId;
}

module.exports = searchVideoIdPlaywright;

