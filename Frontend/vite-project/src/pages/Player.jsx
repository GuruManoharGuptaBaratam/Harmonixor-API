import React, { useState } from "react";
import "./Player.css";

export default function Player() {
  const [songQuery, setSongQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState([]);

  const handleSongSearch = () => {

    console.log("Searching music:", songQuery);
    fetch(`/api/player/search?song=${songQuery}`)
      .then(() => alert("Triggered dummy player search route"))
      .catch(() => {});
  };

  const fetchPage = (page) => {
    console.log("Fetching page:", page);


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


          <input
            type="text"
            placeholder="Search song..."
            className="player-input"
            value={songQuery}
            onChange={(e) => setSongQuery(e.target.value)}
          />

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
            <rect x="3"  y="7"  width="2" height="10" rx="0.3" fill="#fff" opacity="0.95" />
            <rect x="8"  y="5"  width="2" height="14" rx="0.3" fill="#fff" opacity="0.95" />
            <rect x="13" y="9"  width="2" height="6"  rx="0.3" fill="#fff" opacity="0.95" />
            <rect x="18" y="3"  width="2" height="18" rx="0.3" fill="#fff" opacity="0.95" />
            </svg>

            <div className="no-song-text">No song is playing</div>
        </div>
        </div>



          <div className="song-name-box">
            <h3 className="song-name">Song Name Will Appear Here</h3>
          </div>


          <div className="controls-box">
            <button className="control-btn">⏮</button>
            <button className="control-btn">▶</button>
            <button className="control-btn">⏭</button>
          </div>
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
