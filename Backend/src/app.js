const express = require("express");
const cors = require("cors");
const devApiRoutes = require("./routes/songs");
const sequelize = require('./models/db');
const user = require("./routes/user");
const userRoutes = require("./routes/userRoutes")
const extensionRouter = require("./routes/extensionRoutes")
const demoSongsRoute = require("./routes/demoSongs");


const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
