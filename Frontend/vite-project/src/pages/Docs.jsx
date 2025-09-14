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
            <li><a href="#faq">▸ FAQs</a></li>
          </ul>
        </aside>

        <main className="docs-content">
          <section id="intro">
            <h1>Harmonixor API Documentation</h1>
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

          <section id="faq">
            <h2>FAQs</h2>

            <p><strong>Q:</strong> <span className="ques" >Do I need an API key?</span><br />
            <strong>A:</strong> Yes. Every request must include your personal API key.</p>

            <p ><strong>Q:</strong> <span className="ques">Can I download songs? </span><br />
            <strong>A:</strong> No. The API is strictly for streaming purposes.</p>

            <p ><strong>Q:</strong><span className="ques"> What are the rate limits? </span><br />
            <strong>A:</strong> By default, <strong>1000 requests/day per key</strong>. Contact support for extensions.</p>

            <p ><strong>Q:</strong><span className="ques"> Is it free to use? </span><br />
            <strong>A:</strong> Yes, but usage is monitored and subject to fair use policy.</p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Docs;
