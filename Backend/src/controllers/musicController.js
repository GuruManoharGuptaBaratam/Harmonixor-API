const { exec, spawn } = require("child_process");

async function handleSongSearch(req, res, songNameParam) {
 const songName = songNameParam || req.query.song || req.body.songName;
  if (!songName || typeof songName !== "string") {
    return res.status(400).json({ error: "Invalid song name" });
  }

  const command = `yt-dlp -f "bestaudio[ext=m4a]/bestaudio" --default-search "ytsearch" --get-title --get-thumbnail --get-url --sponsorblock-remove all "${songName} lyrical"`;

  exec(command, (error, stdout, stderr) => {
    if (error || !stdout) {
      console.error("yt-dlp error:", error || stderr);
      return res.status(500).json({ error: "Error extracting media" } , error);
    }

    const lines = stdout.trim().split("\n");
    const title = lines[0];
    const songUrl = lines[1];
    const thumbnail = lines[2];

    const streamUrl = `${encodeURIComponent(songUrl)}`;

    res.status(200).json({ title, thumbnail, streamUrl });
  });
}

function handleSongStream(req, res, songUrlParam) {
 const songUrl = songUrlParam || req.query.songUrl || req.body.songUrl;

  if (!songUrl) return res.status(400).send("URL missing");

  const ytdlp = spawn("yt-dlp", ["-f", "bestaudio", "-o", "-", songUrl]);
  const ffmpeg = spawn("ffmpeg", ["-i", "pipe:0", "-f", "mp3", "-ab", "192k", "-vn", "pipe:1"]);

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Transfer-Encoding", "chunked");

  ytdlp.stdout.pipe(ffmpeg.stdin);
  ffmpeg.stdout.pipe(res);

  ytdlp.stderr.on("data", (data) => console.error("yt-dlp error:", data.toString()));
  ffmpeg.stderr.on("data", (data) => console.error("ffmpeg error:", data.toString()));
}

module.exports = { handleSongSearch, handleSongStream };
