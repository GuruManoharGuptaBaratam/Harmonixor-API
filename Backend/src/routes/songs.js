const express = require("express");
const { handleDevApiSearchURL,handleDevApiStreamURL, handleDevApiProxyURL } = require("../controllers/devApiController");
const apiKeyAuth = require("../middleware/apiAuth");

const router = express.Router();


router.get("/search", apiKeyAuth, handleDevApiSearchURL);
router.get("/stream",apiKeyAuth, handleDevApiStreamURL);
router.get("/proxy",apiKeyAuth, handleDevApiProxyURL);

module.exports = router
