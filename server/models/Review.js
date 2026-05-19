const mongoose = require("mongoose");

const IST_OFFSET = 330;

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    fullName: { type: String, required: true, trim: true },
    userName: { type: String, default: "" },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    body: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 1000,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String, default: "" },
    approvedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
    },
  },
  { versionKey: false }
);

// Fast per-user lookup — uniqueness enforced at controller level
reviewSchema.index({ userId: 1 });
// Fast status-filtered list for homepage + admin panel
reviewSchema.index({ status: 1, approvedAt: -1 });

const Review = mongoose.model("Review", reviewSchema);
Review.syncIndexes();

module.exports = Review;
