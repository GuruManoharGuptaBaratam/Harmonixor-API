const express = require("express");
const { handleDevApiSearchURL,handleDevApiStreamURL } = require("../controllers/devApiController");
const apiKeyAuth = require("../middleware/apiAuth");

const router = express.Router();


router.get("/search", apiKeyAuth, handleDevApiSearchURL);
router.get("/stream",apiKeyAuth, handleDevApiStreamURL);

module.exports = router
