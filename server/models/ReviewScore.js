const mongoose = require("mongoose");

const IST_OFFSET = 330;

const reviewScoreSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blog",
    required: true,
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  // 0..AdminConfig.maxBlogScore (same cap as blog scores)
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  note: {
    type: String,
    default: "",
    maxlength: 500,
  },
  awardedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admins",
    default: null,
  },
  awardedAt: {
    type: Date,
    default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  },
});

// Enforce one score per reviewer per blog — upsert on re-score
reviewScoreSchema.index({ blogId: 1, reviewerId: 1 }, { unique: true });
// Fast aggregation across all scores for a given reviewer
reviewScoreSchema.index({ reviewerId: 1 });

const ReviewScore = mongoose.model("ReviewScore", reviewScoreSchema);
ReviewScore.syncIndexes();

module.exports = ReviewScore;
