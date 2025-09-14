const app = require("./app");
const express = require('express')
const PORT = process.env.PORT || 3003;
const sequelize = require('./models/db');
const User = require('./models/User');
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// user routes
app.get("/checkBackend",(req,res)=>{
  res.json({message: "Backend Server is Running !!!"})
})
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
