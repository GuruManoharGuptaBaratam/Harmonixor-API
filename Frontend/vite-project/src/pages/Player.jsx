import React, { useState, useRef } from "react";
import "./Player.css";

export default function Player() {
  const [songQuery, setSongQuery] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState([]);

  const [audioUrl, setAudioUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);



  const handleSongSearch = async () => {
    if (!songQuery || !apiKey) {
      alert("Enter both Song Name and API Key");
      return;
    }

    try {

      const searchRes = await fetch(
        `https://harmonixor-api-r.onrender.com/harmonixor/songs/search?KEY=${apiKey}&Song_name=${songQuery}`
      );
      const searchData = await searchRes.json();

      if (!searchData || !searchData.videoId) {
        alert("No videoId found from search.");
        return;
      }

      const videoID = searchData.videoId;



      const streamRes = await fetch(
        `https://harmonixor-api-r.onrender.com/harmonixor/songs/stream?KEY=${apiKey}&Song_url=${videoID}`
      );
      const streamData = await streamRes.json();

      setAudioUrl(streamData.videoUrl);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 200);

    } catch (err) {
      console.error(err);
      alert("Something went wrong while fetching.");
    }
  };


  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };


  const fetchPage = (page) => {
    fetch(`/api/music/demo?page=${page}`)
      .then(() => {
        setCurrentPage(page);
        setResults([`Song result from page ${page}`]);
      })
      .catch(() => {});
  };

  const handleNext = () => fetchPage(currentPage + 1);
  const handlePrev = () => {
    if (currentPage > 1) fetchPage(currentPage - 1);
  };

  return (
    <div className="player-container">
      <div className="player-wrapper">


        <div className="player-box">
          <h2 className="player-title">Music Player</h2>


          <div className="api-row">
            <input
              type="text"
              placeholder="Song name..."
              className="player-input api-half"
              value={songQuery}
              onChange={(e) => setSongQuery(e.target.value)}
            />
            <input
              type="text"
              placeholder="API Key..."
              className="player-input api-half"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <button className="player-button" onClick={handleSongSearch}>
            Search & Play
          </button>


          <div className="cover-box">
            <div className="cover-image-area">
              <svg
                className="cover-svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <rect x="3" y="7" width="2" height="10" rx="0.3" fill="#fff" opacity="0.95" />
                <rect x="8" y="5" width="2" height="14" rx="0.3" fill="#fff" opacity="0.95" />
                <rect x="13" y="9" width="2" height="6" rx="0.3" fill="#fff" opacity="0.95" />
                <rect x="18" y="3" width="2" height="18" rx="0.3" fill="#fff" opacity="0.95" />
              </svg>

              {!audioUrl && <div className="no-song-text">No song is playing</div>}
              {audioUrl && <div className="no-song-text">Song Loaded</div>}
            </div>
          </div>


          <div className="song-name-box">
            <h3 className="song-name">{audioUrl ? songQuery : "{Song Name Will Appear Here}"}</h3>
          </div>


          <div className="controls-box">
            <button className="control-btn">⏮</button>

            <button className="control-btn" onClick={togglePlayback}>
              {isPlaying ? "⏸" : "▶"}
            </button>

            <button className="control-btn">⏭</button>
          </div>


          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              style={{ marginTop: "20px", width: "100%" }}
              controls
            />
          )}
        </div>


        <div className="player-box">
          <h2 className="player-title">Music Demo Search</h2>

          <input
            type="text"
            placeholder="Search demo music..."
            className="player-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="pagination-box">
            <button
              className="player-button small"
              onClick={handlePrev}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button className="player-button small" onClick={handleNext}>
              Next
            </button>
          </div>

          <div className="results-display">
            <h4>Current Page: {currentPage}</h4>
            {results.map((item, index) => (
              <p key={index}>{item}</p>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
