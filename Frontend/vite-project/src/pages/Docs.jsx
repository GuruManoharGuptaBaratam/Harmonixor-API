import React from "react";
import "./Docs.css";

const Docs = () => {
  return (
    <div className="docs-wrapper">
      <div className="docs-capsule">

        <aside className="docs-sidebar">
          <ul>
            <li><a href="#intro">▸ Introduction</a></li>
            <li><a href="#usage">▸ Authentication</a></li>
            <li><a href="#routes">▸ API Routes</a></li>
            <li><a href="#examples">▸ Examples</a></li>
            <li><a href="#player">▸ Player Usage</a></li>
            <li><a href="#cookies">▸ Cookie Setup & Dashboard</a></li>
            <li><a href="#security">▸ Security & Reliability</a></li>
            <li><a href="#download">▸ Download MP3 (Demo)</a></li>
            <li><a href="#extension">▸ Chrome Extension Usage</a></li>
            <li><a href="#faq">▸ FAQs</a></li>
          </ul>
        </aside>

        <main className="docs-content">

          {/* INTRO */}
          <section id="intro">
            <h1 className="title_docs">Harmonixor API Documentation</h1>
            <p>
              The <strong>Harmonixor API</strong> lets developers easily <strong>search</strong> songs and securely
              <strong>stream</strong> audio using YouTube-based IDs.  
              This API powers the <strong>Harmonixor Player</strong> and can be integrated into any app requiring
              audio playback or dynamic song fetching.
            </p>
          </section>

          {/* AUTH */}
          <section id="usage">
            <h2>Authentication</h2>
            <p>
              All endpoints require an <strong>API key</strong>.  
              Retrieve yours from the <code>Profile</code> page after logging in.
            </p>

            <p>Send the key like this:</p>
            <pre className="code">{`GET /songs/search?KEY=YOUR_API_KEY&Song_name=Hello`}</pre>

            <p>Or via headers:</p>
            <pre className="code">{`Authorization: Bearer YOUR_API_KEY`}</pre>
          </section>

          {/* ROUTES */}
          <section id="routes">
            <h2>API Routes</h2>

            <h3>1. Search Songs</h3>
            <p>
              Searches for a song on YouTube and returns a <strong>title</strong>,
              <strong>thumbnail</strong>, and a <strong>videoId</strong>.  
              Use this <strong>videoId</strong> in the streaming route.
            </p>
            <pre className="code">{`GET /songs/search?KEY=YOUR_API_KEY&Song_name={song_name}`}</pre>

            <h3>2. Stream Songs</h3>
            <p>
              Use the <code>videoId</code> obtained from the search route to request a playable audio URL.  
              <strong>IMPORTANT:</strong> You must now provide <code>videoId</code> instead of a raw Song_url.
            </p>
            <pre className="code">{`GET /songs/stream?KEY=YOUR_API_KEY&Song_url={videoId}`}</pre>
          </section>

          {/* EXAMPLES */}
          <section id="examples">
            <h2>Examples</h2>

            <p>Search for a song:</p>
            <pre className="code">{`curl -X GET "https://harmonixor-api-1.onrender.com/harmonixor/songs/search?KEY=YOUR_API_KEY&Song_name=Shape of You"`}</pre>

            <p>Sample response:</p>
            <pre className="code">{`{
  "title": "Shape of You",
  "thumbnail": "https://img.example.com/...jpg",
  "videoId": "4Bsc2uI_LsM"
}`}</pre>

            <p>Use the returned <code>videoId</code> to fetch the audio stream:</p>
            <pre className="code">{`curl -X GET "https://harmonixor-api-1.onrender.com/harmonixor/songs/stream?KEY=YOUR_API_KEY&Song_url=4Bsc2uI_LsM"`}</pre>
          </section>

          {/* PLAYER SECTION (NEW) */}
          <section id="player">
            <h2>Player Usage</h2>
            <p>
              The Harmonixor Player (available inside your dashboard) allows you to
              <strong> test </strong> any song using a direct integration with the API.
            </p>

            <h3>How it works:</h3>
            <ol>
              <li>
                Enter a song name in the <strong>Song Search</strong> field inside the Player.
              </li>
              <li>
                The player calls:  
                <pre className="code">{`/songs/search?KEY=API_KEY&Song_name={your_song}`}</pre>
              </li>
              <li>
                The response contains a <strong>videoId</strong>.  
                This ID is automatically used for streaming:
                <pre className="code">{`/songs/stream?KEY=API_KEY&Song_url={videoId}`}</pre>
              </li>
              <li>
                Once the audio URL is returned, the player:
                <ul>
                  <li>Displays the song name</li>
                  <li>Shows animated visual thumbnail</li>
                  <li>Loads the audio</li>
                  <li>Starts playback automatically</li>
                </ul>
              </li>
            </ol>

            <h3>Testing Demo Songs</h3>
            <p>
              In the <strong>Test Bench</strong> section of the player, you can browse paginated demo tracks.  
              Selecting a demo track shows its details and allows you to manually copy the title.
            </p>

            <h3>Error Handling</h3>
            <ul>
              <li><strong>music ID not found</strong> → “No videoId found”</li>
              <li><strong>stream error</strong> → “Failed to load song”</li>
              <li><strong>automatic button animation</strong> indicates loading state</li>
            </ul>
          </section>

          {/* COOKIES */}
          <section id="cookies">
            <h2>Cookie Setup & Dashboard</h2>
            <p>
              Some YouTube streaming requests require browser cookies.  
              The API supports uploading your <code>cookies.txt</code> file to improve reliability.
            </p>

            <h3>Step 1 — Download the extension</h3>
            <p>
              Install the <a href="" target="_blank" rel="noreferrer">HarmoSync Extension</a>.
            </p>

            <h3>Step 2 — Export your cookies</h3>
            <p>Use the extension to export cookies from YouTube or your music site.</p>

            <h3>Step 3 — Upload in dashboard</h3>
            <p>
              Upload <code>cookies.txt</code> inside the Dashboard → Cookie Manager.
            </p>
          </section>

          {/* SECURITY */}
          <section id="security">
            <h2>Security & Reliability Features</h2>
            <p>
              The Harmonixor API includes several stability mechanisms:
            </p>
            <ul>
              <li><strong>Automatic Retries</strong> for intermittent failures</li>
              <li><strong>Safe Headers</strong> to reduce YouTube blocking</li>
              <li><strong>1000 req/day</strong> rate limit per key</li>
            </ul>
          </section>

          {/* DOWNLOAD */}
          <section id="download">
            <h2>Download MP3 (Demo)</h2>
            <p>
              ⚠️ Officially the API is <strong>stream-only</strong>.  
              The following script is a <strong>demo</strong> showing how you could download an MP3 from an audio stream URL.
            </p>

            <pre className="code">{`async function downloadSong() {
  const apiKey = "YOUR_API_KEY";
  const videoId = "4Bsc2uI_LsM"; // from search route

  const response = await fetch(
    \`https://harmonixor-api-1.onrender.com/harmonixor/songs/stream?KEY=\${apiKey}&Song_url=\${videoId}\`
  );

  if (!response.ok) throw new Error("Failed to fetch stream");

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "song.mp3";
  document.body.appendChild(a);
  a.click();
  a.remove();
}`}</pre>

          </section>

          {/* EXTENSION */}
          <section id="extension">
            <h1>Chrome Extension Usage</h1>
            <p>
              Use the HarmoSync extension to export cookies and automate streaming authentication.
            </p>

            <h2>Step 1 — Download the ZIP</h2>
            <p>
              <a href="../extensionFile/HarmoSync.zip" download>Download HarmoSync Extension</a>
            </p>

            <h2>Step 2 — Load as Unpacked</h2>
            <p>
              <p>1. Open <code>chrome://extensions/</code></p>
              <p>2. Enable <strong>Developer mode</strong></p>
              <p>3. Click <strong>Load unpacked</strong> and select the extracted folder</p>
            </p>

            <img src="../assets/Load_unpack_demo.png" alt="Load Unpacked Example" />

            <h2>Step 3 — Automatic Cookie Extraction</h2>
            <p>
              <p>1. Visit the music site</p>
              <p>2. Click the extension icon</p>
              <p>3. Enable <strong>Automate Extraction</strong></p>
            </p>

            <img src="../assets/Success_extension_demo.png" alt="Success" />
          </section>

          {/* FAQ */}
          <section id="faq">
            <h2>FAQs</h2>

            <p><strong>Q:</strong> Do I need an API key?<br/>
            <strong>A:</strong> Yes, all endpoints require an API key.</p>

            <p><strong>Q:</strong> Can I download songs?<br/>
            <strong>A:</strong> No. Streams only.</p>

            <p><strong>Q:</strong> What are the rate limits?<br/>
            <strong>A:</strong> 1000 requests/day</p>

            <p><strong>Q:</strong> Is it free?<br/>
            <strong>A:</strong> Yes, under Fair Use Policy.</p>
          </section>

        </main>
      </div>
    </div>
  );
};

export default Docs;
