const Review = require("../models/Review");
const User   = require("../models/User");

// ── Public ───────────────────────────────────────────────────────────────────

/**
 * GET /api/reviews/approved
 * Returns all approved reviews sorted newest-approved-first.
 * Used by the homepage (server-side fetch) and can also be polled client-side.
 */
const getApprovedReviews = async (req, res) => {
  try {
    const docs = await Review.find({ status: "approved" })
      .sort({ approvedAt: -1 })
      .select("fullName userName rating body approvedAt userId")
      .populate("userId", "profilePicture")
      .lean();
    const reviews = docs.map((r) => ({
      ...r,
      profilePicture: r.userId?.profilePicture ?? null,
      userId: r.userId?._id ?? null,
    }));
    res.json({ reviews });
  } catch (err) {
    console.error("getApprovedReviews:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Authenticated user ────────────────────────────────────────────────────────

/**
 * GET /api/reviews/me
 * Returns the current user's review record (status + content) or null.
 */
const getMyReview = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const review = await Review.findOne({ userId })
      .select("status rating body rejectionReason createdAt")
      .lean();
    res.json({ review: review ?? null });
  } catch (err) {
    console.error("getMyReview:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/reviews
 * Submit a new review. Requires verified account, one per user.
 */
const createReview = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { rating, body } = req.body;

    // Validate inputs
    const num = Number(rating);
    if (!num || num < 1 || num > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }
    if (!body || String(body).trim().length < 10) {
      return res.status(400).json({ message: "Review must be at least 10 characters." });
    }
    if (String(body).trim().length > 1000) {
      return res.status(400).json({ message: "Review must be at most 1000 characters." });
    }

    // Fetch user — check active + verified
    const user = await User.findById(userId)
      .select("isVerified status fullName userName")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Your account is not active." });
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: "Only verified users can submit a review." });
    }

    const review = await Review.create({
      userId,
      fullName: user.fullName,
      userName: user.userName ?? "",
      rating: num,
      body: String(body).trim(),
      status: "pending",
    });

    res.status(201).json({
      message: "Review submitted! It will appear on the site once approved by our team.",
      review,
    });
  } catch (err) {
    console.error("createReview:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/reviews?status=pending|approved|rejected|all&page=1
 */
const listAdminReviews = async (req, res) => {
  try {
    const { status = "pending", page = 1, limit = 20 } = req.query;
    const filter = !status || status === "all" ? {} : { status };

    const [docs, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate("userId", "profilePicture")
        .lean(),
      Review.countDocuments(filter),
    ]);
    const reviews = docs.map((r) => ({
      ...r,
      profilePicture: r.userId?.profilePicture ?? null,
      userId: r.userId?._id ?? null,
    }));

    res.json({
      reviews,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      pendingCount: status === "all"
        ? await Review.countDocuments({ status: "pending" })
        : status === "pending" ? total : undefined,
    });
  } catch (err) {
    console.error("listAdminReviews:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/admin/reviews/:id/approve
 */
const approveReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: "approved", approvedAt: new Date(), rejectionReason: "" },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: "Review not found." });
    res.json({ message: "Review approved.", review });
  } catch (err) {
    console.error("approveReview:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/admin/reviews/:id/reject
 */
const rejectReview = async (req, res) => {
  try {
    const { reason = "" } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectionReason: String(reason).trim(), approvedAt: null },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: "Review not found." });
    res.json({ message: "Review rejected.", review });
  } catch (err) {
    console.error("rejectReview:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/admin/reviews/:id
 */
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found." });
    res.json({ message: "Review deleted." });
  } catch (err) {
    console.error("deleteReview:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getApprovedReviews,
  getMyReview,
  createReview,
  listAdminReviews,
  approveReview,
  rejectReview,
  deleteReview,
};
