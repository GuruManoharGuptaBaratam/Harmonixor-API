const app = require("./app");
const express = require('express')
const PORT = process.env.PORT || 3003;
const sequelize = require('./models/db');
const User = require('./models/User');
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");

app.use(cors());
app.use(express.json());

// user routes
app.use("/harmonixor/users", userRoutes);
sequelize.sync({ alter: true }) // automatically creates table if not exists
  .then(() => {
    console.log("All models synced with DB");
  })
  .catch(err => console.error("DB sync error:", err));



app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
