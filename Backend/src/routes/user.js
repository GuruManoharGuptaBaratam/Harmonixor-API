const express = require("express");
const { generateKey } = require("../controllers/userController");

const router = express.Router();

router.post("/generate-key", generateKey);

module.exports = router;