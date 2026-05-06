process.env.TMPDIR = "/tmp";

const app = require("./app");
const sequelize = require('./models/db');

const PORT = process.env.PORT || 5000;

app.get("/checkBackend", (req, res) => {
  res.json({ message: "Backend Server is Running !!!" });
});


async function start() {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected successfully");

    if (process.env.DB_SYNC !== "false") {
      await sequelize.sync();
      console.log("✅ Database synced successfully");
    } else {
      console.log("ℹ️ Database sync skipped because DB_SYNC=false");
    }

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ Error starting server:", err);
    process.exit(1);
  }
}

start();
