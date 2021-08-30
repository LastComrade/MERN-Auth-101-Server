const express = require("express");
const router = express.Router();
const auth = require("../controllers/auth");

router.route("/register").post(auth.register);
router.route("/login").post(auth.login);
router.route("/forgot-password").post(auth.forgotPassword);
router.route("/password-reset/:resetToken").put(auth.resetPassword);
router.route("/activate-account/:registertoken").put(auth.activateAccount);

module.exports = router;
