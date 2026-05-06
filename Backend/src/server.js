process.env.TMPDIR = "/tmp";

const app = require("./app");
const sequelize = require('./models/db');

const PORT = process.env.PORT || 5000;
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS) || 10000;

app.locals.dbReady = false;
app.locals.dbError = null;

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "harmonixor-backend",
    dbReady: app.locals.dbReady,
  });
});

app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "ok",
    dbReady: app.locals.dbReady,
  });
});

app.get("/readyz", (req, res) => {
  if (!app.locals.dbReady) {
    return res.status(503).json({
      status: "starting",
      dbReady: false,
      error: app.locals.dbError,
    });
  }

  return res.status(200).json({
    status: "ready",
    dbReady: true,
  });
});

app.get("/checkBackend", (req, res) => {
  res.status(200).json({
    message: "Backend Server is Running !!!",
    dbReady: app.locals.dbReady,
  });
});

async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected successfully");

    if (process.env.DB_SYNC !== "false") {
      await sequelize.sync();
      console.log("✅ Database synced successfully");
    } else {
      console.log("ℹ️ Database sync skipped because DB_SYNC=false");
    }

    app.locals.dbReady = true;
    app.locals.dbError = null;
  } catch (err) {
    app.locals.dbReady = false;
    app.locals.dbError = err.message;
    console.error("❌ Database startup failed. Retrying...", err.message);
    setTimeout(connectDatabase, DB_RETRY_DELAY_MS);
  }
}

function start() {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    void connectDatabase();
  });
}

start();
