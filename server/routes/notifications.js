const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const {
  registerToken,
  unregisterToken,
  tokenStatus,
} = require("../controllers/notificationController");

// All require a logged-in user (token derived from the auth JWT).
router.post("/register", authenticate, registerToken);
router.post("/unregister", authenticate, unregisterToken);
router.get("/status", authenticate, tokenStatus);

module.exports = router;
