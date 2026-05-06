const express = require("express");
const cors = require("cors");
const devApiRoutes = require("./routes/songs");
const sequelize = require('./models/db');
const user = require("./routes/user");
const userRoutes = require("./routes/userRoutes")
const extensionRouter = require("./routes/extensionRoutes")
const demoSongsRoute = require("./routes/demoSongs");


const app = express();
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://harmonixor-api.vercel.app",
  "https://harmonixor-api-pcfs.vercel.app",
  "https://harmonixor-api-r.onrender.com",
];

function normalizeOrigin(origin) {
  return String(origin || "")
    .trim()
    .replace(/\/+$/, "");
}

const allowedOrigins = Array.from(
  new Set([
    ...DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin),
    ...(process.env.CORS_ORIGINS || "")
      .split(",")
      .map(normalizeOrigin)
      .filter(Boolean),
  ])
);

app.use(cors({
  origin(origin, callback) {
    const normalizedOrigin = normalizeOrigin(origin);

    if (
      !origin ||
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    console.error("Blocked by CORS:", normalizedOrigin, "Allowed:", allowedOrigins);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
}));
app.options(/.*/, cors({
  origin(origin, callback) {
    const normalizedOrigin = normalizeOrigin(origin);

    if (
      !origin ||
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const requestOrigin = normalizeOrigin(req.headers.origin);
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  res.setHeader("Vary", "Origin");
  next();
});
app.use("/harmonixor/songs", devApiRoutes);
app.use("/harmonixor/users", userRoutes);
app.use("/harmonixor/users",user)
app.use("/harmonixor/extension",extensionRouter)
app.use("/harmonixor/api", demoSongsRoute);


// sequelize.sync({ alter: true })
//   .then(() => {
//     console.log('-- Database & tables synced successfully');
//   })
//   .catch(err => {
//     console.error('-- Error syncing database:', err);
//   });
module.exports = app;
