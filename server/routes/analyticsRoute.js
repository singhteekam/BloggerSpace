const express = require("express");
const router = express.Router();
const { trackVisit, getAnalytics } = require("../controllers/analyticsController");
const adminMiddleware = require("../middlewares/adminMiddleware");

// Public — frontend calls this on each page load
router.post("/track", trackVisit);

// Admin-only
router.get("/stats", adminMiddleware, getAnalytics);

module.exports = router;
