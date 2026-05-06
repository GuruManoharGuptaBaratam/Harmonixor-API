# Harmonixor Backend Deployment

This backend is now prepared for:

- Neon Postgres as the database
- Render as the free backend host

## 1. Neon Postgres

Create a Neon project and copy the pooled connection string.

Recommended values:

- Postgres version: current stable offered by Neon
- Region: choose the same region as your backend host
- Connection string: pooled URI with `sslmode=require`

Set this in the backend environment:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
DB_SSL=true
DB_SYNC=true
```

Notes:

- No schema change is required.
- The backend supports `DATABASE_URL` directly, which is the easiest Neon setup.
- `DB_SYNC=true` keeps your current Sequelize sync-based flow intact.

## 2. Render Backend Hosting

Render is the recommended free host for this backend because:

- It can run a long-lived Node backend instead of forcing serverless execution.
- It is a workable free option for `yt-dlp`-based extraction.
- It fits the current project flow with minimal deployment changes.

### Deploy steps

1. Push the repo to GitHub.
2. In Render, create a new `Web Service` from that repo.
3. Set the root directory to `Backend`.
4. Use:

```text
Build Command: npm install
Start Command: node src/server.js
```

5. Add environment variables:

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
DB_SSL=true
DB_SYNC=true
DB_LOGGING=false
JWT_SECRET=your_strong_secret
CORS_ORIGINS=https://harmonixor-api.vercel.app,http://localhost:5173
YT_DLP_BINARY=yt-dlp
```

6. Deploy the service.
7. Set the health check path to `/healthz` if Render asks for one.
7. After deploy, test:

```text
GET /
GET /healthz
GET /checkBackend
GET /harmonixor/songs/search?KEY=YOUR_API_KEY&Song_name=kesariya
GET /harmonixor/songs/stream?KEY=YOUR_API_KEY&Song_url=VIDEO_ID
```

## 3. Important Operational Notes

- This backend uses `yt-dlp` first and Playwright as fallback during extraction.
- The server now starts immediately and connects to the database in the background so Render health checks can pass faster.
- The stream route now tries `yt-dlp` first and falls back to Playwright if needed.
- Stored cookies are normalized to base64-backed Netscape cookie text, and older saved cookie rows are still supported.
- If you already have an existing database, keep `DB_SYNC=true` for now to preserve the current project flow. If you later introduce migrations, you can switch this off.
