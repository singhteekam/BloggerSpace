const router = require("express").Router();
const authenticate = require("../middlewares/authenticate");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
  getApprovedReviews,
  getMyReview,
  createReview,
  listAdminReviews,
  approveReview,
  rejectReview,
  deleteReview,
} = require("../controllers/reviewsController");

// ── Public ──────────────────────────────────────────────────────────────────
router.get("/approved", getApprovedReviews);

// ── Authenticated user ───────────────────────────────────────────────────────
router.get("/me", authenticate, getMyReview);
router.post("/", authenticate, createReview);

// ── Admin ────────────────────────────────────────────────────────────────────
router.get("/admin", adminMiddleware, listAdminReviews);
router.patch("/admin/:id/approve", adminMiddleware, approveReview);
router.patch("/admin/:id/reject", adminMiddleware, rejectReview);
router.delete("/admin/:id", adminMiddleware, deleteReview);

module.exports = router;
