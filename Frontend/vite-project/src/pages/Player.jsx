import React, { useState, useRef } from "react";
import "./Player.css";

export default function Player() {
  const [songQuery, setSongQuery] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState([]);

  const [audioUrl, setAudioUrl] = useState("");
  // const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);

  const [loadingState, setLoadingState] = useState("");
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  // error flags
  const [searchError, setSearchError] = useState(false);
  const [streamError, setStreamError] = useState(false);

  const handleSongSearch = async () => {
    if (!songQuery || !apiKey) {
      alert("Enter both Song Name and API Key");
      return;
    }



    setLoadingState("Searching for music ID...");
    setIsButtonLoading(true);
    setSearchError(false);
    setStreamError(false);

    try {

      const searchRes = await fetch(
        `https://harmonixor-api-r.onrender.com/harmonixor/songs/search?KEY=${apiKey}&Song_name=${songQuery}`
      );



      if (!searchRes.ok) {

        setSearchError(true);
        setLoadingState("Error: Unable to fetch Music ID");
        setIsButtonLoading(false);
        return;
      }

      const searchData = await searchRes.json();


      if (!searchData || !searchData.videoId) {

        setSearchError(true);
        setLoadingState("Failed to load song");
        setIsButtonLoading(false);
        return;
      }

      const videoID = searchData.videoId;


      setLoadingState("Music ID found ");


      const streamRes = await fetch(
        `https://harmonixor-api-r.onrender.com/harmonixor/songs/stream?KEY=${apiKey}&Song_url=${videoID}`
      );



      if (!streamRes.ok) {

        setStreamError(true);
        setLoadingState("Error: Unable to load stream URL");
        setIsButtonLoading(false);
        return;
      }

      const streamData = await streamRes.json();


      if (!streamData || !streamData.videoUrl) {

        setStreamError(true);
        setLoadingState("Failed to load song");
        setIsButtonLoading(false);
        return;
      }

      setAudioUrl(streamData.videoUrl);


      setLoadingState("Audio is loading...");

      setTimeout(() => {
        if (audioRef.current) {

          audioRef.current.play();
          // setIsPlaying(true);

          setLoadingState("Song is playing ");
          setIsButtonLoading(false);
        } else {
          console.log("⚠ audioRef.current is null");
        }
      }, 400);

    } catch (err) {
      console.error(err);
      setLoadingState("Failed to load song");
      setIsButtonLoading(false);
      setSearchError(true);
    }
  };

  // const togglePlayback = () => {
  //   console.log("🎛 Toggle Playback Clicked");
  //   if (!audioRef.current) {
  //     console.log("⚠ No audioRef found");
  //     return;
  //   }

  //   if (isPlaying) {
  //     console.log("⏸ Pausing audio");
  //     audioRef.current.pause();
  //     setIsPlaying(false);
  //   } else {
  //     console.log("▶ Playing audio");
  //     audioRef.current.play();
  //     setIsPlaying(true);
  //   }
  // };

  const fetchPage = (page) => {


    fetch(`/api/music/demo?page=${page}`)
      .then(() => {

        setCurrentPage(page);
        setResults([`Song result from page ${page}`]);
      })
      .catch((err) => {
        console.error( err);
      });
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

          <button
            className={`player-button ${isButtonLoading ? "loading" : ""}`}
            onClick={handleSongSearch}
            disabled={isButtonLoading}
          >
            <span>{isButtonLoading ? "Loading..." : "Search & Play"}</span>
          </button>

          <div className="loading-msg">{loadingState}</div>

          {searchError && <div className="error-msg">Failed to fetch Music ID</div>}
          {streamError && <div className="error-msg">Failed to fetch Audio Stream</div>}

          <div className="cover-box">
            <div className="cover-image-area">
              <svg
                className="cover-svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
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
            <h3 className="song-name">{audioUrl ? `{${songQuery}}` : "{Song Name Will Appear Here}"}</h3>
          </div>

          {/* <div className="controls-box">
            <button className="control-btn">⏮</button>

            <button className="control-btn" onClick={togglePlayback}>
              {isPlaying ? "⏸" : "▶"}
            </button>

            <button className="control-btn">⏭</button>
          </div> */}

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
