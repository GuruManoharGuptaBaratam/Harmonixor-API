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

app.get("/render",(req,res)=>{
  res.json({message : "this is a dummy route"})
})
app.get("/", (req, res) => {
  res.send("API is running!");
});
app.post("postCheck",(req,res)=>{
  res.json({content: message})
})
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
