const mongoose = require("mongoose");
const { commentSchema } = require("./Comment");
const User= require("./User");

const IST_OFFSET = 330;

const blogSchema = new mongoose.Schema({
  blogId: {
    type: Number,
    default:()=> (new Date().getTime() + IST_OFFSET * 60000)+Math.floor(Math.random() * (90) + 10).toString(),
  },
  slug: {
    type: String,
    // required: false,
    // unique: true, 
    index: true,
    required: true,
  },
  title: {
    type: String,
    required: true,
    unique: true, 
  },
  category: {
    type: String,
  },
  tags: {
    type: Array,
  },
  content: {
    type: String,
    required: true,
  },
  authorDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },
  status: {
    type: String,
    default: "PENDING_REVIEW",
  },
  currentReviewer: {
    type: String,
    default: "",
  },
  feedbackToAuthor: {
    type: Array,
    default: []
  },
  reviewedBy: {
    type: Array,
    default: [],
  },
  reportBlog: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    // default: Date.now,
    default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  },
  lastUpdatedAt: {
    type: Date,
    default: "",
  },
  blogLikes: {
    type: Array,
    default: [],
  },
  blogViews: {
    type: Number,
    default: 0,
  },
  comments: [commentSchema],
  gems: {
    authorGems:    { type: Number, default: 0 },
    reviewerGems:  { type: Number, default: 0 },
    reviewerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
    reviewerAwards: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
      gems:   { type: Number, default: 0 },
    }],
    awarded:       { type: Boolean, default: false },
    awardedAt:     { type: Date, default: null },
    awardedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
  },

  // Phase 5 — admin-assigned blog quality score (0..AdminConfig.maxBlogScore).
  // Default 0 so existing blogs read cleanly without a backfill script.
  // Aggregated into User.creatorScore whenever this is changed.
  blogScore: { type: Number, default: 0, min: 0 },
  blogScoreUpdatedAt: { type: Date, default: null },
  blogScoreUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "admins", default: null },

  // Push-notification dedup: set when this blog is included in a sent trending
  // digest, so it is never sent again. Null = eligible for the next digest.
  digestNotifiedAt: { type: Date, default: null },
});

const Blog = mongoose.model("Blog", blogSchema);

// Compound indexes for the public blog listing + filter queries
blogSchema.index({ status: 1, lastUpdatedAt: -1 });
blogSchema.index({ status: 1, category: 1, lastUpdatedAt: -1 });
blogSchema.index({ status: 1, tags: 1, lastUpdatedAt: -1 });
blogSchema.index({ status: 1, blogViews: -1 });
blogSchema.index({ "blogLikes.userId": 1 });
// Trending-digest query: published + not yet notified, sorted by views
blogSchema.index({ status: 1, digestNotifiedAt: 1, blogViews: -1 });
// Author dashboards (MyBlogs tabs + public profile): filter by author+status,
// sort by lastUpdatedAt. Without this, paging 2000+ blogs scans + sorts in memory.
blogSchema.index({ authorDetails: 1, status: 1, lastUpdatedAt: -1 });

// Sync indexes only once a DB connection is actually open. Calling syncIndexes()
// at module load with no connection buffers its index commands and hits Mongoose's
// 10s bufferTimeoutMS — during Firebase's deploy-time code analysis (which loads
// the code but never connects) that lingering 10s operation is exactly what causes
// "Cannot determine backend specification. Timeout after 10000". Tying it to the
// connection means it runs at runtime/emulator/local-dev, never during discovery.
function syncBlogIndexes() {
  Blog.syncIndexes().catch((err) => console.error("Blog.syncIndexes failed:", err));
}
if (mongoose.connection.readyState === 1) {
  syncBlogIndexes();
} else {
  mongoose.connection.once("connected", syncBlogIndexes);
}

module.exports = Blog;
