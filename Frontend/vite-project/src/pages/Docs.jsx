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
            <li><a href="#cookies">▸ Cookie Setup & Dashboard</a></li>
            <li><a href="#security">▸ Security & Reliability</a></li>
            <li><a href="#download">▸ Download MP3 (Demo)</a></li>
            <li><a href="#extension">▸ Chrome Extension Usage</a></li>
            <li><a href="#faq">▸ FAQs</a></li>
          </ul>
        </aside>

        <main className="docs-content">
          <section id="intro">
            <h1 className="title_docs">Harmonixor API Documentation</h1>
            <p>
              The <strong>Harmonixor API</strong> provides developers with a simple and secure way
              to <strong>search</strong> for songs and <strong>stream</strong> them directly.  
              Designed to be lightweight yet powerful, it enables integration into apps, websites,
              or personal projects where music playback is required.
            </p>
          </section>

          <section id="usage">
            <h2>Authentication</h2>
            <p>
              All endpoints require an <strong>API key</strong>.  
              You can obtain your key from the <code>Profile</code> page after signing up.  
              Include the key either as:
            </p>

            <pre className="code">{`GET /songs/search?KEY=YOUR_API_KEY&Song_name=Hello`}</pre>

            <p>Or via headers:</p>
            <pre className="code">{`Authorization: Bearer YOUR_API_KEY`}</pre>
          </section>

          <section id="routes">
            <h2>API Routes</h2>

            <h3>1. Search Songs</h3>
            <p>
              Use this endpoint to search for songs by keyword.  
              Returns metadata like <strong>title</strong>, <strong>thumbnail</strong>, and a <strong>streamId</strong>.
            </p>
            <pre className="code">{`GET /songs/search?KEY=YOUR_API_KEY&Song_name={song_name}`}</pre>

            <h3>2. Stream Songs</h3>
            <p>
              Once you have the <code>streamId</code> from the search route,  
              call the stream endpoint to retrieve playable audio URLs.
            </p>
            <pre className="code">{`GET /songs/stream?KEY=YOUR_API_KEY&Song_url={streamId}`}</pre>
          </section>

          <section id="examples">
            <h2>Examples</h2>
            <p>Search for a song:</p>
            <pre className="code">{`curl -X GET "https://harmonixor-api-1.onrender.com/harmonixor/songs/search?KEY=YOUR_API_KEY&Song_name=Shape of You"`}</pre>

            <p>Sample response:</p>
            <pre className="code">{`{
              "title": "Shape of You",
              "thumbnail": "https://img.coverimage.com/...",
              "streamId": "abc123{rawID}"
            }`}</pre>

            <p>Fetch the stream:</p>
            <pre className="code">{`curl -X GET "https://harmonixor-api-1.onrender.com/songs/stream?KEY=YOUR_API_KEY&Song_url=abc123"`}</pre>
          </section>

          <section id="cookies">
            <h2>Cookie Setup & Dashboard</h2>
            <p>
              Some streaming requests require cookies for authentication.  
              To make this easy, we support uploading a <code>cookies.txt</code> file.
            </p>

            <h3>Step 1 — Download the extension</h3>
            <p>
              Install the <a href="" target="_blank" rel="noreferrer">HarmoSync Extension</a> browser extension.
            </p>
            <p>Read the Chrome extension <a href="#extension">docs</a></p>

            <h3>Step 2 — Export your cookies</h3>
            <p>
              Open the music site in your browser, click the extension icon, and export cookies.  
              This will download a file named <code>cookies.txt</code>.
            </p>

            <h3>Step 3 — Upload in dashboard</h3>
            <p>
              Go to the <strong>Dashboard</strong> in your Harmonixor account.  
              Upload the <code>cookies.txt</code> file under <strong>Cookie Manager</strong>.  
              Once uploaded, the API will use it automatically for requests.
            </p>
          </section>

          <section id="security">
            <h2>Security & Reliability Features</h2>
            <p>
              The Harmonixor API includes several features to make your integration stable and secure:
            </p>
            <ul>
              <li><strong>Retries</strong>: If a request fails due to temporary issues, the API retries it automatically in the background.</li>
              <li><strong>User-Agent Headers</strong>: Every request includes safe browser-like headers to reduce blocking by music providers.</li>
              <li><strong>Rate Limiting</strong>: To protect from abuse and ensure fair use, requests are capped at <strong>1000/day per key</strong>. Exceeding this will temporarily block further calls.</li>
            </ul>
            <p>
              These measures ensure reliable streaming while keeping the system fair and secure for all users.
            </p>
          </section>

          <section id="download">
            <h2>Download MP3 (Demo)</h2>
            <p>
              ⚠️ Officially, the API is <strong>stream-only</strong>.  
              But here’s a <strong>demo</strong> showing how you could trigger a song download in MP3 format.
            </p>

            <pre className="code">{`async function downloadSong() {
            const apiKey = "YOUR_API_KEY";
            const songUrl = "abc123"; // streamId from search

            const response = await fetch(
              \`https://harmonixor-api-1.onrender.com/harmonixor/songs/stream?KEY=\${apiKey}&Song_url=\${songUrl}\`
            );

            if (!response.ok) {
              throw new Error("Failed to fetch stream");
            }

            // Convert stream into a blob
            const blob = await response.blob();

            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "song.mp3"; // file name
            document.body.appendChild(a);
            a.click();
            a.remove();

            console.log("Song download started ✅");
          }

          downloadSong().catch(console.error);`}</pre>

            <p>
              This snippet will download the song as <code>song.mp3</code> directly in the browser.  
              In a real app, you can add constraints like limiting file size, setting timeouts,  
              or restricting downloads to authorized users.
            </p>
          </section>

          <section id="faq">
            <h2>FAQs</h2>

            <p><strong>Q:</strong> <span className="ques">Do I need an API key?</span><br />
            <strong>A:</strong> Yes. Every request must include your personal API key.</p>

            <p><strong>Q:</strong> <span className="ques">Can I download songs?</span><br />
            <strong>A:</strong> No. The API is strictly for streaming purposes.</p>

            <p><strong>Q:</strong> <span className="ques">What are the rate limits?</span><br />
            <strong>A:</strong> By default, <strong>1000 requests/day per key</strong>. Contact support for extensions.</p>

            <p><strong>Q:</strong> <span className="ques">Is it free to use?</span><br />
            <strong>A:</strong> Yes, but usage is monitored and subject to fair use policy.</p>
          </section>

          <section id="extension">
            <h1>Chrome Extension Usage</h1>
            <p>
              The Harmonixor Chrome Extension helps you easily export cookies and automate streaming requests.  
              You can <strong>download the extension ZIP</strong> and load it as an unpacked extension in Chrome.
            </p>

            <h2>Step 1 — Download the ZIP</h2>
            <p>
              Click here to download the extension ZIP: <a href="../extensionFile/HarmoSync.zip" download>Download HarmoSync Extension</a>  
            </p>

            <h2>Step 2 — Load as Unpacked</h2>
            <p>
              <p>1. Open Chrome and go to <code>chrome://extensions/</code>  </p>
              <p>2. Enable <strong>Developer mode</strong> (top-right)  </p>
              <p>3. Click <strong>Load unpacked</strong> and select the extracted extension folder</p>
            </p>
            <img src="../assets/Load_unpack_demo.png" alt="Load Unpacked Example" />
       

            <h2>Step 3 — Automate Cookie Extraction</h2>
            <p>
              <p>1. Open the music site in Chrome  </p>
              <p>2. Click the extension icon  </p>
              <p>3. Check <strong>Automate Extraction</strong> checkbox to start automatic cookie export  </p>
              <p>4. A success message will appear when automation is successful</p>
            </p>
            <img src="../assets/Success_extension_demo.png" alt="Automation Success" />


            <p>
              You can stop automation anytime by unchecking the <strong>Automate Extraction</strong> option.
            </p>

            <h2>Step 4 — Manual Extraction</h2>
            <p>
              If you prefer, you can manually export cookies using the extension and upload the <code>cookies.txt</code> file in your Harmonixor dashboard.  
            </p>

          </section>

        </main>
      </div>
    </div>
  );
};

export default Docs;
