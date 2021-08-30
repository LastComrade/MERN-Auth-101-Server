const express = require("express");
const router = express.Router();
const { getPrivateData } = require("../controllers/private");
const authMid = require("../middlewares/auth");

router.route("/").get(authMid.protect, getPrivateData);

module.exports = router;
