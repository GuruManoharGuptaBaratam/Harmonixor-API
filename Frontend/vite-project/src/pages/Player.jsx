import React, { useState, useRef , useEffect} from "react";
import "./Player.css";

export default function Player() {
  const [songQuery, setSongQuery] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState([]);

  const [audioUrl, setAudioUrl] = useState("");


  const audioRef = useRef(null);

  const [loadingState, setLoadingState] = useState("");
  const [isButtonLoading, setIsButtonLoading] = useState(false);


  const [searchError, setSearchError] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [filteredResults, setFilteredResults] = useState([]);


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
        `${import.meta.env.VITE_API_URL}harmonixor/songs/search?KEY=${apiKey}&Song_name=${songQuery}`
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
        `${import.meta.env.VITE_API_URL}harmonixor/songs/stream?KEY=${apiKey}&Song_url=${videoID}`
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



const fetchPage = async (page) => {
  try {

    const res = await fetch(`${import.meta.env.VITE_API_URL}harmonixor/api/demo-songs?page=${page}`);
    const data = await res.json();

    setCurrentPage(page);
    setResults(data.songs); 
    setFilteredResults(data.songs);  
  } catch (err) {
    console.error( err);
  }
};
  useEffect(() => {
    fetchPage(1);
  }, []);


  const handleNext = () => {
    if (currentPage < 4) {
      fetchPage(currentPage + 1);
    }
  };
  const handlePrev = () => {
    if (currentPage > 1) {
      fetchPage(currentPage - 1);
    }
  };

  const handleSearchFilter = (value) => {
  setSearchQuery(value);

  if (!value.trim()) {
    setFilteredResults(results);
    return;
  }

  const filtered = results.filter(song =>
    song.title.toLowerCase().includes(value.toLowerCase()) ||
    song.artist.toLowerCase().includes(value.toLowerCase())
  );

  setFilteredResults(filtered);

  
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
          <h2 className="player-title">Test Bench</h2>

          <input
            type="text"
            placeholder="Search demo music..."
            className="player-input"
            value={searchQuery}
            onChange={(e) => handleSearchFilter(e.target.value)}
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
           
          {filteredResults.length === 0 ? (
            <p className="no-results">No results found</p>
          ) : (
            filteredResults.map((item, index) => (
              <div key={index} className="song-vertical-card">

                <div className="accent-strip"></div>

                <div className="song-thumbnail">
                  <svg
                    className="thumb-svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  >
                    <path d="M3 12h2"></path>
                    <path d="M7 10h2"></path>
                    <path d="M11 14h2"></path>
                    <path d="M15 8h2"></path>
                    <path d="M19 12h2"></path>
                  </svg>
                </div>

                <div className="song-info">
                  <div className="song-title">{item.title}</div>
                  <div className="song-artist">{item.artist}</div>
                </div>

              </div>
            ))
          )}

             
        </div>
        
        </div>

      </div>
    </div>
  );
}
