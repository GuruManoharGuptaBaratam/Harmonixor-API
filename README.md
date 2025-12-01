# HARMONIXOR API

HARMONIXOR API is a backend audio-processing engine designed to power the HARMONIXOR Music Streaming Website. It transforms any song search text or YouTube video ID into a stable, high-quality, stream-ready audio URL.  
The system handles automated YouTube searching, intelligent video selection, and audio extraction through **yt-dlp**, returning a clean link that can be played instantly on the frontend.

---

## What This Application Does

HARMONIXOR automates the entire process of fetching and streaming audio from YouTube.  
It works as the middle layer between the user and YouTube by:

- Receiving a search query or video ID  
- Automatically finding the correct YouTube video  
- Processing it internally using yt-dlp  
- Extracting a high-quality audio stream URL  
- Returning that URL to be played inside your music player  

The goal is to provide a fast, stable, and clean audio experience with minimal errors and maximum efficiency.

---

## How the System Works (Simplified Explanation)

1. **User searches for a song** on the website.  
2. The query is sent to the HARMONIXOR API.  
3. If the user typed a song name, the API performs a **smart YouTube search**.  
4. The system picks the most relevant video based on ranking and quality.  
5. yt-dlp extracts a **direct audio streaming URL**.  
6. The website receives the URL and **begins playback instantly**.  
7. The stream URL expires periodically for security, but the API can regenerate it anytime.

This entire workflow is automated, fast, and optimized to avoid common issues like 403 Forbidden errors or signature mismatches.

---

## How to Use the Website

Using HARMONIXOR on the frontend is simple:

- Enter a **song name** or paste a **Music ID** into the search bar.  
- The website sends the request to the API internally.  
- The extracted audio stream begins playback instantly.  
- You can like/save songs, replay them, and check recent searches.  
- Everything is optimized for quick loading and seamless playback.

For full developer-level explanations,  
👉 **Visit the Documentation Page:**  
[View Full Docs](https://harmonixor-api.vercel.app/docs)

---

## ✨ Features Available (Website + API)

- 🔍 **Global Song Search** with intelligent YouTube matching  
- 🎧 **High-quality audio extraction** using yt-dlp  
- 📡 **Fast and stable streaming** with expirable URLs  
- 📱 **Responsive custom music player** with volume, seek bar, and scrolling song title  
- ⚡ **Optimized backend** for stable stream delivery  
- 🔁 **Auto-retry mechanism** for YouTube extraction errors  
- 🎨 **Clean and modern UI** designed for smooth user interaction  

---

## 🌐 HARMONIXOR API Routes / Endpoints

### **1. get `/api/search`**
Used to extract and return a search-ready video ID to stream.

### **2. get `/api/stream`**
Used to extract and return a stream-ready audio URL.

#### **Response**
- Returns an object containing a `streamUrl` that can be used to play the audio.

---

## 💻 Example Code Snippets

### 🔍 Searching for a Song

```js
const response = await fetch("https://https://harmonixor-api-1.onrender.com/harmonixor/songs/search?Song_name=kesariya arijit singh", {
method: "GET",
headers: { "Content-Type": "application/json" }
});

const data = await response.json();
console.log(data.streamID);

```
---
### 🔍 Streaming the a Song using MusicID
```js
const response = await fetch("https://https://harmonixor-api-1.onrender.com/harmonixor/songs/search?Song_ID=ABCDXYZ", {
method: "GET",
headers: { "Content-Type": "application/json" }
});

const data = await response.json();
console.log(data.streamUrl);
```
---

### 🔍 Login through EmailID and Password
```js
const response = await fetch("https://https://harmonixor-api-1.onrender.com/harmonixor/users/login", {
method: "POST",
headers: { "Content-Type": "application/json" }
});

const response = await response.json();
console.log(response.data.success); // True or False 
```
---


### 🔍 Creating Account using EmailID and New Password
```js
const response = await fetch("https://https://harmonixor-api-1.onrender.com/harmonixor/users/signup", {
method: "POST",
headers: { "Content-Type": "application/json" }
});

const response = await response.json();
console.log(response.data.message);
```
