process.env.TMPDIR = "/tmp";

const express = require('express');
const app = require("./app");
const cors = require("cors");
const sequelize = require('./models/db');

const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: [
    "http://localhost:3000",      
    "https://harmonixor-api-pcfs.vercel.app"  
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/checkBackend", (req, res) => {
  res.json({ message: "Backend Server is Running !!!" });
});


async function start() {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected successfully");

    await sequelize.sync();
    console.log("-- Database & tables synced successfully");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ Error starting server:", err);
    process.exit(1);
  }
}

start();
