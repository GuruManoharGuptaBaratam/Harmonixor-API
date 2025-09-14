const express = require("express");
const cors = require("cors");
const devApiRoutes = require("./routes/songs");
const sequelize = require('./models/db');
const user = require("./routes/user");
const userRoutes = require("./routes/userRoutes")


const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
app.use("/harmonixor/songs", devApiRoutes);
app.use("/harmonixor/users", userRoutes);
app.use("/harmonixor/users",user)


app.get("/check",(req,res)=>{
  res.send("Working check ")
})
// Example: GET /harmonixor/users/me


sequelize.sync({ alter: true })  // or { force: true } if you want to drop & recreate
  .then(() => {
    console.log('✅ Database & tables synced successfully');
  })
  .catch(err => {
    console.error('❌ Error syncing database:', err);
  });
const path = require("path");

module.exports = app;
