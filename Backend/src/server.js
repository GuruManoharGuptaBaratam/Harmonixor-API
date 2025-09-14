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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
