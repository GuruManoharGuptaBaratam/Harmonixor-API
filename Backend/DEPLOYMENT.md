# Harmonixor Backend Deployment

This backend is now prepared for:

- Neon Postgres as the database
- Railway as the recommended backend host

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

## 2. Railway Backend Hosting

Railway is the recommended host for this backend because:

- It runs long-lived Node services well.
- Docker deployment works cleanly with `yt-dlp` and Playwright.
- It is a better fit than serverless hosts for browser-assisted extraction.

### Deploy steps

1. Push the repo to GitHub.
2. In Railway, create a new project from that repo.
3. Set the service root directory to `Backend`.
4. Railway should detect the `Dockerfile` automatically.
5. Add environment variables:

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
DB_SSL=true
DB_SYNC=true
DB_LOGGING=false
JWT_SECRET=your_strong_secret
CORS_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:5173
YT_DLP_BINARY=yt-dlp
```

6. Deploy the service.
7. After deploy, test:

```text
GET /checkBackend
GET /harmonixor/songs/search?KEY=YOUR_API_KEY&Song_name=kesariya
GET /harmonixor/songs/stream?KEY=YOUR_API_KEY&Song_url=VIDEO_ID
```

## 3. Important Operational Notes

- This backend uses both `yt-dlp` and Playwright. That is why Docker-based deployment is recommended.
- The stream route now tries `yt-dlp` first and falls back to Playwright if needed.
- Stored cookies are normalized to base64-backed Netscape cookie text, and older saved cookie rows are still supported.
- If you already have an existing database, keep `DB_SYNC=true` for now to preserve the current project flow. If you later introduce migrations, you can switch this off.
