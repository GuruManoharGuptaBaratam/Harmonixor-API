const express = require("express");
const cors = require("cors");
const devApiRoutes = require("./routes/songs");
const sequelize = require('./models/db');
const user = require("./routes/user");
const userRoutes = require("./routes/userRoutes")
const extensionRouter = require("./routes/extensionRoutes")



const app = express();

app.use(cors());
app.use(express.json());

app.use("/harmonixor/songs", devApiRoutes);
app.use("/harmonixor/users", userRoutes);
app.use("/harmonixor/users",user)
app.use("/harmonixor/extension",extensionRouter)


sequelize.sync({ alter: true })
  .then(() => {
    console.log('-- Database & tables synced successfully');
  })
  .catch(err => {
    console.error('-- Error syncing database:', err);
  });
const path = require("path");

module.exports = app;
