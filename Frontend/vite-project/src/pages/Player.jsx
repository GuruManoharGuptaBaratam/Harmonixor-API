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
  const [anticipatingPageAction, setAnticipatingPageAction] = useState("");


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
    if (currentPage >= 4 || anticipatingPageAction) return;

    setAnticipatingPageAction("next");

    window.setTimeout(() => {
      fetchPage(currentPage + 1);
      setAnticipatingPageAction("");
    }, 120);
  };
  const handlePrev = () => {
    if (currentPage <= 1 || anticipatingPageAction) return;

    setAnticipatingPageAction("prev");

    window.setTimeout(() => {
      fetchPage(currentPage - 1);
      setAnticipatingPageAction("");
    }, 120);
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
  const languageDistribution = {
    Telugu: 0,
    Tamil: 0,
    Hindi: 0
  };

  filteredResults.forEach((song) => {
    const langRaw = song.language || song.genre || "Hindi";
    const lang = langRaw.charAt(0).toUpperCase() + langRaw.slice(1).toLowerCase();
    
    if (languageDistribution[lang] !== undefined) {
      languageDistribution[lang] += 1;
    } else {
      languageDistribution[lang] = 1;
    }
  });

  const maxLangCount = Math.max(...Object.values(languageDistribution), 1);

  return (
    <div className="player-container">
      <div className="player-wrapper-vertical">

        {/* TOP CARD: Search */}
        <div className="ref-card top-card">
          <h1 className="ref-title">Search Songs</h1>
          <p className="ref-subtitle">Search any track and start listening instantly.</p>
          
          <div className="ref-search-pill">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="Song name..."
              className="ref-input-pill"
              value={songQuery}
              onChange={(e) => setSongQuery(e.target.value)}
            />
            <div className="divider"></div>
            <input
              type="text"
              placeholder="API Key..."
              className="ref-input-pill"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              className={`ref-btn-pill ${isButtonLoading ? "loading" : ""}`}
              onClick={handleSongSearch}
              disabled={isButtonLoading}
            >
              {isButtonLoading ? "Loading..." : "Get Started"}
            </button>
          </div>
          
          <div className="status-messages">
            <div className="loading-msg">{loadingState}</div>
            {searchError && <div className="error-msg">Failed to fetch Music ID</div>}
            {streamError && <div className="error-msg">Failed to fetch Audio Stream</div>}
          </div>
        </div>

        {/* MIDDLE CARD: Filters & Pagination */}
        <div className="ref-card middle-card">
          <div className="filters-left">
             <button className="ref-tag" onClick={handlePrev} disabled={currentPage === 1 || Boolean(anticipatingPageAction)}>Previous</button>
             <button className="ref-tag" onClick={handleNext} disabled={Boolean(anticipatingPageAction)}>Next</button>
          </div>
          <div className="filters-right">
             <input
                type="text"
                placeholder="Title..."
                className="ref-input-dropdown"
                value={searchQuery}
                onChange={(e) => handleSearchFilter(e.target.value)}
              />
              <span className="results-count">{filteredResults.length} results</span>
          </div>
        </div>

        {/* BOTTOM CARD: Content & Player */}
        <div className="ref-card bottom-card">
          <div className="bottom-card-content-split">
            
            <div className="bottom-left-panel">
              <h3 className="ref-section-title">Demo Songs</h3>
              <div className={`ref-results-list ${anticipatingPageAction ? `page-anticipating-${anticipatingPageAction}` : ""}`}>
                {filteredResults.length === 0 ? (
                  <p className="no-results">No results found</p>
                ) : (
                  filteredResults.map((item, index) => (
                    <div key={index} className="ref-song-item">
                      <div className="song-info-stack">
                         <span className="song-title">{item.title}</span>
                         <span className="song-artist">{item.artist}</span>
                      </div>
                      <div className="song-play-icon">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bottom-right-panel">
              <div className="distribution-header">
                <h3 className="ref-section-title">Song Distribution</h3>
                <span className="distribution-subtitle">by language</span>
              </div>
              <div className="distribution-list">
                {Object.entries(languageDistribution).map(([lang, count], index) => (
                   <div key={index} className="dist-row">
                      <span className="dist-label">{lang}</span>
                      <div className="dist-bar-wrapper">
                         <div className="dist-bar-fill" style={{ width: `${(count / maxLangCount) * 100}%` }}></div>
                      </div>
                      <span className="dist-count">{count}</span>
                   </div>
                ))}
              </div>
            </div>

          </div>

          {/* Player Bottom Bar */}
          <div className="ref-player-bar">
             <div className="player-left">
                <div className={`player-icon ${audioUrl ? 'is-playing' : ''}`}>
                  <svg
                    className="cover-svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <rect x="5" y="7" width="3" height="10" rx="1" fill="#000" />
                    <rect x="10.5" y="4" width="3" height="16" rx="1" fill="#000" />
                    <rect x="16" y="8" width="3" height="8" rx="1" fill="#000" />
                  </svg>
                </div>
                <div className="player-info">
                   <h4 className="player-now-playing">Now Playing</h4>
                   <p className="player-song-status">{audioUrl ? songQuery || "Song Loaded" : "Select a song to start"}</p>
                </div>
             </div>
             
             <div className="player-center-right">
               {audioUrl ? (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  className="native-audio"
                  controls
                />
               ) : (
                 <div className="audio-placeholder">
                    <span>No audio loaded</span>
                 </div>
               )}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
