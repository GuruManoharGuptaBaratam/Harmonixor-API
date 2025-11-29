const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");


const PAGE_SIZE = 5;

router.get("/demo-songs", (req, res) => {
  const page = parseInt(req.query.page) || 1;


  const filePath = path.join(__dirname, "../../demo_songs/songs.json");
  const songs = JSON.parse(fs.readFileSync(filePath, "utf8"));


  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  const paginatedSongs = songs.slice(start, end);

  res.json({
    page,
    totalPages: Math.ceil(songs.length / PAGE_SIZE),
    songs: paginatedSongs
  });
});

module.exports = router;
