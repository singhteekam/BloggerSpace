const express = require("express");
const router = express.Router();
const {
  trackVisit,
  getAnalytics,
  getLogs,
  getVisitors,
  getVisitorJourney,
  deleteOldLogs,
  deleteLog,
  deleteVisitor,
} = require("../controllers/analyticsController");
const adminMiddleware = require("../middlewares/adminMiddleware");

// Public — frontend calls this on each page load
router.post("/track", trackVisit);

// Admin-only
router.get("/stats", adminMiddleware, getAnalytics);
router.get("/logs", adminMiddleware, getLogs);
router.get("/visitors", adminMiddleware, getVisitors);
router.get("/visitor/:visitorId", adminMiddleware, getVisitorJourney);
router.delete("/logs", adminMiddleware, deleteOldLogs);
router.delete("/logs/:id", adminMiddleware, deleteLog);
router.delete("/visitor/:visitorId", adminMiddleware, deleteVisitor);

module.exports = router;
