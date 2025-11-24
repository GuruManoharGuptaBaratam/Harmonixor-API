const { spawn } = require("child_process");

async function searchVideoId(query) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn("yt-dlp", [
      `ytsearch1:${query}`,
      "--skip-download",
      "--dump-json",
    ]);

    let data = "";

    ytdlp.stdout.on("data", (chunk) => (data += chunk));
    ytdlp.stderr.on("data", (err) => console.log("Search Error:", err.toString()));

    ytdlp.on("close", () => {
      try {
        const json = JSON.parse(data);
        resolve(json.id);
      } catch (err) {
        reject("Failed to search YouTube");
      }
    });
  });
}

module.exports = searchVideoId;
